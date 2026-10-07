// Checks which findings make vet exit with "problems found".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findExitProblems } from '../src/exitStatus.js';

function report({ brokenLinks = [], commandResults = null }) {
  return {
    links: { brokenLinks },
    tests: { testRun: commandResults ? { commandResults } : null },
  };
}

test('no broken links and passing tests means no problems', () => {
  assert.deepEqual(findExitProblems(report({ commandResults: [{ exitCode: 0 }] })), []);
});

test('broken links and failing test commands are both reported', () => {
  const problems = findExitProblems(
    report({ brokenLinks: [{}, {}], commandResults: [{ exitCode: 0 }, { exitCode: 1 }] }),
  );
  assert.deepEqual(problems, ['2 broken link(s)', '1 failing test command(s)']);
});

test('tests that were not run are not a problem', () => {
  assert.deepEqual(findExitProblems(report({ commandResults: null })), []);
});
