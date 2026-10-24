import { supabase } from './supabaseClient';

// Saving live items (a university course, a job advert) to favourites.
//
// These are stored in result_feedback exactly like the other reactions
// (feedback_scope 'item_reaction', reaction 'like' = saved / 'dislike' = not for
// me), but they also carry a small snapshot in the item_meta JSONB column: a
// course's link, or a job's employer/location/URL and its closing date. The
// snapshot is what lets the profile favourites show a saved job as "Closed" once
// its closing date passes, and open the original link.
//
// Requires the one-off migration adding result_feedback.item_meta (jsonb).
//
// Components that use this (RankingsModal, JobCard) are mounted deep inside the
// results page and do not receive the run id as a prop. The results page
// registers the report it is showing with setActiveRunId(), so a saved job or
// course lands on THAT report, the same run the other reactions and the profile
// favourites read from. Outside a report we fall back to the profile's current
// report, then the newest run.

let activeRunId = null;
let runCache = { id: null, at: 0 };

if (typeof window !== 'undefined') {
  window.addEventListener('cdna:signed-out', () => { activeRunId = null; runCache = { id: null, at: 0 }; });
}

export function setActiveRunId(runId) {
  activeRunId = runId ? String(runId) : null;
}
export function getActiveRunId() {
  return activeRunId;
}

// Forget the cached "current report" (called when the student pins a
// different report), so the next save goes to the right one straight away.
export function clearRunCache() {
  runCache = { id: null, at: 0 };
}

async function getContext() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { userId: null, runId: null };
  if (activeRunId) return { userId: user.id, runId: activeRunId };
  if (runCache.id && Date.now() - runCache.at < 60000) {
    return { userId: user.id, runId: runCache.id };
  }
  let id = null;
  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('current_run_id')
      .eq('id', user.id)
      .maybeSingle();
    id = prof?.current_run_id || null;
  } catch (_) { id = null; }
  if (!id) {
    const { data } = await supabase
      .from('assessment_runs')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    id = data?.id || null;
  }
  runCache = { id, at: Date.now() };
  return { userId: user.id, runId: runCache.id };
}

// The ids of items of one type the student has SAVED (liked) on their latest run,
// so a card can render its saved state. Returns a Set of item_id strings.
export async function getSavedIds(itemType) {
  const { userId, runId } = await getContext();
  if (!userId || !runId || !itemType) return new Set();
  try {
    const { data } = await supabase
      .from('result_feedback')
      .select('item_id')
      .eq('user_id', userId)
      .eq('assessment_run_id', runId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', itemType)
      .eq('reaction', 'like');
    return new Set((data || []).map((r) => r.item_id).filter(Boolean));
  } catch (_) {
    return new Set();
  }
}

// Both reactions for one item type on the active run: Map item_id -> 'like' | 'dislike'.
export async function getReactions(itemType) {
  const { userId, runId } = await getContext();
  if (!userId || !runId || !itemType) return new Map();
  try {
    const { data } = await supabase
      .from('result_feedback')
      .select('item_id, reaction')
      .eq('user_id', userId)
      .eq('assessment_run_id', runId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', itemType)
      .in('reaction', ['like', 'dislike']);
    const out = new Map();
    (data || []).forEach((r) => { if (r.item_id && r.reaction) out.set(r.item_id, r.reaction); });
    return out;
  } catch (_) {
    return new Map();
  }
}

// Save / unsave (or mark "not for me") a live item. reaction is 'like' or
// 'dislike'; pass remove:true to clear it. Returns the reaction now stored
// ('like' | 'dislike' | '') so the caller can update its UI.
// Anything showing favourites (the profile cards, for one) can listen for this
// and reload, so a save made inside a popup shows up without a page refresh.
export const FAVOURITES_CHANGED_EVENT = 'cdna:favourites-changed';
export function notifyFavouritesChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(FAVOURITES_CHANGED_EVENT));
}

// Announced when a save from a popup did not reach the database, so the page
// underneath (results or profile) can show its "could not save" notice.
export const SAVE_FAILED_EVENT = 'cdna:save-failed';
export const SAVE_FAILED_TEXT = 'Could not save that. Check your connection and try again.';
export function notifySaveFailed() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(SAVE_FAILED_EVENT));
}

// Writes for the same item are queued, so a double tap cannot insert twice.
const writeQueue = new Map();

export async function setItemReaction(args) {
  const key = `${args?.itemType}|${args?.itemId}`;
  const previous = writeQueue.get(key) || Promise.resolve();
  const run = previous.catch(() => {}).then(() => setItemReactionNow(args));
  writeQueue.set(key, run);
  try {
    return await run;
  } finally {
    if (writeQueue.get(key) === run) writeQueue.delete(key);
  }
}

// Throws when the save did not reach the database, so the caller can put its
// UI back and tell the student. Returns the reaction now stored ('like',
// 'dislike' or '') otherwise. Returns null only when there is nothing to save
// against (not signed in, no report yet).
async function setItemReactionNow({ itemType, itemId, itemTitle, itemMeta = null, reaction = 'like', remove = false }) {
  const { userId, runId } = await getContext();
  if (!userId || !runId || !itemType || !itemId) return null;

  const findExisting = async () => {
    const { data, error } = await supabase
      .from('result_feedback')
      .select('id')
      .eq('user_id', userId)
      .eq('assessment_run_id', runId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  const existing = await findExisting();

  if (remove) {
    if (existing?.id) {
      const { error } = await supabase.from('result_feedback').delete().eq('id', existing.id);
      if (error) throw error;
    }
    notifyFavouritesChanged();
    return '';
  }

  const row = {
    user_id: userId,
    assessment_run_id: runId,
    feedback_scope: 'item_reaction',
    item_type: itemType,
    item_id: itemId,
    item_title: itemTitle || '',
    item_meta: itemMeta || null,
    reaction,
    updated_at: new Date().toISOString(),
  };

  const write = async (payload, id) => (id
    ? supabase.from('result_feedback').update(payload).eq('id', id)
    : supabase.from('result_feedback').insert(payload));

  let { error } = await write(row, existing?.id);
  if (error && error.code === '23505' && !existing?.id) {
    // Row appeared between read and insert (another tab): update it instead.
    const again = await findExisting();
    if (again?.id) ({ error } = await write(row, again.id));
  }
  if (error && error.code !== '23505') {
    // item_meta column missing (migration not run): retry without it.
    const withoutMeta = { ...row };
    delete withoutMeta.item_meta;
    ({ error } = await write(withoutMeta, existing?.id));
  }
  if (error) throw error;
  notifyFavouritesChanged();
  return reaction;
}
