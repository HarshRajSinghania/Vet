// Checks whether a single URL responds successfully, with a short timeout
// so one slow or dead server doesn't stall the whole scan.
const TIMEOUT_MS = 8000;

// Sites like npmjs.com answer every automated request with one of these, even
// for pages that load fine in a browser, so they don't prove a link is broken.
const BLOCKED_STATUSES = [401, 403, 429];

export async function checkLink(url) {
  try {
    const headResponse = await fetchWithTimeout(url, 'HEAD');
    if (headResponse.ok) {
      return { ok: true };
    }

    // Some servers reject HEAD requests but allow GET, so give GET a try too.
    const getResponse = await fetchWithTimeout(url, 'GET');
    if (getResponse.ok) {
      return { ok: true };
    }

    const blocked = BLOCKED_STATUSES.includes(getResponse.status);
    return { ok: false, blocked, reason: `HTTP ${getResponse.status}` };
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timed out' : error.message;
    return { ok: false, reason };
  }
}

async function fetchWithTimeout(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { method, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}
