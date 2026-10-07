// Prints the "Repo health" section: the signals that a repo is well kept
// and safe to depend on.
import picocolors from 'picocolors';

export function printHealth({ hygiene }) {
  console.log(picocolors.bold('\nRepo health'));
  printHygiene(hygiene);
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
