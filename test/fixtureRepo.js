// Builds a small throwaway repo on disk from a { path: content } map, so tests
// can run vet's file-reading code against known files.
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export async function createFixtureRepo(filesByPath) {
  const repoPath = await mkdtemp(join(tmpdir(), 'vet-test-'));

  for (const [path, content] of Object.entries(filesByPath)) {
    const fullPath = join(repoPath, path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }

  return repoPath;
}

export async function removeFixtureRepo(repoPath) {
  await rm(repoPath, { recursive: true, force: true });
}
