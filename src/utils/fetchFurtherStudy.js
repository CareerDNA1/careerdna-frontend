import { buildApiCandidates } from './config';
import { supabase } from './supabaseClient';

// In-memory cache for the session: the profile is fixed for a given results run,
// so the study routes only change when the set of liked worlds/pathways changes.
// This avoids re-fetching (and the "Finding your study routes…" spinner) every
// time the user re-opens the Further Study tab.
const FS_CACHE = new Map();

function fsCacheKey(likedItems = [], likedPathwayTitles = []) {
  const worlds = (likedItems || []).map((w) => w?.careerWorldId || w?.id || w?.title || '').sort();
  const paths = [...(likedPathwayTitles || [])].sort();
  return JSON.stringify({ worlds, paths });
}

// Synchronous peek so the panel can seed its state and skip the spinner entirely.
export function peekFurtherStudyCache(likedItems = [], likedPathwayTitles = []) {
  return FS_CACHE.get(fsCacheKey(likedItems, likedPathwayTitles)) || null;
}

// Given the student's liked pathways, returns the study routes (university
// degrees now; apprenticeships/training later) that lead to each, scored.
export async function fetchFurtherStudy({
  archetypes,
  subdimensions = [],
  likedItems = [],
  likedPathwayTitles = [],
}) {
  const cacheKey = fsCacheKey(likedItems, likedPathwayTitles);
  if (FS_CACHE.has(cacheKey)) return FS_CACHE.get(cacheKey);

  const payload = {
    archetypes: archetypes || {},
    subdimensions: Array.isArray(subdimensions) ? subdimensions : [],
    likedItems: Array.isArray(likedItems) ? likedItems : [],
    likedPathwayTitles: Array.isArray(likedPathwayTitles) ? likedPathwayTitles : [],
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token || '';
  const candidates = buildApiCandidates('/api/further-study');
  let lastError = null;

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.status === 404) {
        lastError = new Error('Request failed: 404');
        continue;
      }

      if (!response.ok) {
        let message = `Request failed: ${response.status}`;
        try {
          const error = await response.json();
          message = error?.error || message;
        } catch {}
        throw new Error(message);
      }

      {
        const data = await response.json();
        FS_CACHE.set(cacheKey, data);
        return data;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Could not load your study routes right now.');
}
