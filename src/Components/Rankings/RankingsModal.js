import { useEffect, useMemo, useState } from 'react';
import { loadSubjectRanking } from '../../utils/rankings';
import { showSelectionTooltip, hideSelectionTooltip } from '../Survey/SelectionInsightExplorer';
import './RankingsModal.css';

const SORTS = [
  { key: 'score', label: 'CareerDNA Rank', field: 'score' },
  { key: 'salary', label: 'Graduate salary', field: 'medianSalary' },
  { key: 'employment', label: 'Employment', field: 'employment' },
  { key: 'meaningful', label: 'Meaningful work', field: 'meaningfulWork' },
  { key: 'satisfaction', label: 'Student satisfaction', field: 'satisfaction' },
  { key: 'continuation', label: 'Continuation', field: 'continuation' },
  { key: 'entry', label: 'Entry requirements', field: 'tariffPoints' },
];

const COLS = [
  { lines: ['CareerDNA', 'Rank'], title: 'CareerDNA Rank', tip: 'Our overall university score (0–100). It blends graduate outcomes (50%: salary, employment, meaningful work), student satisfaction (25%), entry standards (15%) and continuation (10%).' },
  { lines: ['Median', 'salary'], title: 'Median salary', tip: 'Median graduate salary, 15 months after finishing the course.' },
  { lines: ['Employed'], title: 'Employed', tip: 'Percentage of graduates in work or further study 15 months after finishing.' },
  { lines: ['Meaningful', 'work'], title: 'Meaningful work', tip: 'Percentage of graduates who say their work is meaningful and fits their future plans (Graduate Outcomes survey).' },
  { lines: ['Satisfaction'], title: 'Student satisfaction', tip: 'Average student satisfaction, from the National Student Survey (NSS).' },
  { lines: ['Continued'], title: 'Continuation', tip: 'Percentage of students who continue their studies past the first year.' },
  { lines: ['Entry'], title: 'Entry requirements', tip: 'Typical entry grades, based on the UCAS tariff of accepted students.' },
  { lines: ['TEF'], title: 'Teaching Excellence Framework', tip: 'The official Gold, Silver or Bronze rating for teaching quality.' },
];

const TEF_STYLE = {
  Gold: { bg: '#e7b53c', fg: '#4a3300', label: 'Gold' },
  Silver: { bg: '#b8c0cb', fg: '#333c48', label: 'Silver' },
  Bronze: { bg: '#c67f3a', fg: '#3d2410', label: 'Bronze' },
  'Requires Improvement': { bg: '#e6d3cd', fg: '#7a3322', label: 'Requires improvement', small: true },
};

