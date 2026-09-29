// Collects every test command the repo itself declares (npm scripts, Makefile
// targets, GitHub Actions steps) so vet runs the tests the way its authors do.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readWorkflowCommands } from './readWorkflowCommands.js';

// Commands that watch for file changes or open a UI would never finish on their own.
const INTERACTIVE_PATTERN = /watch|\bdebug\b|\bui\b|cypress open/;

export async function findTestCommands(repoPath, files) {
  const declared = [];
  declared.push(...(await readPackageScripts(repoPath, files)));
  declared.push(...(await readMakeTargets(repoPath, files)));
  declared.push(...(await readWorkflowCommands(repoPath, files)));
  return mergeDuplicates(declared);
}

async function readPackageScripts(repoPath, files) {
  if (!files.includes('package.json')) return [];

  let scripts;
  try {
    const packageJson = JSON.parse(await readFile(join(repoPath, 'package.json'), 'utf8'));
    scripts = packageJson.scripts || {};
  } catch {
    return [];
  }

  const testScriptNames = Object.keys(scripts).filter((name) => isRunnableTestScript(name, scripts[name]));
  const commands = [];
  for (const name of testScriptNames) {
    if (!isCalledByAnother(name, testScriptNames, scripts)) {
      commands.push({ command: `npm run ${name}`, source: 'package.json' });
    }
  }
  return commands;
}

function isRunnableTestScript(name, script) {
  if (!/^tests?([:-]|$)/.test(name)) return false;
  if (script.includes('no test specified')) return false;
  return !INTERACTIVE_PATTERN.test(`${name} ${script}`);
}

// e.g. "test": "npm run test:unit && npm run test:e2e" already runs both of those,
// so running them again separately would just repeat the same tests.
function isCalledByAnother(name, allNames, scripts) {
  const scriptName = `${escapeForRegExp(name)}(?=$|[\\s"'&;|])`;
  const callPattern = new RegExp(
    `\\b(npm|yarn|pnpm)\\s+(run(-script)?\\s+)?${scriptName}|\\b(run-s|run-p|npm-run-all)\\b[^&;|]*\\s${scriptName}`,
  );

  for (const otherName of allNames) {
    if (otherName !== name && callPattern.test(scripts[otherName])) {
      return true;
    }
  }
  return false;
}

async function readMakeTargets(repoPath, files) {
  const makefile = files.find((file) => file === 'Makefile' || file === 'makefile');
  if (!makefile) return [];

  const content = await readFile(join(repoPath, makefile), 'utf8');
  const targets = [];
  for (const match of content.matchAll(/^(tests?[\w-]*)\s*:(?!=)(.*)$/gm)) {
    if (!INTERACTIVE_PATTERN.test(match[1])) {
      targets.push({ name: match[1], prerequisites: match[2].trim().split(/\s+/) });
    }
  }

  const commands = [];
  for (const target of targets) {
    const runByAnother = targets.some((other) => other.prerequisites.includes(target.name));
    if (!runByAnother) {
      commands.push({ command: `make ${target.name}`, source: 'Makefile' });
    }
  }
  return commands;
}

function mergeDuplicates(declared) {
  const byCommand = new Map();

  for (const entry of declared) {
    const command = normalizeCommand(entry.command);
    const existing = byCommand.get(command);
    if (!existing) {
      byCommand.set(command, { command, sources: [entry.source] });
    } else if (!existing.sources.includes(entry.source)) {
      existing.sources.push(entry.source);
    }
  }

  return Array.from(byCommand.values());
}

// "yarn test", "pnpm test" and "npm test" all run the same package.json script.
function normalizeCommand(command) {
  const scriptCall = command.match(/^(?:npm|yarn|pnpm)\s+(?:run(?:-script)?\s+)?(tests?(?:[:-][\w:-]*)?)(\s.*)?$/);
  if (scriptCall) {
    return `npm run ${scriptCall[1]}${scriptCall[2] || ''}`;
  }
  return command.replace(/\s+/g, ' ').trim();
}

function escapeForRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
