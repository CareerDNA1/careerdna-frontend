// src/utils/telemetry.js

// Generic POST helper (safe, non-blocking, logs warnings on failure)
export async function postJson(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true, // allows sending on page unload
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.warn('telemetry non-OK', res.status);
  } catch (e) {
    console.warn('telemetry failed', e);
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
