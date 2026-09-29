// Lists every test case: the ones written out in the code, marked with the
// outcome vet saw for each, plus any the test tools reported that the code
// only creates while running (e.g. it() calls inside a loop).
import picocolors from 'picocolors';
import { lookupCaseStatus } from './parseTestCases.js';

const STATUS_ICONS = {
  passed: picocolors.green('✔'),
  failed: picocolors.red('✘'),
  skipped: picocolors.dim('○'),
  unknown: picocolors.yellow('?'),
  notRun: picocolors.dim('-'),
};

export function printTestCases(outline, caseStatuses) {
  console.log(picocolors.bold('\n  Test cases'));
  const totals = { passed: 0, failed: 0, skipped: 0, unknown: 0, notRun: 0 };

  if (outline.length === 0) {
    console.log('    No test cases are written out by name in the code.');
  }
  for (const language of listLanguages(outline)) {
    console.log(`\n    ${picocolors.underline(language)}`);
    for (const group of outline) {
      if (group.language === language) {
        printFileCases(group, caseStatuses, totals);
      }
    }
  }

  if (caseStatuses) {
    printOutputOnlyCases(outline, caseStatuses, totals);
  }
  printTotals(totals);
}

function listLanguages(outline) {
  const languages = new Set();
  for (const group of outline) {
    languages.add(group.language);
  }
  return Array.from(languages);
}

function printFileCases(group, caseStatuses, totals) {
  console.log(`      ${picocolors.cyan(group.file)}`);

  for (const test of group.tests) {
    const status = caseStatuses ? lookupCaseStatus(caseStatuses, group.file, test) : 'notRun';
    totals[status] += 1;
    console.log(`        ${STATUS_ICONS[status]} ${test.displayName}`);
  }
}

// Tests built while the suite runs have no fixed name in the code, so the
// test tool's output is the only place they show up.
function printOutputOnlyCases(outline, caseStatuses, totals) {
  const namesInCode = new Set();
  for (const group of outline) {
    for (const test of group.tests) {
      namesInCode.add(test.rawName);
    }
  }

  const outputOnly = [];
  for (const [name, status] of caseStatuses.byName) {
    if (!namesInCode.has(name)) {
      outputOnly.push({ name, status });
    }
  }
  if (outputOnly.length === 0) return;

  console.log(`\n    ${picocolors.underline('Reported while running')} ${picocolors.dim('(created by the code at runtime)')}`);
  for (const test of outputOnly) {
    const times = caseStatuses.timesSeen.get(test.name) || 1;
    totals[test.status] += times;
    const repeatNote = times > 1 ? picocolors.dim(` (${times} tests with this name)`) : '';
    console.log(`        ${STATUS_ICONS[test.status]} ${test.name}${repeatNote}`);
  }
}

function printTotals(totals) {
  const total = totals.passed + totals.failed + totals.skipped + totals.unknown + totals.notRun;
  if (total === 0) return;

  if (totals.notRun === total) {
    console.log(`\n    ${total} test case(s) found (not run).`);
    return;
  }

  console.log(
    `\n    ${total} test case(s): ${totals.passed} passed, ${totals.failed} failed, ` +
      `${totals.skipped} skipped, ${totals.unknown} without an individual result`,
  );
  if (totals.unknown > 0) {
    console.log(
      picocolors.dim(
        "    ? = this test wasn't named in the output (the tool only printed totals, or the test didn't run).",
      ),
    );
  }
}
