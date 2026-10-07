import { apiFetch } from './apiFetch';

// Premium data routes check the plan on the server; apiFetch sends the session
// token when signed in. A 404 from every base URL surfaces as err.status === 404,
// which loadSubjectRanking relies on.
// The first load of a subject's ranking builds the course list on the server,
// which can be slow on a cold start, so allow longer than the default timeout.
function getJson(path) {
  return apiFetch(path, { timeoutMs: 45000 });
}

let subjectsCache = null;

// Load the set of subjects that actually have a national ranking, so the UI can
// hide the rankings panel for degrees we have no ranked data for (e.g. newly
// added subjects not yet in the Office for Students build). Returns
// { ids: Set<string>, titles: Set<string> } with normalised titles.
let rankingIndexCache = null;
export async function loadRankingSubjectIndex() {
  if (rankingIndexCache) return rankingIndexCache;
  const norm = (s) => String(s || '').trim().toLowerCase();
  try {
    const data = await getJson('/api/rankings/subjects');
    const list = Array.isArray(data?.subjects) ? data.subjects : [];
    subjectsCache = list;
    const countById = new Map();
    const countByTitle = new Map();
    list.forEach((s) => {
      if (s.id) countById.set(s.id, Number(s.count) || 0);
      if (s.subject) countByTitle.set(norm(s.subject), Number(s.count) || 0);
    });
    rankingIndexCache = {
      ids: new Set(list.map((s) => s.id).filter(Boolean)),
      titles: new Set(list.map((s) => norm(s.subject)).filter(Boolean)),
      countById,
      countByTitle,
    };
  } catch (_) {
    rankingIndexCache = { ids: new Set(), titles: new Set(), countById: new Map(), countByTitle: new Map() };
  }
  return rankingIndexCache;
}

// Fetch the ranking for a subject. Tries the subject id first; if that isn't a
// known ranking id, falls back to matching by subject title.
export async function loadSubjectRanking({ subjectId, subjectTitle }) {
  if (subjectId) {
    try {
      return await getJson(`/api/rankings/${encodeURIComponent(subjectId)}`);
    } catch (err) {
      if (err?.status !== 404) throw err;
    }
  }
  if (subjectTitle) {
    if (!subjectsCache) {
      const data = await getJson('/api/rankings/subjects');
      subjectsCache = Array.isArray(data?.subjects) ? data.subjects : [];
    }
    const norm = (s) => String(s || '').trim().toLowerCase();
    const match = subjectsCache.find((s) => norm(s.subject) === norm(subjectTitle));
    if (match) return getJson(`/api/rankings/${encodeURIComponent(match.id)}`);
  }
  const e = new Error('No national ranking is available for this subject yet.');
  e.status = 404;
  throw e;
}
