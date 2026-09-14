// Turns raw/technical errors into calm, user-facing messages so a provider
// outage (e.g. Supabase down) or a network blip never shows as "Failed to
// fetch" / "Invalid or expired session" / a stack trace. Returns { message,
// kind } where kind is 'network' | 'auth' | 'server' | 'ratelimit' | 'user'.
export function friendlyError(err, context = '') {
  const raw = String(err?.message || err || '').toLowerCase();
  const status = err?.status || err?.code;

  // Network / provider unreachable (fetch failed, timeouts, 502/503/504).
  if (
    raw.includes('failed to fetch') ||
    raw.includes('networkerror') ||
    raw.includes('network request failed') ||
    raw.includes('load failed') ||
    raw.includes('timeout') || raw.includes('timed out') ||
    err?.name === 'AbortError' ||
    status === 502 || status === 503 || status === 504
  ) {
    return {
      kind: 'network',
      message: "We're having trouble reaching CareerDNA right now. This is usually a brief hiccup — please try again in a moment.",
    };
  }

  // Session expired / auth.
  if (status === 401 || raw.includes('invalid or expired session') ||
      raw.includes('sign in') || raw.includes('log in') || raw.includes('authorization')) {
    return {
      kind: 'auth',
      message: 'Your session has timed out. Please log in again to continue.',
    };
  }

  // Rate / credit limits (keep any specific server message if present).
  if (status === 429 || raw.includes('limit reached') || raw.includes('rate limit')) {
    return {
      kind: 'ratelimit',
      message: err?.message || "You've reached the limit for now. Please try again later.",
    };
  }

  // Server error.
  if (status >= 500) {
    return {
      kind: 'server',
      message: 'This service is temporarily unavailable. Please try again shortly.',
    };
  }

  // Otherwise show the real (usually validation) message, or a safe default.
  return {
    kind: 'user',
    message: err?.message && !raw.includes('fetch') ? err.message
      : `We couldn't ${context || 'complete that'} just now. Please try again.`,
  };
}
