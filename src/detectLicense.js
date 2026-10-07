// Works out which open source license a repo uses, by looking for phrases
// that only appear in that license's text (like licensee/licensee does), and
// says in plain words what it means for someone who wants to reuse the code.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { listFiles } from './listFiles.js';

const LICENSE_FILE_PATTERN = /^(licen[cs]e|copying|unlicense)([-.][\w.-]+)?$/i;

const MEANINGS = {
  permissive: 'reuse it almost any way you like, as long as you keep the copyright notice',
  'weak copyleft': 'changes to these files must stay open, but your own code can use any license',
  copyleft: 'if you ship software built on it, your code must be released under the same license',
  'network copyleft': "like GPL, and it also applies to people using it over a network (e.g. a web app)",
  'public domain': 'no conditions at all',
};

// Order matters: AGPL and LGPL texts mention "GNU General Public License" too,
// so they're checked before plain GPL, and the Boost license reuses MIT's
// opening sentence, so it's checked before MIT.
const KNOWN_LICENSES = [
  { id: 'BSL-1.0', kind: 'permissive', phrases: ['boost software license'] },
  { id: 'AGPL-3.0', kind: 'network copyleft', phrases: ['gnu affero general public license'] },
  { id: 'LGPL-3.0', kind: 'weak copyleft', phrases: ['gnu lesser general public license', 'version 3'] },
  { id: 'LGPL-2.1', kind: 'weak copyleft', phrases: ['gnu lesser general public license', 'version 2.1'] },
  { id: 'GPL-3.0', kind: 'copyleft', phrases: ['gnu general public license', 'version 3'] },
  { id: 'GPL-2.0', kind: 'copyleft', phrases: ['gnu general public license', 'version 2'] },
  { id: 'MPL-2.0', kind: 'weak copyleft', phrases: ['mozilla public license', '2.0'] },
  { id: 'EPL-2.0', kind: 'weak copyleft', phrases: ['eclipse public license', '2.0'] },
  { id: 'Apache-2.0', kind: 'permissive', phrases: ['apache license', 'version 2.0'] },
  { id: 'MIT', kind: 'permissive', phrases: ['permission is hereby granted, free of charge'] },
  { id: 'BSD-3-Clause', kind: 'permissive', phrases: ['redistribution and use in source and binary forms', 'neither the name'] },
  { id: 'BSD-2-Clause', kind: 'permissive', phrases: ['redistribution and use in source and binary forms'] },
  { id: 'ISC', kind: 'permissive', phrases: ['permission to use, copy, modify, and/or distribute this software for any purpose'] },
  { id: 'Unlicense', kind: 'public domain', phrases: ['free and unencumbered software released into the public domain'] },
  { id: 'CC0-1.0', kind: 'public domain', phrases: ['cc0 1.0 universal'] },
];

export async function detectLicense(repoPath) {
  const files = await listFiles(repoPath);
  const licenseFile = files.find((file) => LICENSE_FILE_PATTERN.test(file));
  if (!licenseFile) {
    return { file: null, id: null, kind: null, meaning: null };
  }

  const text = (await readFile(join(repoPath, licenseFile), 'utf8')).replace(/\s+/g, ' ').toLowerCase();
  const match = KNOWN_LICENSES.find((license) => license.phrases.every((phrase) => text.includes(phrase)));
  if (!match) {
    return { file: licenseFile, id: null, kind: null, meaning: null };
  }

  return { file: licenseFile, id: match.id, kind: match.kind, meaning: MEANINGS[match.kind] };
}
