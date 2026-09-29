import React, { useEffect, useRef, useState } from 'react';
import { CaretDown, Check } from 'phosphor-react';
import './PickMenu.css';

// Status picker in the app's own menu style (same panel as the three dots
// menu on the reports list), not the browser's native dropdown.
export default function PickMenu({ options, value, triggerClass, disabled, onSelect, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  // The popup scrolls, so an absolutely positioned menu would be clipped by
  // it. Float the menu at fixed viewport coordinates under the pill instead,
  // flipping above it when there is no room below.
  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = options.length * 36 + 10;
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    // Prefer below; go above only when below is short and above has more room.
    const top = (below >= menuH + 8 || below >= above) ? r.bottom + 6 : Math.max(8, r.top - menuH - 6);
    setPos({ top, left: r.left });
  };
  useEffect(() => {
    if (!open) return undefined;
    place();
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    const onMove = () => place();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onMove);
    document.addEventListener('scroll', onMove, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', onMove);
      document.removeEventListener('scroll', onMove, true);
    };
  }, [open]);
  return (
    <div className="apps-menu-wrap" ref={wrapRef}>
      <button type="button" className={triggerClass} disabled={disabled} aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}>
        <span className="apps-pick-label">{(options.find((o) => o.value === value) || {}).label || value}</span>
        <CaretDown size={12} weight="bold" aria-hidden="true" />
      </button>
      {open && pos ? (
        <div className="profile-run-menu apps-menu" role="menu" style={{ position: 'fixed', top: pos.top, left: pos.left, right: 'auto', bottom: 'auto', width: 'max-content' }}>
          {options.map((s) => (
            <button type="button" role="menuitemradio" aria-checked={s.value === value} key={s.value}
              className={`profile-run-menu-item${s.value === value ? ' is-current' : ''}`}
              onClick={() => { setOpen(false); onSelect(s.value); }}>
              <span className="apps-menu-check" aria-hidden="true">{s.value === value ? <Check size={14} weight="bold" /> : null}</span>
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

