import React from 'react';
import { gradeBand, studentTop3Tariff } from '../../utils/matchBand';
import '../Rankings/RankingsModal.css'; // rk-band colours, shared with the rankings table
import './ChancesPill.css';

// How a student's predicted A-levels compare with a course's typical offer.
// Same bands and colours as the "Your chances" column in the rankings table,
// so a course reads the same wherever it appears (rankings, favourites, UCAS).
const TIP = {
  safe: 'Your predicted grades are comfortably above the typical offer.',
  match: 'Your predicted grades are about the same as the typical offer.',
  reach: 'You would need to improve on your predicted grades to get a place.',
  longshot: 'You would need to improve significantly on your predicted grades to get a place.',
};

export function chancesFor(predicted, typicalGrades) {
  return gradeBand(studentTop3Tariff(predicted), typicalGrades);
}

// Same bands for an offer's conditions, which may be grades ("ABB") or a
// points figure ("120 UCAS points"). Null when there is nothing to compare.
export function chancesForConditions(predicted, conditions) {
  const text = String(conditions || '').trim();
  if (!text) return null;
  const points = text.match(/(\d{2,3})\s*(?:ucas\s*)?(?:points|pts|tariff)/i);
  const mine = studentTop3Tariff(predicted);
  if (points) {
    const need = Number(points[1]);
    if (!mine || !need) return null;
    const diff = mine - need;
    if (diff >= 8) return { key: 'safe', label: 'Safe' };
    if (diff >= -8) return { key: 'match', label: 'Match' };
    if (diff >= -24) return { key: 'reach', label: 'Stretch' };
    return { key: 'longshot', label: 'Ambitious' };
  }
  return gradeBand(mine, text);
}

// `band` lets a caller pass a precomputed band (e.g. from offer conditions);
// otherwise it is worked out from the typical offer. `what` names what is
// being compared in the explanation.
export default function ChancesPill({ predicted = [], typicalGrades, band = null, what = 'Typical offer', size = 'sm', className = '', onTap }) {
  const b = band || chancesFor(predicted, typicalGrades);
  if (!b) return null;
  const tip = `${TIP[b.key]} ${what} ${typicalGrades}.`;
  return (
    <span
      className={`rk-band rk-band--${b.key} chances-pill chances-pill--${size} ${className}`.trim()}
      data-tip={tip}
      tabIndex={0}
      role={onTap ? 'button' : undefined}
      aria-label={`Your chances: ${b.label}`}
      onClick={onTap ? (e) => { e.stopPropagation(); onTap(tip); } : undefined}
      onKeyDown={onTap ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTap(tip); } } : undefined}
    >
      {b.label}
    </span>
  );
}

// Plain-text explanation, for surfaces that show it inline (touch screens
// have no hover, so the tooltip alone is not enough).
export function chancesExplanation(bandKey, typicalGrades, what = 'Typical offer') {
  return bandKey && TIP[bandKey] ? `${TIP[bandKey]} ${what} ${typicalGrades}.` : '';
}
