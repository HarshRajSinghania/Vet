# Contributing

Thanks for considering a contribution! This project is intentionally small
and dependency-light — please keep new code in that spirit.

## Setup

```bash
npm install
node bin/vet.js https://github.com/owner/repo
```

## How the code works

Here's what happens, in order, when you run `vet https://github.com/owner/repo`:

1. **[bin/vet.js](bin/vet.js)** is the file `npm link` points the `vet` command
   at. It just calls `runCli()` and gets out of the way.
2. **[src/cli.js](src/cli.js)** parses the command line with `commander`, pulls
   out the URL, and calls `vetRepository()`, which runs every step below inside
   a `try/catch/finally` so a failure prints a friendly message instead of a
   stack trace.
3. **[src/parseRepoUrl.js](src/parseRepoUrl.js)** turns the URL into a short
   `owner/repo` label for the report header, and rejects anything that doesn't
   look like a GitHub URL.
4. **[src/cloneRepo.js](src/cloneRepo.js)** asks
   **[src/tempDir.js](src/tempDir.js)** for a fresh temporary directory, then
   shallow-clones the repo into it with `git clone --depth 1`.
5. **[src/detectLanguage.js](src/detectLanguage.js)** calls
   **[src/listFiles.js](src/listFiles.js)** to get every file path in the
   clone, then runs each detector in **[src/detectors/](src/detectors)**
   against that file list to count how many files match each language.
6. **[src/findBrokenLinks.js](src/findBrokenLinks.js)** reuses `listFiles.js`
   to find every `.md` file, pulls links out of each one with
   **[src/extractLinks.js](src/extractLinks.js)**, and checks each link with
   **[src/checkLink.js](src/checkLink.js)**.
7. **[src/report.js](src/report.js)** prints the languages found and any
   broken links to the console.
8. **[src/explainTests.js](src/explainTests.js)** finds every test case
   written in the repo's test files (`it('...')`, `def test_...`,
   `func Test...`, `#[test] fn ...`) and gives each a readable name.
9. Unless `--no-tests` was passed, **[src/runTests.js](src/runTests.js)**
   runs the tests:
   - **[src/findTestCommands.js](src/findTestCommands.js)** collects the test
     commands the repo declares in `package.json` and its `Makefile`, and asks
     **[src/readWorkflowCommands.js](src/readWorkflowCommands.js)** for the
     test steps in its GitHub Actions workflows.
   - Each runner in **[src/testRunners/](src/testRunners)** that `isNeeded()`
     gets `setup()` called: `npm install`, a Python virtual environment, or a
     check that Go or Cargo is installed.
   - Each command runs through
     **[src/runCommand.js](src/runCommand.js)**, which captures its output and
     stops it (and anything it started) after 5 minutes.
   - **[src/parseTestSummary.js](src/parseTestSummary.js)** reads the
     pass/fail totals from each command's output, and
     **[src/parseTestCases.js](src/parseTestCases.js)** reads each individual
     test's result.
10. **[src/printTestReport.js](src/printTestReport.js)** prints each command
    and its totals, then **[src/printTestCases.js](src/printTestCases.js)**
    lists every test case with its result.
11. Back in `src/cli.js`, the `finally` block calls `removeTempDir()` to delete
    the clone, whether or not anything went wrong. This also removes anything
    the test run created, like `node_modules` or the Python virtual environment.

## Adding a new language detector

Add a file to `src/detectors/` that exports a `name` and a
`countMatches(files)` function — copy an existing one like
`src/detectors/python.js` as a starting point — then add it to the list in
`src/detectors/index.js`.

## Adding a new language's tests

1. Add a file to `src/testRunners/` (copy `src/testRunners/go.js`) that
   exports:
   - `name`
   - `defaultCommand`: what to run when the repo doesn't declare anything
   - `coveredBy`: a pattern that matches the repo's own commands for this
     tool, so the default isn't run on top of them
   - `isNeeded({ files, commands })`
   - `async setup(repoPath)`: it returns `{ pathEntries }`, the folders to
     put on `PATH` while tests run

   Then add the file to the list in `src/testRunners/index.js`.
2. Add a matcher to `src/explainTests.js` so its test cases are found in the
   code.
3. If the tool prints results in a new format, add a reader to
   `src/parseTestSummary.js` (totals) and `src/parseTestCases.js`
   (individual tests).

**Running tests executes the target repo's code on your machine.** Any new
runner should install dependencies into a location that gets deleted with the
rest of the temp clone (like `node_modules` or a per-run virtual
environment), never into the user's global environment.

## Code style

- Plain JavaScript (ES modules), no TypeScript, no classes unless truly
  needed.
- Small files, one job each, under ~150 lines. Small functions, under ~30
  lines.
- Full, descriptive names. No one-letter variables except loop counters.
- Plain `async/await` and `for...of` loops over long chained `.map().filter()`.
- Comments explain *why*, not *what*.
