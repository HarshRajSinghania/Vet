// Counts code, comment and blank lines in a source file, like scc and cloc do.
// It looks at how each line starts, so a comment marker inside a string can
// fool it now and then; the totals are a close estimate, not exact.
export function countLines(text, { lineComments, blockComment }) {
  const counts = { code: 0, comment: 0, blank: 0 };
  const lines = text.split('\n');
  if (text.endsWith('\n')) lines.pop();

  let insideBlockComment = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (insideBlockComment) {
      counts.comment += 1;
      insideBlockComment = !line.includes(blockComment[1]);
    } else if (line === '') {
      counts.blank += 1;
    } else if (lineComments.some((marker) => line.startsWith(marker))) {
      counts.comment += 1;
    } else if (blockComment && line.startsWith(blockComment[0])) {
      counts.comment += 1;
      insideBlockComment = !line.includes(blockComment[1], blockComment[0].length);
    } else {
      counts.code += 1;
    }
  }

  return counts;
}
