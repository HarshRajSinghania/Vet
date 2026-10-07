// Checks that common licenses are recognized from their own wording.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLicense } from '../src/detectLicense.js';
import { createFixtureRepo, removeFixtureRepo } from './fixtureRepo.js';

async function licenseOf(filesByPath) {
  const repoPath = await createFixtureRepo(filesByPath);
  try {
    return await detectLicense(repoPath);
  } finally {
    await removeFixtureRepo(repoPath);
  }
}

test('recognizes licenses, including ones that share wording', async () => {
  const cases = {
    'MIT License\n\nPermission is hereby granted, free of\n  charge, to any person': 'MIT',
    'Boost Software License - Version 1.0\n\nPermission is hereby granted, free of charge, to any person': 'BSL-1.0',
    'GNU LESSER GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007 ... GNU General Public License': 'LGPL-3.0',
    'GNU GENERAL PUBLIC LICENSE\nVersion 2, June 1991': 'GPL-2.0',
    'Apache License\nVersion 2.0, January 2004': 'Apache-2.0',
  };

  for (const [text, expectedId] of Object.entries(cases)) {
    const license = await licenseOf({ LICENSE: text });
    assert.equal(license.id, expectedId, text.slice(0, 30));
  }
});

test('explains what the license kind means', async () => {
  const license = await licenseOf({ 'COPYING.txt': 'GNU AFFERO GENERAL PUBLIC LICENSE Version 3' });
  assert.deepEqual(license, {
    file: 'COPYING.txt',
    id: 'AGPL-3.0',
    kind: 'network copyleft',
    meaning: "like GPL, and it also applies to people using it over a network (e.g. a web app)",
  });
});

test('reports a missing or unrecognized license', async () => {
  assert.equal((await licenseOf({ 'README.md': '' })).file, null);
  assert.deepEqual(await licenseOf({ LICENSE: 'All rights reserved.' }), {
    file: 'LICENSE',
    id: null,
    kind: null,
    meaning: null,
  });
});
