// Runs every check that only reads the cloned repo (or asks GitHub's API)
// and gathers the results into one report object.
import { detectLanguages } from './detectLanguage.js';
import { fetchRepoInfo } from './fetchRepoInfo.js';
import { detectLicense } from './detectLicense.js';
import { checkHygiene } from './checkHygiene.js';
import { checkBinaries } from './checkBinaries.js';
import { checkWorkflows } from './checkWorkflows.js';
import { findBrokenLinks } from './findBrokenLinks.js';

export async function collectChecks(repoName, repoPath) {
  return {
    repo: repoName,
    languages: await detectLanguages(repoPath),
    repoInfo: await fetchRepoInfo(repoName),
    license: await detectLicense(repoPath),
    hygiene: await checkHygiene(repoPath),
    binaries: await checkBinaries(repoPath),
    workflows: await checkWorkflows(repoPath),
    links: await findBrokenLinks(repoPath),
  };
}
