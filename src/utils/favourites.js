import { supabase } from './supabaseClient';
import { canonicalItem, pathwayWorld, canonicalWorldId } from './canonicalIds';

// The insights engine labels pathway families as type "role" in the university
// flow, so a liked PATHWAY can be stored with item_type 'role'. Recognise those
// (by canonical title/id) and treat them as pathways.
export function normaliseFavouriteType(itemType, itemId, itemTitle) {
  const t = String(itemType || 'other');
  if (t !== 'role') return t;
  return canonicalItem(t, itemId, itemTitle).type;
}

// Favourites are the items the student liked on a SINGLE assessment run (their
// latest one). Backed by the result_feedback table (feedback_scope 'item_reaction',
// reaction 'like'). Categories mirror the item_type values written across the app.
export const FAV_CATEGORIES = [
  { type: 'career_world', label: 'Career worlds' },
  { type: 'pathway', label: 'Career pathways' },
  { type: 'subject', label: 'University degrees' },
  { type: 'role', label: 'Roles' },
  { type: 'apprenticeship', label: 'Apprenticeships' },
  { type: 'nonuni_pathway', label: 'Training & work pathways' },
  // Live apprenticeship adverts saved from the Training & Work tab. Stored as
  // item_type 'job' (same card, same link/expiry handling) but grouped here,
  // next to the other training items, not under jobs.
  { type: 'job', key: 'apprenticeship_advert', label: 'Training & work adverts' },
  { type: 'course', label: 'University courses' },
  { type: 'job', key: 'job', label: 'Saved jobs' },
  { type: 'strength', label: 'Strengths' },
  { type: 'environment', label: 'Ideal environments' },
];

