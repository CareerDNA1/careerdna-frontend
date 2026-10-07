import { apiFetch } from './apiFetch';

// Live graduate-jobs lookup (university flow). Talks to our own backend, which
// fetches + caches from Reed/Adzuna. Results are cached client-side per role
// title so re-opening a card doesn't re-hit the backend.

// Premium data routes check the plan on the server; apiFetch sends the session
// token when signed in. No timeout: upstream job boards can be slow.
function getJson(path) {
  return apiFetch(path, { timeoutMs: 0 });
}

// Is the feature switched on at all (are the API keys configured on the server)?
let statusCache = null;
export async function fetchGradJobsStatus() {
  if (statusCache !== null) return statusCache;
  try {
    const data = await getJson('/api/gradjobs?statusOnly=1');
    statusCache = !!data?.gradJobs;
  } catch (_) {
    statusCache = false;
  }
  return statusCache;
}

const jobsCache = new Map();
export async function fetchGradJobs(title, kind = 'grad') {
  const key = String(title || '').trim();
  if (!key) return null;
  const cacheKey = `${kind}:${key}`;
  if (jobsCache.has(cacheKey)) return jobsCache.get(cacheKey);
  const kindParam = (kind === 'internship' || kind === 'scheme') ? `&kind=${kind}` : '';
  try {
    const data = await getJson(`/api/gradjobs?title=${encodeURIComponent(key)}${kindParam}`);
    // Don't cache transient/empty-with-error results (e.g. a Google source timeout)
    // so re-opening the card retries instead of showing a stale "no jobs".
    if (!data || !data.error) jobsCache.set(cacheKey, data);
    return data;
  } catch (err) {
    const fallback = { count: null, error: err?.message || 'lookup failed' };
    return fallback; // don't cache failures
  }
}
