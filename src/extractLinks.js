// Pulls links out of Markdown, like [text](https://example.com) or
// [setup](docs/setup.md#install), along with the line each one is on.
// Links shown as examples inside code blocks or `code spans` aren't real
// links, so they're skipped.
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\(([^\s)]+)[^)]*\)/g;

export function extractLinks(markdownText) {
  const links = [];
  const lines = markdownText.split('\n');
  let insideCodeBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*(```|~~~)/.test(lines[index])) {
      insideCodeBlock = !insideCodeBlock;
      continue;
    }
    if (insideCodeBlock) continue;

    const withoutCodeSpans = lines[index].replace(/`[^`]*`/g, '');
    for (const match of withoutCodeSpans.matchAll(MARKDOWN_LINK_PATTERN)) {
      const kind = classifyTarget(match[1]);
      if (kind) {
        links.push({ target: match[1], kind, line: index + 1 });
      }
    }
  }

  return links;
}

// "web" links are fetched, "local" ones are looked up inside the repo. Other
// kinds (mailto:, site-absolute /paths, {{templates}}) can't be checked from
// the repo alone, so they're left out.
function classifyTarget(target) {
  if (/^https?:\/\//i.test(target)) return 'web';
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return null;
  if (target.startsWith('/') || target.includes('{{')) return null;
  return 'local';
}
