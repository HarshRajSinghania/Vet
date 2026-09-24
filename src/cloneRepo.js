// Shallow-clones a GitHub repo into a fresh temp directory so we can inspect its files.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { makeTempDir } from './tempDir.js';

const execFileAsync = promisify(execFile);

export async function cloneRepo(url) {
  const tempDir = await makeTempDir();

  try {
    await execFileAsync('git', ['clone', '--depth', '1', '--quiet', url, tempDir]);
  } catch (error) {
    const firstLine = error.message.split('\n')[0];
    throw new Error(`git clone failed for "${url}" (${firstLine})`);
  }

  return tempDir;
}
