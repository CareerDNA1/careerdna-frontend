// src/utils/applyCoupon.js
import { buildApiCandidates } from './config';
import { supabase } from './supabaseClient';

export async function applyCouponCode(code) {
  const cleanedCode = String(code || '').trim();

  if (!cleanedCode) {
    throw new Error('Please enter an access code.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (sessionError) {
    throw new Error(sessionError.message || 'Could not verify your login session.');
  }

  if (!accessToken) {
    throw new Error('Please sign in again before applying an access code.');
  }

  const candidates = buildApiCandidates('/api/apply-coupon');
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: cleanedCode }),
      });

      if (res.status === 404) {
        lastError = new Error('Coupon service was not found.');
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Could not apply access code (${res.status}).`);
      }

      return data;
    } catch (err) {
      if (err?.message && !String(err.message).includes('not found')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Could not apply access code right now.');
}
