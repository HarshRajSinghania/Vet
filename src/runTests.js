// Runs each applicable test runner (see src/testRunners/) against the cloned repo.
import { listFiles } from './listFiles.js';
import { testRunners } from './testRunners/index.js';

export async function runTests(repoPath) {
  const files = await listFiles(repoPath);
  const results = [];

  for (const runner of testRunners) {
    const canRun = await runner.canRun({ repoPath, files });
    if (!canRun) continue;

    results.push(await runOneRunner(runner, repoPath));
  }

  return results;
}

async function runOneRunner(runner, repoPath) {
  const startTime = Date.now();

  try {
    const summary = await runner.run(repoPath);
    return { name: runner.name, error: null, durationSeconds: elapsedSince(startTime), ...summary };
  } catch (error) {
    return {
      name: runner.name,
      error: error.message,
      durationSeconds: elapsedSince(startTime),
      passed: null,
      failed: null,
      skipped: null,
      total: null,
    };
  }
}

function elapsedSince(startTime) {
  return ((Date.now() - startTime) / 1000).toFixed(1);
}
