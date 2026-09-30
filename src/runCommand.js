// Runs a command in a directory and captures its output. It never throws on a
// non-zero exit code, because a failing test run is a normal result for vet.
import { spawn } from 'node:child_process';

export const COMMAND_TIMEOUT_MINUTES = 5;
const MAX_OUTPUT_CHARACTERS = 5 * 1024 * 1024;

// Each command runs in its own process group, so a timeout or vet exiting
// early can stop everything it started (like the test process a shell script
// launched), not just the shell itself.
const runningProcessGroups = new Set();

process.on('exit', () => {
  for (const processId of runningProcessGroups) {
    stopProcessGroup(processId);
  }
});

export function runCommand(command, args, cwd, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const output = captureOutput(child);
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      stopProcessGroup(child.pid);
    }, COMMAND_TIMEOUT_MINUTES * 60 * 1000);

    child.on('spawn', () => runningProcessGroups.add(child.pid));

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ missingCommand: error.code === 'ENOENT', timedOut: false, exitCode: 127, output: '' });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      runningProcessGroups.delete(child.pid);
      resolve({ missingCommand: false, timedOut, exitCode: exitCode ?? 1, output: output.text });
    });
  });
}

function captureOutput(child) {
  const output = { text: '' };
  const append = (chunk) => {
    if (output.text.length < MAX_OUTPUT_CHARACTERS) {
      output.text += chunk;
    }
  };

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', append);
  child.stderr.on('data', append);
  return output;
}

function stopProcessGroup(processId) {
  try {
    process.kill(-processId, 'SIGTERM');
  } catch {
    // The group already exited, so there's nothing left to stop.
  }
}
