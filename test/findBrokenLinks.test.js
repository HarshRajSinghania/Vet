// Checks links that point inside the repo: missing files, missing headings,
// folders, and links that escape the repo. Uses no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findBrokenLinks } from '../src/findBrokenLinks.js';
import { createFixtureRepo, removeFixtureRepo } from './fixtureRepo.js';

test('reports broken local links with file, line and reason', async () => {
  const repoPath = await createFixtureRepo({
    'README.md': [
      '# Project',
      '[guide](docs/guide.md) [setup section](docs/guide.md#setup) [src folder](src/)',
      '[missing file](docs/missing.md)',
      '[missing heading](docs/guide.md#deploy)',
      '[back to top](#project) [no such heading](#nowhere)',
      '[escape](../../etc/passwd) [encoded](docs/my%20notes.md) [line link](docs/guide.md#L3)',
    ].join('\n'),
    'docs/guide.md': '# Guide\n\n## Setup\n',
    'docs/my notes.md': 'notes',
    'src/index.js': '',
  });

  try {
    const result = await findBrokenLinks(repoPath);
    const broken = result.brokenLinks.map((link) => `${link.url} | ${link.file}:${link.line} | ${link.reason}`);

    assert.deepEqual(broken, [
      'docs/missing.md | README.md:3 | file not found',
      'docs/guide.md#deploy | README.md:4 | no heading #deploy',
      '#nowhere | README.md:5 | no heading #nowhere',
      '../../etc/passwd | README.md:6 | points outside the repo',
    ]);
    assert.equal(result.checkedCount, 10);
  } finally {
    await removeFixtureRepo(repoPath);
  }
});
