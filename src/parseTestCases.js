// Collects individual test results ("adds numbers: passed") from a test tool's
// output, so each test case found in the code can be shown with its outcome.
import { stripColors } from './stripColors.js';
import { readTestLine } from './readTestLine.js';

const STATUS_RANK = { skipped: 1, passed: 2, failed: 3 };

export function createCaseStatuses() {
  return { byName: new Map(), byFile: new Map(), timesSeen: new Map() };
}

export function recordCaseStatuses(caseStatuses, output) {
  const seenMochaFailures = new Set();
  const timesSeenInThisOutput = new Map();

  for (const line of stripColors(output).split('\n')) {
    const found = readTestLine(line);
    if (!found) continue;

    // Mocha numbers each failure twice: once in the test list, then again above
    // its error details, where the line holds the suite name instead of the test.
    if (found.mochaFailureNumber) {
      if (seenMochaFailures.has(found.mochaFailureNumber)) continue;
      seenMochaFailures.add(found.mochaFailureNumber);
    }

    const statusMap = found.kind === 'file' ? caseStatuses.byFile : caseStatuses.byName;
    keepMostSevere(statusMap, found.key, found.status);
    if (found.kind === 'name') {
      timesSeenInThisOutput.set(found.key, (timesSeenInThisOutput.get(found.key) || 0) + 1);
    }
  }

  // Several tests can share a name (e.g. generated in a loop). Keep the highest
  // count from any one run, so a suite run by two commands isn't counted twice.
  for (const [name, count] of timesSeenInThisOutput) {
    caseStatuses.timesSeen.set(name, Math.max(caseStatuses.timesSeen.get(name) || 0, count));
  }
}

export function lookupCaseStatus(caseStatuses, file, test) {
  const namedStatus = caseStatuses.byName.get(test.rawName);
  if (namedStatus) return namedStatus;
  if (test.skippedInCode) return 'skipped';

  // Jest with several files only names the failures, plus one PASS line per
  // file, so every test in a file that passed as a whole passed too.
  for (const [reportedFile, fileStatus] of caseStatuses.byFile) {
    const sameFile = file.endsWith(reportedFile) || reportedFile.endsWith(file);
    if (sameFile && fileStatus === 'passed') return 'passed';
  }
  return 'unknown';
}

// Tests built while the suite runs (like it() calls inside a loop) have no
// fixed name in the code, so the test tool's output is the only place they
// show up. Returns those, with how many tests shared each name.
export function findOutputOnlyCases(outline, caseStatuses) {
  const namesInCode = new Set();
  for (const group of outline) {
    for (const test of group.tests) {
      namesInCode.add(test.rawName);
    }
  }

  const outputOnly = [];
  for (const [name, status] of caseStatuses.byName) {
    if (!namesInCode.has(name)) {
      outputOnly.push({ name, status, times: caseStatuses.timesSeen.get(name) || 1 });
    }
  }
  return outputOnly;
}

// A test that fails in one command and passes in another counts as failed.
function keepMostSevere(statusMap, key, status) {
  const existing = statusMap.get(key);
  if (!existing || STATUS_RANK[status] > STATUS_RANK[existing]) {
    statusMap.set(key, status);
  }
}
