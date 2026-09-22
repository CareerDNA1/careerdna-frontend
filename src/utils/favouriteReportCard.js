import { fetchSelectionInsights } from './fetchSelectionInsights';
import { fetchFurtherStudy } from './fetchFurtherStudy';
import { fetchNonUniRoutes } from './fetchNonUniRoutes';
import { loadRankingSubjectIndex } from './rankings';
import {
  CAREER_WORLD_SHORT_DEFINITIONS,
  CAREER_WORLD_LONG_DEFINITIONS,
  CAREER_WORLD_DEFINITIONS,
  PATHWAY_DEFINITIONS,
  PATHWAY_UNI_LONG_DEFINITIONS,
} from './selectionDefinitions';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Same key + parser the report uses to pull each item's personalised narrative
// out of the run's generated markdown (kept in sync with ResultsComponent).
const compactKey = (v) => String(v || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
function parseNarrativesByTitle(md = '') {
  const out = new Map();
  const src = String(md || '');
  const re = /(?:^|\n)\s*\d+\)\s*\*\*(.+?)\*\*\s*:?\s*\n?([\s\S]*?)(?=(?:\n\s*\d+\)\s*\*\*)|(?:\n\s*#{1,6}\s)|$)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const title = String(m[1] || '').trim();
    const body = String(m[2] || '').replace(/\s+$/, '').trim();
    if (title) out.set(compactKey(title), body);
  }
  return out;
}
const words = (s) => norm(s).split(' ').filter(Boolean);
// True when every word of `a` appears in `b` (used to match a compact favourite
// title like "Creative Arts & Design" to the full "Creative Arts, Design & Experience").
const subset = (a, b) => { const bw = new Set(words(b)); return words(a).length > 0 && words(a).every((w) => bw.has(w)); };

// Index the static definitions by title so a favourite (which stores a compact
// title, not the internal id) still resolves.
const CW_TITLE_TO_ID = {};
const CW_TITLES = [];
Object.entries(CAREER_WORLD_DEFINITIONS || {}).forEach(([id, d]) => {
  if (d && d.title) { CW_TITLE_TO_ID[norm(d.title)] = id; CW_TITLES.push([id, d.title]); }
});
const PATHWAY_BY_TITLE = {};
const PATHWAY_TITLES = [];
Object.entries(PATHWAY_DEFINITIONS || {}).forEach(([id, d]) => {
  if (d && d.title) { PATHWAY_BY_TITLE[norm(d.title)] = { id, ...d }; PATHWAY_TITLES.push([id, d.title, d]); }
});

// Resolve a career world's short/long definition text. CAREER_WORLD_DEFINITIONS
// is the primary source (it carries the school-friendly short/long text and the
// COMPACT titles favourites are stored under); the older SHORT/LONG maps (keyed
// by a different id scheme) are a fallback.
function resolveCareerWorldDef(favTitle, canonId, itemId) {
  let id = '';
  let def = null;
  if (CAREER_WORLD_DEFINITIONS[canonId]) { id = canonId; def = CAREER_WORLD_DEFINITIONS[canonId]; }
  else if (CAREER_WORLD_DEFINITIONS[itemId]) { id = itemId; def = CAREER_WORLD_DEFINITIONS[itemId]; }
  else if (CW_TITLE_TO_ID[norm(favTitle)]) { id = CW_TITLE_TO_ID[norm(favTitle)]; def = CAREER_WORLD_DEFINITIONS[id]; }
  else {
    const fuzzy = CW_TITLES.find(([, t]) => subset(favTitle, t) || subset(t, favTitle));
    if (fuzzy) { id = fuzzy[0]; def = CAREER_WORLD_DEFINITIONS[id]; }
  }
  const short = (def && (def.short || def.paragraph)) || CAREER_WORLD_SHORT_DEFINITIONS[canonId] || CAREER_WORLD_SHORT_DEFINITIONS[itemId] || '';
  const long = (def && def.long) || CAREER_WORLD_LONG_DEFINITIONS[canonId] || CAREER_WORLD_LONG_DEFINITIONS[itemId] || (def && def.paragraph) || '';
  return { id: id || canonId, short, long };
}

