import { buildApiCandidates } from './config';
import { supabase } from './supabaseClient';

// Submits a "Report a problem" message. Auth is optional — if the user happens
// to be signed in we attach their token so the backend can record who reported
// it, but a logged-out visitor (e.g. someone who can't sign in) can still send.
export async function reportProblem({ message, pageUrl = '', assessmentRunId = '' }) {
  const text = String(message || '').trim();
  if (!text) throw new Error('Please describe the problem.');

  let accessToken = '';
  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || '';
  } catch (_) {
    accessToken = '';
  }

  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const body = JSON.stringify({
    message: text,
    pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
    assessmentRunId: assessmentRunId || undefined,
  });

  const candidates = buildApiCandidates('/api/report-problem');
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      if (res.status === 404) { lastError = new Error('Request failed: 404'); continue; }

      let data = null;
      try { data = await res.json(); } catch (_) { data = null; }

      if (!res.ok) {
        const apiError = new Error(data?.message || data?.error || `Request failed: ${res.status}`);
        apiError.status = res.status;
        throw apiError;
      }
      return data;
    } catch (error) {
      if (error?.status && error.status !== 404) throw error;
      lastError = error;
    }
  }

  throw lastError || new Error('Could not submit your report right now.');
}
