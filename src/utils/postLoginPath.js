// Google sign-in leaves the app and comes back to /login or /signup, so the
// "where were you heading" state held in React Router is lost. Keep it in
// sessionStorage for the round trip. Also reads any OAuth error Supabase or
// Google put in the URL and cleans it off the address bar.

export const POST_LOGIN_PATH_KEY = 'cdna_post_login_path';

const SAFE_PATH = /^\/(?!\/)[^\s]*$/; // same-origin, absolute path only

export function storePostLoginPath(pathname) {
  try {
    if (pathname && SAFE_PATH.test(pathname) && !['/login', '/signup', '/reset-password', '/'].includes(pathname)) {
      window.sessionStorage.setItem(POST_LOGIN_PATH_KEY, pathname);
    } else {
      window.sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
    }
  } catch (_) { /* storage unavailable */ }
}

// Returns the stored path (and clears it) or the fallback.
export function consumePostLoginPath(fallback = '/profile') {
  try {
    const stored = window.sessionStorage.getItem(POST_LOGIN_PATH_KEY) || '';
    window.sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
    if (stored && SAFE_PATH.test(stored)) return stored;
  } catch (_) { /* storage unavailable */ }
  return fallback;
}

// Looks for error / error_description / error_code in the hash and the query
// string. If found, strips them from the URL (history.replaceState) and returns
// an Error-like object suitable for friendlyError; otherwise null.
export function readOAuthErrorFromUrl() {
  if (typeof window === 'undefined') return null;
  const search = new URLSearchParams(window.location.search || '');
  const hash = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
  const code = search.get('error') || hash.get('error') || '';
  const description = search.get('error_description') || hash.get('error_description') || '';
  const errorCode = search.get('error_code') || hash.get('error_code') || '';
  if (!code && !description && !errorCode) return null;

  ['error', 'error_description', 'error_code'].forEach((k) => { search.delete(k); hash.delete(k); });
  const qs = search.toString();
  const hs = hash.toString();
  const clean = `${window.location.pathname}${qs ? `?${qs}` : ''}${hs ? `#${hs}` : ''}`;
  try { window.history.replaceState(window.history.state, '', clean); } catch (_) { /* ignore */ }

  const message = [errorCode, code, description.replace(/\+/g, ' ')].filter(Boolean).join(': ');
  return { message: message || 'Sign-in was not completed.', code: errorCode || code };
}