function resolvePathwayDef(favTitle, canonId, itemId) {
  return PATHWAY_DEFINITIONS[canonId]
    || PATHWAY_DEFINITIONS[itemId]
    || PATHWAY_BY_TITLE[norm(favTitle)]
    || (PATHWAY_TITLES.find(([, t]) => subset(favTitle, t) || subset(t, favTitle)) || [])[2]
    || null;
}

// Assemble the exact `world` object the report's WorldCard renders, for one
// favourited career world or pathway. Pulls the live match band + pills from the
// insights engine (using the run's archetypes/subdimensions) and the definition
// text from the static definitions. Returns null if the type isn't supported.
export async function assembleFavouriteWorld(item, ctx = {}) {
  if (!item || (item.type !== 'career_world' && item.type !== 'pathway')) return null;

  let insight = null;
  if (ctx.archetypes && Object.keys(ctx.archetypes).length) {
    try {
      const data = await fetchSelectionInsights({
        archetypes: ctx.archetypes,
        subdimensions: Array.isArray(ctx.subdimensions) ? ctx.subdimensions : [],
        likedItems: [{ id: item.id, title: item.title, type: item.type, careerWorldId: item.careerWorldId || '' }],
      });
      const list = Array.isArray(data?.selectionInsights) ? data.selectionInsights : [];
      insight = list.find((i) => String(i.id) === String(item.id) || norm(i.title) === norm(item.title)) || null;
    } catch (_) { /* band/pills just won't show */ }
  }
  const canonId = insight?.id || item.id;
  // Personalised narrative: parse it from the run's generated report markdown,
  // exactly as the report does (keyed by compact title). Fall back to any
  // narrative on the insight object.
  const narrMap = parseNarrativesByTitle(ctx.summaryMarkdown || '');
  const narrative = narrMap.get(compactKey(item.title))
    || narrMap.get(compactKey(insight?.title))
    || insight?.narrative
    || '';

  if (item.type === 'career_world') {
    const cw = resolveCareerWorldDef(item.title, canonId, item.id);
    return {
      world: {
        id: cw.id,
        title: insight?.title || item.title,
        shortDef: cw.short,
        longDef: cw.long,
        signalLabel: insight?.signalLabel || '',
        signalBlocks: insight?.signalBlocks,
        narrative,
        splitNarrative: true,
        insight: insight || null,
      },
      itemType: 'career_world',
      pilotDefinition: true,
    };
  }

  // pathway — rendered in the pilot layout too, for the same big consistent
  // buttons and Read-more pattern (no old round thumb buttons).
  const def = resolvePathwayDef(item.title, canonId, item.id);
  return {
    world: {
      id: canonId,
      title: insight?.title || item.title,
      shortDef: def?.short || '',
      longDef: def?.long || '',
      uniLongDef: (PATHWAY_UNI_LONG_DEFINITIONS && PATHWAY_UNI_LONG_DEFINITIONS[canonId]) || '',
      signalLabel: insight?.signalLabel || '',
      signalBlocks: insight?.signalBlocks,
      narrative,
      splitNarrative: true,
      insight: insight || null,
    },
    itemType: 'pathway',
    pilotDefinition: true,
  };
}

// Assemble the exact role object the report's RoleAccordionItem renders, for one
// favourited role. Roles live inside pathway insights, so we fetch the insights
// for the student's liked pathways (ctx.likedPathways) and find the role by id or
// title across them. Returns { role, pathwayTitle } or null.
export async function assembleFavouriteRole(item, ctx = {}) {
  if (!item || item.type !== 'role') return null;
  if (!ctx.archetypes || !Object.keys(ctx.archetypes).length) return null;
  const likedPathways = Array.isArray(ctx.likedPathways) ? ctx.likedPathways : [];
  if (!likedPathways.length) return null;
  try {
    const data = await fetchSelectionInsights({
      archetypes: ctx.archetypes,
      subdimensions: Array.isArray(ctx.subdimensions) ? ctx.subdimensions : [],
      likedItems: likedPathways.map((p) => ({ id: p.id, title: p.title, type: 'pathway', careerWorldId: p.careerWorldId || '' })),
    });
    const insights = Array.isArray(data?.selectionInsights) ? data.selectionInsights : [];
    for (const ins of insights) {
      const pathways = Array.isArray(ins?.pathways) ? ins.pathways : (ins?.roles ? [ins] : []);
      for (const pw of pathways) {
        const roles = Array.isArray(pw?.roles) ? pw.roles : [];
        const role = roles.find((r) => String(r?.id) === String(item.id) || norm(r?.title) === norm(item.title));
        if (role) return { role, pathwayTitle: pw?.title || '' };
      }
    }
  } catch (_) { /* fall through to null */ }
  return null;
}

