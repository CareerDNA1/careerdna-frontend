import React, { useId } from 'react';
import './AdvisorAvatar.css';

// The advisor's face: a big-eyed chibi mentor with a headset, on soft blue.
// Fills whatever box it is placed in. Eyes blink now and then and the head
// bobs gently (CSS, off for people who prefer reduced motion).
export default function AdvisorAvatar({ className = '' }) {
  const clip = `cdna-adv-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg className={`cdna-advisor-face ${className}`.trim()} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="#eaf1fe" stroke="#d6e3fb" strokeWidth="2" />
      <clipPath id={clip}><circle cx="32" cy="32" r="29" /></clipPath>
      <g clipPath={`url(#${clip})`}>
        <path d="M19 64c1-8 6-12.5 13-12.5S44 56 45 64" fill="#2f6fed" />
        <g className="cdna-advisor-face__head">
          <circle cx="32" cy="33" r="15" fill="#f7d3b0" />
          <path d="M17 31c0-10 7-16 15-16s15 6 15 16c-2-5-6-8-10-8-1 3-5 5-9 5s-7-1-9-3c-1 2-2 4-2 6z" fill="#4a3428" />
          <path d="M15.5 33a16.5 16.5 0 0 1 33 0" stroke="#2f6fed" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <rect x="12" y="29" width="6.5" height="11" rx="3.2" fill="#2f6fed" />
          <rect x="45.5" y="29" width="6.5" height="11" rx="3.2" fill="#2f6fed" />
          <path d="M48.5 39.5c0 4.5-3.5 7.5-9 7.5" stroke="#2f6fed" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="38.5" cy="47" r="2.2" fill="#2f6fed" />
          <g className="cdna-advisor-face__eye">
            <ellipse cx="26.5" cy="33" rx="3.1" ry="3.7" fill="#12233c" />
            <circle cx="27.6" cy="31.7" r="1.1" fill="#fff" />
          </g>
          <g className="cdna-advisor-face__eye">
            <ellipse cx="37.5" cy="33" rx="3.1" ry="3.7" fill="#12233c" />
            <circle cx="38.6" cy="31.7" r="1.1" fill="#fff" />
          </g>
          <ellipse cx="21.5" cy="38.5" rx="3" ry="1.9" fill="#ff9aa2" opacity="0.75" />
          <ellipse cx="42.5" cy="38.5" rx="3" ry="1.9" fill="#ff9aa2" opacity="0.75" />
          <path d="M29 39.5c1.8 2 4.2 2 6 0" stroke="#12233c" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

