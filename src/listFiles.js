// Walks a repo directory and returns every file path, skipping folders that
// would just add noise (version control internals, installed dependencies).
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'build', 'vendor']);

export async function listFiles(repoPath) {
  const files = [];
  await walk(repoPath, repoPath, files);
  return files;
}

async function walk(repoPath, currentDir, files) {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        await walk(repoPath, join(currentDir, entry.name), files);
      }
      continue;
    }

    const fullPath = join(currentDir, entry.name);
    files.push(relative(repoPath, fullPath));
  }
}