// Assemble the exact degree object the Further Study RouteItem renders. Degrees
// come from the further-study endpoint, computed from the student's liked worlds
// and pathways. Returns { route } or null.
export async function assembleFavouriteDegree(item, ctx = {}) {
  if (!item || item.type !== 'subject') return null;
  if (!ctx.archetypes || !Object.keys(ctx.archetypes).length) return null;
  const likedWorlds = Array.isArray(ctx.likedWorlds) ? ctx.likedWorlds : [];
  const likedPathwayTitles = (Array.isArray(ctx.likedPathways) ? ctx.likedPathways : []).map((p) => p.title).filter(Boolean);
  if (!likedWorlds.length && !likedPathwayTitles.length) return null;
  try {
    const data = await fetchFurtherStudy({
      archetypes: ctx.archetypes,
      subdimensions: Array.isArray(ctx.subdimensions) ? ctx.subdimensions : [],
      likedItems: likedWorlds.map((w) => ({ id: w.id, title: w.title, type: 'career_world', careerWorldId: w.careerWorldId || '' })),
      likedPathwayTitles,
    });
    const groups = Array.isArray(data?.groups) ? data.groups : [];
    for (const g of groups) {
      const routes = Array.isArray(g?.routes) ? g.routes : [];
      const route = routes.find((r) => String(r?.id) === String(item.id) || norm(r?.title) === norm(item.title));
      if (route) {
        // Enable the exact "Explore courses & rankings" cell (opened by App's
        // global rankings listener) with its live count.
        let hasRankings = false;
        let rankCount = 0;
        try {
          const idx = await loadRankingSubjectIndex();
          if (idx) {
            const nt = String(route.title || '').trim().toLowerCase();
            hasRankings = !!((route.id && idx.ids.has(route.id)) || (nt && idx.titles.has(nt)));
            rankCount = (route.id && idx.countById.get(route.id)) || idx.countByTitle.get(nt) || 0;
          }
        } catch (_) { /* rankings cell just won't show */ }
        return { route, hasRankings, rankCount };
      }
    }
  } catch (_) { /* fall through to null */ }
  return null;
}

// Assemble the exact Non-University PathwayCard for a favourited training route
// or apprenticeship. Apprenticeships live inside a pathway grouping, so we find
// the pathway the item belongs to and return all its routes. Returns
// { pathway, routes } or null.
export async function assembleFavouriteTraining(item, ctx = {}) {
  if (!item || (item.type !== 'nonuni_pathway' && item.type !== 'apprenticeship')) return null;
  try {
    const res = await fetchNonUniRoutes();
    const arr = Array.isArray(res) ? res : (Array.isArray(res?.routes) ? res.routes : []);
    if (!arr.length) return null;
    let pathwayName = '';
    if (item.type === 'nonuni_pathway') {
      pathwayName = String(item.id).replace(/^nonuni:/, '') || item.title;
      const exact = arr.find((r) => norm(r.pathway) === norm(pathwayName) || norm(r.pathway) === norm(item.title));
      if (exact) pathwayName = exact.pathway;
    } else {
      const key = String(item.id).replace(/^apprenticeship:/, '');
      const r0 = arr.find((r) => r.standardLarsCode === key || norm(r.standardName) === norm(key) || norm(r.standardName) === norm(item.title));
      if (!r0) return null;
      pathwayName = r0.pathway;
    }
    if (!pathwayName) return null;
    const routes = arr.filter((r) => norm(r.pathway) === norm(pathwayName));
    if (!routes.length) return null;
    return { pathway: pathwayName, routes };
  } catch (_) { /* fall through to null */ }
  return null;
}
