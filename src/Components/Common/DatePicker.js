import React, { useEffect, useRef, useState } from 'react';
import { CalendarBlank, CaretLeft, CaretRight, Clock } from 'phosphor-react';
import './DatePicker.css';

// App-style date (and optional time) picker, so no native browser widget is
// ever shown. Value in: 'YYYY-MM-DD' (or 'YYYY-MM-DDTHH:MM' with time). The
// calendar floats at fixed viewport coordinates under the trigger, like the
// status menus, so a scrolling popup cannot clip it.

const pad = (n) => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

export default function DatePicker({ value, onChange, withTime = false, placeholder = 'Choose a date', min, max, className = '', autoFocus = false }) {
  const { date, time } = splitValue(value);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const initial = date ? new Date(`${date}T00:00:00`) : new Date();
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const [timeDraft, setTimeDraft] = useState(time || (withTime ? '10:00' : ''));
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => { if (autoFocus && btnRef.current) btnRef.current.focus(); }, [autoFocus]);
  useEffect(() => { if (time) setTimeDraft(time); }, [time]);

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

  return (
    <div className={`dp ${className}`.trim()} ref={wrapRef}>
      <div className="dp-row">
        <button type="button" ref={btnRef} className={`dp-trigger${date ? '' : ' is-empty'}`} aria-haspopup="dialog" aria-expanded={open}
          onClick={() => { if (date) { const d = new Date(`${date}T00:00:00`); setView({ y: d.getFullYear(), m: d.getMonth() }); } setOpen((v) => !v); }}>
          <CalendarBlank size={15} weight="bold" aria-hidden="true" />
          <span>{date ? formatDateLabel(date) : placeholder}</span>
        </button>
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
            <button type="button" className="dp-nav" aria-label="Previous month" onClick={() => shift(-1)}><CaretLeft size={14} weight="bold" /></button>
            <span className="dp-month">{MONTHS[view.m]} {view.y}</span>
            <button type="button" className="dp-nav" aria-label="Next month" onClick={() => shift(1)}><CaretRight size={14} weight="bold" /></button>
          </div>
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
          <div className="dp-foot">
            <button type="button" className="dp-link" onClick={() => { const n = new Date(); setView({ y: n.getFullYear(), m: n.getMonth() }); emit(todayIso, timeDraft); setOpen(false); }}>Today</button>
            {date ? <button type="button" className="dp-link" onClick={() => { emit('', ''); setOpen(false); }}>Clear</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
