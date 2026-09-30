// Checks that GitHub URLs in all their common shapes become "owner/repo".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRepoUrl } from '../src/parseRepoUrl.js';

test('reads owner/repo from https, .git and ssh URLs', () => {
  assert.equal(parseRepoUrl('https://github.com/tj/commander.js'), 'tj/commander.js');
  assert.equal(parseRepoUrl('https://github.com/tj/commander.js.git'), 'tj/commander.js');
  assert.equal(parseRepoUrl('https://github.com/tj/commander.js/'), 'tj/commander.js');
  assert.equal(parseRepoUrl('git@github.com:tj/commander.js.git'), 'tj/commander.js');
});

test('rejects anything that is not a GitHub repo URL', () => {
  assert.throws(() => parseRepoUrl('not-a-url'), /doesn't look like a GitHub repository URL/);
  assert.throws(() => parseRepoUrl('https://gitlab.com/owner/repo'));
});
