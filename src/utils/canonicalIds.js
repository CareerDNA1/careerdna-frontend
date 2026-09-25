import CANON from '../data/canonicalIds.json';

// One id per pathway and per career world, everywhere.
//
// Pathways and worlds have carried different ids over time: short slugs in
// reports generated before the data rebuild, world prefixed `rf_` ids since,
// section based fallbacks when a report row had no id, and a separate scheme in
// the frontend definitions file. The TITLE has been the stable key throughout.
//
// The canonical ids are the backend's (Roles2 role families and
// career_worlds.json), because that is what reports and live insights emit and
// what gets stored. src/data/canonicalIds.json is generated from those files by
// careerdna-backend/scripts/export_canonical_ids.js; re-run it when they change.

const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');

const PATHWAY_ID_BY_TITLE = new Map(Object.entries(CANON.pathways || {}));
const PATHWAY_IDS = new Set(CANON.pathwayIds || []);
const WORLD_ID_BY_TITLE = new Map(Object.entries(CANON.worlds || {}));
const WORLD_IDS = new Set(CANON.worldIds || []);

export function canonicalPathwayId(id, title) {
  const raw = String(id || '');
  if (PATHWAY_IDS.has(raw)) return raw;
  return PATHWAY_ID_BY_TITLE.get(norm(title)) || raw;
}

export function canonicalWorldId(id, title) {
  const raw = String(id || '');
  if (WORLD_IDS.has(raw)) return raw;
  return WORLD_ID_BY_TITLE.get(norm(title)) || raw;
}

// The career world a pathway belongs to (canonical ids and titles).
export function pathwayWorld(id, title) {
  const cid = canonicalPathwayId(id, title);
  const w = (CANON.pathwayWorld || {})[cid];
  return w && (w.careerWorldId || w.careerWorldTitle) ? { careerWorldId: w.careerWorldId || '', careerWorldTitle: w.careerWorldTitle || '' } : null;
}

export function isPathwayTitle(title) {
  return PATHWAY_ID_BY_TITLE.has(norm(title));
}

// Canonical (type, id) for a liked item. Pathway families the university flow
// labels 'role' come back as 'pathway'. Anything else is returned unchanged.
export function canonicalItem(type, id, title) {
  const t = String(type || '');
  if (t === 'career_world') return { type: t, id: canonicalWorldId(id, title) };
  if (t === 'pathway') return { type: t, id: canonicalPathwayId(id, title) };
  if (t === 'role' && (isPathwayTitle(title) || PATHWAY_IDS.has(String(id || '')))) {
    return { type: 'pathway', id: canonicalPathwayId(id, title) };
  }
  return { type: t, id: String(id || '') };
}
