// Turns the report into plain data for --json. Test results are kept in Maps
// while vet runs, which JSON can't hold, so here every test case gets its
// status the same way the text report decides it.
import { lookupCaseStatus, findOutputOnlyCases } from './parseTestCases.js';

export function toJson(report) {
  const { tests, ...checks } = report;
  return { ...checks, tests: testsToJson(tests) };
}

function testsToJson({ outline, testRun }) {
  const testCases = [];

  for (const group of outline) {
    for (const test of group.tests) {
      const status = testRun ? lookupCaseStatus(testRun.caseStatuses, group.file, test) : 'notRun';
      testCases.push({ language: group.language, file: group.file, name: test.displayName, status, count: 1 });
    }
  }

  if (testRun) {
    for (const test of findOutputOnlyCases(outline, testRun.caseStatuses)) {
      testCases.push({ language: null, file: null, name: test.name, status: test.status, count: test.times });
    }
  }

  return {
    ran: Boolean(testRun),
    commands: testRun ? testRun.commandResults : [],
    setupProblems: testRun ? testRun.setupProblems : [],
    testCases,
  };
}
