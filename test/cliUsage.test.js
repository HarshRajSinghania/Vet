// Checks that usage mistakes (missing URL, unknown option) exit with code 2,
// while --help and --version exit with 0.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const binPath = fileURLToPath(new URL('../bin/vet.js', import.meta.url));

function runVet(args) {
  return spawnSync(process.execPath, [binPath, ...args], {
    encoding: 'utf8',
    timeout: 10000,
  });
}

test('missing URL exits with code 2', () => {
  const result = runVet([]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /error: missing required argument 'url'/);
});

test('unknown option exits with code 2', () => {
  const result = runVet(['https://github.com/a/b', '--nope']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /error: unknown option '--nope'/);
});

test('--help exits with code 0', () => {
  const result = runVet(['--help']);
  assert.equal(result.status, 0);
});

test('--version exits with code 0', () => {
  const result = runVet(['--version']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /\d+\.\d+\.\d+/);
});
