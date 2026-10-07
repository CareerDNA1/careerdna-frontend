// src/utils/telemetry.js
import { apiFetch } from './apiFetch';

// Generic POST helper (safe, non-blocking, logs warnings on failure).
// `path` is a backend path such as '/api/cdna/complete'; apiFetch resolves the
// base URL. No token is sent and keepalive lets it go out on page unload.
export async function postJson(path, payload) {
  try {
    await apiFetch(path, { method: 'POST', body: payload, auth: false, keepalive: true });
  } catch (e) {
    if (e?.status) console.warn('telemetry non-OK', e.status);
    else console.warn('telemetry failed', e);
  }
}

// Strip first name for analytics by default
export function redactIntro(intro) {
  if (!intro || typeof intro !== 'object') return {};
  const { name, ...rest } = intro;
  return rest;
}

/**
 * Fire when the user completes the survey (arrives at results).
 * @param {object} data
 *  {
 *    nonce,               // string
 *    introResponses,      // object (will be redacted)
 *    answers,             // object (all answers)
 *    finishedAt,          // ISO string
 *  }
 */
export async function sendSurveyComplete(data) {
  // Point this to your backend route
  return postJson('/api/cdna/complete', {
    ...data,
    intro: redactIntro(data.introResponses),
  });
}

/**
 * Optional: call on intro changes (lightweight heartbeat)
 * @param {object} data { nonce, introResponses, updatedAt }
 */
export async function sendIntroHeartbeat(data) {
  return postJson('/api/cdna/intro-heartbeat', {
    nonce: data.nonce,
    intro: redactIntro(data.introResponses),
    updatedAt: data.updatedAt || new Date().toISOString(),
  });
}
