// Checks that committed programs are found by extension or by their first bytes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBinaries } from '../src/checkBinaries.js';
import { createFixtureRepo, removeFixtureRepo } from './fixtureRepo.js';

test('flags compiled programs but not images, text or the Gradle wrapper', async () => {
  const repoPath = await createFixtureRepo({
    'tools/setup.exe': 'pretend program',
    'lib/native.so': 'pretend library',
    'bin/linux-tool': Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01]),
    'bin/run': '#!/bin/sh\necho hi\n',
    'gradle/wrapper/gradle-wrapper.jar': 'allowed',
    'logo.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    'LICENSE': 'MIT License',
    'Makefile': 'test:\n\techo ok\n',
  });

  try {
    assert.deepEqual((await checkBinaries(repoPath)).sort(), ['bin/linux-tool', 'lib/native.so', 'tools/setup.exe']);
  } finally {
    await removeFixtureRepo(repoPath);
  }
});
