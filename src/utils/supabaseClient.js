import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const REMEMBER_SESSION_KEY = 'cdna_remember_session';

const memoryStorage = new Map();

function safeGetStorage(kind) {
  if (typeof window === 'undefined') return null;

  try {
    const storage = kind === 'session' ? window.sessionStorage : window.localStorage;
    const testKey = '__cdna_storage_test__';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch (_) {
    return null;
  }
}

const cdnaAuthStorage = {
  getItem(key) {
    const local = safeGetStorage('local');
    const session = safeGetStorage('session');

    return local?.getItem(key) ?? session?.getItem(key) ?? memoryStorage.get(key) ?? null;
  },

  setItem(key, value) {
    const local = safeGetStorage('local');

    if (local) {
      local.setItem(key, value);
      return;
    }

    const session = safeGetStorage('session');
    if (session) {
      session.setItem(key, value);
      return;
    }

    memoryStorage.set(key, value);
  },

  removeItem(key) {
    safeGetStorage('local')?.removeItem(key);
    safeGetStorage('session')?.removeItem(key);
    memoryStorage.delete(key);
  },
};

export function setRememberSession(remember) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REMEMBER_SESSION_KEY, remember ? 'local' : 'session');
  } catch (_) {
    // Ignore storage errors; auth still falls back safely.
  }
}

export function getRememberSession() {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(REMEMBER_SESSION_KEY) !== 'session';
  } catch (_) {
    return true;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: cdnaAuthStorage,
  },
});

// getUser() asks the sign-in server every time. The profile page alone made
// about 20 of these at once, and when one failed (a blip, a slow token
// refresh) the caller got "no user" and quietly showed an empty list: empty
// favourites, "applications could not be loaded". Now:
//   - calls made at the same moment share one request,
//   - a confirmed answer is reused for a minute for the same sign-in,
//   - if the server cannot be reached, the user from the signed-in session is
//     used. A real "signed out / token rejected" answer is still passed on.
// Reading data stays safe: the database's own row rules decide what each
// signed-in user may see.
const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
let getUserInFlight = null;
let getUserCache = { token: '', at: 0, res: null };
supabase.auth.getUser = async (jwt) => {
  if (jwt) return originalGetUser(jwt);
  let session = null;
  try { ({ data: { session } } = await supabase.auth.getSession()); } catch (_) { session = null; }
  if (!session) return originalGetUser();
  const token = session.access_token || '';
  if (getUserCache.res && getUserCache.token === token && Date.now() - getUserCache.at < 60000) {
    return getUserCache.res;
  }
  if (!getUserInFlight) {
    getUserInFlight = originalGetUser().finally(() => { getUserInFlight = null; });
  }
  let res;
  try { res = await getUserInFlight; } catch (err) { res = { data: { user: null }, error: err }; }
  if (res?.data?.user) {
    getUserCache = { token, at: Date.now(), res };
    return res;
  }
  const status = Number(res?.error?.status || 0);
  const rejected = status === 401 || status === 403;
  if (!rejected && session.user) {
    return { data: { user: session.user }, error: null };
  }
  return res;
};
