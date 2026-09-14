import { buildApiCandidates } from './config';
import { supabase } from './supabaseClient';

export async function fetchSelectionInsights({
  archetypes,
  subdimensions = [],
  likedItems = [],
}) {
  const payload = {
    archetypes: archetypes || {},
    subdimensions: Array.isArray(subdimensions) ? subdimensions : [],
    likedItems: Array.isArray(likedItems) ? likedItems : [],
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token || '';

  const candidates = buildApiCandidates('/api/selection-insights');
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
            ...(accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {}),
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
          message = error?.error || error?.summary || message;
        } catch {}

        throw new Error(message);
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Could not load deeper insights right now.');
}