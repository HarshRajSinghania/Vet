// Checks that risky GitHub Actions patterns are found at the right lines.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkWorkflows } from '../src/checkWorkflows.js';
import { createFixtureRepo, removeFixtureRepo } from './fixtureRepo.js';

async function findingsFor(workflow) {
  const repoPath = await createFixtureRepo({ '.github/workflows/ci.yml': workflow });
  try {
    const result = await checkWorkflows(repoPath);
    return result.findings.map((found) => `${found.line} ${found.severity} ${found.problem}`);
  } finally {
    await removeFixtureRepo(repoPath);
  }
}

test('finds dangerous checkouts, script injection, missing permissions and unpinned actions', async () => {
  const workflow = [
    'on: pull_request_target', // 1
    'jobs:', // 2
    '  build:', // 3
    '    steps:', // 4
    '      - uses: actions/checkout@v4', // 5
    '        with:', // 6
    '          ref: ${{ github.event.pull_request.head.sha }}', // 7
    '      - uses: some-org/deploy-action@v1', // 8
    '      - uses: some-org/pinned@0123456789abcdef0123456789abcdef01234567', // 9
    '      - run: echo "${{ github.event.issue.title }}"', // 10
    '      - run: |', // 11
    '          echo safe ${{ github.sha }}', // 12
    '          echo "${{ github.head_ref }}"', // 13
  ].join('\n');

  assert.deepEqual(await findingsFor(workflow), [
    "7 high checks out a pull request's code in a pull_request_target workflow",
    '10 high puts attacker-controlled text straight into a shell command',
    '13 high puts attacker-controlled text straight into a shell command',
    '1 medium has no permissions: block',
    '5 low uses actions/checkout@v4, a tag rather than a commit',
    '8 medium uses some-org/deploy-action@v1, a tag rather than a commit',
  ]);
});

test('a safe workflow has no findings', async () => {
  const workflow = [
    'on: pull_request',
    'permissions:',
    '  contents: read',
    'jobs:',
    '  test:',
    '    steps:',
    '      - uses: actions/checkout@0123456789abcdef0123456789abcdef01234567',
    '      - uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.1.0',
    '      - env:',
    '          TITLE: ${{ github.event.pull_request.title }}',
    '        run: echo "$TITLE"',
  ].join('\n');

  assert.deepEqual(await findingsFor(workflow), []);
});

test('flags write-all permissions', async () => {
  assert.deepEqual(await findingsFor('on: push\npermissions: write-all\njobs: {}\n'), [
    '2 medium gives the workflow token write access to everything',
  ]);
});