// Liked items for one run, grouped into the ordered categories above (plus any
// unknown types appended under "Other").
export async function getFavouritesByCategory(runId) {
  if (!runId) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Prefer selecting item_meta (needed for saved course/job links + expiry). If
  // the column doesn't exist yet (migration not run), fall back to the base
  // columns so favourites never break.
  let data;
  let res = await supabase
    .from('result_feedback')
    .select('item_id, item_type, item_title, item_meta')
    .eq('user_id', user.id)
    .eq('assessment_run_id', runId)
    .eq('feedback_scope', 'item_reaction')
    .eq('reaction', 'like');
  if (res.error) {
    res = await supabase
      .from('result_feedback')
      .select('item_id, item_type, item_title')
      .eq('user_id', user.id)
      .eq('assessment_run_id', runId)
      .eq('feedback_scope', 'item_reaction')
      .eq('reaction', 'like');
    if (res.error) throw res.error;
  }
  data = res.data;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = (data || []).filter((r) => r.item_id && r.item_title);
  const byType = new Map();
  rows.forEach((r) => {
    const t = normaliseFavouriteType(r.item_type, r.item_id, r.item_title);
    const meta = (r.item_meta && typeof r.item_meta === 'object') ? r.item_meta : {};
    const rawId = String(r.item_id || '');
    // Recover the university and link from the id when the item_meta snapshot is
    // missing. Courses are saved as `course:<university>::<url-or-title>` (new) or
    // `course:<url>` (old); jobs as `job:<url>`.
    let idUrl = '';
    let idUni = '';
    if (t === 'course') {
      // id formats: `course:<uni>::<title>::<url>` (current),
      // `course:<uni>::<url>` and `course:<url>` (older). The university is the
      // text before the first `::`; the link is any trailing http(s) URL.
      const body = rawId.replace(/^course:/, '');
      const sep = body.indexOf('::');
      if (sep >= 0) idUni = body.slice(0, sep);
      idUrl = (body.match(/(https?:\/\/[^\s]+)$/) || [])[1] || '';
    } else {
      idUrl = (rawId.match(/^job:(https?:\/\/.+)$/) || [])[1] || '';
    }
    const item = {
      id: r.item_id,
      title: r.item_title,
      type: t,
      storedType: String(r.item_type || 'other'),
      url: meta.url || idUrl || '',
      subtitle: meta.university || meta.employer || idUni || '',
      subject: meta.subject || '',
      stats: (meta.stats && typeof meta.stats === 'object') ? meta.stats : null,
      meta,
    };
    // Saved jobs can close: flag ones whose closing date has passed so the
    // student can clear them out. Other saved types never expire.
    if (t === 'job' && meta.closingDate) {
      const d = new Date(meta.closingDate);
      if (!Number.isNaN(d.getTime()) && d < today) item.expired = true;
    }
    // Group key: apprenticeship adverts are jobs by type but sit with the
    // Training & Work favourites.
    const isApprenticeshipAd = t === 'job' && (meta.kind === 'apprenticeship' || /apprentice/i.test(String(meta.source || '')));
    const gk = t === 'job' ? (isApprenticeshipAd ? 'apprenticeship_advert' : 'job') : t;
    if (!byType.has(gk)) byType.set(gk, []);
    byType.get(gk).push(item);
  });

  // Kept orphans: a favourite whose parent world or pathway is no longer liked
  // still lives here but is no longer shown in the report tabs. Mark it with a
  // short note so the student knows why it is only on the profile.
  const nkey = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const likedWorlds = new Set();
  const likedPathways = new Set();
  byType.forEach((items, type) => {
    items.forEach((it) => {
      if (type === 'career_world') { likedWorlds.add(nkey(it.title)); likedWorlds.add(canonicalWorldId(it.id, it.title)); }
      if (type === 'pathway') likedPathways.add(nkey(it.title));
    });
  });
  const worldLiked = (id, title) => (id && likedWorlds.has(canonicalWorldId(id, title))) || (title && likedWorlds.has(nkey(title)));
  byType.forEach((items, type) => {
    items.forEach((it) => {
      const m = it.meta || {};
      if (type === 'pathway') {
        const w = pathwayWorld(it.id, it.title);
        if (w && !worldLiked(w.careerWorldId, w.careerWorldTitle)) it.note = `Kept from ${w.careerWorldTitle}`;
        return;
      }
      if (!['subject', 'role', 'nonuni_pathway', 'apprenticeship'].includes(type)) return;
      const pathwayTitle = m.pathwayTitle || (type === 'nonuni_pathway' ? it.title : '');
      const w = (m.careerWorldId || m.careerWorldTitle)
        ? { careerWorldId: m.careerWorldId || '', careerWorldTitle: m.careerWorldTitle || '' }
        : (pathwayTitle ? pathwayWorld('', pathwayTitle) : null);
      const pathwayStillLiked = pathwayTitle && likedPathways.has(nkey(pathwayTitle));
      const worldStillLiked = w && worldLiked(w.careerWorldId, w.careerWorldTitle);
      if (!pathwayStillLiked && !worldStillLiked && (pathwayTitle || (w && w.careerWorldTitle))) {
        const from = (pathwayTitle && pathwayTitle !== it.title) ? pathwayTitle : (w && w.careerWorldTitle) || pathwayTitle;
        if (from) it.note = `Kept from ${from}`;
      }
    });
  });

  const groups = [];
  FAV_CATEGORIES.forEach((c) => {
    const k = c.key || c.type;
    if (byType.has(k)) { groups.push({ type: c.type, key: k, label: c.label, items: byType.get(k) }); byType.delete(k); }
  });
  byType.forEach((items, type) => groups.push({ type, key: type, label: 'Other', items }));
  return groups;
}

// Remove one favourite (delete that like row for this run).
export async function removeFavourite(runId, itemId, itemType, storedType = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be logged in.');
  const { error } = await supabase
    .from('result_feedback')
    .delete()
    .eq('user_id', user.id)
    .eq('assessment_run_id', runId)
    .eq('feedback_scope', 'item_reaction')
    .eq('item_type', storedType || itemType)
    .eq('item_id', itemId);
  if (error) throw error;
}
