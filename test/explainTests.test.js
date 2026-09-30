// Checks that test cases written in the code are found and given readable names.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explainTests } from '../src/explainTests.js';
import { createFixtureRepo, removeFixtureRepo } from './fixtureRepo.js';

async function outlineOf(filesByPath) {
  const repoPath = await createFixtureRepo(filesByPath);
  try {
    return await explainTests(repoPath);
  } finally {
    await removeFixtureRepo(repoPath);
  }
}

function namesIn(outline) {
  const names = [];
  for (const group of outline) {
    for (const found of group.tests) {
      names.push(found.displayName);
    }
  }
  return names;
}

test('finds JavaScript tests, including skipped ones and apostrophes', async () => {
  const outline = await outlineOf({
    'src/math.test.js': `it('adds numbers', () => {});\nit("doesn't divide by zero", () => {});\nit.skip('later', () => {});\npattern.test('not a test');`,
  });

  assert.deepEqual(namesIn(outline), ['adds numbers', "doesn't divide by zero", 'later']);
  assert.equal(outline[0].tests[2].skippedInCode, true);
});

test('recognizes test.js files and test/ folders', async () => {
  const outline = await outlineOf({
    'test.js': "it('root test', () => {});",
    'test/helpers.js': "test('folder test', () => {});",
    'src/app.js': "it('not in a test file', () => {});",
  });
  assert.deepEqual(namesIn(outline).sort(), ['folder test', 'root test']);
});

test('turns Python, Go and Rust test names into plain words', async () => {
  const outline = await outlineOf({
    'tests/test_math.py': 'def test_divide_by_zero():\n    pass\n',
    'math_test.go': 'func TestSubtractNegative(t *testing.T) {}\nfunc TestMain(m *testing.M) {}\n',
    'src/lib.rs': '#[test]\n#[should_panic]\nfn it_adds_numbers() {}\nfn helper() {}\n',
  });
  assert.deepEqual(namesIn(outline).sort(), ['Subtract Negative', 'divide by zero', 'it adds numbers']);
});
