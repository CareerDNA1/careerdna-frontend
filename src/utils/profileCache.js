// Pages that create or change assessment runs (results, deletion) call this so
// the next profile visit skips its in-memory cache instead of flashing stale
// counts for a moment.
const KEY = 'cdna_profile_dirty';

export function markProfileStale() {
  try { sessionStorage.setItem(KEY, '1'); } catch (_) { /* ignore */ }
}

export function takeProfileStale() {
  try {
    const dirty = sessionStorage.getItem(KEY) === '1';
    sessionStorage.removeItem(KEY);
    return dirty;
  } catch (_) {
    return false;
  }
}
