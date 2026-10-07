// Asks GitHub's public API whether the repo is still alive: recent commits,
// last push, archived or not, stars, issues, contributors and latest release.
// Uses GITHUB_TOKEN when it's set, since GitHub allows only 60 requests an
// hour without one.
const API_URL = 'https://api.github.com';
const DAY_MS = 24 * 60 * 60 * 1000;

// OpenSSF Scorecard calls a repo fully maintained at about one commit a week.
const ACTIVE_COMMITS_IN_90_DAYS = 13;

export async function fetchRepoInfo(repoName) {
  try {
    const repo = await getJson(`/repos/${repoName}`);
    const since = new Date(Date.now() - 90 * DAY_MS).toISOString();
    const recentCommitCount = await countItems(`/repos/${repoName}/commits?since=${since}`);
    const contributorCount = await countItems(`/repos/${repoName}/contributors?anon=1`);
    const release = await getJson(`/repos/${repoName}/releases/latest`, { allowMissing: true });

    const daysSinceLastPush = Math.floor((Date.now() - Date.parse(repo.pushed_at)) / DAY_MS);
    return {
      available: true,
      activity: describeActivity(repo.archived, recentCommitCount, daysSinceLastPush),
      defaultBranch: repo.default_branch,
      recentCommitCount,
      daysSinceLastPush,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssuesAndPullRequests: repo.open_issues_count,
      contributorCount,
      latestRelease: release ? { tag: release.tag_name, publishedAt: release.published_at.slice(0, 10) } : null,
    };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

// Commits are counted on the default branch only, but some projects (like
// commander.js) work on a develop branch and merge at release time, so a
// recent push to any branch still counts as a sign of life.
export function describeActivity(archived, recentCommitCount, daysSinceLastPush) {
  if (archived) return 'archived';
  if (recentCommitCount >= ACTIVE_COMMITS_IN_90_DAYS) return 'active';
  if (recentCommitCount > 0 || daysSinceLastPush <= 90) return 'quiet';
  return 'inactive';
}

// Asking for one item per page makes GitHub's "last page" link equal the total count.
async function countItems(path) {
  const response = await request(`${path}${path.includes('?') ? '&' : '?'}per_page=1`);
  const lastPage = (response.headers.get('link') || '').match(/[?&]page=(\d+)>; rel="last"/);
  if (lastPage) return Number(lastPage[1]);
  return (await response.json()).length;
}

async function getJson(path, { allowMissing = false } = {}) {
  const response = await request(path, allowMissing);
  return response.status === 404 ? null : response.json();
}

async function request(path, allowMissing = false) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'vet-cli' };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { headers, signal: AbortSignal.timeout(10000) });
  if (response.ok || (allowMissing && response.status === 404)) return response;

  if (response.headers.get('x-ratelimit-remaining') === '0') {
    throw new Error('GitHub API rate limit reached (set GITHUB_TOKEN to raise it)');
  }
  throw new Error(`GitHub API answered HTTP ${response.status} for ${path.split('?')[0]}`);
}
