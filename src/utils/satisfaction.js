import { supabase } from './supabaseClient';

// Recurring "How useful is CareerDNA?" prompt.
//
// We want to see how a student's view changes as they keep coming back, so we
// ask more than once and keep EVERY answer (a time series), rather than a single
// overwrite. Everything is stored in the result_feedback table, which the client
// already writes to for reactions, so no new table or RLS policy is needed.
//
//   • Per-day visit marker  → feedback_scope 'item_reaction', item_type 'app_visit',
//                             item_id 'visit-day:YYYY-MM-DD', reaction null.
//   • Satisfaction pulse    → feedback_scope 'item_reaction', item_type
//                             'satisfaction_pulse', item_id 'pulse:visit:<n>',
//                             rating 1-3, optional comment. created_at is the
//                             timestamp of that answer.
//
// Both use reaction=null, so they are invisible to the like/dislike loaders,
// the favourites list and the admin like/dislike counts (which all require a
// like/dislike reaction). They can be queried on their own for reporting.

const VISIT_TYPE = 'app_visit';
const PULSE_TYPE = 'satisfaction_pulse';

// Visits at which we ask: the 1st and 3rd visit, then every 6th visit
// (6, 12, 18, ...). Change this to retune how often the prompt returns.
export function isPulseVisit(n) {
  if (n === 1 || n === 3) return true;
  return n >= 6 && n % 6 === 0;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Record at most one visit per calendar day and return the distinct visit-day
// count for this user. Safe to call on every profile load.
export async function recordVisitAndCount(userId, runId) {
  if (!userId) return 0;
  const day = todayKey();
  const itemId = `visit-day:${day}`;
  try {
    const { data: existing } = await supabase
      .from('result_feedback')
      .select('id')
      .eq('user_id', userId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', VISIT_TYPE)
      .eq('item_id', itemId)
      .maybeSingle();
    if (!existing?.id) {
      await supabase.from('result_feedback').insert({
        user_id: userId,
        assessment_run_id: runId || null,
        feedback_scope: 'item_reaction',
        item_type: VISIT_TYPE,
        item_id: itemId,
        item_title: null,
        reaction: null,
        rating: null,
        comment: null,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (_) {
    // Non-fatal: if the write fails we still return whatever count we can read.
  }
  try {
    const { data } = await supabase
      .from('result_feedback')
      .select('item_id')
      .eq('user_id', userId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', VISIT_TYPE);
    const days = new Set((data || []).map((r) => r.item_id));
    return days.size;
  } catch (_) {
    return 0;
  }
}

// Visit numbers the user has already answered a pulse for.
export async function getAnsweredPulseVisits(userId) {
  const answered = new Set();
  if (!userId) return answered;
  try {
    const { data } = await supabase
      .from('result_feedback')
      .select('item_id')
      .eq('user_id', userId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', PULSE_TYPE);
    (data || []).forEach((r) => {
      const m = String(r.item_id || '').match(/visit:(\d+)/);
      if (m) answered.add(Number(m[1]));
    });
  } catch (_) {
    // treat as none answered
  }
  return answered;
}

// The earliest scheduled visit at or before the current count that has not been
// answered yet, or null if nothing is due. This "catches up" a missed prompt:
// if a student blew past visit 3 without answering, they get asked at the next
// completed visit instead of losing that wave.
export function dueVisitFor(visitCount, answered) {
  for (let n = 1; n <= visitCount; n += 1) {
    if (isPulseVisit(n) && !answered.has(n)) return n;
  }
  return null;
}

// Compute the whole prompt state in one call for the profile page.
export async function getSatisfactionPrompt(userId, runId) {
  const visitCount = await recordVisitAndCount(userId, runId);
  const answered = await getAnsweredPulseVisits(userId);
  const dueVisit = dueVisitFor(visitCount, answered);
  return { visitCount, dueVisit };
}

// Save one pulse answer as a timestamped history row, keyed by the visit number
// so re-saving (e.g. adding a comment after picking a face) updates the same row
// rather than duplicating it. Also mirrors the latest rating into the single
// 'overall_usefulness' row so existing usefulness reporting keeps working.
export async function saveSatisfactionPulse(userId, runId, { visit, rating, comment }) {
  if (!userId || !visit) return;
  const now = new Date().toISOString();
  const itemId = `pulse:visit:${visit}`;

  // Upsert the timestamped pulse row.
  try {
    const { data: existing } = await supabase
      .from('result_feedback')
      .select('id')
      .eq('user_id', userId)
      .eq('feedback_scope', 'item_reaction')
      .eq('item_type', PULSE_TYPE)
      .eq('item_id', itemId)
      .maybeSingle();
    const row = {
      user_id: userId,
      assessment_run_id: runId || null,
      feedback_scope: 'item_reaction',
      item_type: PULSE_TYPE,
      item_id: itemId,
      item_title: `Visit ${visit}`,
      reaction: null,
      rating: rating || null,
      comment: comment || null,
      updated_at: now,
    };
    if (existing?.id) {
      await supabase.from('result_feedback').update(row).eq('id', existing.id);
    } else {
      await supabase.from('result_feedback').insert(row);
    }
  } catch (_) {
    // Non-fatal.
  }

  // Mirror latest rating into the single overall_usefulness row (per run) so the
  // existing admin usefulness view stays populated.
  if (runId) {
    try {
      const { data: existingOverall } = await supabase
        .from('result_feedback')
        .select('id')
        .eq('user_id', userId)
        .eq('assessment_run_id', runId)
        .eq('feedback_scope', 'overall_usefulness')
        .maybeSingle();
      const overall = {
        user_id: userId,
        assessment_run_id: runId,
        feedback_scope: 'overall_usefulness',
        item_type: null,
        item_id: null,
        item_title: null,
        reaction: null,
        rating: rating || null,
        comment: comment || null,
        updated_at: now,
      };
      if (existingOverall?.id) {
        await supabase.from('result_feedback').update(overall).eq('id', existingOverall.id);
      } else {
        await supabase.from('result_feedback').insert(overall);
      }
    } catch (_) {
      // Non-fatal.
    }
  }
}
