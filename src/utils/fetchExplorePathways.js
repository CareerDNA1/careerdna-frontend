import { buildApiCandidates } from './config';
import { supabase } from './supabaseClient';

// Fetches the career pathways within the user's matched career worlds, each
// scored (match band) by the backend, grouped by world. Shape returned:
//   { worlds: [ { id, title, signalLabel, signalPct, pathways: [insight, ...] } ] }
export async function fetchExplorePathways({ archetypes, subdimensions = [] }) {
  const payload = {
    archetypes: archetypes || {},
    subdimensions: Array.isArray(subdimensions) ? subdimensions : [],
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token || '';

  const candidates = buildApiCandidates('/api/explore-pathways');
  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 404) {
        lastError = new Error('Request failed: 404');
        continue;
      }

      if (!response.ok) {
        let message = `Request failed: ${response.status}`;
        try {
          const error = await response.json();
          message = error?.error || error?.message || message;
        } catch {}
        throw new Error(message);
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Could not load your pathways right now.');
}
