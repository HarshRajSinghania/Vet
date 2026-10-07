// Checks that links are pulled out of Markdown with the right line numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractLinks } from '../src/extractLinks.js';

test('finds http(s) links and the line each is on', () => {
  const markdown = '# Title\n\nSee [docs](https://example.com/docs).\n\nAnd [site](http://example.org) here.';
  assert.deepEqual(extractLinks(markdown), [
    { url: 'https://example.com/docs', line: 3 },
    { url: 'http://example.org', line: 5 },
  ]);
});

test('keeps every occurrence, even of the same link', () => {
  const markdown = '[a](https://example.com)\n[b](https://example.com)';
  assert.deepEqual(extractLinks(markdown), [
    { url: 'https://example.com', line: 1 },
    { url: 'https://example.com', line: 2 },
  ]);
});
