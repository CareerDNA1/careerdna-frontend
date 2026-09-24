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

export function setActiveRunId(runId) {
  activeRunId = runId ? String(runId) : null;
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

// Save / unsave (or mark "not for me") a live item. reaction is 'like' or
// 'dislike'; pass remove:true to clear it. Returns the reaction now stored
// ('like' | 'dislike' | '') so the caller can update its UI.
export async function setItemReaction({ itemType, itemId, itemTitle, itemMeta = null, reaction = 'like', remove = false }) {
  const { userId, runId } = await getContext();
  if (!userId || !runId || !itemType || !itemId) return null;

  try {
    const { data: existing } = await supabase
      .from('result_feedback')
      .select('id')
      .eq('user_id', userId)
      .eq('assessment_run_id', runId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .maybeSingle();

    if (remove) {
      if (existing?.id) await supabase.from('result_feedback').delete().eq('id', existing.id);
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

    // Write, and if the item_meta column doesn't exist yet (migration not run),
    // retry without it so saving still works and the item appears in favourites.
    const write = async (payload) => (existing?.id
      ? supabase.from('result_feedback').update(payload).eq('id', existing.id)
      : supabase.from('result_feedback').insert(payload));

    const { error } = await write(row);
    if (error) {
      const withoutMeta = { ...row };
      delete withoutMeta.item_meta;
      const retry = await write(withoutMeta);
      if (retry.error) return null;
    }
    return reaction;
  } catch (_) {
    return null;
  }
}
