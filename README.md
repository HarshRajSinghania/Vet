# Vet

A command-line tool that vets a GitHub repository: it detects which
programming languages the repo uses, checks the links in its Markdown files
for anything broken, and — if you ask it to — runs the repo's own test suite
and explains both what the tests check and what happened when they ran.

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

## Running the repo's tests

Pass `--run-tests` to also run the repo's own test suite:

```bash
vet https://github.com/owner/repo --run-tests
```

**This executes the repository's code on your machine** — installing its
dependencies and running its test scripts, the same way `npm test` or
`pytest` would. Only use it on repos you trust. That's also why it's off by
default: the rest of `vet` only reads files and checks links, but
`--run-tests` runs arbitrary code.

When it's on, Vet detects which test runner applies (JavaScript via
`npm test`, Python via `pytest` in a throwaway virtual environment, Go via
`go test`, or Rust via `cargo test`), skips gracefully if the matching tool
isn't installed, and prints both what each test file checks and the pass/fail
counts next to it:

```
Tests

  JavaScript
    math.test.js
      - adds numbers
      - this one fails on purpose
    ✘ 1 passed, 1 failed, 0 skipped (2.9s)

  Python
    test_math.py
      - add works
      - this one is skipped
    ✔ 2 passed, 0 failed, 1 skipped (4.6s)
```

## How it works

See [CONTRIBUTING.md](CONTRIBUTING.md) for a walkthrough of the code, file
by file.

## License

MIT — see [LICENSE](LICENSE).
