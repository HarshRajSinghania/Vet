// Checks that Cargo is installed. Cargo builds and fetches dependencies
// itself as part of `cargo test`, so there's nothing else to install first.
import { runCommand } from '../runCommand.js';

export default {
  name: 'Rust',
  defaultCommand: 'cargo test',
  coveredBy: /\bcargo (test|nextest)\b/,

  isNeeded({ files }) {
    return files.includes('Cargo.toml');
  },

  async setup(repoPath) {
    const version = await runCommand('cargo', ['--version'], repoPath);
    if (version.missingCommand) {
      throw new Error('cargo is not installed');
    }
    return { pathEntries: [] };
  },
};
