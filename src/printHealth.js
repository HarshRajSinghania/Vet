// Prints the "Repo health" section: the signals that a repo is well kept
// and safe to depend on.
import picocolors from 'picocolors';

const SEVERITY_COLORS = { high: picocolors.red, medium: picocolors.yellow, low: picocolors.dim };

const ACTIVITY_LABELS = {
  active: picocolors.green('✔ Actively maintained'),
  quiet: picocolors.yellow('? Quiet'),
  inactive: picocolors.red('✘ Inactive'),
  archived: picocolors.red('✘ Archived (read-only, no longer maintained)'),
};

export function printHealth({ repoInfo, license, hygiene, binaries, workflows }) {
  console.log(picocolors.bold('\nRepo health'));
  printActivity(repoInfo);
  printLicense(license);
  printHygiene(hygiene);
  printBinaries(binaries);
  printWorkflowRisks(workflows);
}

function printWorkflowRisks({ workflowCount, findings }) {
  if (workflowCount === 0) return;
  if (findings.length === 0) {
    console.log(`  ${picocolors.green('✔')} CI security: no risky patterns in ${workflowCount} workflow(s)`);
    return;
  }

  console.log(`  ${picocolors.red('✘')} CI security: ${findings.length} risk(s) in ${workflowCount} workflow(s)`);
  for (const found of findings) {
    const severity = SEVERITY_COLORS[found.severity](`[${found.severity}]`);
    console.log(`    ${severity} ${found.file}:${found.line} ${found.problem}`);
    console.log(picocolors.dim(`        ${found.why}`));
  }
}

function printActivity(repoInfo) {
  if (!repoInfo.available) {
    console.log(`  ${picocolors.yellow('?')} Activity: unknown ${picocolors.dim(`— ${repoInfo.reason}`)}`);
    return;
  }

  const lastPush = repoInfo.daysSinceLastPush === 0 ? 'today' : `${repoInfo.daysSinceLastPush} day(s) ago`;
  console.log(
    `  ${ACTIVITY_LABELS[repoInfo.activity]}: ${repoInfo.recentCommitCount} commit(s) on ${repoInfo.defaultBranch} ` +
      `in the last 90 days, last push to any branch ${lastPush}`,
  );

  const release = repoInfo.latestRelease
    ? `latest release ${repoInfo.latestRelease.tag} (${repoInfo.latestRelease.publishedAt})`
    : 'no releases';
  console.log(
    picocolors.dim(
      `      ⭐ ${repoInfo.stars} stars, ${repoInfo.forks} forks, ${repoInfo.contributorCount} contributor(s), ` +
        `${repoInfo.openIssuesAndPullRequests} open issues and PRs, ${release}`,
    ),
  );
}

function printLicense(license) {
  if (!license.file) {
    console.log(`  ${picocolors.red('✘')} License: none ${picocolors.dim('— legally, nobody may reuse this code')}`);
    return;
  }
  if (!license.id) {
    console.log(`  ${picocolors.yellow('?')} License: not recognized ${picocolors.dim(`— read ${license.file} yourself`)}`);
    return;
  }

  console.log(`  ${picocolors.green('✔')} License: ${picocolors.bold(license.id)} (${license.kind}) ${picocolors.dim(`— ${license.file}`)}`);
  console.log(picocolors.dim(`      You can ${license.meaning}.`));
}

function printBinaries(binaries) {
  if (binaries.length === 0) {
    console.log(`  ${picocolors.green('✔')} No compiled programs committed`);
    return;
  }

  console.log(
    `  ${picocolors.red('✘')} ${binaries.length} compiled program(s) committed ${picocolors.dim("— these can't be reviewed like source code")}`,
  );
  for (const file of binaries) {
    console.log(`    ${picocolors.red('✘')} ${file}`);
  }
}

function printHygiene(hygiene) {
  const foundCount = hygiene.filter((check) => check.found).length;
  console.log(`  Project files: ${foundCount} of ${hygiene.length} present`);

  for (const check of hygiene) {
    if (check.found) {
      console.log(`    ${picocolors.green('✔')} ${check.name} ${picocolors.dim(`(${check.file})`)}`);
    } else {
      console.log(`    ${picocolors.red('✘')} ${check.name} ${picocolors.dim(`— ${check.why}`)}`);
    }
  }
}
