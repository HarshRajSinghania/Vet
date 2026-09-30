// Detects C# source files by extension.
const EXTENSIONS = ['.cs'];

export default {
  name: 'C#',
  countMatches(files) {
    return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext))).length;
  },
};
