import React, { useEffect, useRef, useState } from 'react';
import './PlanBadge.css';

// Plan badge used in the profile hero, the account modal and the plan
// welcome dialog. Starter and Premium are outlined; Explorer is a blue tint.
//
//   <PlanBadge plan="explore" />          small (hero)
//   <PlanBadge plan="premium" size="lg" /> large (account modal)
function normalisePlan(plan = '') {
  const p = String(plan || '').toLowerCase();
  if (p === 'dev') return 'dev';
  if (p === 'premium' || p === 'premium_school' || p === 'premium_university') return 'premium';
  if (p === 'explore' || p === 'explorer') return 'explore';
  return 'starter';
}

const LABELS = { starter: 'Starter', explore: 'Explorer', premium: 'Premium', dev: 'Developer' };

function Icon({ kind }) {
  if (kind === 'dev') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></svg>
    );
  }
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

const DEV_TIP = 'Developer account: unlimited reports and advisor questions, managed by the CareerDNA team.';

export default function PlanBadge({ plan = 'free', size = 'sm', className = '' }) {
  const kind = normalisePlan(plan);
  const [tip, setTip] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const cls = `plan-badge plan-badge--${kind} plan-badge--${size}${className ? ` ${className}` : ''}`;
  if (kind === 'dev') {
    // Developer badge: tapping it explains what the account is.
    return (
      <span className="plan-badge-wrap">
        <button
          type="button"
          className={`${cls} plan-badge--button`}
          onClick={(e) => {
            e.stopPropagation();
            setTip(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setTip(false), 3500);
          }}
          aria-label="Developer account"
        >
          <Icon kind={kind} />
          {LABELS[kind]}
        </button>
        {tip ? <span className="plan-badge-tip" role="tooltip">{DEV_TIP}</span> : null}
      </span>
    );
  }
  return (
    <span className={cls} title={`CareerDNA ${LABELS[kind]}`}>
      <Icon kind={kind} />
      {LABELS[kind]}
    </span>
  );
}
