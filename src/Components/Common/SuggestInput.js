import React, { useEffect, useRef, useState } from 'react';
import './SuggestInput.css';

// Text input with app-style suggestions (replaces the browser's native
// datalist dropdown). Free text is still allowed; the list just speeds up
// picking a known subject. Suggestions float at fixed coordinates so a
// scrolling modal cannot clip them.
export default function SuggestInput({ value, onChange, options = [], placeholder, className = '', maxItems = 8, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);

  const q = String(value || '').trim().toLowerCase();
  const matches = (q
    ? [...options.filter((o) => o.toLowerCase().startsWith(q)), ...options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q))]
    : options
  ).filter((o) => o.toLowerCase() !== q).slice(0, maxItems);

  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const h = Math.min(matches.length, maxItems) * 36 + 10;
    const below = window.innerHeight - r.bottom;
    const top = (below >= h + 8 || below >= r.top) ? r.bottom + 4 : Math.max(8, r.top - h - 4);
    setPos({ top, left: r.left, width: r.width });
  };
  useEffect(() => {
    if (!open) return undefined;
    place();
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onMove = () => place();
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', onMove);
    document.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', onMove);
      document.removeEventListener('scroll', onMove, true);
    };
  }); // re-place on every render while open: the list height follows the matches

  const pick = (o) => { onChange(o); setOpen(false); setActive(-1); };

  return (
    <div className={`sug ${className}`.trim()} ref={wrapRef}>
      <input
        type="text"
        className="sug-input"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !matches.length) { if (e.key === 'ArrowDown') setOpen(true); return; }
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(matches.length - 1, a + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(matches[active]); }
          else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
        }}
      />
      {open && pos && matches.length ? (
        <div className="sug-menu" role="listbox" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {matches.map((o, i) => (
            <button type="button" role="option" aria-selected={i === active} key={o}
              className={`sug-item${i === active ? ' is-active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}>
              {o}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
