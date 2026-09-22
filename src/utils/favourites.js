import { supabase } from './supabaseClient';

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
  { type: 'course', label: 'University courses' },
  { type: 'job', label: 'Saved jobs' },
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
    const t = String(r.item_type || 'other');
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
      url: meta.url || idUrl || '',
      subtitle: meta.university || meta.employer || idUni || '',
      subject: meta.subject || '',
      stats: (meta.stats && typeof meta.stats === 'object') ? meta.stats : null,
    };
    // Saved jobs can close: flag ones whose closing date has passed so the
    // student can clear them out. Other saved types never expire.
    if (t === 'job' && meta.closingDate) {
      const d = new Date(meta.closingDate);
      if (!Number.isNaN(d.getTime()) && d < today) item.expired = true;
    }
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(item);
  });

  const groups = [];
  FAV_CATEGORIES.forEach((c) => {
    if (byType.has(c.type)) { groups.push({ type: c.type, label: c.label, items: byType.get(c.type) }); byType.delete(c.type); }
  });
  byType.forEach((items, type) => groups.push({ type, label: 'Other', items }));
  return groups;
}

// Remove one favourite (delete that like row for this run).
export async function removeFavourite(runId, itemId, itemType) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be logged in.');
  const { error } = await supabase
    .from('result_feedback')
    .delete()
    .eq('user_id', user.id)
    .eq('assessment_run_id', runId)
    .eq('feedback_scope', 'item_reaction')
    .eq('item_type', itemType)
    .eq('item_id', itemId);
  if (error) throw error;
}
