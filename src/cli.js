// Wires together the command line, the repo checks, and the report.
import { Command } from 'commander';
import picocolors from 'picocolors';
import { parseRepoUrl } from './parseRepoUrl.js';
import { cloneRepo } from './cloneRepo.js';
import { removeTempDir } from './tempDir.js';
import { detectLanguages } from './detectLanguage.js';
import { findBrokenLinks } from './findBrokenLinks.js';
import { explainTests } from './explainTests.js';
import { runTests } from './runTests.js';
import { printReport, printElapsedTime } from './report.js';
import { printTestSection } from './printTestReport.js';

export async function runCli(argv) {
  const program = new Command();
  program
    .name('vet')
    .description("Vet a GitHub repository: detect its languages, find broken doc links, and optionally run its tests")
    .argument('<url>', 'GitHub repository URL, e.g. https://github.com/owner/repo')
    .option(
      '--run-tests',
      "also run the repo's own test suite (installs dependencies and executes its code — only use this for repos you trust)",
    )
    .parse(argv);

  const [url] = program.args;
  const { runTests: shouldRunTests } = program.opts();
  await vetRepository(url, shouldRunTests);
}

async function vetRepository(url, shouldRunTests) {
  const startTime = Date.now();
  let repoPath;

  try {
    const repoName = parseRepoUrl(url);
    console.log(`Vetting ${picocolors.bold(repoName)}...\n`);

    repoPath = await cloneRepo(url);
    const languages = await detectLanguages(repoPath);
    const brokenLinks = await findBrokenLinks(repoPath);
    printReport({ languages, brokenLinks });

    if (shouldRunTests) {
      await vetTests(repoPath);
    }

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

async function vetTests(repoPath) {
  console.log(
    picocolors.yellow(
      "\nRunning the repo's own tests now. This executes its code on your machine, so only use --run-tests for repos you trust.",
    ),
  );

  const outline = await explainTests(repoPath);
  const results = await runTests(repoPath);
  printTestSection(outline, results);
}
