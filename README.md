# Vet

A command-line tool that vets a GitHub repository: it detects which
programming languages the repo uses, checks the links in its Markdown files
for anything broken, and runs every test the repo declares, showing whether
each individual test case passed or failed.

## Install

```bash
npm install
npm link
```

`npm link` puts the `vet` command on your PATH so you can run it from
anywhere.

## Usage

```bash
vet https://github.com/owner/repo
```

Vet clones the repository into a temporary folder, scans it, prints a
report, and deletes the temporary folder when it's done — nothing is left
behind.

Example output:

```
Vetting tj/commander.js...

Languages
  ● JavaScript   171 files

Links
  ✘ 26 link(s) checked, 4 broken
    ✘ https://example.com/dead-link (HTTP 404) — Readme.md

Done in 5.2s
```

## Tests

Vet runs the repo's tests the way its own authors do. It collects every test
command the repo declares:

- `test` scripts in `package.json` (`test`, `test:unit`, `test:e2e`, ...)
- `test` targets in the `Makefile`
- test steps in its GitHub Actions workflows (`.github/workflows/*.yml`)

It skips anything that would never finish (watch modes, UIs) or only works on
GitHub's servers, and doesn't run a script twice when another already calls
it. If the repo declares nothing for a language, Vet falls back to that
language's usual command (`pytest`, `go test ./...`, `cargo test`).

Before running, it prepares each language inside the temporary clone:
`npm install` for JavaScript, a throwaway virtual environment for Python. Then
it lists **every test case**, each with its own result:

```
Tests

  Test commands

    ✘ npm run test (from package.json, 1.2s)
      2 passed, 1 failed, 1 skipped

    ✘ python -m pytest tests -q (from .github/workflows/ci.yml, 0.2s)
      1 passed, 1 failed, 1 skipped

  Test cases

    JavaScript
      math.test.js
        ✔ adds numbers
        ✘ doesn't divide by zero
        ○ rounds money

    Python
      tests/test_math.py
        ✔ add works
        ✘ this one fails
        ○ later

    6 test case(s): 2 passed, 2 failed, 2 skipped, 0 without an individual result
```

✔ passed, ✘ failed, ○ skipped, and ? means the test tool didn't name that
test in its output. Tests the code creates while running (like `it()` calls
inside a loop) are listed from the test output too.

**Running tests executes the repository's code on your machine**, just like
running `npm test` or `pytest` yourself. Only vet repos you trust, or pass
`--no-tests` to skip running them. Vet still lists the test cases it finds in
the code, since that only reads files:

```bash
vet https://github.com/owner/repo --no-tests
```

## How it works

See [CONTRIBUTING.md](CONTRIBUTING.md) for a walkthrough of the code, file
by file.

## License

MIT — see [LICENSE](LICENSE).
