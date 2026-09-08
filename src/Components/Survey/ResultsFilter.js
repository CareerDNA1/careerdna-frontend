import React, { useState, useRef, useEffect } from 'react';
import './ResultsFilter.css';

// The four "ways in" chips (Work is shown to students as "On the job").
export const ROUTE_FILTER_OPTIONS = [
  { key: 'University', label: 'University' },
  { key: 'Apprenticeship', label: 'Apprenticeship' },
  { key: 'College', label: 'College' },
  { key: 'Work', label: 'On the job' },
];

export const BAND_FILTER_OPTIONS = [
  { key: 'Standout', label: 'Standout' },
  { key: 'Strong', label: 'Strong' },
  { key: 'Good', label: 'Good' },
  { key: 'Lower', label: 'Lower' },
];

export function emptyFilter() {
  return { routes: [], bands: [], favouritesOnly: false };
}

// Normalise any band string (e.g. "Standout match", "Top match", "Lower") to a token.
export function bandToken(v) {
  const s = String(v || '').trim().toLowerCase();
  if (s.startsWith('standout') || s.startsWith('top')) return 'Standout';
  if (s.startsWith('strong')) return 'Strong';
  if (s.startsWith('good')) return 'Good';
  if (s.startsWith('lower')) return 'Lower';
  return '';
}

// Strength rank for ordering (Standout highest). Unknown/none sort last.
export function bandRank(v) {
  const t = bandToken(v);
  return { Standout: 4, Strong: 3, Good: 2, Lower: 1 }[t] || 0;
}

export function filterActiveCount(filter) {
  if (!filter) return 0;
  return (filter.routes?.length || 0) + (filter.bands?.length || 0) + (filter.favouritesOnly ? 1 : 0);
}

// Filter a list of items by the active filter. Callers supply accessors so this
// works across worlds, pathways, degrees and routes (which carry chips/band/id
// under slightly different fields).
export function applyResultsFilter(items, filter, opts = {}) {
  if (!Array.isArray(items)) return [];
  const f = filter || emptyFilter();
  const getChips = opts.getChips || ((it) => (Array.isArray(it?.routeChips) ? it.routeChips : []));
  const getBand = opts.getBand || ((it) => bandToken(it?.signalLabel || it?.band));
  const isLiked = opts.isLiked || (() => false);
  const routeSet = new Set(f.routes || []);
  const bandSet = new Set(f.bands || []);
  return items.filter((it) => {
    if (routeSet.size) {
      const chips = getChips(it) || [];
      if (!chips.some((c) => routeSet.has(c))) return false;
    }
    if (bandSet.size) {
      if (!bandSet.has(getBand(it))) return false;
    }
    if (f.favouritesOnly && !isLiked(it)) return false;
    return true;
  });
}

// Top-right filter control (button + popover). Presentational: the parent owns
// the filter state and applies applyResultsFilter to its own list.
export default function ResultsFilterBar({ filter, onChange, groups = ['route', 'band', 'favourites'], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  const f = filter || emptyFilter();
  const count = filterActiveCount(f);
  const toggle = (field, key) => {
    const set = new Set(f[field] || []);
    if (set.has(key)) set.delete(key); else set.add(key);
    onChange({ ...f, [field]: Array.from(set) });
  };
  const clear = () => onChange(emptyFilter());

  return (
    <div className={`results-filter results-filter--${align}`} ref={ref}>
      <button
        type="button"
        className={`results-filter__btn ${count ? 'is-active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3 5h18l-7 8.2V21l-4-2.2v-5.6z" /></svg>
        <span className="results-filter__btn-label">Filter</span>
        {count ? <span className="results-filter__count">{count}</span> : null}
      </button>
      {open ? (
        <div className="results-filter__popover" role="dialog" aria-label="Filter options">
          {groups.includes('route') ? (
            <div className="results-filter__group">
              <div className="results-filter__group-title">Ways in</div>
              <div className="results-filter__chips">
                {ROUTE_FILTER_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className={`results-filter__chip ${(f.routes || []).includes(o.key) ? 'is-on' : ''}`}
                    onClick={() => toggle('routes', o.key)}
                  >{o.label}</button>
                ))}
              </div>
            </div>
          ) : null}
          {groups.includes('band') ? (
            <div className="results-filter__group">
              <div className="results-filter__group-title">Match strength</div>
              <div className="results-filter__chips">
                {BAND_FILTER_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className={`results-filter__chip ${(f.bands || []).includes(o.key) ? 'is-on' : ''}`}
                    onClick={() => toggle('bands', o.key)}
                  >{o.label}</button>
                ))}
              </div>
              <button
                type="button"
                className="results-filter__mini"
                onClick={() => onChange({ ...f, bands: ['Standout', 'Strong', 'Good'] })}
              >Hide lower matches</button>
            </div>
          ) : null}
          {groups.includes('favourites') ? (
            <div className="results-filter__group">
              <label className="results-filter__switch">
                <input type="checkbox" checked={!!f.favouritesOnly} onChange={(e) => onChange({ ...f, favouritesOnly: e.target.checked })} />
                <span>Only my favourites</span>
              </label>
            </div>
          ) : null}
          <div className="results-filter__foot">
            {count ? (
              <button type="button" className="results-filter__clear" onClick={clear}>Clear</button>
            ) : null}
            <button type="button" className="results-filter__done" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
