import { supabase } from './supabaseClient';
import { pathwayWorld, canonicalWorldId } from './canonicalIds';
import { fetchNonUniRoutes } from './fetchNonUniRoutes';

// When a student unlikes a career world or pathway, the degrees, roles and
// training routes they saved under it become orphans. These helpers find those
// children (using the parent stored with each favourite) so the UI can offer to
// remove them too.

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const CHILD_TYPES = ['pathway', 'subject', 'role', 'nonuni_pathway', 'apprenticeship', 'course'];

// The career world a pathway belongs to (canonical backend ids, via
// src/data/canonicalIds.json). Used to stamp pathway likes with their parent
// and as a fallback for old likes saved without one.
export function pathwayParentMeta(itemId, itemTitle) {
  return pathwayWorld(itemId, itemTitle);
}

export const CHILD_TYPE_LABELS = {
  pathway: ['pathway', 'pathways'],
  subject: ['degree', 'degrees'],
  role: ['role', 'roles'],
  nonuni_pathway: ['training route', 'training routes'],
  apprenticeship: ['apprenticeship', 'apprenticeships'],
  course: ['university course', 'university courses'],
};

// parent: { type: 'career_world' | 'pathway' | 'subject', id, title }
// Returns [{ id, item_type, item_title }] of liked children on this run.
//
// Hierarchy: world > pathway > (degree, role, training route, apprenticeship);
// degree > saved university course. A child that only knows its pathway is
// resolved up to the world through the static definitions, and courses follow
// the degree they were saved for, so one prompt lists everything underneath.
export async function findChildFavourites({ userId, runId, parent }) {
  if (!userId || !runId || !parent || !parent.type) return [];
  if (!['career_world', 'pathway', 'subject'].includes(parent.type)) return [];
  const { data, error } = await supabase
    .from('result_feedback')
    .select('id, item_type, item_title, item_meta')
    .eq('user_id', userId)
    .eq('assessment_run_id', runId)
    .eq('feedback_scope', 'item_reaction')
    .eq('reaction', 'like')
    .in('item_type', CHILD_TYPES);
  if (error) throw error;
  const pid = parent.type === 'career_world' ? canonicalWorldId(parent.id, parent.title) : String(parent.id || '');
  const ptitle = norm(parent.title);
  const rows = data || [];
  const metaOf = (row) => ((row.item_meta && typeof row.item_meta === 'object') ? row.item_meta : {});

  // Apprenticeships liked before their pathway was stored: resolve the parent
  // from the routes data (by LARS code or standard name).
  const bareApprenticeships = rows.filter((r) => r.item_type === 'apprenticeship' && !metaOf(r).pathwayTitle);
  const apprenticeParent = new Map(); // row id -> { pathwayTitle, careerWorldTitle }
  if (bareApprenticeships.length) {
    try {
      const res = await fetchNonUniRoutes();
      const routes = Array.isArray(res) ? res : (Array.isArray(res?.routes) ? res.routes : []);
      bareApprenticeships.forEach((r) => {
        const key = String(r.item_id || '').replace(/^apprenticeship:/, '');
        const hit = routes.find((x) => String(x.standardLarsCode || '') === key || norm(x.standardName) === norm(key) || norm(x.standardName) === norm(r.item_title));
        if (hit) apprenticeParent.set(r.id, { pathwayTitle: hit.pathway || '', careerWorldTitle: hit.careerWorld || '' });
      });
    } catch (_) { /* leave unresolved */ }
  }
  const metaWithFallback = (row) => {
    const m = metaOf(row);
    if (row.item_type === 'apprenticeship' && !m.pathwayTitle && apprenticeParent.has(row.id)) return { ...m, ...apprenticeParent.get(row.id) };
    return m;
  };

  const inWorld = (row) => {
    let m = metaWithFallback(row);
    // A training route's title IS its pathway; older likes stored no meta.
    if (row.item_type === 'nonuni_pathway' && !m.pathwayTitle) m = { ...m, pathwayTitle: row.item_title };
    // Pathways (and the university flow's pathway families stored as roles)
    // liked before parents were stored: resolve their world from the definitions.
    if ((row.item_type === 'pathway' || row.item_type === 'role') && !m.careerWorldId && !m.careerWorldTitle) {
      m = pathwayParentMeta(row.item_id, row.item_title) || m;
    }
    // Anything that only knows its pathway: resolve that pathway's world.
    if (!m.careerWorldId && !m.careerWorldTitle && m.pathwayTitle) {
      m = { ...m, ...(pathwayParentMeta('', m.pathwayTitle) || {}) };
    }
    return (pid && canonicalWorldId(m.careerWorldId, m.careerWorldTitle) === pid) || (ptitle && norm(m.careerWorldTitle) === ptitle);
  };
  const inPathway = (row) => {
    if (row.item_type === 'pathway') return false;
    const m = metaWithFallback(row);
    const pt = m.pathwayTitle || (row.item_type === 'nonuni_pathway' ? row.item_title : '');
    return ptitle && norm(pt) === ptitle;
  };

  let picked;
  if (parent.type === 'subject') {
    picked = [];
  } else {
    picked = rows.filter((row) => row.item_type !== 'course' && (parent.type === 'pathway' ? inPathway(row) : inWorld(row)));
  }

  // Courses follow their degree: the parent itself when a degree is unliked,
  // otherwise the degrees being removed above.
  const removedDegrees = new Set(picked.filter((r) => r.item_type === 'subject').map((r) => norm(r.item_title)));
  if (parent.type === 'subject' && ptitle) removedDegrees.add(ptitle);
  if (removedDegrees.size) {
    rows.forEach((row) => {
      if (row.item_type !== 'course') return;
      const subj = norm(metaOf(row).subject);
      if (subj && removedDegrees.has(subj)) picked.push(row);
    });
  }

  return picked.map((row) => {
    const m = metaOf(row);
    return {
      id: row.id,
      item_type: row.item_type,
      item_title: row.item_title || '',
      // Extra context for the prompt list, so two items with the same title
      // (a degree and a course in that subject) read differently.
      subtitle: row.item_type === 'course' ? (m.university || '') : row.item_type === 'job' ? (m.employer || '') : '',
    };
  });
}

export async function deleteFavouriteRows(ids = []) {
  const clean = (ids || []).filter(Boolean);
  if (!clean.length) return 0;
  const { error } = await supabase.from('result_feedback').delete().in('id', clean);
  if (error) throw error;
  return clean.length;
}

// "2 degrees and 1 role" from a children list.
export function describeChildren(children = []) {
  const counts = {};
  children.forEach((c) => { counts[c.item_type] = (counts[c.item_type] || 0) + 1; });
  const parts = Object.entries(counts).map(([t, n]) => {
    const [one, many] = CHILD_TYPE_LABELS[t] || ['item', 'items'];
    return `${n} ${n === 1 ? one : many}`;
  });
  if (parts.length <= 1) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
