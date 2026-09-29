// Removes terminal color codes so test output can be matched as plain text.
export function stripColors(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
