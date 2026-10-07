import React, { useEffect, useRef, useState } from 'react';
import { CalendarBlank, CaretDoubleLeft, CaretDoubleRight, CaretLeft, CaretRight, Clock } from 'phosphor-react';
import './DatePicker.css';

// App-style date (and optional time) picker, so no native browser widget is
// ever shown. Value in: 'YYYY-MM-DD' (or 'YYYY-MM-DDTHH:MM' with time). The
// calendar floats at fixed viewport coordinates under the trigger, like the
// status menus, so a scrolling popup cannot clip it.

const pad = (n) => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function isoToTyped(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}
// Accepts digits with or without separators and returns an ISO date, or ''.
function typedToIso(text) {
  const digits = String(text || '').replace(/\D/g, '');
  if (digits.length !== 8) return '';
  const d = Number(digits.slice(0, 2)); const m = Number(digits.slice(2, 4)); const y = Number(digits.slice(4, 8));
  if (y < 1000 || m < 1 || m > 12 || d < 1 || d > 31) return '';
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
  return toIso(y, m - 1, d);
}
function formatTyping(text) {
  const digits = String(text || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function splitValue(value) {
  const s = String(value || '');
  const date = s.slice(0, 10);
  const time = s.length > 10 ? s.slice(11, 16) : '';
  return { date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '', time };
}
function formatDateLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// defaultView: ISO date the calendar opens on when nothing is chosen yet (for
// example a date of birth picker opening around the typical user's birth year).
// yearNav: show year step buttons as well as month ones.
// typeable: the trigger is a text box the user can type DD/MM/YYYY into; the
// calendar icon still opens the picker. showToday: the Today shortcut (off for
// dates of birth, where it makes no sense).
export default function DatePicker({ value, onChange, withTime = false, placeholder = 'Choose a date', min, max, className = '', autoFocus = false, defaultView = '', yearNav = false, typeable = false, showToday = true }) {
  const { date, time } = splitValue(value);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const initial = date ? new Date(`${date}T00:00:00`) : (defaultView ? new Date(`${defaultView}T00:00:00`) : new Date());
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const [timeDraft, setTimeDraft] = useState(time || (withTime ? '10:00' : ''));
  // Typed text (DD/MM/YYYY) when typeable. Kept in step with the value.
  const [typed, setTyped] = useState(() => (date ? isoToTyped(date) : ''));
  const [typedBad, setTypedBad] = useState(false);
  // Popup view: calendar days, month grid, or year grid.
  const [mode, setMode] = useState('days');
  const [yearPage, setYearPage] = useState(0);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => { if (autoFocus && btnRef.current) btnRef.current.focus(); }, [autoFocus]);
  useEffect(() => { if (time) setTimeDraft(time); }, [time]);
  useEffect(() => { setTyped(date ? isoToTyped(date) : ''); setTypedBad(false); }, [date]);
  useEffect(() => { if (!open) { setMode('days'); setYearPage(0); } }, [open]);

  const emit = (nextDate, nextTime) => {
    if (!nextDate) { onChange(''); return; }
    onChange(withTime ? `${nextDate}T${/^\d{2}:\d{2}$/.test(nextTime) ? nextTime : '10:00'}` : nextDate);
  };

  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const h = 320; const w = 292;
    const below = window.innerHeight - r.bottom;
    const top = (below >= h + 8 || below >= r.top) ? r.bottom + 6 : Math.max(8, r.top - h - 6);
    const left = Math.min(r.left, Math.max(8, window.innerWidth - w - 8));
    setPos({ top, left });
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

  // Calendar grid for the month in view, Monday first.
  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const todayIso = (() => { const n = new Date(); return toIso(n.getFullYear(), n.getMonth(), n.getDate()); })();
  const disabled = (iso) => (min && iso < min) || (max && iso > max);
  const shift = (n) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  // Year grid: 12 years per page, centred on the year in view.
  const yearStart = view.y - 7 + yearPage * 12;

  return (
    <div className={`dp ${className}`.trim()} ref={wrapRef}>
      <div className="dp-row">
        {typeable ? (
          <div className={`dp-trigger dp-trigger--typeable${date ? '' : ' is-empty'}${typedBad ? ' is-invalid' : ''}`}>
            <input
              ref={btnRef}
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              className="dp-input"
              placeholder={placeholder}
              value={typed}
              maxLength={10}
              aria-label={placeholder}
              aria-invalid={typedBad || undefined}
              onChange={(e) => {
                const next = formatTyping(e.target.value);
                setTyped(next);
                setTypedBad(false);
                const iso = typedToIso(next);
                if (iso && !disabled(iso)) { emit(iso, timeDraft); const d = new Date(`${iso}T00:00:00`); setView({ y: d.getFullYear(), m: d.getMonth() }); }
                else if (!next) emit('', '');
              }}
              onBlur={() => {
                if (!typed) return;
                const iso = typedToIso(typed);
                if (!iso || disabled(iso)) { setTypedBad(true); if (date) emit('', ''); }
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
            />
            <button type="button" className="dp-open" aria-haspopup="dialog" aria-expanded={open} aria-label="Open calendar"
              onClick={() => { if (date) { const d = new Date(`${date}T00:00:00`); setView({ y: d.getFullYear(), m: d.getMonth() }); } setOpen((v) => !v); }}>
              <CalendarBlank size={15} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button type="button" ref={btnRef} className={`dp-trigger${date ? '' : ' is-empty'}`} aria-haspopup="dialog" aria-expanded={open}
            onClick={() => { if (date) { const d = new Date(`${date}T00:00:00`); setView({ y: d.getFullYear(), m: d.getMonth() }); } setOpen((v) => !v); }}>
            <CalendarBlank size={15} weight="bold" aria-hidden="true" />
            <span>{date ? formatDateLabel(date) : placeholder}</span>
          </button>
        )}
        {withTime ? (
          <label className="dp-time" aria-label="Time">
            <Clock size={14} weight="bold" aria-hidden="true" />
            <input type="text" inputMode="numeric" value={timeDraft} placeholder="10:00" maxLength={5}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d:]/g, '');
                setTimeDraft(v);
                if (/^\d{2}:\d{2}$/.test(v) && date) emit(date, v);
              }}
              onBlur={() => {
                const m = timeDraft.match(/^(\d{1,2}):?(\d{2})?$/);
                if (!m) { setTimeDraft(time || '10:00'); return; }
                const hh = Math.min(23, Number(m[1])); const mm = Math.min(59, Number(m[2] || 0));
                const v = `${pad(hh)}:${pad(mm)}`;
                setTimeDraft(v);
                if (date) emit(date, v);
              }} />
          </label>
        ) : null}
      </div>
      {open && pos ? (
        <div className="dp-pop" role="dialog" aria-label="Choose a date" style={{ top: pos.top, left: pos.left }}>
          <div className="dp-head">
            {mode === 'years' ? (
              <>
                <button type="button" className="dp-nav" aria-label="Earlier years" onClick={() => setYearPage((p) => p - 1)}><CaretLeft size={14} weight="bold" /></button>
                <span className="dp-month">{yearStart} to {yearStart + 11}</span>
                <button type="button" className="dp-nav" aria-label="Later years" onClick={() => setYearPage((p) => p + 1)}><CaretRight size={14} weight="bold" /></button>
              </>
            ) : mode === 'months' ? (
              <>
                <button type="button" className="dp-nav" aria-label="Previous year" onClick={() => setView((v) => ({ ...v, y: v.y - 1 }))}><CaretLeft size={14} weight="bold" /></button>
                <button type="button" className="dp-month dp-month--btn" onClick={() => setMode('years')} aria-label={`Change year, currently ${view.y}`}>{view.y}</button>
                <button type="button" className="dp-nav" aria-label="Next year" onClick={() => setView((v) => ({ ...v, y: v.y + 1 }))}><CaretRight size={14} weight="bold" /></button>
              </>
            ) : (
              <>
                {yearNav ? <button type="button" className="dp-nav" aria-label="Previous year" onClick={() => shift(-12)}><CaretDoubleLeft size={14} weight="bold" /></button> : null}
                <button type="button" className="dp-nav" aria-label="Previous month" onClick={() => shift(-1)}><CaretLeft size={14} weight="bold" /></button>
                <span className="dp-month">
                  <button type="button" className="dp-month--btn" onClick={() => setMode('months')} aria-label={`Change month, currently ${MONTHS[view.m]}`}>{MONTHS[view.m]}</button>
                  {' '}
                  <button type="button" className="dp-month--btn" onClick={() => { setYearPage(0); setMode('years'); }} aria-label={`Change year, currently ${view.y}`}>{view.y}</button>
                </span>
                <button type="button" className="dp-nav" aria-label="Next month" onClick={() => shift(1)}><CaretRight size={14} weight="bold" /></button>
                {yearNav ? <button type="button" className="dp-nav" aria-label="Next year" onClick={() => shift(12)}><CaretDoubleRight size={14} weight="bold" /></button> : null}
              </>
            )}
          </div>
          {mode === 'years' ? (
            <div className="dp-grid dp-grid--pick" role="grid">
              {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => {
                const off = (min && y < Number(min.slice(0, 4))) || (max && y > Number(max.slice(0, 4)));
                return (
                  <button type="button" key={y} disabled={off} className={`dp-cell dp-cell--pick${y === view.y ? ' is-selected' : ''}`}
                    onClick={() => { setView((v) => ({ ...v, y })); setMode('months'); }}>{y}</button>
                );
              })}
            </div>
          ) : mode === 'months' ? (
            <div className="dp-grid dp-grid--pick" role="grid">
              {MONTHS.map((name, i) => (
                <button type="button" key={name} className={`dp-cell dp-cell--pick${i === view.m ? ' is-selected' : ''}`}
                  onClick={() => { setView((v) => ({ ...v, m: i })); setMode('days'); }}>{name.slice(0, 3)}</button>
              ))}
            </div>
          ) : (
          <div className="dp-grid" role="grid">
            {DAYS.map((d) => <span className="dp-dow" key={d}>{d}</span>)}
            {cells.map((d, i) => {
              if (!d) return <span className="dp-cell dp-cell--blank" key={`b${i}`} />;
              const iso = toIso(view.y, view.m, d);
              const off = disabled(iso);
              return (
                <button type="button" key={iso} disabled={off}
                  className={`dp-cell${iso === date ? ' is-selected' : ''}${iso === todayIso ? ' is-today' : ''}`}
                  onClick={() => { emit(iso, timeDraft); setOpen(false); }}>
                  {d}
                </button>
              );
            })}
          </div>
          )}
          {(showToday || date) ? (
            <div className="dp-foot">
              {showToday ? <button type="button" className="dp-link" onClick={() => { const n = new Date(); setView({ y: n.getFullYear(), m: n.getMonth() }); emit(todayIso, timeDraft); setOpen(false); }}>Today</button> : <span />}
              {date ? <button type="button" className="dp-link" onClick={() => { emit('', ''); setOpen(false); }}>Clear</button> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
