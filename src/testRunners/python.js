// Gets a Python project ready to test inside a throwaway virtual environment,
// so installing its dependencies never touches the user's own Python setup.
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { runCommand } from '../runCommand.js';

const TEST_FILE_PATTERN = /(^|\/)(test_[^/]+|[^/]+_test)\.py$/;
const REQUIREMENTS_FILE_PATTERN = /^requirements[^/]*\.txt$/;
const PYTHON_COMMAND_PATTERN = /\b(pytest|tox|nox|unittest|python3?)\b/;
const BIN_FOLDER = process.platform === 'win32' ? 'Scripts' : 'bin';

export default {
  name: 'Python',
  defaultCommand: 'pytest',
  coveredBy: /\b(pytest|tox|nox|unittest)\b/,

  isNeeded({ files, commands }) {
    const hasTestFiles = files.some((file) => TEST_FILE_PATTERN.test(file));
    return hasTestFiles || commands.some((entry) => PYTHON_COMMAND_PATTERN.test(entry.command));
  },

  async setup(repoPath) {
    const venvPath = join(repoPath, '.vet-venv');
    const venvSetup = await runCommand('python3', ['-m', 'venv', venvPath], repoPath);
    if (venvSetup.missingCommand) {
      throw new Error('python3 is not installed');
    }
    if (venvSetup.exitCode !== 0) {
      throw new Error('could not create a virtual environment to run the tests in');
    }

    await installDependencies(repoPath, join(venvPath, BIN_FOLDER, 'pip'));
    return { pathEntries: [join(venvPath, BIN_FOLDER)] };
  },
};

async function installDependencies(repoPath, pip) {
  for (const file of await readdir(repoPath)) {
    if (REQUIREMENTS_FILE_PATTERN.test(file)) {
      await runCommand(pip, ['install', '-r', file], repoPath);
    }
  }

  const isPackage = existsSync(join(repoPath, 'pyproject.toml')) || existsSync(join(repoPath, 'setup.py'));
  if (isPackage) {
    // Many projects list their test tools as a "test" extra; fall back to a plain install.
    const withTestExtra = await runCommand(pip, ['install', '-e', '.[test]'], repoPath);
    if (withTestExtra.exitCode !== 0) {
      await runCommand(pip, ['install', '-e', '.'], repoPath);
    }
  }

  await runCommand(pip, ['install', 'pytest'], repoPath);
}
