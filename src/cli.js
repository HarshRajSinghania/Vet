// Wires together the command line, the repo checks, and the report.
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import picocolors from 'picocolors';
import { parseRepoUrl } from './parseRepoUrl.js';
import { cloneRepo } from './cloneRepo.js';
import { removeTempDir } from './tempDir.js';
import { collectChecks } from './collectChecks.js';
import { explainTests } from './explainTests.js';
import { runTests } from './runTests.js';
import { scoreReport } from './scoreReport.js';
import { toJson } from './toJson.js';
import { printReport, printElapsedTime } from './report.js';
import { printTestSection } from './printTestReport.js';
import { printScore } from './printScore.js';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

// By default Ctrl+C kills Node without running 'exit' handlers. Exiting
// normally lets tempDir.js and runCommand.js clean up after themselves.
process.on('SIGINT', () => process.exit(130));

export async function runCli(argv) {
  const program = new Command();
  program
    .name('vet')
    .version(packageJson.version)
    .description("Vet a GitHub repository: its health, security, licensing, docs and tests")
    .argument('<url>', 'GitHub repository URL, e.g. https://github.com/owner/repo')
    .option('--no-tests', "don't run the repo's tests (running them executes the repo's code on your machine)")
    .option('--json', 'print the full report as JSON instead of text')
    .parse(argv);

  const [url] = program.args;
  await vetRepository(url, program.opts());
}

async function vetRepository(url, options) {
  const startTime = Date.now();
  // With --json, standard output must hold only the JSON, so progress goes to stderr.
  const say = options.json ? console.error : console.log;
  let repoPath;

  try {
    const repoName = parseRepoUrl(url);
    say(`Vetting ${picocolors.bold(repoName)}...\n`);

    repoPath = await cloneRepo(url);
    const report = await collectChecks(repoName, repoPath);
    if (!options.json) printReport(report);

    report.tests = await reportTests(repoPath, options, say);
    report.score = scoreReport(report);
    finishReport(report, options, startTime);
  } catch (error) {
    console.error(picocolors.red(`Could not vet repository: ${error.message}`));
    process.exitCode = 1;
  } finally {
    if (repoPath) {
      await removeTempDir(repoPath);
    }
  }
}

function finishReport(report, options, startTime) {
  if (options.json) {
    console.log(JSON.stringify(toJson(report), null, 2));
    return;
  }
  printScore(report.score);
  printElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
}

// Test cases are always listed, since finding them only reads files. Running
// them is the part that executes the repo's code, so --no-tests turns just that off.
async function reportTests(repoPath, options, say) {
  const outline = await explainTests(repoPath);
  let testRun = null;

  if (options.tests) {
    say(picocolors.yellow("\nRunning the repo's tests. This executes its code on your machine (pass --no-tests to skip)."));
    testRun = await runTests(repoPath, (message) => say(picocolors.dim(`  ${message}`)));
  }

  if (!options.json) printTestSection({ outline, testRun });
  return { outline, testRun };
}
