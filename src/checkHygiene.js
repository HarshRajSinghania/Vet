// Checks for the files a well-kept open source repo usually has: README,
// license, contributing guide, CI, and so on. Based on the default rules of
// todogroup/repolinter. GitHub also finds most of these in .github/ or docs/.
import { listFiles } from './listFiles.js';

const SPECIAL_FOLDERS = '(|\\.github/|docs/)';

function namedFile(name) {
  return new RegExp(`^${SPECIAL_FOLDERS}${name}(\\.[\\w.]+)?$`, 'i');
}

const HYGIENE_CHECKS = [
  { name: 'README', why: 'explains what the project is and how to use it', patterns: [namedFile('readme')] },
  {
    name: 'License',
    why: "without one, nobody is legally allowed to reuse the code",
    patterns: [/^(licen[cs]e|copying|unlicense)([-.][\w.-]+)?$/i],
  },
  { name: 'Contributing guide', why: 'tells newcomers how to help', patterns: [namedFile('contributing')] },
  { name: 'Code of conduct', why: 'sets expectations for how people treat each other', patterns: [namedFile('code_of_conduct')] },
  { name: 'Security policy', why: 'tells people how to report vulnerabilities privately', patterns: [namedFile('security')] },
  { name: 'Changelog', why: 'shows what changed between versions', patterns: [namedFile('(changelog|changes|history)')] },
  {
    name: 'Issue templates',
    why: 'make bug reports arrive with the details needed',
    patterns: [/^\.github\/issue_template(\.\w+|\/.+)$/i],
  },
  {
    name: 'Pull request template',
    why: 'reminds contributors what a good PR includes',
    patterns: [namedFile('pull_request_template'), /^\.github\/pull_request_template\/.+$/i],
  },
  {
    name: 'Continuous integration',
    why: 'runs checks automatically on every change',
    patterns: [
      /^\.github\/workflows\/[^/]+\.ya?ml$/i,
      /^\.gitlab-ci\.yml$/i,
      /^\.circleci\/config\.yml$/i,
      /^\.travis\.yml$/i,
      /^azure-pipelines\.yml$/i,
      /^Jenkinsfile$/,
    ],
  },
  {
    name: 'Dependency updates',
    why: 'Dependabot or Renovate keeps dependencies patched',
    patterns: [/^\.github\/dependabot\.ya?ml$/i, /^(\.github\/)?renovate\.json5?$/i, /^\.renovaterc(\.json5?)?$/i],
  },
  {
    name: 'Tests',
    why: 'show the code is checked, not just written',
    patterns: [
      /(^|\/)(tests?|__tests__|spec)\//i,
      /\.(test|spec)\.[cm]?[jt]sx?$/i,
      /(^|\/)test_[^/]+\.py$/i,
      /_test\.(go|py)$/i,
    ],
  },
];

export async function checkHygiene(repoPath) {
  const files = await listFiles(repoPath);
  const results = [];

  for (const check of HYGIENE_CHECKS) {
    const foundFile = files.find((file) => check.patterns.some((pattern) => pattern.test(file)));
    results.push({ name: check.name, why: check.why, found: Boolean(foundFile), file: foundFile || null });
  }

  return results;
}
