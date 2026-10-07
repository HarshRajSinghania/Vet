// Prints the final vet score with a bar for each check that went into it.
import picocolors from 'picocolors';

export function printScore({ score, verdict, checks }) {
  const color = colorFor(score);
  console.log(`\n${picocolors.bold('Vet score:')} ${color(picocolors.bold(`${score} / 10`))} — ${verdict}`);

  for (const check of checks) {
    const mark = Math.round(check.mark * 10) / 10;
    const bar = '█'.repeat(Math.round(check.mark)).padEnd(10, '·');
    console.log(`  ${check.name.padEnd(22)} ${colorFor(check.mark)(bar)} ${mark}`);
  }
}

function colorFor(mark) {
  if (mark >= 8) return picocolors.green;
  if (mark >= 5) return picocolors.yellow;
  return picocolors.red;
}
