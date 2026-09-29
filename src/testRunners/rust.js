// Runs a Rust project's test suite with Cargo, which manages its own
// dependencies and build cache.
import { runCommand } from '../runCommand.js';

export default {
  name: 'Rust',

  async canRun({ files }) {
    return files.includes('Cargo.toml');
  },

  async run(repoPath) {
    const result = await runCommand('cargo', ['test'], repoPath);
    if (result.missingCommand) {
      throw new Error('cargo is not installed');
    }
    return parseOutput(result.output, result.exitCode);
  },
};

function parseOutput(output, exitCode) {
  const pattern = /test result: \w+\. (\d+) passed; (\d+) failed; (\d+) ignored/g;
  let match;
  let passed = 0;
  let failed = 0;
  let ignored = 0;
  let found = false;

  while ((match = pattern.exec(output)) !== null) {
    found = true;
    passed += Number(match[1]);
    failed += Number(match[2]);
    ignored += Number(match[3]);
  }

  if (!found) {
    return { passed: null, failed: null, skipped: null, total: null, exitCode };
  }

  return { passed, failed, skipped: ignored, total: passed + failed + ignored, exitCode };
}
