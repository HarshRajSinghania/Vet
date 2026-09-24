# Vet

A command-line tool that vets a GitHub repository: it detects which
programming languages the repo uses and checks the links in its Markdown
files for anything broken.

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

## How it works

See [CONTRIBUTING.md](CONTRIBUTING.md) for a walkthrough of the code, file
by file.

## License

MIT — see [LICENSE](LICENSE).
