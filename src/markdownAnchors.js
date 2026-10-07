// Works out the #anchors GitHub creates for a Markdown file's headings, using
// the same rules GitHub does: lowercase, punctuation dropped, spaces become
// hyphens, and a repeated heading gets -1, -2, ... on the end.
export function findAnchors(markdownText) {
  const anchors = new Set();
  const timesUsed = new Map();
  const lines = markdownText.split('\n');
  let insideCodeBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*(```|~~~)/.test(line)) {
      insideCodeBlock = !insideCodeBlock;
      continue;
    }
    if (insideCodeBlock) continue;

    // Hand-written anchors like <a name="install"></a> count too.
    for (const match of line.matchAll(/<a\s[^>]*(?:name|id)=["']([^"']+)["']/gi)) {
      anchors.add(match[1].toLowerCase());
    }

    const headingText = readHeading(line, lines[index + 1]);
    if (headingText !== null) {
      anchors.add(uniqueSlug(slugify(headingText), timesUsed));
    }
  }

  return anchors;
}

// "## Install" style headings, or a line underlined with === or --- below it.
function readHeading(line, nextLine) {
  const hashHeading = line.match(/^\s{0,3}#{1,6}\s+(.*?)(?:\s+#+)?\s*$/);
  if (hashHeading) return hashHeading[1];

  const isUnderlined = nextLine !== undefined && /^\s{0,3}(=+|-+)\s*$/.test(nextLine);
  const isListItem = /^\s*([-*+]|\d+\.)\s/.test(line);
  if (isUnderlined && line.trim() !== '' && !isListItem) return line.trim();
  return null;
}

function slugify(headingText) {
  // Turn the heading into the text GitHub displays: link text only, no HTML,
  // no code or emphasis markers. _word_ is italics, but snake_case is not.
  const plainText = headingText
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(^|[^\p{L}\p{N}])_{1,2}([^_]+?)_{1,2}(?=[^\p{L}\p{N}]|$)/gu, '$1$2')
    .replace(/[`*~]/g, '');

  return plainText
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

function uniqueSlug(slug, timesUsed) {
  const count = timesUsed.get(slug) || 0;
  timesUsed.set(slug, count + 1);
  return count === 0 ? slug : `${slug}-${count}`;
}
