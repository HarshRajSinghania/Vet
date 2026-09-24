// Detects JavaScript and TypeScript source files by extension.
const EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'];

export default {
  name: 'JavaScript',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
