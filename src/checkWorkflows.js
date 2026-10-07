// Looks for risky patterns in GitHub Actions workflows: the ones OpenSSF
// Scorecard calls Dangerous-Workflow, Token-Permissions and Pinned-Dependencies.
// Each finding has a file, line, severity, the problem and why it matters.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';

const WORKFLOW_FILE_PATTERN = /^\.github\/workflows\/[^/]+\.ya?ml$/;

// Text that anyone can write (an issue title, a PR's branch name, ...). Putting
// it inside ${{ }} in a run: step pastes it into the shell command as code.
const ATTACKER_CONTROLLED =
  /\$\{\{\s*github\.(head_ref|event\.(issue|pull_request|comment|review|review_comment|discussion|discussion_comment)\.(title|body)|event\.pull_request\.head\.(ref|label)|event\.head_commit\.(message|author\.(email|name))|event\.commits\b[^}]*\.(message|author)|event\.pages\b[^}]*\.page_name)\s*\}\}/;

const PULL_REQUEST_CODE = /\$\{\{\s*github\.(event\.pull_request\.head\.(sha|ref)|head_ref)\s*\}\}|refs\/pull\/.*\/merge/;

// The SLSA generator only works when referenced by version tag (its docs say
// so, and Scorecard exempts it too), so pinning it to a commit isn't asked for.
const MUST_USE_TAGS = /^slsa-framework\/slsa-github-generator\//;

export async function checkWorkflows(repoPath) {
  const files = await listFiles(repoPath);
  const workflowFiles = files.filter((file) => WORKFLOW_FILE_PATTERN.test(file));
  const findings = [];

  for (const file of workflowFiles) {
    const lines = (await readFile(join(repoPath, file), 'utf8')).split('\n');
    findings.push(...findPullRequestCodeWithSecrets(file, lines));
    findings.push(...findScriptInjection(file, lines));
    findings.push(...findBroadPermissions(file, lines));
    findings.push(...findUnpinnedActions(file, lines));
  }

  return { workflowCount: workflowFiles.length, findings };
}

function findPullRequestCodeWithSecrets(file, lines) {
  const runsOnPullRequestTarget = lines.some((line) => /^[^#]*\bpull_request_target\b/.test(line));
  if (!runsOnPullRequestTarget) return [];

  const findings = [];
  lines.forEach((line, index) => {
    if (/^\s*ref:/.test(line) && PULL_REQUEST_CODE.test(line)) {
      findings.push(finding(file, index, 'high', "checks out a pull request's code in a pull_request_target workflow",
        "that code runs with the repo's secrets, so any stranger's PR can steal them"));
    }
  });
  return findings;
}

function findScriptInjection(file, lines) {
  const findings = [];
  for (const index of runLineNumbers(lines)) {
    if (ATTACKER_CONTROLLED.test(lines[index])) {
      findings.push(finding(file, index, 'high', 'puts attacker-controlled text straight into a shell command',
        'a crafted issue title, PR body or branch name can run any command; pass it through env: instead'));
    }
  }
  return findings;
}

function findBroadPermissions(file, lines) {
  const writeAllIndex = lines.findIndex((line) => /^\s*permissions:\s*write-all\b/.test(line));
  if (writeAllIndex !== -1) {
    return [finding(file, writeAllIndex, 'medium', 'gives the workflow token write access to everything',
      'if any step is compromised, it can push code, change releases and more')];
  }

  const hasPermissions = lines.some((line) => /^\s*permissions:/.test(line));
  if (hasPermissions) return [];
  return [finding(file, 0, 'medium', 'has no permissions: block',
    "the token gets the repo's default rights, which can include writing; add permissions: contents: read")];
}

function findUnpinnedActions(file, lines) {
  const findings = [];
  lines.forEach((line, index) => {
    const match = line.match(/^\s*(?:-\s+)?uses:\s*['"]?([^@\s'"]+)@([^\s'"#]+)/);
    if (!match || /^[0-9a-f]{40}$/i.test(match[2]) || match[1].startsWith('docker://')) return;
    if (MUST_USE_TAGS.test(match[1])) return;

    const isGitHubOwned = /^(actions|github)\//.test(match[1]);
    findings.push(finding(file, index, isGitHubOwned ? 'low' : 'medium', `uses ${match[1]}@${match[2]}, a tag rather than a commit`,
      "whoever controls that action can move the tag to new code, which then runs here; pin the full commit SHA"));
  });
  return findings;
}

// The line numbers of shell commands: `run: cmd`, or the indented lines under `run: |`.
function runLineNumbers(lines) {
  const numbers = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)(?:-\s+)?run:\s*(.*)$/);
    if (!match) continue;
    if (!/^[|>]/.test(match[2].trim())) {
      numbers.push(index);
      continue;
    }
    for (let blockIndex = index + 1; blockIndex < lines.length; blockIndex += 1) {
      const blockLine = lines[blockIndex];
      if (blockLine.trim() === '') continue;
      if (blockLine.length - blockLine.trimStart().length <= match[1].length) break;
      numbers.push(blockIndex);
    }
  }
  return numbers;
}

function finding(file, index, severity, problem, why) {
  return { file, line: index + 1, severity, problem, why };
}
