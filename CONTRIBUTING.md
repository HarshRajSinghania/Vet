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
8. Back in `src/cli.js`, the `finally` block calls `removeTempDir()` to delete
   the clone, whether or not anything went wrong.

## Adding a new language detector

Add a file to `src/detectors/` that exports a `name` and a
`countMatches(files)` function — copy an existing one like
`src/detectors/python.js` as a starting point — then add it to the list in
`src/detectors/index.js`.

## Code style

- Plain JavaScript (ES modules), no TypeScript, no classes unless truly
  needed.
- Small files, one job each, under ~150 lines. Small functions, under ~30
  lines.
- Full, descriptive names. No one-letter variables except loop counters.
- Plain `async/await` and `for...of` loops over long chained `.map().filter()`.
- Comments explain *why*, not *what*.
