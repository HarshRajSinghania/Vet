// Creates and cleans up the scratch directories we clone repos into.
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function makeTempDir() {
  const prefix = join(tmpdir(), 'vet-');
  return mkdtemp(prefix);
}

export async function removeTempDir(path) {
  await rm(path, { recursive: true, force: true });
}
