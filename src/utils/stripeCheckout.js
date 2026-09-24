import { buildApiCandidates } from './config';
import { supabase } from './supabaseClient';

export async function createCheckoutSession(plan) {
  const selectedPlan = String(plan || '').trim().toLowerCase();

  if (!selectedPlan) {
    throw new Error('Please choose a plan.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (sessionError) {
    throw new Error(sessionError.message || 'Could not verify your login session.');
  }

  if (!accessToken) {
    throw new Error('Please sign in again before continuing to checkout.');
  }

  const candidates = buildApiCandidates('/api/stripe/create-checkout-session');
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (res.status === 404) {
        lastError = new Error('Checkout service was not found.');
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Could not start checkout (${res.status}).`);
      }

      if (!data?.url) {
        throw new Error('Stripe checkout did not return a checkout URL.');
      }

      return data;
    } catch (err) {
      if (err?.message && !String(err.message).includes('not found')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Could not start checkout right now.');
}


export async function createBillingPortalSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (sessionError) {
    throw new Error(sessionError.message || 'Could not verify your login session.');
  }

  if (!accessToken) {
    throw new Error('Please sign in again before managing your plan.');
  }

  const candidates = buildApiCandidates('/api/stripe/create-billing-portal-session');
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 404) {
        lastError = new Error('Billing portal service was not found.');
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Could not open billing portal (${res.status}).`);
      }

      if (!data?.url) {
        throw new Error('Stripe billing portal did not return a URL.');
      }

      return data;
    } catch (err) {
      if (err?.message && !String(err.message).includes('not found')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Could not open billing portal right now.');
}

export async function changeSubscriptionPlan(plan) {
  const selectedPlan = String(plan || '').trim().toLowerCase();

  if (!['explore', 'premium'].includes(selectedPlan)) {
    throw new Error('Please choose either Explorer or Premium.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (sessionError) {
    throw new Error(sessionError.message || 'Could not verify your login session.');
  }

  if (!accessToken) {
    throw new Error('Please sign in again before changing your plan.');
  }

  const candidates = buildApiCandidates('/api/stripe/change-subscription-plan');
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (res.status === 404) {
        lastError = new Error('Subscription change service was not found.');
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Could not change subscription (${res.status}).`);
      }

      return data;
    } catch (err) {
      if (err?.message && !String(err.message).includes('not found')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Could not change your subscription right now.');
}

export async function cancelScheduledDowngrade() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (sessionError) {
    throw new Error(sessionError.message || 'Could not verify your login session.');
  }

  if (!accessToken) {
    throw new Error('Please sign in again before changing your plan.');
  }

  const candidates = buildApiCandidates('/api/stripe/cancel-scheduled-downgrade');
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 404) {
        lastError = new Error('Cancel downgrade service was not found.');
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || data?.error || `Could not cancel scheduled downgrade (${res.status}).`);
      }

      return data;
    } catch (err) {
      if (err?.message && !String(err.message).includes('not found')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Could not cancel the scheduled downgrade right now.');
}

// AI Advisor question packs (one-off purchases on top of the plan allowance).
async function getAccessTokenOrThrow() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message || 'Could not verify your login session.');
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('Please sign in again before continuing.');
  return accessToken;
}

export async function fetchAdvisorPacks() {
  const candidates = buildApiCandidates('/api/stripe/advisor-packs');
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      // The CRA dev server answers unknown GET paths with the app's HTML and a
      // 200, so only accept a real JSON pack list; otherwise try the next URL.
      const type = String(res.headers.get('content-type') || '');
      if (!/json/i.test(type)) continue;
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.packs)) return data.packs;
    } catch (_) { /* try next */ }
  }
  return [];
}

export async function createAdvisorPackCheckout(pack) {
  const accessToken = await getAccessTokenOrThrow();
  const candidates = buildApiCandidates('/api/stripe/create-advisor-pack-checkout');
  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ pack: String(pack) }),
      });
      if (res.status === 404) { lastError = new Error('Checkout service was not found.'); continue; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `Could not start checkout (${res.status}).`);
      if (!data?.url) throw new Error('Stripe checkout did not return a checkout URL.');
      return data;
    } catch (err) {
      if (err?.message && !String(err.message).includes('not found')) throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('Could not start checkout right now.');
}

export function formatPackPrice(pack) {
  const amount = Number(pack?.amount || 0) / 100;
  const currency = String(pack?.currency || 'gbp').toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  } catch (_) {
    return `£${amount.toFixed(2)}`;
  }
}

// Cancel the paid plan at the end of the billing year (cancel: true), or undo
// that (cancel: false). Handled in-app; no Stripe portal.
export async function setCancelAtPeriodEnd(cancel) {
  const accessToken = await getAccessTokenOrThrow();
  const candidates = buildApiCandidates('/api/stripe/set-cancel-at-period-end');
  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ cancel: Boolean(cancel) }),
      });
      if (res.status === 404) { lastError = new Error('Plan service was not found.'); continue; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || `Could not update your plan (${res.status}).`);
      return data;
    } catch (err) {
      if (err?.message && !String(err.message).includes('not found')) throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('Could not update your plan right now.');
}
