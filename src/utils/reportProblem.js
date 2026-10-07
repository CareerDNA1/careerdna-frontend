import { apiFetch } from './apiFetch';

// Submits a "Report a problem" message. Auth is optional: if the user happens
// to be signed in, apiFetch attaches their token so the backend can record who
// reported it, but a logged-out visitor (e.g. someone who can't sign in) can
// still send.
export async function reportProblem({ message, pageUrl = '', assessmentRunId = '' }) {
  const text = String(message || '').trim();
  if (!text) throw new Error('Please describe the problem.');

  return apiFetch('/api/report-problem', {
    method: 'POST',
    body: {
      message: text,
      pageUrl: pageUrl || (typeof window !== 'undefined' ? window.location.href : ''),
      assessmentRunId: assessmentRunId || undefined,
    },
  });
}
