// Prints what the test suite covers alongside what happened when it ran,
// grouped by language so each result sits right next to what it tested.
import picocolors from 'picocolors';

const MAX_TEST_NAMES_PER_FILE = 8;
const MAX_FILES_SHOWN = 15;

export function printTestSection(outline, results) {
  console.log(picocolors.bold('\nTests'));

  const languages = collectLanguageNames(outline, results);
  if (languages.length === 0) {
    console.log('  No recognizable test suite was found for this repo.');
    return;
  }

  for (const language of languages) {
    console.log(`\n  ${picocolors.underline(language)}`);
    printOutlineForLanguage(outline, language);
    printResultForLanguage(results, language);
  }
}

function collectLanguageNames(outline, results) {
  const names = new Set();
  for (const group of outline) names.add(group.language);
  for (const result of results) names.add(result.name);
  return Array.from(names);
}

function printOutlineForLanguage(outline, language) {
  const groups = outline.filter((group) => group.language === language);
  const shownGroups = groups.slice(0, MAX_FILES_SHOWN);

  for (const group of shownGroups) {
    console.log(`    ${picocolors.cyan(group.file)}`);
    printTestNames(group.testNames);
  }

  const remainingFiles = groups.length - shownGroups.length;
  if (remainingFiles > 0) {
    console.log(`    ...and ${remainingFiles} more file(s) with tests`);
  }
}

function printTestNames(testNames) {
  const shownNames = testNames.slice(0, MAX_TEST_NAMES_PER_FILE);
  for (const name of shownNames) {
    console.log(`      - ${name}`);
  }

  const remainingNames = testNames.length - shownNames.length;
  if (remainingNames > 0) {
    console.log(`      ...and ${remainingNames} more`);
  }
}

function printResultForLanguage(results, language) {
  const result = results.find((entry) => entry.name === language);
  if (!result) {
    console.log('    (not run)');
    return;
  }
  printOneResult(result);
}

function printOneResult(result) {
  if (result.error) {
    console.log(`    ${picocolors.yellow('!')} Could not run: ${result.error}`);
    return;
  }

  if (result.total === null) {
    console.log(
      `    ${picocolors.yellow('?')} Ran, but the output didn't match a known format (exit code ${result.exitCode})`,
    );
    return;
  }

  const icon = result.failed > 0 ? picocolors.red('✘') : picocolors.green('✔');
  console.log(
    `    ${icon} ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped (${result.durationSeconds}s)`,
  );
}
