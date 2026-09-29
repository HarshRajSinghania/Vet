// Recognizes a single line of test output that names one test (or one test
// file) and its result. Each test tool words this differently, so each known
// format gets its own small reader.

const CHECKMARK_STATUSES = {
  '✓': 'passed',
  '✔': 'passed',
  '√': 'passed',
  '✕': 'failed',
  '✖': 'failed',
  '×': 'failed',
  '✗': 'failed',
  '○': 'skipped',
};
const PYTEST_STATUSES = { PASSED: 'passed', XPASS: 'passed', FAILED: 'failed', ERROR: 'failed', SKIPPED: 'skipped', XFAIL: 'skipped' };
const GO_STATUSES = { PASS: 'passed', FAIL: 'failed', SKIP: 'skipped' };
const CARGO_STATUSES = { ok: 'passed', FAILED: 'failed', ignored: 'skipped' };

// Order matters: file-level and failure-detail lines are checked before the
// general checkmark format, which would otherwise swallow them.
const LINE_READERS = [
  readFailureDetailLine,
  readVitestFileLine,
  readJestFileLine,
  readCheckmarkLine,
  readMochaFailureLine,
  readPytestLine,
  readGoLine,
  readCargoLine,
  readTapLine,
];

// Returns { kind: 'name' | 'file', key, status } or null when the line isn't a test result.
export function readTestLine(line) {
  for (const readLine of LINE_READERS) {
    const found = readLine(line);
    if (found) return found;
  }
  return null;
}

// Jest: "● math › adds numbers"    Vitest: "FAIL src/math.test.js > math > adds numbers"
function readFailureDetailLine(line) {
  const jest = line.match(/^\s*●\s+(.+?)\s*$/);
  if (jest && jest[1] === 'Console') return null; // a heading for console.log output, not a test
  if (jest) return { kind: 'name', key: lastPart(jest[1], ' › '), status: 'failed' };

  const vitest = line.match(/^\s*(?:FAIL|×)\s+\S+\s+>\s+(.+?)\s*$/);
  if (vitest) return { kind: 'name', key: lastPart(vitest[1], ' > '), status: 'failed' };
  return null;
}

// Vitest: "✓ src/math.test.js (3 tests) 4ms" or "❯ src/math.test.js (3 tests | 1 failed)"
function readVitestFileLine(line) {
  const match = line.match(/^\s*([✓❯×])\s+(\S+\.[cm]?[jt]sx?)\s+\(\d+ tests?/);
  if (!match) return null;
  return { kind: 'file', key: match[2], status: match[1] === '✓' ? 'passed' : 'failed' };
}

// Jest: "PASS src/math.test.js" or "FAIL src/math.test.js"
function readJestFileLine(line) {
  const match = line.match(/^\s*(PASS|FAIL)\s+(\S+\.[cm]?[jt]sx?)\b/);
  if (!match) return null;
  return { kind: 'file', key: match[2], status: match[1] === 'PASS' ? 'passed' : 'failed' };
}

// Jest, Vitest, Mocha, node:test: "✓ adds numbers (3 ms)" or "○ skipped adds numbers"
function readCheckmarkLine(line) {
  const match = line.match(/^\s*([✓✔√✕✖×✗○])\s+(?:skipped\s+)?(.+?)(?:\s+\(?\d+(?:\.\d+)?\s?m?s\)?)?\s*$/);
  if (!match) return null;
  return { kind: 'name', key: match[2], status: CHECKMARK_STATUSES[match[1]] };
}

// Mocha lists failures in place as "  1) adds numbers"
function readMochaFailureLine(line) {
  const match = line.match(/^\s+(\d+)\)\s+(.+?):?\s*$/);
  if (!match) return null;
  return { kind: 'name', key: match[2], status: 'failed', mochaFailureNumber: match[1] };
}

// pytest -v: "tests/test_math.py::test_add PASSED [ 50%]"   pytest -rA: "PASSED tests/test_math.py::test_add"
function readPytestLine(line) {
  const verbose = line.match(/^(\S+::\S+?)\s+(PASSED|FAILED|SKIPPED|ERROR|XFAIL|XPASS)\b/);
  if (verbose) return { kind: 'name', key: pytestTestName(verbose[1]), status: PYTEST_STATUSES[verbose[2]] };

  const summary = line.match(/^(PASSED|FAILED|SKIPPED|ERROR|XFAIL|XPASS)\s+(\S+::\S+)/);
  if (summary) return { kind: 'name', key: pytestTestName(summary[2]), status: PYTEST_STATUSES[summary[1]] };
  return null;
}

// go test -v: "--- PASS: TestAdd (0.00s)"
function readGoLine(line) {
  const match = line.match(/^\s*--- (PASS|FAIL|SKIP): (\S+)/);
  if (!match) return null;
  return { kind: 'name', key: match[2], status: GO_STATUSES[match[1]] };
}

// cargo test: "test tests::it_adds ... ok"
function readCargoLine(line) {
  const match = line.match(/^test (\S+) \.\.\. (ok|FAILED|ignored)/);
  if (!match) return null;
  return { kind: 'name', key: lastPart(match[1], '::'), status: CARGO_STATUSES[match[2]] };
}

// TAP (tape, node-tap, node --test): "ok 1 - adds numbers" or "not ok 2 - later # SKIP"
function readTapLine(line) {
  const match = line.match(/^\s*(ok|not ok)\s+\d+\s+(?:-\s+)?(.+?)(\s+#\s*(?:SKIP|TODO)\b.*)?$/i);
  if (!match) return null;

  let status = match[1].toLowerCase() === 'ok' ? 'passed' : 'failed';
  if (match[3]) status = 'skipped';
  return { kind: 'name', key: match[2], status };
}

// "tests/test_math.py::TestMath::test_add[case-1]" -> "test_add"
function pytestTestName(nodeId) {
  return lastPart(nodeId, '::').replace(/\[.*\]$/, '');
}

function lastPart(text, separator) {
  const parts = text.split(separator);
  return parts[parts.length - 1].trim();
}
