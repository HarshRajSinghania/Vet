// Flags compiled programs committed to the repo (.exe, .jar, .so, ...). They
// can't be reviewed like source code, so they're a common place to hide
// malicious code. Based on OpenSSF Scorecard's Binary-Artifacts check.
import { open } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { listFiles } from './listFiles.js';

const BINARY_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.a', '.o', '.obj', '.lib',
  '.class', '.jar', '.war', '.ear', '.pyc', '.pyo',
  '.apk', '.msi', '.deb', '.rpm', '.com',
]);

// Gradle projects commit this small launcher on purpose; Scorecard allows it too.
const ALLOWED_SUFFIX = 'gradle/wrapper/gradle-wrapper.jar';

// The first bytes of Linux, macOS and Windows programs.
const EXECUTABLE_SIGNATURES = [
  [0x7f, 0x45, 0x4c, 0x46], // ELF (Linux)
  [0xcf, 0xfa, 0xed, 0xfe], // Mach-O 64-bit (macOS)
  [0xce, 0xfa, 0xed, 0xfe], // Mach-O 32-bit (macOS)
  [0xca, 0xfe, 0xba, 0xbe], // Mach-O universal (macOS)
  [0x4d, 0x5a], // "MZ" (Windows)
];

export async function checkBinaries(repoPath) {
  const files = await listFiles(repoPath);
  const binaries = [];

  for (const file of files) {
    if (file.endsWith(ALLOWED_SUFFIX)) continue;

    const extension = extname(file).toLowerCase();
    if (BINARY_EXTENSIONS.has(extension)) {
      binaries.push(file);
    } else if (extension === '' && (await startsLikeAProgram(join(repoPath, file)))) {
      binaries.push(file);
    }
  }

  return binaries;
}

// Files without an extension (like bin/tool) are recognized by their first bytes.
async function startsLikeAProgram(path) {
  const handle = await open(path, 'r');
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(4), 0, 4, 0);
    return EXECUTABLE_SIGNATURES.some((signature) => {
      return signature.length <= bytesRead && signature.every((byte, index) => buffer[index] === byte);
    });
  } finally {
    await handle.close();
  }
}
