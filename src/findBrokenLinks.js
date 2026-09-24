// Scans every Markdown file in the repo for http(s) links and checks each one.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';
import { extractLinks } from './extractLinks.js';
import { checkLink } from './checkLink.js';

export async function findBrokenLinks(repoPath) {
  const files = await listFiles(repoPath);
  const markdownFiles = files.filter((file) => file.endsWith('.md'));

  const brokenLinks = [];
  let checkedCount = 0;

  for (const file of markdownFiles) {
    const content = await readFile(join(repoPath, file), 'utf8');
    const links = extractLinks(content);

    for (const link of links) {
      checkedCount += 1;
      const result = await checkLink(link);
      if (!result.ok) {
        brokenLinks.push({ url: link, file, reason: result.reason });
      }
    }
  }

  return { checkedCount, brokenLinks };
}
