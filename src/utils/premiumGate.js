// Premium feature gate.
//
// The Premium boxes (rankings, live jobs and internships, live apprenticeship
// openings) stay visible to everyone. What is gated is the action inside them.
// Any clickable element carrying data-premium-feature="<feature>" is intercepted
// by GlobalPremiumGate (App.js): premium plans pass through, everyone else gets
// the upgrade prompt instead.
//
// The current plan is kept here as a tiny module-level store so the gate works
// on every page (results, profile, favourites) without threading props.

export const PREMIUM_PLANS = new Set(['premium', 'premium_school', 'premium_university', 'dev']);

export const PREMIUM_FEATURE_ATTR = 'data-premium-feature';

export function isPremiumPlan(plan = '') {
  return PREMIUM_PLANS.has(String(plan || '').trim().toLowerCase());
}

let currentPlan = '';
let planLoaded = false;
const listeners = new Set();

export function setCurrentPlan(plan = '') {
  currentPlan = String(plan || '').trim().toLowerCase();
  planLoaded = true;
  listeners.forEach((fn) => { try { fn(currentPlan); } catch (_) { /* ignore */ } });
}

export function getCurrentPlan() {
  return currentPlan;
}

export function isPlanLoaded() {
  return planLoaded;
}

export function onPlanChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Human labels for the upgrade prompt, keyed by the data-premium-feature value.
export const PREMIUM_FEATURE_LABELS = {
  rankings: 'University rankings and course search',
  chances: 'Your chances of an offer',
  jobs: 'Live graduate jobs and internships',
  apprenticeships: 'Live apprenticeship and training openings',
};
