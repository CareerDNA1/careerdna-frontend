import React, { useEffect } from 'react';
import './Notice.css';

// Brief, toast-like notice fixed near the bottom of the screen. Used when an
// action that looked instant (a favourite, a reaction) could not be saved.
//
//   const [notice, setNotice] = useState('');
//   <Notice message={notice} onDismiss={() => setNotice('')} />
export default function Notice({ message, onDismiss, durationMs = 5000, tone = 'error' }) {
  useEffect(() => {
    if (!message || !onDismiss) return undefined;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;
  return (
    <div className={`cdna-notice cdna-notice--${tone}`} role="status" aria-live="polite">
      <span className="cdna-notice__text">{message}</span>
      {onDismiss ? (
        <button type="button" className="cdna-notice__close" onClick={onDismiss} aria-label="Dismiss">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 7 10 10M17 7 7 17" /></svg>
        </button>
      ) : null}
    </div>
  );
}
