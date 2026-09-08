import { buildApiCandidates } from './config';

// Load + cache the full non-university routes list once per session, and fetch
// live apprenticeship vacancies per standard (LARS code) on demand.

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
  throw lastError || new Error('Could not load non-university routes right now.');
}

let routesCache = null;

export async function fetchNonUniRoutes() {
  if (routesCache) return routesCache;
  const data = await getJson('/api/nonuni/routes');
  routesCache = {
    routes: Array.isArray(data?.routes) ? data.routes : [],
    liveVacancies: !!data?.liveVacancies,
  };
  return routesCache;
}

export function peekNonUniRoutes() {
  return routesCache;
}

// Live vacancies for one standard, by LARS code. Cached client-side per code so
// re-opening a card doesn't re-hit the backend.
const vacancyCache = new Map();

export async function fetchRouteVacancies(larsCode, keyword = '') {
  const lars = String(larsCode || '').trim();
  if (!lars) return null;
  if (vacancyCache.has(lars)) return vacancyCache.get(lars);
  const q = keyword ? `?q=${encodeURIComponent(keyword)}` : '';
  try {
    const data = await getJson(`/api/nonuni/vacancies/${encodeURIComponent(lars)}${q}`);
    vacancyCache.set(lars, data);
    return data;
  } catch (err) {
    const fallback = { count: null, vacancies: [], error: err?.message || 'lookup failed' };
    return fallback; // don't cache failures
  }
}
