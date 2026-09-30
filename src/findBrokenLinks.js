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
  const unverifiedLinks = [];
  let checkedCount = 0;

  for (const file of markdownFiles) {
    const content = await readFile(join(repoPath, file), 'utf8');
    const links = extractLinks(content);

    for (const link of links) {
      checkedCount += 1;
      const result = await checkLink(link);
      if (result.ok) continue;

      const entry = { url: link, file, reason: result.reason };
      if (result.blocked) {
        unverifiedLinks.push(entry);
      } else {
        brokenLinks.push(entry);
      }
    }
  }

  return { checkedCount, brokenLinks, unverifiedLinks };
}
