import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CaretDown, Check, MagnifyingGlass, X } from 'phosphor-react';
import './PickMenu.css';
import { lockPageScroll, unlockPageScroll } from '../../utils/scrollLock';

// Picker in the app's own menu style (same panel as the three dots menu on the
// reports list), never the browser's native dropdown.
//
// Desktop: a floating panel under the trigger (flips above when there is no
// room), capped in height and scrollable for long lists, with an optional
// search box. Phones: a bottom sheet over the page, which stays put when the
// keyboard opens and cannot be clipped by a scrolling modal.
//
// options: [{ value, label, hint?, disabled? }]
const PHONE = '(max-width: 560px)';
const ROW = 36;
const MAX_PANEL = 320;

export default function PickMenu({
  options, value, triggerClass, disabled, onSelect, ariaLabel,
  title, searchable = false, searchPlaceholder = 'Search', placeholder,
  // Optional rich rendering: renderOption(o) for each row, renderTrigger(current)
  // for the closed control. Both fall back to the plain label.
  renderOption = null, renderTrigger = null,
  // sheetOnPhone=false keeps the floating panel under the field on phones too.
  sheetOnPhone = true,
  // Bring the current option into view when the list opens (long lists).
  scrollToCurrent = false,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const isPhone = () => sheetOnPhone && window.matchMedia(PHONE).matches;
  const [sheet, setSheet] = useState(false);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    const starts = options.filter((o) => String(o.label).toLowerCase().startsWith(s));
    const contains = options.filter((o) => !starts.includes(o) && String(o.label).toLowerCase().includes(s));
    return [...starts, ...contains];
  }, [options, q]);

  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = Math.min(MAX_PANEL, shown.length * ROW + (searchable ? 54 : 10));
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    const goBelow = below >= menuH + 8 || below >= above;
    const top = goBelow ? r.bottom + 6 : Math.max(8, r.top - menuH - 6);
    // The panel never runs off the screen: cap its height to the room on the
    // side it opens, so the last option is always reachable by scrolling inside.
    const maxH = Math.max(140, goBelow ? window.innerHeight - top - 12 : r.top - 6 - 8);
    // Keep the panel inside the viewport horizontally.
    const width = panelRef.current ? panelRef.current.offsetWidth : 0;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    setPos({ top, left, maxH });
  };

  const close = () => { setOpen(false); setQ(''); setActive(-1); };
  const choose = (o) => { if (o.disabled) return; close(); onSelect(o.value); };

  useEffect(() => {
    if (!open) return undefined;
    setSheet(isPhone());
    if (!isPhone()) place();
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && panelRef.current && !panelRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      else if (e.key === 'Enter' && active >= 0 && shown[active]) { e.preventDefault(); choose(shown[active]); }
    };
    // Reposition when the page moves, but not when the list itself scrolls
    // (that was re-placing the panel on every flick and jumping the list).
    const onMove = (e) => {
      if (e && e.type === 'scroll' && panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) return;
      if (!isPhone()) place();
    };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shown, active]);

  // Focus the search box once the panel or sheet is actually on screen.
  useEffect(() => {
    if (open && searchable && (sheet || pos) && searchRef.current) searchRef.current.focus({ preventScroll: true });
  }, [open, searchable, sheet, pos]);


  // Once per open: bring the current option into view.
  const scrolledRef = useRef(false);
  useEffect(() => {
    if (!open) { scrolledRef.current = false; return; }
    if (!scrollToCurrent || scrolledRef.current || !panelRef.current) return;
    if (!sheet && !pos) return; // panel not placed yet
    const el = panelRef.current.querySelector('[role="menuitemradio"].is-current');
    if (el) { el.scrollIntoView({ block: 'center' }); scrolledRef.current = true; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sheet, pos]);

  // Phones, panel mode: the page must not scroll under an open menu. The panel
  // is fixed to the viewport, so a page scroll would drag the field away from
  // it; choose something or close the menu first.
  useEffect(() => {
    if (!open || sheet || !window.matchMedia(PHONE).matches) return undefined;
    lockPageScroll();
    return () => unlockPageScroll();
  }, [open, sheet]);

  useEffect(() => {
    if (open && active >= 0 && panelRef.current) {
      const el = panelRef.current.querySelectorAll('[role="menuitemradio"]')[active];
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [active, open]);

  const current = options.find((o) => o.value === value);
  const empty = value === '' || value == null;
  const label = empty && placeholder ? placeholder : (current ? current.label : (value || ''));

  const list = (
    <>
      {searchable ? (
        <div className="pick-search">
          <MagnifyingGlass size={14} weight="bold" aria-hidden="true" />
          <input ref={searchRef} type="text" value={q} placeholder={searchPlaceholder} aria-label={searchPlaceholder}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
            onChange={(e) => { setQ(e.target.value); setActive(-1); }} />
          {q ? <button type="button" className="pick-search-clear" aria-label="Clear search" onClick={() => { setQ(''); searchRef.current && searchRef.current.focus(); }}><X size={12} weight="bold" /></button> : null}
        </div>
      ) : null}
      <div className="pick-list" role="menu">
        {shown.length ? shown.map((s, i) => (
          <React.Fragment key={String(s.value)}>
          {s.startsGroup && s.group ? <div className="pick-group-label">{s.group}</div> : null}
          <button type="button" role="menuitemradio" aria-checked={s.value === value} disabled={s.disabled}
            className={`profile-run-menu-item${s.value === value ? ' is-current' : ''}${i === active ? ' is-active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(s)}>
            <span className="apps-menu-check" aria-hidden="true">{s.value === value ? <Check size={14} weight="bold" /> : null}</span>
            {renderOption ? renderOption(s) : (
              <>
                <span className="pick-item-label">{s.label}</span>
                {s.hint ? <span className="pick-item-hint">{s.hint}</span> : null}
              </>
            )}
          </button>
          </React.Fragment>
        )) : <div className="pick-empty">No matches</div>}
      </div>
    </>
  );

  return (
    <div className="apps-menu-wrap" ref={wrapRef}>
      <button type="button" className={triggerClass} disabled={disabled} aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => (open ? close() : setOpen(true))}>
        {renderTrigger ? renderTrigger(current) : <span className="apps-pick-label">{label}</span>}
        <CaretDown size={12} weight="bold" aria-hidden="true" />
      </button>
      {open && sheet ? (
        <div className="pick-sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pick-sheet" ref={panelRef} role="dialog" aria-modal="true" aria-label={title || ariaLabel}>
            <div className="pick-sheet-head">
              <span className="pick-sheet-title">{title || ariaLabel}</span>
              <button type="button" className="pick-sheet-close" aria-label="Close" onClick={close}><X size={16} weight="bold" /></button>
            </div>
            {list}
          </div>
        </div>
      ) : null}
      {open && !sheet && pos ? (
        <div ref={panelRef} className={`profile-run-menu apps-menu${searchable ? ' apps-menu--search' : ''}`}
          style={{ position: 'fixed', top: pos.top, left: pos.left, right: 'auto', bottom: 'auto', width: 'max-content', maxHeight: pos.maxH, display: 'flex', flexDirection: 'column' }}>
          {list}
        </div>
      ) : null}
    </div>
  );
}
