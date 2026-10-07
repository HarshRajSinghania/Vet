// Wires together the command line, the repo checks, and the report.
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import picocolors from 'picocolors';
import { parseRepoUrl } from './parseRepoUrl.js';
import { cloneRepo } from './cloneRepo.js';
import { removeTempDir } from './tempDir.js';
import { detectLanguages } from './detectLanguage.js';
import { findBrokenLinks } from './findBrokenLinks.js';
import { checkHygiene } from './checkHygiene.js';
import { checkBinaries } from './checkBinaries.js';
import { detectLicense } from './detectLicense.js';
import { checkWorkflows } from './checkWorkflows.js';
import { fetchRepoInfo } from './fetchRepoInfo.js';
import { scoreReport } from './scoreReport.js';
import { printScore } from './printScore.js';
import { explainTests } from './explainTests.js';
import { runTests } from './runTests.js';
import { printReport, printElapsedTime } from './report.js';
import { printTestSection } from './printTestReport.js';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

// By default Ctrl+C kills Node without running 'exit' handlers. Exiting
// normally lets tempDir.js and runCommand.js clean up after themselves.
process.on('SIGINT', () => process.exit(130));

export async function runCli(argv) {
  const program = new Command();
  program
    .name('vet')
    .version(packageJson.version)
    .description("Vet a GitHub repository: detect its languages, find broken doc links, and run its tests")
    .argument('<url>', 'GitHub repository URL, e.g. https://github.com/owner/repo')
    .option('--no-tests', "don't run the repo's tests (running them executes the repo's code on your machine)")
    .parse(argv);

  const [url] = program.args;
  const { tests: shouldRunTests } = program.opts();
  await vetRepository(url, shouldRunTests);
}

async function vetRepository(url, shouldRunTests) {
  const startTime = Date.now();
  let repoPath;

  try {
    const repoName = parseRepoUrl(url);
    console.log(`Vetting ${picocolors.bold(repoName)}...\n`);

    repoPath = await cloneRepo(url);
    const report = { repo: repoName };
    report.languages = await detectLanguages(repoPath);
    report.repoInfo = await fetchRepoInfo(repoName);
    report.license = await detectLicense(repoPath);
    report.hygiene = await checkHygiene(repoPath);
    report.binaries = await checkBinaries(repoPath);
    report.workflows = await checkWorkflows(repoPath);
    report.links = await findBrokenLinks(repoPath);
    printReport(report);
    report.tests = await reportTests(repoPath, shouldRunTests);
    report.score = scoreReport(report);
    printScore(report.score);

    printElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
  } catch (error) {
    console.error(picocolors.red(`Could not vet repository: ${error.message}`));
    process.exitCode = 1;
  } finally {
    if (repoPath) {
      await removeTempDir(repoPath);
    }
  }
}

// Test cases are always listed, since finding them only reads files. Running
// them is the part that executes the repo's code, so --no-tests turns just that off.
async function reportTests(repoPath, shouldRunTests) {
  const outline = await explainTests(repoPath);
  let testRun = null;

  if (shouldRunTests) {
    console.log(
      picocolors.yellow("\nRunning the repo's tests. This executes its code on your machine (pass --no-tests to skip)."),
    );
    testRun = await runTests(repoPath, (message) => console.log(picocolors.dim(`  ${message}`)));
  }

  printTestSection({ outline, testRun });
  return { outline, testRun };
}
