// Lists every test case found in the code, marked with the outcome vet saw for
// it in the test output (or just listed, when tests weren't run).
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

  if (outline.length === 0) {
    console.log('    No test cases were found in the code.');
    return;
  }

  const totals = { passed: 0, failed: 0, skipped: 0, unknown: 0, notRun: 0 };
  for (const language of listLanguages(outline)) {
    console.log(`\n    ${picocolors.underline(language)}`);
    for (const group of outline) {
      if (group.language === language) {
        printFileCases(group, caseStatuses, totals);
      }
    }
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

function printTotals(totals) {
  const total = totals.passed + totals.failed + totals.skipped + totals.unknown + totals.notRun;

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
