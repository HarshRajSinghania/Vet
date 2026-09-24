// Detects Go source files by extension.
const EXTENSIONS = ['.go'];

export default {
  name: 'Go',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
