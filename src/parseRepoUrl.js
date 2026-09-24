// Turns a GitHub URL into a short "owner/repo" label used in the report header.
export function parseRepoUrl(url) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(\.git)?\/?$/);
  if (!match) {
    throw new Error(`"${url}" doesn't look like a GitHub repository URL`);
  }

  const [, owner, repo] = match;
  return `${owner}/${repo}`;
}
