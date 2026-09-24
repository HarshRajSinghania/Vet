// Detects Java source files by extension.
const EXTENSIONS = ['.java'];

export default {
  name: 'Java',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
