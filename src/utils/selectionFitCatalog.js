// src/utils/selectionFitCatalog.js
// Optional local fallback for role/subject fit metadata.
// The frontend will always prefer backend-provided metadata when available.

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

// Keep this intentionally small and easy to extend.
// Shape:
// {
//   subject: {
//     finance: {
//       archetypes: ['Thinker', 'Achiever'],
//       subdimensions: ['Investigative Curiosity', 'Analytical Thinking']
//     }
//   },
//   role: {
//     softwareengineer: {
//       archetypes: ['Thinker', 'Creator'],
//       subdimensions: ['Investigative Curiosity', 'Creative Expression']
//     }
//   }
// }
const LOCAL_SELECTION_FIT_CATALOG = {
  subject: {},
  role: {},
};

export function getSelectionFitProfile(title, type) {
  const bucket = LOCAL_SELECTION_FIT_CATALOG[type];
  if (!bucket) return null;
  return bucket[normalize(title)] || null;
}

export function normalizeSelectionKey(value) {
  return normalize(value);
}
