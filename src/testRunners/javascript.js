// Runs a Node.js project's own "test" script from package.json.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runCommand } from '../runCommand.js';

export default {
  name: 'JavaScript',

  async canRun({ repoPath }) {
    try {
      const packageJson = JSON.parse(await readFile(join(repoPath, 'package.json'), 'utf8'));
      return Boolean(packageJson.scripts && packageJson.scripts.test);
    } catch {
      return false;
    }
  },

  async run(repoPath) {
    const install = await runCommand('npm', ['install', '--no-audit', '--no-fund'], repoPath);
    if (install.missingCommand) {
      throw new Error('npm is not installed');
    }
    if (install.exitCode !== 0) {
      throw new Error('npm install failed, so the tests could not run');
    }

    const test = await runCommand('npm', ['test'], repoPath);
    return parseOutput(test.output, test.exitCode);
  },
};

function parseOutput(output, exitCode) {
  const jestMatch = output.match(
    /Tests:\s+(?:(\d+) failed, )?(?:(\d+) skipped, )?(\d+) passed, (\d+) total/,
  );
  if (jestMatch) {
    const [, failed, skipped, passed, total] = jestMatch;
    return {
      passed: Number(passed),
      failed: Number(failed || 0),
      skipped: Number(skipped || 0),
      total: Number(total),
      exitCode,
    };
  }

  const mochaPassing = output.match(/(\d+) passing/);
  if (mochaPassing) {
    const mochaFailing = output.match(/(\d+) failing/);
    const passed = Number(mochaPassing[1]);
    const failed = mochaFailing ? Number(mochaFailing[1]) : 0;
    return { passed, failed, skipped: 0, total: passed + failed, exitCode };
  }

  return { passed: null, failed: null, skipped: null, total: null, exitCode };
}
