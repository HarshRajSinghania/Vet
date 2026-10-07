// Pulls http(s) URLs out of Markdown link syntax, e.g. [text](https://example.com),
// along with the line each one is on so the report can point right at it.
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;

export function extractLinks(markdownText) {
  const links = [];
  let line = 1;
  let countedUpTo = 0;

  for (const match of markdownText.matchAll(MARKDOWN_LINK_PATTERN)) {
    line += countNewlines(markdownText, countedUpTo, match.index);
    countedUpTo = match.index;
    links.push({ url: match[1], line });
  }

  return links;
}

// Counting only the text since the previous link keeps this fast on long files.
function countNewlines(text, start, end) {
  let count = 0;
  for (let index = start; index < end; index += 1) {
    if (text[index] === '\n') count += 1;
  }
  return count;
}
