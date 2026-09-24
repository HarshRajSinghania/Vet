// Pulls http(s) URLs out of Markdown link syntax, e.g. [text](https://example.com).
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;

export function extractLinks(markdownText) {
  const links = new Set();
  let match;

  while ((match = MARKDOWN_LINK_PATTERN.exec(markdownText)) !== null) {
    links.add(match[1]);
  }

  return Array.from(links);
}
