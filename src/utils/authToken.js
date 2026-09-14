import { supabase } from './supabaseClient';

// Shared access-token getter. The results page fires many authenticated calls at
// once (advisor per section, selection insights, further study). If each calls
// supabase.auth.getSession() independently they contend for Supabase's auth
// navigator lock and throw "Lock broken by another request" errors. Funnelling
// them through one cached, de-duplicated call avoids that entirely.
let cached = { token: '', at: 0 };
let inflight = null;
const TTL_MS = 8000;

export async function getAccessToken() {
  const now = Date.now();
  if (cached.token && now - cached.at < TTL_MS) return cached.token;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token || '';
      cached = { token, at: Date.now() };
      return token;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
