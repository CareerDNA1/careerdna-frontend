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
