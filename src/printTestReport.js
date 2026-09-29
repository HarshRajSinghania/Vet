// Prints the Tests section: each test command vet ran and what it reported,
// followed by every test case in the code with its individual result.
import picocolors from 'picocolors';
import { COMMAND_TIMEOUT_MINUTES } from './runCommand.js';
import { printTestCases } from './printTestCases.js';

export function printTestSection({ outline, testRun }) {
  console.log(picocolors.bold('\nTests'));

  if (testRun) {
    printSetupProblems(testRun.setupProblems);
    printCommandResults(testRun.commandResults);
  } else {
    console.log('  Not run (--no-tests was passed).');
  }

  printTestCases(outline, testRun ? testRun.caseStatuses : null);
}

function printSetupProblems(setupProblems) {
  for (const problem of setupProblems) {
    console.log(`  ${picocolors.yellow('!')} Couldn't prepare ${problem.name} tests: ${problem.error}`);
  }
}

function printCommandResults(commandResults) {
  console.log(picocolors.bold('\n  Test commands'));

  if (commandResults.length === 0) {
    console.log("    The repo doesn't declare any test commands vet knows how to run.");
    return;
  }

  for (const result of commandResults) {
    printCommandResult(result);
  }
}

function printCommandResult(result) {
  const succeeded = result.exitCode === 0;
  const icon = succeeded ? picocolors.green('✔') : picocolors.red('✘');
  const details = picocolors.dim(`(from ${result.sources.join(', ')}, ${result.durationSeconds}s)`);

  console.log(`\n    ${icon} ${picocolors.bold(result.command)} ${details}`);
  console.log(`      ${describeOutcome(result)}`);

  if (!succeeded && !result.summary) {
    for (const line of result.outputTail) {
      console.log(picocolors.dim(`      │ ${line}`));
    }
  }
}

function describeOutcome(result) {
  if (result.timedOut) return `Stopped after ${COMMAND_TIMEOUT_MINUTES} minutes without finishing.`;
  if (result.exitCode === 127) return "Couldn't start: a tool it needs isn't installed.";
  if (result.summary) return describeSummary(result);
  if (result.exitCode === 0) return "Finished successfully (it didn't print a test count vet recognizes).";
  return `Failed with exit code ${result.exitCode}. Last lines of output:`;
}

function describeSummary(result) {
  const { passed, failed, skipped } = result.summary;
  const counts = `${passed} passed, ${failed} failed, ${skipped} skipped`;

  if (result.exitCode !== 0 && failed === 0) {
    return `${counts}, but the command still exited with code ${result.exitCode} (e.g. a coverage or lint check failed).`;
  }
  return counts;
}
