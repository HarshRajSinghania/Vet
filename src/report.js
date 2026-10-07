// Prints the final report to the console: languages found, repo health,
// and any broken links.
import picocolors from 'picocolors';
import { printHealth } from './printHealth.js';

export function printReport(report) {
  printLanguages(report.languages);
  printHealth(report);
  printLinks(report.links);
}

export function printElapsedTime(elapsedSeconds) {
  console.log(picocolors.dim(`\nDone in ${elapsedSeconds}s`));
}

function printLanguages(languages) {
  console.log(picocolors.bold('Languages'));

  if (languages.length === 0) {
    console.log('  No recognized source files found.');
    return;
  }

  for (const language of languages) {
    const share = `${language.percent}%`.padStart(6);
    const details = picocolors.dim(
      `in ${language.fileCount} file(s), plus ${formatNumber(language.comment)} comment and ${formatNumber(language.blank)} blank`,
    );
    console.log(
      `  ${picocolors.cyan('●')} ${language.name.padEnd(11)} ${share}  ${formatNumber(language.code)} line(s) of code ${details}`,
    );
  }
}

// 12345 -> "12,345"
function formatNumber(number) {
  return number.toLocaleString('en-US');
}

function printLinks({ checkedCount, brokenLinks, unverifiedLinks }) {
  console.log(picocolors.bold('\nLinks'));

  if (checkedCount === 0) {
    console.log('  No links found in Markdown files.');
    return;
  }

  if (brokenLinks.length === 0) {
    console.log(`  ${picocolors.green('✔')} ${checkedCount} link(s) checked, none broken`);
  } else {
    console.log(`  ${picocolors.red('✘')} ${checkedCount} link(s) checked, ${brokenLinks.length} broken`);
    for (const broken of brokenLinks) {
      console.log(`    ${picocolors.red('✘')} ${broken.url} (${broken.reason}) — ${broken.file}:${broken.line}`);
    }
  }

  printUnverifiedLinks(unverifiedLinks);
}

function printUnverifiedLinks(unverifiedLinks) {
  if (unverifiedLinks.length === 0) return;

  console.log(
    `  ${picocolors.yellow('?')} ${unverifiedLinks.length} couldn't be verified (the site blocks automated checks)`,
  );
  for (const link of unverifiedLinks) {
    console.log(picocolors.dim(`    ? ${link.url} (${link.reason}) — ${link.file}:${link.line}`));
  }
}
