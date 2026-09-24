// Detects Ruby source files by extension.
const EXTENSIONS = ['.rb'];

export default {
  name: 'Ruby',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
