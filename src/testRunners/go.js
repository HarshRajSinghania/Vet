// Checks that Go is installed. Go's own toolchain fetches dependencies from
// go.mod while testing, so there's nothing else to install first.
import { runCommand } from '../runCommand.js';

const TEST_FILE_PATTERN = /_test\.go$/;

export default {
  name: 'Go',
  defaultCommand: 'go test -v ./...',
  coveredBy: /\bgo test\b/,

  isNeeded({ files }) {
    return files.some((file) => TEST_FILE_PATTERN.test(file));
  },

  async setup(repoPath) {
    const version = await runCommand('go', ['version'], repoPath);
    if (version.missingCommand) {
      throw new Error('go is not installed');
    }
    return { pathEntries: [] };
  },
};
