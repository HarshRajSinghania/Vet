// Runs the repo's tests: prepares each language's tools, runs every test command
// the repo declares (plus a default where it declares none), and records results.
import { delimiter } from 'node:path';
import { listFiles } from './listFiles.js';
import { findTestCommands } from './findTestCommands.js';
import { runCommand } from './runCommand.js';
import { parseTestSummary } from './parseTestSummary.js';
import { createCaseStatuses, recordCaseStatuses } from './parseTestCases.js';
import { testRunners } from './testRunners/index.js';

export async function runTests(repoPath, reportProgress) {
  const files = await listFiles(repoPath);
  const declaredCommands = await findTestCommands(repoPath, files);
  const neededRunners = testRunners.filter((runner) => runner.isNeeded({ files, commands: declaredCommands }));

  const setup = await setUpRunners(neededRunners, repoPath, reportProgress);
  const commands = addDefaultCommands(declaredCommands, setup.readyRunners);

  const caseStatuses = createCaseStatuses();
  const commandResults = [];
  for (const entry of commands) {
    reportProgress(`Running ${entry.command}...`);
    commandResults.push(await runTestCommand(entry, repoPath, setup.pathEntries, caseStatuses));
  }

  return { commandResults, setupProblems: setup.problems, caseStatuses };
}

async function setUpRunners(runners, repoPath, reportProgress) {
  const readyRunners = [];
  const problems = [];
  const pathEntries = [];

  for (const runner of runners) {
    reportProgress(`Preparing ${runner.name} tests...`);
    try {
      const result = await runner.setup(repoPath);
      pathEntries.push(...result.pathEntries);
      readyRunners.push(runner);
    } catch (error) {
      problems.push({ name: runner.name, error: error.message });
    }
  }

  return { readyRunners, problems, pathEntries };
}

// Only add a language's default command when the repo doesn't already run that tool.
function addDefaultCommands(declaredCommands, readyRunners) {
  const commands = [...declaredCommands];

  for (const runner of readyRunners) {
    if (!runner.defaultCommand) continue;
    const alreadyCovered = declaredCommands.some((entry) => runner.coveredBy.test(entry.command));
    if (!alreadyCovered) {
      commands.push({ command: runner.defaultCommand, sources: ['vet default'] });
    }
  }

  return commands;
}

async function runTestCommand(entry, repoPath, pathEntries, caseStatuses) {
  const startTime = Date.now();
  const result = await runCommand('sh', ['-c', entry.command], repoPath, buildTestEnvironment(pathEntries));
  recordCaseStatuses(caseStatuses, result.output);

  return {
    command: entry.command,
    sources: entry.sources,
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    summary: parseTestSummary(result.output),
    outputTail: lastLines(result.output, 4),
    durationSeconds: ((Date.now() - startTime) / 1000).toFixed(1),
  };
}

// CI=true turns off watch modes and prompts in most test tools, and
// PYTEST_ADDOPTS makes pytest name every test's outcome in its output
// (-vv so it still wins when the repo's own command passes -q).
function buildTestEnvironment(pathEntries) {
  const path = [...pathEntries, process.env.PATH].join(delimiter);
  return { ...process.env, PATH: path, CI: 'true', PYTEST_ADDOPTS: '-vv -rA' };
}

function lastLines(output, count) {
  const lines = output.split('\n').filter((line) => line.trim() !== '');
  return lines.slice(-count).map((line) => line.slice(0, 160));
}
