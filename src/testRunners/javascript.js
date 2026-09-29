// Gets a Node.js project ready to test by installing its dependencies. The test
// commands themselves come from the repo (see src/findTestCommands.js).
import { join } from 'node:path';
import { runCommand } from '../runCommand.js';

const USES_NODE_PATTERN = /\b(npm|npx|yarn|pnpm|node|jest|vitest|mocha|make)\b/;

export default {
  name: 'JavaScript',
  defaultCommand: null,
  coveredBy: null,

  isNeeded({ files, commands }) {
    const hasPackageJson = files.includes('package.json');
    return hasPackageJson && commands.some((entry) => USES_NODE_PATTERN.test(entry.command));
  },

  async setup(repoPath) {
    const install = await runCommand('npm', ['install', '--no-audit', '--no-fund'], repoPath);
    if (install.missingCommand) {
      throw new Error('npm is not installed');
    }
    if (install.exitCode !== 0) {
      throw new Error('npm install failed, so its tests may not run correctly');
    }
    return { pathEntries: [join(repoPath, 'node_modules', '.bin')] };
  },
};
