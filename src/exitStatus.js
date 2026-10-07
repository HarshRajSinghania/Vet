// Decides vet's exit code so CI pipelines can fail a build on problems:
// 0 = nothing wrong, 1 = broken links or failing tests found. (cli.js uses
// 2 when vet itself couldn't run, e.g. a bad URL.)
export const EXIT_PROBLEMS_FOUND = 1;
export const EXIT_VET_FAILED = 2;

export function findExitProblems(report) {
  const problems = [];

  const brokenCount = report.links.brokenLinks.length;
  if (brokenCount > 0) {
    problems.push(`${brokenCount} broken link(s)`);
  }

  const testRun = report.tests.testRun;
  if (testRun) {
    const failingCount = testRun.commandResults.filter((result) => result.exitCode !== 0).length;
    if (failingCount > 0) {
      problems.push(`${failingCount} failing test command(s)`);
    }
  }

  return problems;
}