function titleCase(s) {
  const small = new Set(['and', 'of', 'the', 'for', 'with', 'in', 'at', 'to', 'a', 'an', 'or']);
  return String(s || '')
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function tefPill(tef) {
  const na = <span className="rk-tef rk-tef--none" title="The Teaching Excellence Framework rates English universities only">N/A</span>;
  if (!tef) return na;
  const s = TEF_STYLE[tef];
  if (!s) return na;
  return <span className={`rk-tef${s.small ? ' rk-tef--ri' : ''}`} style={{ background: s.bg, color: s.fg }} title={`Teaching Excellence Framework: ${s.label}`}>{s.label}</span>;
}

export default function RankingsModal({ subjectId, subjectTitle, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState('score');
  const [openCourses, setOpenCourses] = useState(() => new Set());

  const toggleCourses = (key) => setOpenCourses((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError('');
        const d = await loadSubjectRanking({ subjectId, subjectTitle });
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load the ranking.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subjectId, subjectTitle]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const rows = useMemo(() => {
    const list = Array.isArray(data?.universities) ? [...data.universities] : [];
    const field = (SORTS.find((s) => s.key === sortKey) || SORTS[0]).field;
    list.sort((a, b) => (Number(b[field] || 0) - Number(a[field] || 0)));
    return list;
  }, [data, sortKey]);

  return (
    <div className="rk-overlay" role="dialog" aria-modal="true" aria-label="University rankings"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rk-modal">
        <button type="button" className="rk-close" onClick={onClose} aria-label="Close">×</button>

        <div className="rk-head">
          <div>
            <div className="rk-title">CareerDNA 2026 University Rankings©</div>
            <div className="rk-sub">
              {data ? (
                <>
                  <span className="rk-sub-area">{data.titleFiltered ? data.subject : titleCase(data.rankedBy || data.subject)}</span>
                  {` · ${data.count} universities`}
                </>
              ) : (subjectTitle || 'Loading…')}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rk-state">Loading rankings…</div>
        ) : error ? (
          <div className="rk-state rk-state--error">{error}</div>
        ) : (
          <>
            <div className="rk-controls">
              <label htmlFor="rk-sort">Sort by</label>
              <select id="rk-sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            <div className="rk-table-outer">
              <span className="rk-scrollarrow" aria-hidden="true">›</span>
              <div className="rk-table-wrap">
              <div className="rk-table">
                <div className="rk-row rk-row--head">
                  <div>#</div>
                  <div>University</div>
                  {COLS.map((c, ci) => (
                    <div
                      key={ci}
                      className="rk-th"
                      tabIndex={0}
                      role="button"
                      data-selection-tooltip="true"
                      data-tooltip-title={c.title}
                      data-tooltip-body={c.tip}
                      onMouseEnter={(e) => showSelectionTooltip(e.currentTarget)}
                      onMouseLeave={hideSelectionTooltip}
                      onFocus={(e) => showSelectionTooltip(e.currentTarget)}
                      onBlur={hideSelectionTooltip}
                      onClick={(e) => showSelectionTooltip(e.currentTarget, { pinned: true })}
                    >
                      {c.lines.map((l, li) => <span key={li} className="rk-th-line">{l}</span>)}
                    </div>
                  ))}
                </div>
                {rows.map((u, i) => {
                  const key = u.ukprn || u.institution;
                  const courses = Array.isArray(u.courses) ? u.courses : [];
                  const isOpen = openCourses.has(key);
                  return (
                    <div className="rk-rowgroup" key={key}>
                      <div className="rk-row">
                        <div className="rk-rank">{i + 1}</div>
                        <div className="rk-uni">
                          {courses.length ? (
                            <button type="button" className="rk-uni-btn" onClick={() => toggleCourses(key)}
                              aria-expanded={isOpen} title="Show matching degrees">
                              <span className="rk-uni-name">{u.institution}</span>
                              <span className="rk-uni-count">{isOpen ? '▾' : '▸'} {courses.length}<span className="rk-uni-count-word"> {courses.length === 1 ? 'course' : 'courses'}</span></span>
                            </button>
                          ) : (
                            <span className="rk-uni-name">{u.institution}</span>
                          )}
                        </div>
                        <div className="rk-num rk-score">{Math.round(u.score)}</div>
                        <div className="rk-num">{u.medianSalary ? `£${Math.round(u.medianSalary / 1000)}k` : '–'}</div>
                        <div className="rk-num">{u.employment != null ? `${u.employment}%` : '–'}</div>
                        <div className="rk-num">{u.meaningfulWork != null ? `${u.meaningfulWork}%` : '–'}</div>
                        <div className="rk-num">{u.satisfaction != null ? `${u.satisfaction}%` : '–'}</div>
                        <div className="rk-num">{u.continuation != null ? `${u.continuation}%` : '–'}</div>
                        <div className="rk-mid rk-entry">{u.typicalGrades || '–'}</div>
                        <div className="rk-mid">{tefPill(u.tef)}</div>
                      </div>
                      {isOpen && courses.length ? (
                        <div className="rk-courses">
                          {courses.map((c, ci) => (
                            c.url ? (
                              <a key={ci} className="rk-course" href={c.url} target="_blank" rel="noopener noreferrer">
                                {c.title}
                              </a>
                            ) : (
                              <span key={ci} className="rk-course rk-course--nolink">{c.title}</span>
                            )
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>

            <p className="rk-foot">
              {data && data.rankedBy && !data.subject.toLowerCase().includes(String(data.rankedBy).toLowerCase())
                ? `The ranking statistics are based on the ${titleCase(data.rankedBy)} subject area. `
                : ''}
              Built from official 2025 data from the Office for Students. Entry grades are indicative.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
