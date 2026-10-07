import { apiFetch } from './apiFetch';

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

  return apiFetch('/api/selection-insights', { method: 'POST', body: payload, timeoutMs: 45000 });
}
