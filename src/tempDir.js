// Creates and cleans up the scratch directories we clone repos into.
import { rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const activeTempDirs = new Set();

// If vet is stopped early (e.g. Ctrl+C), the normal cleanup never runs, so
// delete any leftover clones on the way out. This has to be synchronous,
// because Node won't wait for async work once it's exiting.
process.on('exit', () => {
  for (const path of activeTempDirs) {
    rmSync(path, { recursive: true, force: true });
  }
});

export async function makeTempDir() {
  const path = await mkdtemp(join(tmpdir(), 'vet-'));
  activeTempDirs.add(path);
  return path;
}

export async function removeTempDir(path) {
  await rm(path, { recursive: true, force: true });
  activeTempDirs.delete(path);
}
