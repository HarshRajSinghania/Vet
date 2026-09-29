// Pulls test commands out of GitHub Actions workflow files by reading their
// `run:` steps line by line. That's all vet needs, so there's no YAML library.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const WORKFLOW_FILE_PATTERN = /^\.github\/workflows\/[^/]+\.ya?ml$/;
const TEST_WORD_PATTERN = /\b(test|tests|pytest|jest|vitest|mocha|tox|nox|rspec|ctest)\b/;
const SETUP_STEP_PATTERN =
  /\b(pip3?|npm|yarn|pnpm|poetry|uv|conda|apt|apt-get|brew|gem|bundle|cargo|go)\s+(install|ci|add|get|sync)\b/;

export async function readWorkflowCommands(repoPath, files) {
  const commands = [];

  for (const file of files) {
    if (!WORKFLOW_FILE_PATTERN.test(file)) continue;

    const content = await readFile(join(repoPath, file), 'utf8');
    for (const line of extractRunLines(content)) {
      if (isLocalTestCommand(line)) {
        commands.push({ command: line, source: file });
      }
    }
  }

  return commands;
}

function extractRunLines(content) {
  const lines = content.split('\n');
  const runLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)(?:-\s+)?run:\s*(.*)$/);
    if (!match) continue;

    const value = match[2].trim();
    if (value.startsWith('|') || value.startsWith('>')) {
      runLines.push(...readBlock(lines, index + 1, match[1].length));
    } else if (value !== '') {
      runLines.push(value.replace(/^(['"])(.*)\1$/, '$2'));
    }
  }

  return runLines;
}

// A `run: |` block continues for as long as its lines are indented deeper than `run:`.
function readBlock(lines, startIndex, keyIndent) {
  const blockLines = [];

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '') continue;

    const indent = line.length - line.trimStart().length;
    if (indent <= keyIndent) break;

    const previous = blockLines[blockLines.length - 1];
    if (previous && previous.endsWith('\\')) {
      blockLines[blockLines.length - 1] = `${previous.slice(0, -1)} ${line.trim()}`;
    } else {
      blockLines.push(line.trim());
    }
  }

  return blockLines;
}

// Skip lines that only make sense on GitHub's servers (${{ ... }} values, sudo)
// and setup steps that merely install a test tool rather than run tests.
function isLocalTestCommand(line) {
  if (line.startsWith('#')) return false;
  if (line.includes('${{')) return false;
  if (/\bsudo\b/.test(line)) return false;
  if (SETUP_STEP_PATTERN.test(line)) return false;
  return TEST_WORD_PATTERN.test(line);
}
