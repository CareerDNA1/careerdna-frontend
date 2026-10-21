import { supabase } from './supabaseClient';

// Favourites follow the student, not the run.
//
// Likes and dislikes (worlds, pathways, roles, degrees, training routes, saved
// courses and job adverts) are stored in result_feedback against the
// assessment run they were made on. A re-run (new subject of interest, new
// output parameters) or a fresh sitting creates a new run id, which used to
// leave every favourite behind on the old run. Scores and the report belong
// to a run; a favourite is the student's own choice and still holds, so it is
// copied forward to the new run here. Band pills on the new results show how
// the match changed; the student can unlike anything that no longer fits.
//
// Only rows with a like or dislike are copied. The satisfaction pulse, visit
// markers and other reaction-less rows stay with the run they were made on.
// Anything the student has already reacted to on the new run is left alone,
// so running this twice, or after the student has started liking things on
// the new run, never duplicates or overwrites a reaction.
export async function carryOverFavourites({ fromRunId, toRunId } = {}) {
  if (!fromRunId || !toRunId || fromRunId === toRunId) return { copied: 0 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { copied: 0 };

  const { data, error } = await supabase
    .from('result_feedback')
    .select('item_type, item_id, item_title, reaction, item_meta, created_at')
    .eq('user_id', user.id)
    .eq('assessment_run_id', fromRunId)
    .eq('feedback_scope', 'item_reaction')
    .in('reaction', ['like', 'dislike']);
  if (error) throw error;

  const { data: already, error: alreadyError } = await supabase
    .from('result_feedback')
    .select('item_type, item_id')
    .eq('user_id', user.id)
    .eq('assessment_run_id', toRunId)
    .eq('feedback_scope', 'item_reaction');
  if (alreadyError) throw alreadyError;
  const taken = new Set((already || []).map((r) => `${r.item_type}\u0000${r.item_id}`));

  const rows = (data || [])
    .filter((r) => r.item_type && r.item_id && !taken.has(`${r.item_type}\u0000${r.item_id}`))
    .map((r) => ({
      user_id: user.id,
      assessment_run_id: toRunId,
      feedback_scope: 'item_reaction',
      item_type: r.item_type,
      item_id: r.item_id,
      item_title: r.item_title,
      reaction: r.reaction,
      item_meta: r.item_meta || null,
      // Keep the original time so the favourite still reads as "liked on
      // <date>" rather than looking brand new on every re-run.
      created_at: r.created_at,
      updated_at: new Date().toISOString(),
    }));
  if (!rows.length) return { copied: 0 };

  const { error: insertError } = await supabase.from('result_feedback').insert(rows);
  if (insertError) throw insertError;
  return { copied: rows.length };
}
