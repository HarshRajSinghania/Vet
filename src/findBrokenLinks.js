// Scans every Markdown file in the repo for http(s) links and checks each one.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';
import { extractLinks } from './extractLinks.js';
import { checkLink } from './checkLink.js';

// Enough to be fast without hammering any one server with requests.
const MAX_PARALLEL_CHECKS = 8;

export async function findBrokenLinks(repoPath) {
  const locationsByUrl = await collectLinks(repoPath);
  const results = await checkAllLinks(Array.from(locationsByUrl.keys()));
  const brokenLinks = [];
  const unverifiedLinks = [];

  // The same URL often appears in several places (like translated READMEs),
  // so each one is checked once and the result applies everywhere it appears.
  for (const [url, locations] of locationsByUrl) {
    const result = results.get(url);
    if (result.ok) continue;

    for (const location of locations) {
      const entry = { url, file: location.file, line: location.line, reason: result.reason };
      if (result.blocked) {
        unverifiedLinks.push(entry);
      } else {
        brokenLinks.push(entry);
      }
    }
  }

  return { checkedCount: locationsByUrl.size, brokenLinks, unverifiedLinks };
}

// A few "workers" each take the next unchecked URL until none are left, so
// at most MAX_PARALLEL_CHECKS requests are in flight at once.
async function checkAllLinks(urls) {
  const results = new Map();
  let nextIndex = 0;

  async function checkUntilDone() {
    while (nextIndex < urls.length) {
      const url = urls[nextIndex];
      nextIndex += 1;
      results.set(url, await checkLink(url));
    }
  }

  const workers = [];
  for (let count = 0; count < MAX_PARALLEL_CHECKS; count += 1) {
    workers.push(checkUntilDone());
  }
  await Promise.all(workers);
  return results;
}

async function collectLinks(repoPath) {
  const files = await listFiles(repoPath);
  const locationsByUrl = new Map();

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const content = await readFile(join(repoPath, file), 'utf8');
    for (const link of extractLinks(content)) {
      if (!locationsByUrl.has(link.url)) {
        locationsByUrl.set(link.url, []);
      }
      locationsByUrl.get(link.url).push({ file, line: link.line });
    }
  }

  return locationsByUrl;
}
