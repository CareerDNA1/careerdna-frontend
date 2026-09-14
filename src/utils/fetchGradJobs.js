import { buildApiCandidates } from './config';

// Live graduate-jobs lookup (university flow). Talks to our own backend, which
// fetches + caches from Reed/Adzuna. Results are cached client-side per role
// title so re-opening a card doesn't re-hit the backend.

async function getJson(path) {
  const candidates = buildApiCandidates(path);
  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.status === 404) { lastError = new Error('404'); lastError.status = 404; continue; }
      let data = null;
      try { data = await res.json(); } catch (_) { data = null; }
      if (!res.ok) {
        const e = new Error(data?.message || `Request failed: ${res.status}`);
        e.status = res.status;
        throw e;
      }
      return data;
    } catch (error) {
      if (error?.status && error.status !== 404) throw error;
      lastError = error;
    }
  }
  throw lastError || new Error('Could not load graduate jobs right now.');
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
