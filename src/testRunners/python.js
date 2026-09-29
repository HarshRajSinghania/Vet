// Runs a Python project's pytest suite inside a throwaway virtual environment,
// so installing its dependencies never touches the user's own Python setup.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { runCommand } from '../runCommand.js';

const TEST_FILE_PATTERN = /(^|\/)(test_[^/]+|[^/]+_test)\.py$/;
const BIN_FOLDER = process.platform === 'win32' ? 'Scripts' : 'bin';

export default {
  name: 'Python',

  async canRun({ files }) {
    return files.some((file) => TEST_FILE_PATTERN.test(file));
  },

  async run(repoPath) {
    const venvPath = join(repoPath, '.vet-venv');
    const venvSetup = await runCommand('python3', ['-m', 'venv', venvPath], repoPath);
    if (venvSetup.missingCommand) {
      throw new Error('python3 is not installed');
    }
    if (venvSetup.exitCode !== 0) {
      throw new Error('could not create a virtual environment to run the tests in');
    }

    await installDependencies(repoPath, venvPath);

    const pytest = join(venvPath, BIN_FOLDER, 'pytest');
    const result = await runCommand(pytest, ['-q'], repoPath);
    return parseOutput(result.output, result.exitCode);
  },
};

async function installDependencies(repoPath, venvPath) {
  const pip = join(venvPath, BIN_FOLDER, 'pip');
  const requirementsPath = join(repoPath, 'requirements.txt');

  if (existsSync(requirementsPath)) {
    await runCommand(pip, ['install', '-r', 'requirements.txt'], repoPath);
  }
  await runCommand(pip, ['install', 'pytest'], repoPath);
}

function parseOutput(output, exitCode) {
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  const skippedMatch = output.match(/(\d+) skipped/);

  if (!passedMatch && !failedMatch) {
    return { passed: null, failed: null, skipped: null, total: null, exitCode };
  }

  const passed = passedMatch ? Number(passedMatch[1]) : 0;
  const failed = failedMatch ? Number(failedMatch[1]) : 0;
  const skipped = skippedMatch ? Number(skippedMatch[1]) : 0;
  return { passed, failed, skipped, total: passed + failed + skipped, exitCode };
}
