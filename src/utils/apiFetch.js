import { buildApiCandidates } from './config';
import { getAccessToken } from './authToken';

// One way to call the CareerDNA backend.
//
//   const data = await apiFetch('/api/further-study', { method: 'POST', body: payload });
//
// Handles, in one place: the backend base URL (with the dev fallbacks from
// config.js), the Supabase access token, JSON encoding and decoding, a timeout,
// the "dev server answered with HTML instead of JSON" trap, and turning error
// responses into an ApiError carrying status, code and the server's message.
//
// Options:
//   method      GET (default) | POST | PUT | DELETE
//   body        plain object; sent as JSON
//   auth        true (default): attach the token if signed in
//               'required': throw a sign-in error when there is no token
//               false: never attach a token
//   timeoutMs   default 20000; 0 disables
//   headers     extra headers
//   keepalive   pass through to fetch (page-unload beacons)
//   signal      caller's AbortSignal

export class ApiError extends Error {
  constructor(message, { status = 0, code = '', data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export const SIGN_IN_MESSAGE = 'Please sign in again to continue.';

// Tells the app (SessionExpiredGate in App.js) that the session is no longer
// accepted: a 401 from the backend, or a call that needed a token when none was
// available. Throttled so a burst of parallel calls raises it once.
export const AUTH_EXPIRED_EVENT = 'cdna:auth-expired';
let lastAuthExpiredAt = 0;
function notifyAuthExpired() {
  const now = Date.now();
  if (now - lastAuthExpiredAt < 10000) return;
  lastAuthExpiredAt = now;
  try { window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT)); } catch (_) { /* no window */ }
}

async function readJson(res) {
  const ctype = String(res.headers.get('content-type') || '');
  if (!/json/i.test(ctype)) return { json: null, isJson: false };
  try { return { json: await res.json(), isJson: true }; } catch (_) { return { json: null, isJson: true }; }
}

export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    timeoutMs = 20000,
    headers: extraHeaders = {},
    keepalive,
    signal: outerSignal,
  } = options;

  const headers = { Accept: 'application/json', ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    let token = '';
    try { token = await getAccessToken(); } catch (_) { token = ''; }
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (auth === 'required') {
      notifyAuthExpired();
      throw new ApiError(SIGN_IN_MESSAGE, { status: 401, code: 'NOT_SIGNED_IN' });
    }
  }

  const candidates = buildApiCandidates(path);
  let lastError = null;

  for (const url of candidates) {
    const controller = new AbortController();
    const onOuterAbort = () => controller.abort();
    if (outerSignal) {
      if (outerSignal.aborted) controller.abort();
      else outerSignal.addEventListener('abort', onOuterAbort, { once: true });
    }
    const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        ...(keepalive ? { keepalive: true } : {}),
      });

      // Not this candidate: try the next base URL.
      if (res.status === 404) {
        lastError = new ApiError('Request failed: 404', { status: 404 });
        continue;
      }

      const { json, isJson } = await readJson(res);

      // A relative path on the dev server (or a SPA host) answers 200 with the
      // app's HTML, not JSON. Treat that as "not this candidate".
      if (res.ok && !isJson) {
        lastError = new ApiError('Server returned a non JSON response.', { status: res.status });
        continue;
      }

      if (!res.ok) {
        const message = json?.message || json?.error || json?.summary || `Request failed: ${res.status}`;
        // 401 means the session is gone, except for the account-deletion
        // re-authentication checks, which are about the password, not the session.
        if (res.status === 401 && json?.code !== 'RECENT_AUTH_REQUIRED' && !/incorrect password/i.test(message)) {
          notifyAuthExpired();
        }
        throw new ApiError(message, { status: res.status, code: json?.code || json?.error || '', data: json });
      }

      return json;
    } catch (error) {
      // Real server answers (4xx/5xx) surface immediately; network failures,
      // timeouts and 404s fall through to the next candidate.
      if (error instanceof ApiError && error.status && error.status !== 404) throw error;
      if (outerSignal?.aborted) throw error;
      lastError = error?.name === 'AbortError'
        ? new ApiError('The request took too long. Please try again.', { status: 0, code: 'TIMEOUT' })
        : error;
    } finally {
      if (timer) clearTimeout(timer);
      if (outerSignal) outerSignal.removeEventListener('abort', onOuterAbort);
    }
  }

  throw lastError || new ApiError('Could not reach the server right now.', { status: 0, code: 'NETWORK' });
}

export default apiFetch;
