// Prints the "Repo health" section: the signals that a repo is well kept
// and safe to depend on.
import picocolors from 'picocolors';

export function printHealth({ hygiene, binaries }) {
  console.log(picocolors.bold('\nRepo health'));
  printHygiene(hygiene);
  printBinaries(binaries);
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
