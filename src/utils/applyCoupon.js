// src/utils/applyCoupon.js
import { apiFetch, ApiError } from './apiFetch';

export async function applyCouponCode(code) {
  const cleanedCode = String(code || '').trim();

  if (!cleanedCode) {
    throw new Error('Please enter an access code.');
  }

  try {
    return await apiFetch('/api/apply-coupon', {
      method: 'POST',
      auth: 'required',
      body: { code: cleanedCode },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === 'NOT_SIGNED_IN') {
        throw new Error('Please sign in again before applying an access code.');
      }
      if (err.status === 404) {
        throw new Error('Coupon service was not found.');
      }
      if (err.status) {
        throw new Error(err.data?.message || err.data?.error || `Could not apply access code (${err.status}).`);
      }
    }
    throw err;
  }
}
