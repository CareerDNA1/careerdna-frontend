import { apiFetch, ApiError } from './apiFetch';

// Signed-in POST to a Stripe route. Maps apiFetch errors to the wording each
// caller used before: a sign-in prompt when there is no token, a "service was
// not found" message when every base URL answers 404, and the server's own
// message (or a numbered fallback) for other errors.
async function stripePost(path, { body, signInMessage, notFoundMessage, failPrefix }) {
  try {
    return await apiFetch(path, { method: 'POST', auth: 'required', body, timeoutMs: 30000 });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === 'NOT_SIGNED_IN') throw new Error(signInMessage);
      if (err.status === 404) throw new Error(notFoundMessage);
      if (err.status) throw new Error(err.data?.message || err.data?.error || `${failPrefix} (${err.status}).`);
    }
    throw err;
  }
}

export async function createCheckoutSession(plan) {
  const selectedPlan = String(plan || '').trim().toLowerCase();

  if (!selectedPlan) {
    throw new Error('Please choose a plan.');
  }

  const data = await stripePost('/api/stripe/create-checkout-session', {
    body: { plan: selectedPlan },
    signInMessage: 'Please sign in again before continuing to checkout.',
    notFoundMessage: 'Checkout service was not found.',
    failPrefix: 'Could not start checkout',
  });

  if (!data?.url) {
    throw new Error('Stripe checkout did not return a checkout URL.');
  }

  return data;
}


export async function createBillingPortalSession() {
  const data = await stripePost('/api/stripe/create-billing-portal-session', {
    signInMessage: 'Please sign in again before managing your plan.',
    notFoundMessage: 'Billing portal service was not found.',
    failPrefix: 'Could not open billing portal',
  });

  if (!data?.url) {
    throw new Error('Stripe billing portal did not return a URL.');
  }

  return data;
}

export async function changeSubscriptionPlan(plan) {
  const selectedPlan = String(plan || '').trim().toLowerCase();

  if (!['explore', 'premium'].includes(selectedPlan)) {
    throw new Error('Please choose either Explorer or Premium.');
  }

  return stripePost('/api/stripe/change-subscription-plan', {
    body: { plan: selectedPlan },
    signInMessage: 'Please sign in again before changing your plan.',
    notFoundMessage: 'Subscription change service was not found.',
    failPrefix: 'Could not change subscription',
  });
}

export async function cancelScheduledDowngrade() {
  return stripePost('/api/stripe/cancel-scheduled-downgrade', {
    signInMessage: 'Please sign in again before changing your plan.',
    notFoundMessage: 'Cancel downgrade service was not found.',
    failPrefix: 'Could not cancel scheduled downgrade',
  });
}

// Advisor question packs (one-off purchases on top of the plan allowance).
export async function fetchAdvisorPacks() {
  // Public list; any failure just means no packs to show.
  try {
    const data = await apiFetch('/api/stripe/advisor-packs', { auth: false, timeoutMs: 30000 });
    if (data && Array.isArray(data.packs)) return data.packs;
  } catch (_) { /* no packs */ }
  return [];
}

export async function createAdvisorPackCheckout(pack) {
  const data = await stripePost('/api/stripe/create-advisor-pack-checkout', {
    body: { pack: String(pack) },
    signInMessage: 'Please sign in again before continuing.',
    notFoundMessage: 'Checkout service was not found.',
    failPrefix: 'Could not start checkout',
  });
  if (!data?.url) throw new Error('Stripe checkout did not return a checkout URL.');
  return data;
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
  return stripePost('/api/stripe/set-cancel-at-period-end', {
    body: { cancel: Boolean(cancel) },
    signInMessage: 'Please sign in again before continuing.',
    notFoundMessage: 'Plan service was not found.',
    failPrefix: 'Could not update your plan',
  });
}
