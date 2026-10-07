// Checks that links are pulled out of Markdown with the right kind and line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractLinks } from '../src/extractLinks.js';

test('finds web and local links and the line each is on', () => {
  const markdown = '# Title\n\nSee [docs](https://example.com/docs).\n\nRead [setup](docs/setup.md#install) here.';
  assert.deepEqual(extractLinks(markdown), [
    { target: 'https://example.com/docs', kind: 'web', line: 3 },
    { target: 'docs/setup.md#install', kind: 'local', line: 5 },
  ]);
});

test('keeps every occurrence, even of the same link', () => {
  const markdown = '[a](https://example.com)\n[b](https://example.com)';
  assert.deepEqual(extractLinks(markdown), [
    { target: 'https://example.com', kind: 'web', line: 1 },
    { target: 'https://example.com', kind: 'web', line: 2 },
  ]);
});

test('skips mailto, site-absolute paths, code blocks and code spans', () => {
  const markdown = [
    '[mail](mailto:me@example.com) [abs](/docs/x.md) [tpl]({{ url }})',
    '```md',
    '[inside a code block](missing.md)',
    '```',
    'Write `[like this](missing.md)` to link. [real](#title "Title")',
  ].join('\n');
  assert.deepEqual(extractLinks(markdown), [{ target: '#title', kind: 'local', line: 5 }]);
});
