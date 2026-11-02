// src/utils/traitNames.js
// Sub-dimension (trait) names that changed with bank v2 (CareerDNA v5, 29 Oct
// 2026). Bank v1 and every report saved before then use the old names; the
// scores themselves are unchanged (same items, same weights), only the label
// moved. Every score leaving the scorer and every saved name that is looked
// up goes through canonicalTraitName, so old and new reports show and match
// the same traits. Mirror: careerdna-backend/src/lib/traitNames.js.

export const TRAIT_RENAMES = Object.freeze({
  'Entrepreneurial Drive': 'Leading & Starting Things',
  // Renamed again on 1 Nov 2026 ("Enterprising" was hard for students to read);
  // early bank v2 test reports carry the interim name.
  'Leading & Enterprising': 'Leading & Starting Things',
  'Technical Curiosity': 'Hands-On & Technical',
  'Cultural & Global Curiosity': 'Society & World Curiosity',
  'Data Curiosity': 'Numbers & Data Curiosity',
  'Achievement': 'Recognition & Reward',
});

export function canonicalTraitName(name) {
  const s = String(name ?? '').trim();
  return TRAIT_RENAMES[s] || s;
}

export default canonicalTraitName;
