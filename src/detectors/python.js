// Detects Python source files by extension.
const EXTENSIONS = ['.py'];

export default {
  name: 'Python',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
