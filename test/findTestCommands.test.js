// Checks which test commands vet finds in package.json, a Makefile, and CI workflows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findTestCommands } from '../src/findTestCommands.js';
import { listFiles } from '../src/listFiles.js';
import { createFixtureRepo, removeFixtureRepo } from './fixtureRepo.js';

async function commandsIn(filesByPath) {
  const repoPath = await createFixtureRepo(filesByPath);
  try {
    return await findTestCommands(repoPath, await listFiles(repoPath));
  } finally {
    await removeFixtureRepo(repoPath);
  }
}

test('runs npm test scripts once, skipping ones already called or that watch', async () => {
  const scripts = {
    test: 'npm run test:unit && npm run test:e2e',
    'test:unit': 'vitest run',
    'test:e2e': 'playwright test',
    'test:watch': 'vitest',
    lint: 'eslint .',
  };
  const commands = await commandsIn({ 'package.json': JSON.stringify({ scripts }) });
  assert.deepEqual(commands, [{ command: 'npm run test', sources: ['package.json'] }]);
});

test("skips npm's placeholder test script", async () => {
  const scripts = { test: 'echo "Error: no test specified" && exit 1' };
  assert.deepEqual(await commandsIn({ 'package.json': JSON.stringify({ scripts }) }), []);
});

test('runs Makefile test targets that no other test target already runs', async () => {
  const makefile = 'test: test-unit test-go\ntest-unit:\n\tpytest\ntest-go:\n\tgo test ./...\nFOO := test\n';
  const commands = await commandsIn({ Makefile: makefile });
  assert.deepEqual(commands, [{ command: 'make test', sources: ['Makefile'] }]);
});

test('reads CI test steps, skipping setup, sudo and GitHub-only lines', async () => {
  const workflow = [
    'jobs:',
    '  build:',
    '    steps:',
    '      - run: npm ci',
    '      - run: yarn test',
    '      - run: |',
    '          pip install pytest',
    '          pytest tests/ \\',
    '            --maxfail=1',
    '      - run: go test ${{ matrix.flags }} ./...',
    '      - run: sudo make test',
    '      - run: "cargo test --all"',
  ].join('\n');

  const commands = await commandsIn({ '.github/workflows/ci.yml': workflow });
  const source = ['.github/workflows/ci.yml'];
  assert.deepEqual(commands, [
    { command: 'npm run test', sources: source },
    { command: 'pytest tests/ --maxfail=1', sources: source },
    { command: 'cargo test --all', sources: source },
  ]);
});

test('merges the same command found in several places', async () => {
  const commands = await commandsIn({
    'package.json': JSON.stringify({ scripts: { test: 'jest' } }),
    '.github/workflows/ci.yml': 'steps:\n  - run: pnpm test\n',
  });
  assert.deepEqual(commands, [{ command: 'npm run test', sources: ['package.json', '.github/workflows/ci.yml'] }]);
});
