// Checks which project files the hygiene checklist finds, and where it looks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHygiene } from '../src/checkHygiene.js';
import { createFixtureRepo, removeFixtureRepo } from './fixtureRepo.js';

async function hygieneOf(filesByPath) {
  const repoPath = await createFixtureRepo(filesByPath);
  try {
    const results = await checkHygiene(repoPath);
    const summary = {};
    for (const check of results) {
      summary[check.name] = check.file;
    }
    return summary;
  } finally {
    await removeFixtureRepo(repoPath);
  }
}

test('finds files in the root, .github/ and docs/, in any case', async () => {
  const summary = await hygieneOf({
    'README.md': '',
    'LICENSE-MIT': '',
    '.github/CONTRIBUTING.md': '',
    'docs/code_of_conduct.md': '',
    '.github/ISSUE_TEMPLATE/bug.yml': '',
    '.github/workflows/ci.yml': '',
    '.github/dependabot.yml': '',
    'src/math.test.ts': '',
  });

  assert.equal(summary['README'], 'README.md');
  assert.equal(summary['License'], 'LICENSE-MIT');
  assert.equal(summary['Contributing guide'], '.github/CONTRIBUTING.md');
  assert.equal(summary['Code of conduct'], 'docs/code_of_conduct.md');
  assert.equal(summary['Issue templates'], '.github/ISSUE_TEMPLATE/bug.yml');
  assert.equal(summary['Continuous integration'], '.github/workflows/ci.yml');
  assert.equal(summary['Dependency updates'], '.github/dependabot.yml');
  assert.equal(summary['Tests'], 'src/math.test.ts');
  assert.equal(summary['Security policy'], null);
  assert.equal(summary['Changelog'], null);
});

test("doesn't mistake files deeper in the tree for project files", async () => {
  const summary = await hygieneOf({ 'src/readme.md': '', 'packages/a/LICENSE': '' });
  assert.equal(summary['README'], null);
  assert.equal(summary['License'], null);
});
