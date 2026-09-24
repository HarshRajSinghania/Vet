// Figures out which programming languages a repo uses by asking each
// detector in src/detectors/ how many matching files it can find.
import { listFiles } from './listFiles.js';
import { detectors } from './detectors/index.js';

export async function detectLanguages(repoPath) {
  const files = await listFiles(repoPath);

  const results = detectors
    .map((detector) => ({ name: detector.name, fileCount: detector.countMatches(files) }))
    .filter((result) => result.fileCount > 0);

  results.sort((a, b) => b.fileCount - a.fileCount);
  return results;
}
