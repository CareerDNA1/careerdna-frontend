// Central definition of the CareerDNA output/content version.
//
// Bump OUTPUT_VERSION whenever the report / explore outputs change in a way
// that makes previously generated results out of date. Every assessment run is
// stamped with this value on save (see saveAssessmentRun). When this number
// increases, runs saved under an older version become eligible for ONE free
// re-run, tracked per user via profiles.upgrade_claimed_version.
//
// Reverted to 1 — dormant. The plain version bump was wrong: it retroactively
// flagged EVERY existing result as stale (they were all stamped v1), including
// current ones. Staleness will instead be decided by a date cutoff (see
// runIsStale) so recent results are never flagged.
export const OUTPUT_VERSION = 1;

// Cutoff for "old" results. Anything created before this instant was generated
// by the older engine; anything from this instant on is current. Parsed in the
// viewer's local timezone (no trailing Z), so "before today" means before local
// midnight. null = feature off.
export const STALE_BEFORE_ISO = '2026-08-13T00:00:00';

// True when a saved run was generated before the STALE_BEFORE_ISO cutoff, i.e.
// with the older engine. Date-based (not version-based) so recent results are
// never falsely flagged. A run that has since been re-run (regeneratedAt on or
// after the cutoff) counts as current again. Off when STALE_BEFORE_ISO is null.
export function runIsStale(run) {
  if (!STALE_BEFORE_ISO) return false;
  const cutoff = new Date(STALE_BEFORE_ISO).getTime();

  const regen = run?.results_json?.regeneratedAt;
  if (regen && new Date(regen).getTime() >= cutoff) return false;

  const created = run?.created_at ? new Date(run.created_at).getTime() : NaN;
  if (Number.isNaN(created)) return false;
  return created < cutoff;
}

// True when a saved run predates the current output version AND the user has
// not yet claimed their free re-run for the current version.
export function runNeedsUpgrade(run, profile) {
  const runVersion = Number(run?.output_version ?? 1);
  const claimed = Number(profile?.upgrade_claimed_version ?? 0);
  return runVersion < OUTPUT_VERSION && claimed < OUTPUT_VERSION;
}
