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

  if (!['plus', 'premium'].includes(selectedPlan)) {
    throw new Error('Please choose either Plus or Premium.');
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
