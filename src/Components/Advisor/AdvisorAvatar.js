import React from 'react';
import './AdvisorAvatar.css';

// The advisor's face: a teal speech bubble with two eyes and a smile, on a
// white circle. Fills whatever box it is placed in. The eyes blink now and
// then (CSS, off for people who prefer reduced motion).
// The same bubble as a line icon in the current text colour, for coloured
// icon boxes (the profile stat tile) that use outline icons.
export function AdvisorGlyph({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-4.5 3.5V18H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="10" r="1.3" fill="currentColor" />
      <circle cx="15" cy="10" r="1.3" fill="currentColor" />
      <path d="M9.5 13.2c1.4 1.1 3.6 1.1 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function AdvisorAvatar({ className = '' }) {
  return (
    <svg className={`cdna-advisor-face ${className}`.trim()} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="31" fill="#fff" stroke="#cdeee5" strokeWidth="2" />
      <g transform="translate(12 12.5) scale(1.6667)">
        <path d="M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-4.5 3.5V18H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#0f9d8a" />
        <circle className="cdna-advisor-face__eye" cx="9" cy="10.5" r="1.4" fill="#fff" />
        <circle className="cdna-advisor-face__eye" cx="15" cy="10.5" r="1.4" fill="#fff" />
        <path d="M9.5 13.6c1.4 1.1 3.6 1.1 5 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
