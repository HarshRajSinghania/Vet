// Checks how GitHub's API answers become maintenance signals, using a fake
// fetch so the test needs no network and no token.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { fetchRepoInfo, describeActivity } from '../src/fetchRepoInfo.js';

function fakeResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

test('turns API answers into activity, counts and the latest release', async (context) => {
  const lastPush = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  context.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('/commits?')) {
      return fakeResponse(200, [{}], { link: '<https://api.github.com/x?per_page=1&page=40>; rel="last"' });
    }
    if (url.includes('/contributors?')) {
      return fakeResponse(200, [{}], { link: '<https://api.github.com/x?anon=1&per_page=1&page=7>; rel="last"' });
    }
    if (url.endsWith('/releases/latest')) {
      return fakeResponse(200, { tag_name: 'v2.0.0', published_at: '2026-09-01T10:00:00Z' });
    }
    return fakeResponse(200, {
      archived: false,
      default_branch: 'main',
      pushed_at: lastPush,
      stargazers_count: 1200,
      forks_count: 80,
      open_issues_count: 15,
    });
  });

  assert.deepEqual(await fetchRepoInfo('owner/repo'), {
    available: true,
    activity: 'active',
    defaultBranch: 'main',
    recentCommitCount: 40,
    daysSinceLastPush: 3,
    stars: 1200,
    forks: 80,
    openIssuesAndPullRequests: 15,
    contributorCount: 7,
    latestRelease: { tag: 'v2.0.0', publishedAt: '2026-09-01' },
  });
});

test('handles no releases, and explains a rate limit', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    return fakeResponse(403, { message: 'API rate limit exceeded' }, { 'x-ratelimit-remaining': '0' });
  });

  assert.deepEqual(await fetchRepoInfo('owner/repo'), {
    available: false,
    reason: 'GitHub API rate limit reached (set GITHUB_TOKEN to raise it)',
  });
});

test('describes activity the way Scorecard measures maintenance', () => {
  assert.equal(describeActivity(true, 50, 1), 'archived');
  assert.equal(describeActivity(false, 13, 1), 'active');
  assert.equal(describeActivity(false, 2, 30), 'quiet');
  assert.equal(describeActivity(false, 0, 2), 'quiet'); // working on another branch, like commander.js
  assert.equal(describeActivity(false, 0, 400), 'inactive');
});

mock.reset();
