import React, { useEffect, useRef, useState } from 'react';
import Celebration from './Celebration';
import './PlanWelcomeModal.css';

// Shown once, on return from a successful Stripe checkout. Three variants:
// a new Explorer plan, a new or upgraded Premium plan, and an advisor
// question pack. Follows the house modal frame (white card, radius 20,
// title split black / blue, tick list, pill buttons bottom right).
//
// Props
//   kind        'explore' | 'premium' | 'pack'
//   audience    'school' | 'university' (changes the Premium lines)
//   hasReport   whether the student already has a report to open
//   onPrimary   called after the primary button (open report / ask advisor / start)
//   onClose     called for "Later" and the X
export default function PlanWelcomeModal({ kind = 'explore', audience = 'school', hasReport = false, onPrimary, onClose }) {
  const [party, setParty] = useState(1);
  useEffect(() => { setParty((n) => n + 1); }, [kind]);
  // Focus the card itself on open so no button shows a focus ring until Tab is used.
  const cardRef = useRef(null);
  useEffect(() => {
    // Runs after the global focus trap's own timeout, so the card keeps focus.
    const t = setTimeout(() => cardRef.current?.focus({ preventScroll: true }), 30);
    return () => clearTimeout(t);
  }, []);

  const isUni = String(audience || '').toLowerCase() === 'university';
  const copy = kind === 'pack'
    ? {
        title: ['Your Advisor has ', 'more questions'],
        body: 'Your payment went through and the extra questions are ready to use now.',
        lines: [
          'Ask about your profile, grades, choices or applications',
          'Every answer is based on your own CareerDNA, not generic advice',
          'Your remaining questions are shown in the Advisor panel',
        ],
        primary: 'Ask your Advisor',
      }
    : kind === 'premium'
    ? {
        title: ['Welcome to CareerDNA ', 'Premium'],
        body: 'Your payment went through and everything is unlocked.',
        lines: isUni
          ? [
              '2 full reports and 20 Advisor questions a year',
              'Live graduate roles and internships matched to your profile',
              'Your applications tracked in one place',
            ]
          : [
              '2 full reports and 20 Advisor questions a year',
              'Your chances of an offer, rankings, entry requirements and live openings',
              'Your applications tracked in one place',
            ],
        primary: hasReport ? 'Open my full report' : 'Take the assessment',
      }
    : {
        title: ['Welcome to CareerDNA ', 'Explorer'],
        body: 'Your payment went through and your full profile is unlocked.',
        lines: [
          'Your full report: strengths, work environments, career worlds and pathways',
          '10 Advisor questions a year, answered from your own profile',
          'Your development tracked over time',
        ],
        primary: hasReport ? 'Open my full report' : 'Take the assessment',
      };

  return (
    <>
      <Celebration key={party} show={party > 0} pieces={60} duration={1900} />
      <div
        className="plan-welcome-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planWelcomeTitle"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <section className="plan-welcome" ref={cardRef} tabIndex={-1} onMouseDown={(e) => e.stopPropagation()}>
          <button type="button" className="plan-welcome__close" onClick={onClose} aria-label="Close">×</button>
          <h2 id="planWelcomeTitle" className="plan-welcome__title">
            {copy.title[0]}<span className="plan-welcome__accent">{copy.title[1]}</span>
          </h2>
          <p className="plan-welcome__body">{copy.body}</p>
          <ul className="plan-welcome__list">
            {copy.lines.map((line) => (
              <li key={line}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="plan-welcome__actions">
            <button type="button" className="plan-welcome__btn plan-welcome__btn--secondary" onClick={onClose}>Later</button>
            <button type="button" className="plan-welcome__btn plan-welcome__btn--primary" onClick={onPrimary}>{copy.primary}</button>
          </div>
        </section>
      </div>
    </>
  );
}
