import { apiFetch } from './apiFetch';

// Load + cache the full non-university routes list once per session, and fetch
// live apprenticeship vacancies per standard (LARS code) on demand.

// Premium data routes check the plan on the server; apiFetch sends the session
// token when signed in. No timeout: these endpoints can be slow on first call.
function getJson(path) {
  return apiFetch(path, { timeoutMs: 0 });
}

let routesCache = null;

export async function fetchNonUniRoutes() {
  if (routesCache) return routesCache;
  const data = await getJson('/api/nonuni/routes');
  const routes = Array.isArray(data?.routes) ? data.routes : [];
  const result = { routes, liveVacancies: !!data?.liveVacancies };
  // Only cache a real answer; an empty list would otherwise stick for the session.
  if (routes.length) routesCache = result;
  return result;
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
