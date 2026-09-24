#!/usr/bin/env node
// Entry point installed as the `vet` command. All the real work happens in src/cli.js.
import { runCli } from '../src/cli.js';

runCli(process.argv);
