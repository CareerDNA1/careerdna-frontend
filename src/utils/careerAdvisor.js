import { buildApiCandidates } from './config';
import { getAccessToken as getSharedAccessToken } from './authToken';

async function getAccessToken() {
  const accessToken = await getSharedAccessToken();
  if (!accessToken) {
    throw new Error('Please sign in again before using the CareerDNA advisor.');
  }
  return accessToken;
}

async function fetchFromCandidates(path, options = {}) {
  const candidates = buildApiCandidates(path);
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, options);

      if (res.status === 404) {
        lastError = new Error('Request failed: 404');
        continue;
      }

      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }

      if (!res.ok) {
        const apiError = new Error(data?.message || data?.error || `Request failed: ${res.status}`);
        apiError.status = res.status;
        apiError.code = data?.error || '';
        throw apiError;
      }

      return data;
    } catch (error) {
      if (error?.status && error.status !== 404) throw error;
      lastError = error;
    }
  }

  throw lastError || new Error('Could not reach the CareerDNA advisor right now.');
}

export async function loadAdvisorConversation({ assessmentRunId, conversationId = '' }) {
  if (!assessmentRunId) throw new Error('A saved CareerDNA result is required.');

  const accessToken = await getAccessToken();
  const params = new URLSearchParams({ assessmentRunId });
  if (conversationId) params.set('conversationId', conversationId);

  return fetchFromCandidates(`/api/career-advisor/conversation?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function sendAdvisorMessage({ assessmentRunId, conversationId = '', message = '', section = '' }) {
  if (!assessmentRunId) throw new Error('A saved CareerDNA result is required.');
  if (!String(message || '').trim()) throw new Error('Please enter a message.');

  const accessToken = await getAccessToken();

  return fetchFromCandidates('/api/career-advisor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      assessmentRunId,
      conversationId: conversationId || undefined,
      message: String(message || '').trim(),
      section: section || undefined,
    }),
  });
}
