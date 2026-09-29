// Scans the repo's test files and turns their test names into a readable
// outline of what the test suite checks, without running anything.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';

const TEST_FILE_MATCHERS = [
  {
    language: 'JavaScript',
    filePattern: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
    namePattern: /\b(?:it|test)\(\s*['"`]([^'"`]+)['"`]/g,
  },
  {
    language: 'Python',
    filePattern: /(^|\/)(test_[^/]+|[^/]+_test)\.py$/,
    namePattern: /def (test_[a-zA-Z0-9_]+)\(/g,
  },
  {
    language: 'Go',
    filePattern: /_test\.go$/,
    namePattern: /func (Test[A-Za-z0-9_]+)\(/g,
  },
  {
    language: 'Rust',
    filePattern: /\.rs$/,
    namePattern: /#\[test\]\s*\n\s*(?:async\s+)?fn ([a-zA-Z0-9_]+)/g,
  },
];

export async function explainTests(repoPath) {
  const files = await listFiles(repoPath);
  const outline = [];

  for (const file of files) {
    const matcher = TEST_FILE_MATCHERS.find((entry) => entry.filePattern.test(file));
    if (!matcher) continue;

    const content = await readFile(join(repoPath, file), 'utf8');
    const testNames = extractTestNames(content, matcher.namePattern);
    if (testNames.length > 0) {
      outline.push({ file, language: matcher.language, testNames });
    }
  }

  return outline;
}

function extractTestNames(content, namePattern) {
  namePattern.lastIndex = 0;
  const names = [];
  let match;

  while ((match = namePattern.exec(content)) !== null) {
    names.push(humanizeTestName(match[1]));
  }

  return names;
}

function humanizeTestName(rawName) {
  return rawName
    .replace(/^test_?/i, '')
    .replace(/_/g, ' ')
    .trim();
}
