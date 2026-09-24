// Detects Rust source files by extension.
const EXTENSIONS = ['.rs'];

export default {
  name: 'Rust',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
