import { apiFetch, ApiError } from './apiFetch';

const SIGN_IN_MESSAGE = 'Please sign in again before using the CareerDNA advisor.';

// Advisor calls need a signed-in user. apiFetch throws NOT_SIGNED_IN when there
// is no token; map that to the advisor's own wording. Server errors keep their
// .status and .code (e.g. ADVISOR_LIMIT_REACHED), and the entitlement from the
// error body is attached so the chat can update its allowance.
async function advisorFetch(path, options = {}) {
  try {
    return await apiFetch(path, { ...options, auth: 'required' });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === 'NOT_SIGNED_IN') throw new Error(SIGN_IN_MESSAGE);
      if (error.data?.entitlement && error.entitlement === undefined) error.entitlement = error.data.entitlement;
    }
    throw error;
  }
}

export async function loadAdvisorConversation({ assessmentRunId, conversationId = '' }) {
  if (!assessmentRunId) throw new Error('A saved CareerDNA result is required.');

  const params = new URLSearchParams({ assessmentRunId });
  if (conversationId) params.set('conversationId', conversationId);

  return advisorFetch(`/api/career-advisor/conversation?${params.toString()}`);
}

export async function sendAdvisorMessage({ assessmentRunId, conversationId = '', message = '', section = '' }) {
  if (!assessmentRunId) throw new Error('A saved CareerDNA result is required.');
  if (!String(message || '').trim()) throw new Error('Please enter a message.');

  // The model reply can take a while; allow well beyond the default timeout.
  return advisorFetch('/api/career-advisor', {
    method: 'POST',
    timeoutMs: 120000,
    body: {
      assessmentRunId,
      conversationId: conversationId || undefined,
      message: String(message || '').trim(),
      section: section || undefined,
    },
  });
}
