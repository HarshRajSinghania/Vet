// Checks that individual test results are picked out of each test tool's output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCaseStatuses, recordCaseStatuses, lookupCaseStatus } from '../src/parseTestCases.js';

function statusesFor(output) {
  const caseStatuses = createCaseStatuses();
  recordCaseStatuses(caseStatuses, output);
  return caseStatuses;
}

test('Jest: names failures, and a PASS file means all its tests passed', () => {
  const caseStatuses = statusesFor('PASS src/add.test.js\nFAIL src/math.test.js\n  ● math › fails on purpose\n  ● Console');

  assert.equal(lookupCaseStatus(caseStatuses, 'src/math.test.js', { rawName: 'fails on purpose' }), 'failed');
  assert.equal(lookupCaseStatus(caseStatuses, 'src/add.test.js', { rawName: 'adds' }), 'passed');
  assert.equal(lookupCaseStatus(caseStatuses, 'src/math.test.js', { rawName: 'adds' }), 'unknown');
  assert.equal(caseStatuses.byName.has('Console'), false);
});

test('a test skipped in the code counts as skipped', () => {
  const caseStatuses = statusesFor('PASS src/add.test.js');
  const test = { rawName: 'later', skippedInCode: true };
  assert.equal(lookupCaseStatus(caseStatuses, 'src/add.test.js', test), 'skipped');
});

test('checkmark lines from Jest, Vitest, Mocha and node:test', () => {
  const caseStatuses = statusesFor('  ✓ adds numbers (3 ms)\n  ✕ fails (1 ms)\n  ○ skipped not ready\n  ✔ works 2ms');

  assert.equal(caseStatuses.byName.get('adds numbers'), 'passed');
  assert.equal(caseStatuses.byName.get('fails'), 'failed');
  assert.equal(caseStatuses.byName.get('not ready'), 'skipped');
  assert.equal(caseStatuses.byName.get('works'), 'passed');
});

test('Mocha: ignores the repeated failure number above the error details', () => {
  const caseStatuses = statusesFor('  suite\n    1) real test\n\n  1) suite\n       real test:\n     AssertionError');

  assert.equal(caseStatuses.byName.get('real test'), 'failed');
  assert.equal(caseStatuses.byName.has('suite'), false);
});

test('pytest: verbose and short-summary lines, with classes and parameters', () => {
  const caseStatuses = statusesFor(
    'tests/test_math.py::test_add PASSED [ 33%]\n' +
      'FAILED tests/test_math.py::TestMath::test_div[zero] - ZeroDivisionError\n' +
      'tests/test_math.py::test_later SKIPPED (not ready)',
  );

  assert.equal(caseStatuses.byName.get('test_add'), 'passed');
  assert.equal(caseStatuses.byName.get('test_div'), 'failed');
  assert.equal(caseStatuses.byName.get('test_later'), 'skipped');
});

test('go test, cargo test and TAP lines', () => {
  const caseStatuses = statusesFor(
    '--- PASS: TestAdd (0.00s)\ntest tests::it_adds ... ok\ntest slow_one ... ignored\nnot ok 2 - tap fails',
  );

  assert.equal(caseStatuses.byName.get('TestAdd'), 'passed');
  assert.equal(caseStatuses.byName.get('it_adds'), 'passed');
  assert.equal(caseStatuses.byName.get('slow_one'), 'skipped');
  assert.equal(caseStatuses.byName.get('tap fails'), 'failed');
});

test('a failure in any command wins over a pass in another', () => {
  const caseStatuses = createCaseStatuses();
  recordCaseStatuses(caseStatuses, '✓ adds numbers');
  recordCaseStatuses(caseStatuses, '✕ adds numbers');
  recordCaseStatuses(caseStatuses, '✓ adds numbers');
  assert.equal(caseStatuses.byName.get('adds numbers'), 'failed');
});

test('counts repeated names within one run, but not across runs', () => {
  const caseStatuses = createCaseStatuses();
  recordCaseStatuses(caseStatuses, '✓ same name\n✓ same name\n✓ same name');
  recordCaseStatuses(caseStatuses, '✓ same name\n✓ same name\n✓ same name');
  assert.equal(caseStatuses.timesSeen.get('same name'), 3);
});
