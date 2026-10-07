// Checks how the individual checks combine into the overall vet score.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreReport } from '../src/scoreReport.js';

function healthyReport() {
  return {
    repoInfo: { available: true, activity: 'active' },
    workflows: { workflowCount: 1, findings: [] },
    license: { file: 'LICENSE', id: 'MIT' },
    hygiene: [{ found: true }, { found: true }],
    binaries: [],
    links: { checkedCount: 10, brokenLinks: [] },
    tests: { testRun: { commandResults: [{ exitCode: 0 }] } },
  };
}

test('a healthy repo scores 10', () => {
  const result = scoreReport(healthyReport());
  assert.equal(result.score, 10);
  assert.equal(result.verdict, 'Looks healthy and well kept');
});

test('problems lower the score in proportion to their weight', () => {
  const report = healthyReport();
  report.repoInfo.activity = 'archived'; // weight 2 -> 0
  report.workflows.findings = [{ severity: 'high' }]; // weight 2 -> 5
  report.license = { file: null, id: null }; // weight 1.5 -> 0

  // (0*2 + 5*2 + 0*1.5 + 10*1.5 + 10 + 10 + 10) / 10 = 5.5
  assert.equal(scoreReport(report).score, 5.5);
});

test('checks that could not be measured are left out, not counted as zero', () => {
  const report = healthyReport();
  report.repoInfo = { available: false };
  report.workflows = { workflowCount: 0, findings: [] };
  report.links = { checkedCount: 0, brokenLinks: [] };
  report.tests = { testRun: null };

  const names = scoreReport(report).checks.map((check) => check.name);
  assert.deepEqual(names, ['License', 'Project files', 'No committed programs']);
  assert.equal(scoreReport(report).score, 10);
});
