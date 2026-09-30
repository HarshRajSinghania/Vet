// Prints the final report to the console: languages found and any broken links.
import picocolors from 'picocolors';

export function printReport({ languages, brokenLinks }) {
  printLanguages(languages);
  printLinks(brokenLinks);
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
    const fileWord = language.fileCount === 1 ? 'file' : 'files';
    console.log(`  ${picocolors.cyan('●')} ${language.name.padEnd(12)} ${language.fileCount} ${fileWord}`);
  }
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
      console.log(`    ${picocolors.red('✘')} ${broken.url} (${broken.reason}) — ${broken.file}`);
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
    console.log(picocolors.dim(`    ? ${link.url} (${link.reason}) — ${link.file}`));
  }
}
