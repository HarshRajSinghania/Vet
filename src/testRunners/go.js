// Runs a Go project's test suite; Go's own toolchain resolves dependencies
// from go.mod, so there's no separate install step.
import { runCommand } from '../runCommand.js';

const TEST_FILE_PATTERN = /_test\.go$/;

export default {
  name: 'Go',

  async canRun({ files }) {
    return files.some((file) => TEST_FILE_PATTERN.test(file));
  },

  async run(repoPath) {
    const result = await runCommand('go', ['test', './...', '-v'], repoPath);
    if (result.missingCommand) {
      throw new Error('go is not installed');
    }
    return parseOutput(result.output, result.exitCode);
  },
};

function parseOutput(output, exitCode) {
  const passed = (output.match(/--- PASS/g) || []).length;
  const failed = (output.match(/--- FAIL/g) || []).length;

  if (passed === 0 && failed === 0) {
    return { passed: null, failed: null, skipped: null, total: null, exitCode };
  }

  return { passed, failed, skipped: 0, total: passed + failed, exitCode };
}
