// Scans every Markdown file in the repo for http(s) links and checks each one.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';
import { extractLinks } from './extractLinks.js';
import { checkLink } from './checkLink.js';

export async function findBrokenLinks(repoPath) {
  const filesByUrl = await collectLinks(repoPath);
  const brokenLinks = [];
  const unverifiedLinks = [];

  // The same URL often appears in several files (like translated READMEs),
  // so each one is checked once and the result applies everywhere it appears.
  for (const [url, files] of filesByUrl) {
    const result = await checkLink(url);
    if (result.ok) continue;

    for (const file of files) {
      const entry = { url, file, reason: result.reason };
      if (result.blocked) {
        unverifiedLinks.push(entry);
      } else {
        brokenLinks.push(entry);
      }
    }
  }

  return { checkedCount: filesByUrl.size, brokenLinks, unverifiedLinks };
}

async function collectLinks(repoPath) {
  const files = await listFiles(repoPath);
  const filesByUrl = new Map();

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const content = await readFile(join(repoPath, file), 'utf8');
    for (const url of extractLinks(content)) {
      if (!filesByUrl.has(url)) {
        filesByUrl.set(url, []);
      }
      filesByUrl.get(url).push(file);
    }
  }

  return filesByUrl;
}
