import { BACKEND_URL } from './config';

export async function fetchSelectionInsights({ archetypes, subdimensions = [], likedItems = [] }) {
  const response = await fetch(`${BACKEND_URL}/api/selection-insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      archetypes: archetypes || {},
      subdimensions: Array.isArray(subdimensions) ? subdimensions : [],
      likedItems: Array.isArray(likedItems) ? likedItems : [],
    }),
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const error = await response.json();
      message = error?.error || error?.summary || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}
