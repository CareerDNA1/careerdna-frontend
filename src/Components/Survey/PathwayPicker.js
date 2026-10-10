import React, { useEffect, useMemo, useRef } from 'react';
import PickMenu from '../Common/PickMenu';

// Shared selector for the University, Training & Work and Role Explorer tabs:
// a field showing the chosen item with its icon, match and count, opening the
// app's own menu panel (same on phones) with one row per option.
//
// options: [{ value, label, band?, count?, countNoun?, icon?, group? }]
// Options are shown in the order given. A `group` string starts a small
// divider line before that option when it differs from the previous one.
//
// Remembering the choice: pass `storageKey` and the last selection is kept
// for the session (sessionStorage), so leaving the tab and coming back does
// not reset it. Use `readRemembered(storageKey, validValues)` to seed state.

export function readRemembered(storageKey, validValues = []) {
  if (!storageKey) return '';
  try {
    const v = sessionStorage.getItem(`cdna_pick_${storageKey}`) || '';
    return validValues.includes(v) ? v : '';
  } catch (_) { return ''; }
}

function remember(storageKey, value) {
  if (!storageKey) return;
  try { sessionStorage.setItem(`cdna_pick_${storageKey}`, String(value || '')); } catch (_) { /* ignore */ }
}

// Plain band pill (same classes as the card badges), no tooltip hooks.
function bandKey(label = '') {
  const l = String(label || '').toLowerCase();
  if (l.startsWith('standout') || l.startsWith('top')) return 'standout';
  if (l.startsWith('strong')) return 'strong';
  if (l.startsWith('good')) return 'good';
  return 'lower';
}
function PlainBadge({ label }) {
  if (!label) return null;
  return <span className={`cdna-band-pill cdna-band-pill--${bandKey(label)} cdna-band-pill--header`}>{label}</span>;
}

function bandLabel(v) {
  const b = String(v || '').trim();
  if (!b) return '';
  return /match$/i.test(b) ? b : `${b} match`;
}

export default function PathwayPicker({ options = [], value, onSelect, ariaLabel = 'Choose a pathway', title = 'Your pathways', storageKey = '' }) {
  const wrapRef = useRef(null);

  // The open panel matches the field's width, like a proper select.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const set = () => el.style.setProperty('--pw-pick-w', `${el.getBoundingClientRect().width}px`);
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  // Dividers: mark the first option of each group.
  const rows = useMemo(() => {
    let prev = null;
    return options.map((o) => {
      const startsGroup = !!o.group && o.group !== prev;
      prev = o.group || prev;
      return { ...o, startsGroup };
    });
  }, [options]);

  const renderIcon = (icon) => <span className="pw-pick__icon" aria-hidden="true">{icon || null}</span>;
  const countText = (o) => {
    if (typeof o?.count !== 'number') return '';
    const noun = o.countNoun || 'role';
    return `${o.count} ${o.count === 1 ? noun : `${noun}s`}`;
  };

  return (
    <div className="pw-pick" ref={wrapRef}>
      <PickMenu
        options={rows}
        value={value}
        onSelect={(v) => { remember(storageKey, v); onSelect(v); }}
        ariaLabel={ariaLabel}
        title={title}
        triggerClass="pw-pick__trigger"
        sheetOnPhone={false}
        scrollToCurrent
        renderTrigger={(o) => (
          <span className="pw-pick__current">
            {renderIcon(o?.icon)}
            <span className="pw-pick__text">
              <span className="pw-pick__name">{o?.label || ariaLabel}</span>
              {o ? (
                <span className="pw-pick__meta">
                  {[bandLabel(o.band), countText(o)].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </span>
          </span>
        )}
        renderOption={(o) => (
          <span className={`pw-pick__option${o.startsGroup ? ' pw-pick__option--group-start' : ''}`} data-group={o.startsGroup ? o.group : undefined}>
            {renderIcon(o.icon)}
            <span className="pw-pick__option-name">{o.label}</span>
            <span className="pw-pick__option-right">
              {o.band ? <PlainBadge label={o.band} /> : null}
              {countText(o) ? <span className="pw-pick__count">{countText(o)}</span> : null}
            </span>
          </span>
        )}
      />
    </div>
  );
}
