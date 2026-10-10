import React, { useEffect, useState } from 'react';
import './InlineError.css';

// Small, calm inline error with an optional "Try again" button. Pass the
// message through friendlyError() first so the wording is already user-facing.
//
//   <InlineError message={error} onRetry={reload} />
//   <InlineError message={error} compact />
export default function InlineError({ message, onRetry, compact = false, retryLabel = 'Try again', className = '' }) {
  if (!message) return null;
  return (
    <div className={`cdna-inline-error${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`} role="alert">
      <span className="cdna-inline-error__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="8.6" />
          <path d="M12 8v4.6" />
          <path d="M12 15.6h.01" />
        </svg>
      </span>
      <span className="cdna-inline-error__text">{message}</span>
      {typeof onRetry === 'function' ? (
        <button type="button" className="cdna-inline-error__retry" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

// Second line shown under a loading indicator once a slow (LLM-backed) call has
// been running for a while. Renders nothing until `afterMs` has passed.
export function StillWorkingNote({ active = true, afterMs = 8000, children, className = '', inline = false }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) { setShow(false); return undefined; }
    const t = setTimeout(() => setShow(true), afterMs);
    return () => clearTimeout(t);
  }, [active, afterMs]);
  if (!active || !show) return null;
  const text = children || 'This can take a little longer the first time. Still working.';
  // Inline: continues the loading sentence instead of starting a new paragraph.
  if (inline) {
    return <span className={`cdna-still-working cdna-still-working--inline${className ? ` ${className}` : ''}`} role="status" aria-live="polite"> {text}</span>;
  }
  return (
    <p className={`cdna-still-working${className ? ` ${className}` : ''}`} role="status" aria-live="polite">
      {text}
    </p>
  );
}
