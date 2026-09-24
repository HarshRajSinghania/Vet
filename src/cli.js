// Wires together the command line, the repo checks, and the report.
import { Command } from 'commander';
import picocolors from 'picocolors';
import { parseRepoUrl } from './parseRepoUrl.js';
import { cloneRepo } from './cloneRepo.js';
import { removeTempDir } from './tempDir.js';
import { detectLanguages } from './detectLanguage.js';
import { findBrokenLinks } from './findBrokenLinks.js';
import { printReport } from './report.js';

export async function runCli(argv) {
  const program = new Command();
  program
    .name('vet')
    .description('Vet a GitHub repository: detect its languages and find broken doc links')
    .argument('<url>', 'GitHub repository URL, e.g. https://github.com/owner/repo')
    .parse(argv);

  const [url] = program.args;
  await vetRepository(url);
}

async function vetRepository(url) {
  const startTime = Date.now();
  let repoPath;

  try {
    const repoName = parseRepoUrl(url);
    console.log(`Vetting ${picocolors.bold(repoName)}...\n`);

    repoPath = await cloneRepo(url);
    const languages = await detectLanguages(repoPath);
    const brokenLinks = await findBrokenLinks(repoPath);

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    printReport({ languages, brokenLinks, elapsedSeconds });
  } catch (error) {
    console.error(picocolors.red(`Could not vet repository: ${error.message}`));
    process.exitCode = 1;
  } finally {
    if (repoPath) {
      await removeTempDir(repoPath);
    }
  }
}
