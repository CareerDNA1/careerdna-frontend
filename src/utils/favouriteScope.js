import { supabase } from './supabaseClient';
import { stageFromAnswers } from './academicStatus';

// ---------------------------------------------------------------------------
// One favourites list per stage, not per report.
//
// Likes and dislikes ("item reactions") are still stored in result_feedback
// against the report they were made on, but every report of the same stage
// (school, or university) reads and writes ONE shared list:
//   - reads take the reactions from all reports of that stage, newest wins;
//   - a like, dislike or removal on any report clears that item's rows on the
//     other reports of the stage, so the list never holds two answers for the
//     same item and a removal can never come back from an older report.
// A move between school and university starts the other stage's list, which
// is kept for if the student ever goes back.
// ---------------------------------------------------------------------------

const TTL_MS = 30000;
const cache = new Map(); // userId -> { at, runs: [{ id, stage }] }

export function invalidateStageRuns() { cache.clear(); }

async function loadRuns(userId) {
  const { data, error } = await supabase
    .from('assessment_runs')
    .select('id, status:intro_answers_json->>status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  const runs = (data || []).map((r) => ({ id: r.id, stage: stageFromAnswers({ status: r.status }) }));
  cache.set(userId, { at: Date.now(), runs });
  return runs;
}

// Ids of every report of the same stage as runId (always including runId).
// Falls back to just [runId] when the stage is unknown or the lookup fails.
export async function stageRunIds(userId, runId) {
  if (!runId) return [];
  if (!userId) return [runId];
  try {
    const hit = cache.get(userId);
    let runs = hit && Date.now() - hit.at < TTL_MS ? hit.runs : await loadRuns(userId);
    let me = runs.find((r) => r.id === runId);
    if (!me) { runs = await loadRuns(userId); me = runs.find((r) => r.id === runId); }
    if (!me || !me.stage) return [runId];
    const ids = runs.filter((r) => r.stage === me.stage).map((r) => r.id);
    return ids.includes(runId) ? ids : [runId, ...ids];
  } catch (_) {
    return [runId];
  }
}

const stamp = (r) => Date.parse(r?.updated_at || r?.created_at || '') || 0;

// One row per item (type + id), the most recently saved one.
export function newestPerItem(rows, keyOf = (r) => `${r.item_type}|${r.item_id}`) {
  const sorted = [...(rows || [])].sort((a, b) => stamp(b) - stamp(a));
  const seen = new Set();
  return sorted.filter((r) => {
    const k = keyOf(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Delete this item's reaction rows on every report of the stage, except keepId.
export async function clearItemAcrossStage({ userId, runIds, itemTypes, itemIds, keepId = null }) {
  const types = Array.from(new Set((itemTypes || []).filter(Boolean)));
  const ids = Array.from(new Set((itemIds || []).filter(Boolean)));
  if (!userId || !runIds?.length || !types.length || !ids.length) return;
  let q = supabase
    .from('result_feedback')
    .delete()
    .eq('user_id', userId)
    .in('assessment_run_id', runIds)
    .eq('feedback_scope', 'item_reaction')
    .in('item_type', types)
    .in('item_id', ids);
  if (keepId) q = q.neq('id', keepId);
  const { error } = await q;
  if (error) throw error;
}
