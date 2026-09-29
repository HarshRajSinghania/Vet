// Finds every test case written in the repo's test files and gives each one a
// readable name, without running anything.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';

const JS_EXTENSIONS = '(js|jsx|ts|tsx|mjs|cjs)';

const TEST_FILE_MATCHERS = [
  {
    language: 'JavaScript',
    filePattern: new RegExp(`\\.(test|spec)\\.${JS_EXTENSIONS}$|(^|/)__tests__/.+\\.${JS_EXTENSIONS}$`),
    // it('...'), test("..."), it.skip(`...`) — but not something.test(...)
    namePattern: /(?<![.\w])(?:it|test)(?:\.(?<modifier>only|skip|todo|concurrent))?\(\s*(?<quote>['"`])(?<name>.+?)\k<quote>/g,
    needsHumanizing: false,
  },
  {
    language: 'Python',
    filePattern: /(^|\/)(test_[^/]+|[^/]+_test)\.py$/,
    namePattern: /(?:async\s+)?def (?<name>test_\w+)\s*\(/g,
    needsHumanizing: true,
  },
  {
    language: 'Go',
    filePattern: /_test\.go$/,
    namePattern: /func (?<name>Test\w*)\(\s*\w+\s+\*testing\.T\s*\)/g,
    needsHumanizing: true,
  },
  {
    language: 'Rust',
    filePattern: /\.rs$/,
    // #[test] or #[tokio::test], possibly followed by more attributes like #[should_panic]
    namePattern: /#\[(?:\w+::)?test\](?:\s*#\[[^\]]*\])*\s*(?:pub\s+)?(?:async\s+)?fn (?<name>\w+)/g,
    needsHumanizing: true,
  },
];

export async function explainTests(repoPath) {
  const files = await listFiles(repoPath);
  const outline = [];

  for (const file of files) {
    const matcher = TEST_FILE_MATCHERS.find((entry) => entry.filePattern.test(file));
    if (!matcher) continue;

    const content = await readFile(join(repoPath, file), 'utf8');
    const tests = extractTests(content, matcher);
    if (tests.length > 0) {
      outline.push({ file, language: matcher.language, tests });
    }
  }

  return outline;
}

function extractTests(content, matcher) {
  const tests = [];

  for (const match of content.matchAll(matcher.namePattern)) {
    const { name, modifier } = match.groups;
    tests.push({
      rawName: name,
      displayName: matcher.needsHumanizing ? humanizeTestName(name) : name,
      skippedInCode: modifier === 'skip' || modifier === 'todo',
    });
  }

  return tests;
}

// "test_divide_by_zero" -> "divide by zero", "TestSubtractNegative" -> "Subtract Negative"
function humanizeTestName(rawName) {
  const readable = rawName
    .replace(/^test_?/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  return readable || rawName;
}
