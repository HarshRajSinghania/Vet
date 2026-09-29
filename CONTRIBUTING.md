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
8. If `--run-tests` was passed, `src/cli.js` calls
   **[src/explainTests.js](src/explainTests.js)**, which finds test files and
   pulls out their test names to build a plain-language outline, then
   **[src/runTests.js](src/runTests.js)**, which asks each runner in
   **[src/testRunners/](src/testRunners)** whether it applies (via
   `canRun()`) and, if so, installs dependencies and executes the tests (via
   `run()`), using **[src/runCommand.js](src/runCommand.js)** to shell out and
   capture output. **[src/printTestReport.js](src/printTestReport.js)** prints
   the outline and the result side by side, grouped by language.
9. Back in `src/cli.js`, the `finally` block calls `removeTempDir()` to delete
   the clone, whether or not anything went wrong — this also removes anything
   the test run created, like `node_modules` or a Python virtual environment.

## Adding a new language detector

Add a file to `src/detectors/` that exports a `name` and a
`countMatches(files)` function — copy an existing one like
`src/detectors/python.js` as a starting point — then add it to the list in
`src/detectors/index.js`.

## Adding a new test runner

Add a file to `src/testRunners/` that exports a `name`, an
`async canRun({ repoPath, files })` function that returns `true` when this
runner applies, and an `async run(repoPath)` function that installs
dependencies if needed, executes the tests with
`runCommand()` from `src/runCommand.js`, and parses the tool's own output
into `{ passed, failed, skipped, total, exitCode }` — copy
`src/testRunners/python.js` as a starting point. Then add it to the list in
`src/testRunners/index.js`. If you also want its test names explained (not
just its pass/fail count), add a matcher to `src/explainTests.js`.

**Running tests executes the target repo's code on your machine.** Any new
runner should install dependencies into a location that gets deleted with the
rest of the temp clone (like `node_modules` or a per-run virtual
environment) — never into the user's global environment.

## Code style

- Plain JavaScript (ES modules), no TypeScript, no classes unless truly
  needed.
- Small files, one job each, under ~150 lines. Small functions, under ~30
  lines.
- Full, descriptive names. No one-letter variables except loop counters.
- Plain `async/await` and `for...of` loops over long chained `.map().filter()`.
- Comments explain *why*, not *what*.
