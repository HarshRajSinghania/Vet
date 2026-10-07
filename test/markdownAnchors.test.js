// Checks that heading anchors match the ones GitHub generates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findAnchors } from '../src/markdownAnchors.js';

test('turns headings into GitHub-style anchors', () => {
  const markdown = [
    '# Vet',
    '## Running the Tests!',
    '### `--no-tests` flag',
    '## What is [vet](https://example.com)?',
    '## snake_case and émojis 🎉',
    '## Declaring _program_ variable',
    '### 其他的选项类型，取反选项',
  ].join('\n');

  // Expected values come from github-slugger, which copies GitHub's rules.
  assert.deepEqual(
    [...findAnchors(markdown)],
    [
      'vet',
      'running-the-tests',
      '--no-tests-flag',
      'what-is-vet',
      'snake_case-and-émojis-',
      'declaring-program-variable',
      '其他的选项类型取反选项',
    ],
  );
});

test('numbers repeated headings and reads underlined headings and <a name>', () => {
  const markdown = ['## Usage', '## Usage', 'Install', '=======', '<a name="custom-spot"></a>'].join('\n');
  assert.deepEqual([...findAnchors(markdown)], ['usage', 'usage-1', 'install', 'custom-spot']);
});

test('ignores lines that only look like headings inside code blocks', () => {
  const markdown = ['```sh', '# not a heading', '```', '# Real'].join('\n');
  assert.deepEqual([...findAnchors(markdown)], ['real']);
});
