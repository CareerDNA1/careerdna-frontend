// Turns raw/technical errors into calm, user-facing messages so a provider
// outage (e.g. Supabase down) or a network blip never shows as "Failed to
// fetch" / "Invalid or expired session" / a stack trace. Returns { message,
// kind } where kind is 'network' | 'auth' | 'server' | 'ratelimit' | 'user'.
const PASSWORD_RULE_TEXT =
  'Please make your password stronger. Use at least 8 characters, including uppercase and lowercase letters, a number and a symbol.';

// Supabase Auth messages that users see verbatim otherwise. Checked first, in
// order, against the lowercased message.
const AUTH_MESSAGES = [
  { test: (m) => m.includes('user already registered') || m.includes('already been registered') || m.includes('email address is already'),
    kind: 'user', message: 'An account with this email already exists. Log in or use Forgot your password.' },
  { test: (m) => m.includes('password should be at least') || m.includes('password should contain') || m.includes('weak password') || m.includes('password is too'),
    kind: 'user', message: PASSWORD_RULE_TEXT },
  { test: (m) => m.includes('invalid login credentials') || m.includes('invalid credentials'),
    kind: 'user', message: 'That email and password do not match.' },
  { test: (m) => m.includes('email not confirmed'),
    kind: 'user', message: 'Please confirm your email before logging in. Check your inbox (and spam folder) for the confirmation link.' },
  { test: (m) => m.includes('email rate limit') || m.includes('over_email_send_rate_limit') || m.includes('too many requests') || m.includes('for security purposes, you can only request') || /rate limit/.test(m),
    kind: 'ratelimit', message: 'Too many attempts. Wait a minute and try again.' },
  { test: (m) => m.includes('invalid email') || m.includes('unable to validate email'),
    kind: 'user', message: 'That does not look like a valid email address. Check it and try again.' },
  { test: (m) => m.includes('access_denied') || m.includes('access denied') || m.includes('user cancelled') || m.includes('user canceled'),
    kind: 'user', message: 'Google sign-in was cancelled. You can try again when you are ready.' },
  { test: (m) => m.includes('otp_expired') || m.includes('link is invalid or has expired') || m.includes('email link is invalid'),
    kind: 'user', message: 'That link has expired or has already been used. Request a new one and try again.' },
  { test: (m) => m.includes('signups not allowed') || m.includes('signup is disabled'),
    kind: 'user', message: 'New accounts cannot be created right now. Please try again later.' },
];

export function friendlyError(err, context = '') {
  const raw = String(err?.message || err || '').toLowerCase();
  const status = err?.status || err?.code;

  for (const rule of AUTH_MESSAGES) {
    if (rule.test(raw)) return { kind: rule.kind, message: rule.message };
  }

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
      message: "We're having trouble reaching CareerDNA right now. This is usually brief. Please try again in a moment.",
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
