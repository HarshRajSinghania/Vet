// Checks that the report becomes plain JSON, with a status for every test case.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJson } from '../src/toJson.js';
import { createCaseStatuses, recordCaseStatuses } from '../src/parseTestCases.js';

const outline = [
  {
    language: 'JavaScript',
    file: 'math.test.js',
    tests: [
      { rawName: 'adds numbers', displayName: 'adds numbers' },
      { rawName: 'later', displayName: 'later', skippedInCode: true },
    ],
  },
];

test('lists every test case with its status, including ones only in the output', () => {
  const caseStatuses = createCaseStatuses();
  recordCaseStatuses(caseStatuses, '✓ adds numbers\n✓ made in a loop\n✓ made in a loop');
  const testRun = { commandResults: [{ command: 'npm run test', exitCode: 0 }], setupProblems: [], caseStatuses };

  const json = JSON.parse(JSON.stringify(toJson({ repo: 'owner/repo', tests: { outline, testRun } })));

  assert.equal(json.repo, 'owner/repo');
  assert.equal(json.tests.ran, true);
  assert.deepEqual(json.tests.commands, [{ command: 'npm run test', exitCode: 0 }]);
  assert.deepEqual(json.tests.testCases, [
    { language: 'JavaScript', file: 'math.test.js', name: 'adds numbers', status: 'passed', count: 1 },
    { language: 'JavaScript', file: 'math.test.js', name: 'later', status: 'skipped', count: 1 },
    { language: null, file: null, name: 'made in a loop', status: 'passed', count: 2 },
  ]);
});

test('marks test cases as not run when tests were skipped', () => {
  const json = toJson({ repo: 'owner/repo', tests: { outline, testRun: null } });
  assert.equal(json.tests.ran, false);
  assert.deepEqual(
    json.tests.testCases.map((testCase) => testCase.status),
    ['notRun', 'notRun'],
  );
});
