// Figures out which programming languages a repo uses: for each language in
// src/detectors/, it finds the matching files and counts their lines.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';
import { countLines } from './countLines.js';
import { detectors } from './detectors/index.js';

export async function detectLanguages(repoPath) {
  const files = await listFiles(repoPath);
  const results = [];

  for (const detector of detectors) {
    const matchingFiles = files.filter((file) => detector.extensions.some((extension) => file.endsWith(extension)));
    if (matchingFiles.length === 0) continue;

    const lines = await countLinesInFiles(repoPath, matchingFiles, detector);
    results.push({ name: detector.name, fileCount: matchingFiles.length, ...lines, percent: 0 });
  }

  addPercentages(results);
  results.sort((a, b) => b.code - a.code);
  return results;
}

async function countLinesInFiles(repoPath, files, detector) {
  const totals = { code: 0, comment: 0, blank: 0 };

  for (const file of files) {
    const counts = countLines(await readFile(join(repoPath, file), 'utf8'), detector);
    totals.code += counts.code;
    totals.comment += counts.comment;
    totals.blank += counts.blank;
  }

  return totals;
}

// Each language's share of all the code lines, to one decimal place.
function addPercentages(results) {
  let totalCode = 0;
  for (const result of results) {
    totalCode += result.code;
  }

  for (const result of results) {
    result.percent = totalCode === 0 ? 0 : Math.round((result.code / totalCode) * 1000) / 10;
  }
}
