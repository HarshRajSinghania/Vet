// Detects PHP source files by extension.
const EXTENSIONS = ['.php'];

export default {
  name: 'PHP',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
