// Combines every check into one 0-10 score, the way OpenSSF Scorecard does:
// each check gets its own 0-10 mark, and the total is a weighted average of
// the checks that could be measured for this repo.
const VERDICTS = [
  { minimum: 8, text: 'Looks healthy and well kept' },
  { minimum: 6, text: 'Mostly fine, but check the ✘ items above' },
  { minimum: 4, text: 'Use with care: several problems above' },
  { minimum: 0, text: 'High risk: read the problems above before depending on it' },
];

const ACTIVITY_MARKS = { active: 10, quiet: 5, inactive: 0, archived: 0 };

export function scoreReport(report) {
  const checks = [
    scoreMaintenance(report.repoInfo),
    scoreCiSecurity(report.workflows),
    scoreLicense(report.license),
    scoreHygiene(report.hygiene),
    // Scorecard's Binary-Artifacts rule: one point off per committed program.
    { name: 'No committed programs', mark: Math.max(0, 10 - report.binaries.length), weight: 1 },
    scoreLinks(report.links),
    scoreTests(report.tests),
  ].filter(Boolean);

  let weightedTotal = 0;
  let totalWeight = 0;
  for (const check of checks) {
    weightedTotal += check.mark * check.weight;
    totalWeight += check.weight;
  }

  const score = Math.round((weightedTotal / totalWeight) * 10) / 10;
  const verdict = VERDICTS.find((entry) => score >= entry.minimum).text;
  return { score, verdict, checks };
}

// Each scorer returns null when there's nothing to measure, so the check is
// left out instead of counting as a zero.
function scoreMaintenance(repoInfo) {
  if (!repoInfo.available) return null;
  return { name: 'Maintained', mark: ACTIVITY_MARKS[repoInfo.activity], weight: 2 };
}

function scoreCiSecurity(workflows) {
  if (workflows.workflowCount === 0) return null;

  const penalties = { high: 5, medium: 2, low: 0.5 };
  let lost = 0;
  for (const found of workflows.findings) {
    lost += penalties[found.severity];
  }
  return { name: 'CI security', mark: Math.max(0, 10 - lost), weight: 2 };
}

function scoreLicense(license) {
  let mark = 0;
  if (license.id) mark = 10;
  else if (license.file) mark = 5;
  return { name: 'License', mark, weight: 1.5 };
}

function scoreHygiene(hygiene) {
  const foundCount = hygiene.filter((check) => check.found).length;
  return { name: 'Project files', mark: (foundCount / hygiene.length) * 10, weight: 1.5 };
}

function scoreLinks(links) {
  if (links.checkedCount === 0) return null;
  const brokenShare = Math.min(1, links.brokenLinks.length / links.checkedCount);
  return { name: 'Working links', mark: (1 - brokenShare) * 10, weight: 1 };
}

function scoreTests(tests) {
  if (!tests || !tests.testRun || tests.testRun.commandResults.length === 0) return null;

  const commands = tests.testRun.commandResults;
  const passedCount = commands.filter((result) => result.exitCode === 0).length;
  return { name: 'Tests pass', mark: (passedCount / commands.length) * 10, weight: 1 };
}
