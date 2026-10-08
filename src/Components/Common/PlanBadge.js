import React from 'react';
import './PlanBadge.css';

// Plan badge used in the profile hero, the account modal and the plan
// welcome dialog. Starter and Premium are outlined; Explorer is a blue tint.
//
//   <PlanBadge plan="explore" />          small (hero)
//   <PlanBadge plan="premium" size="lg" /> large (account modal)
function normalisePlan(plan = '') {
  const p = String(plan || '').toLowerCase();
  if (p === 'premium' || p === 'premium_school' || p === 'premium_university' || p === 'dev') return 'premium';
  if (p === 'explore' || p === 'explorer') return 'explore';
  return 'starter';
}

const LABELS = { starter: 'Starter', explore: 'Explorer', premium: 'Premium' };

function Icon({ kind }) {
  if (kind === 'premium') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 18h18l-1.5-9-4.5 4-3-7-3 7-4.5-4z" /></svg>
    );
  }
  if (kind === 'explore') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 21c0-4 3-6 7-6s7 2 7 6" /></svg>
  );
}

export default function PlanBadge({ plan = 'free', size = 'sm', className = '' }) {
  const kind = normalisePlan(plan);
  return (
    <span className={`plan-badge plan-badge--${kind} plan-badge--${size}${className ? ` ${className}` : ''}`} title={`CareerDNA ${LABELS[kind]}`}>
      <Icon kind={kind} />
      {LABELS[kind]}
    </span>
  );
}
