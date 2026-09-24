import { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkSimple } from 'phosphor-react';
import { PathwayReactionRow } from '../Survey/SelectionInsightExplorer';
import { loadSubjectRanking } from '../../utils/rankings';
import { getMyAcademicProfile } from '../../utils/academicProfile';
import { studentTop3Tariff, gradedAlevelCount, gradeBand, checkPrerequisites } from '../../utils/matchBand';
import { showSelectionTooltip, hideSelectionTooltip } from '../Survey/SelectionInsightExplorer';
import { getSavedIds, setItemReaction } from '../../utils/savedItems';
import './RankingsModal.css';

// Stable id for a saved course (prefer its provider URL; fall back to uni+title).
function courseKey(university, course) {
  // Unique per course. Keyed on the TITLE (distinct), not the URL — joint-honours
  // courses at one provider can share a single URL, so keying on URL made liking
  // one mark them all. The university is encoded first so favourites can show it,
  // and the URL is kept at the end so the link is recoverable from the id.
  // Format: course:<university>::<title>::<url>
  return `course:${university || ''}::${course.title || ''}::${course.url || ''}`;
}

const SORTS = [
  { key: 'score', label: 'CareerDNA Rank', field: 'score' },
  { key: 'salary', label: 'Graduate salary', field: 'medianSalary' },
  { key: 'employment', label: 'Employment', field: 'employment' },
  { key: 'meaningful', label: 'Meaningful work', field: 'meaningfulWork' },
  { key: 'satisfaction', label: 'Student satisfaction', field: 'satisfaction' },
  { key: 'continuation', label: 'Continuation', field: 'continuation' },
  { key: 'entry', label: 'Entry requirements', field: 'tariffPoints' },
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
  const wrapRef = useRef(null);
  const [showArrow, setShowArrow] = useState(false);
  const [academic, setAcademic] = useState(null);
  // Whether the grades fetch has finished (regardless of result). The table waits
  // for this so the personalised "Your chances" column paints with the rest of
  // the table instead of popping in a moment later.
  const [academicLoaded, setAcademicLoaded] = useState(false);
  // Courses the student has saved (liked), and the course currently open in the
  // save card. Saving is optional and never blocks browsing the rankings.
  const [savedCourses, setSavedCourses] = useState(() => new Set());
  const [courseCard, setCourseCard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSavedIds('course').then((s) => { if (!cancelled) setSavedCourses(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleCourseReact = async (reaction) => {
    const cc = courseCard;
    if (!cc) return;
    const isLiked = savedCourses.has(cc.id);
    const meta = { university: cc.university, url: cc.url || '', subject: (data && data.subject) || subjectTitle || '', stats: cc.stats || null };
    if (reaction === 'like') {
      const remove = isLiked;
      setSavedCourses((prev) => {
        const n = new Set(prev);
        if (remove) n.delete(cc.id); else n.add(cc.id);
        return n;
      });
      await setItemReaction({ itemType: 'course', itemId: cc.id, itemTitle: cc.title, itemMeta: meta, reaction: 'like', remove });
    } else {
      setSavedCourses((prev) => { const n = new Set(prev); n.delete(cc.id); return n; });
      await setItemReaction({ itemType: 'course', itemId: cc.id, itemTitle: cc.title, itemMeta: meta, reaction: 'dislike' });
      setCourseCard(null);
    }
  };

  // Load the student's self-entered grades once, to personalise the band column.
  useEffect(() => {
    let cancelled = false;
    getMyAcademicProfile()
      .then((ap) => { if (!cancelled) setAcademic(ap || null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAcademicLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  // Personalised chances need at least three graded predicted A-levels.
  const studentTariff = useMemo(() => studentTop3Tariff(academic?.predicted_alevels), [academic]);
  const showChances = gradedAlevelCount(academic?.predicted_alevels) >= 3;
  const prereq = useMemo(() => checkPrerequisites(academic, data?.requirements), [academic, data]);
  const prereqMissing = [
    ...(prereq.missingAlevels || []).map((a) => `A-level ${a}`),
    ...(prereq.missingGcse || []).map((m) => `GCSE ${m.subject} grade ${m.need}`),
  ];

  // Show the "swipe right" cue only while there is more table to the right; hide
  // it once scrolled to the end (otherwise it permanently covers the TEF column).
  const updateArrow = () => {
    const el = wrapRef.current;
    if (!el) { setShowArrow(false); return; }
    const max = el.scrollWidth - el.clientWidth;
    setShowArrow(max > 6 && el.scrollLeft < max - 6);
  };

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

  // Recompute arrow visibility whenever the rendered table can change size.
  useEffect(() => {
    updateArrow();
    window.addEventListener('resize', updateArrow);
    return () => window.removeEventListener('resize', updateArrow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortKey, openCourses, loading]);

  const rows = useMemo(() => {
    const list = Array.isArray(data?.universities) ? [...data.universities] : [];
    const field = (SORTS.find((s) => s.key === sortKey) || SORTS[0]).field;
    list.sort((a, b) => (Number(b[field] || 0) - Number(a[field] || 0)));
    return list;
  }, [data, sortKey]);

  // Single ordered column config for the table, grouped into three readable
  // blocks: the verdict (our rank + official TEF), "can I get in" (chances,
  // entry grades, offer rate), and the outcomes the rank is built from. Each
  // column carries its width, header lines, tooltip and a cell renderer, so the
  // header and body stay in lockstep and the grid template is derived from it.
  const rkColumnDefs = [
    { key: 'score', group: 'verdict', width: 70, cls: 'rk-num rk-score', lines: ['CareerDNA', 'Rank'], title: 'CareerDNA Rank', tip: 'Our overall university score (0–100). It blends graduate outcomes (50%: salary, employment, meaningful work), student satisfaction (25%), entry standards (15%) and continuation (10%).', render: (u) => Math.round(u.score) },
    { key: 'tef', group: 'verdict', width: 62, cls: 'rk-mid', lines: ['TEF'], title: 'Teaching Excellence Framework', tip: 'The official Gold, Silver or Bronze rating for teaching quality.', render: (u) => tefPill(u.tef) },
    { key: 'chances', group: 'getin', width: 92, cls: 'rk-mid', when: showChances, lines: ['Your', 'chances'], title: 'Your chances', tip: "How your predicted A-level results compare with each university's typical offer.\n\nSafe: your predicted grades are comfortably above the typical offer.\nMatch: your predicted grades are about the same as the typical offer.\nStretch: you would need to improve on your predicted grades to get a place.\nAmbitious: you would need to improve significantly on your predicted grades to get a place.\n\nBased on the typical entry grades for this course. Individual offers can vary.", render: (u) => { const b = gradeBand(studentTariff, u.typicalGrades); return b ? <span className={`rk-band rk-band--${b.key}`}>{b.label}</span> : <span className="rk-band-na">–</span>; } },
    { key: 'entry', group: 'getin', width: 58, cls: 'rk-mid rk-entry', lines: ['Entry'], title: 'Entry requirements', tip: 'Typical entry grades, based on the UCAS tariff of accepted students.', render: (u) => u.typicalGrades || '–' },
    { key: 'offer', group: 'getin', width: 66, cls: 'rk-num rk-offer', lines: ['Offer', 'rate'], title: 'Offer rate', tip: `The share of applicants who received an offer. A lower rate means more competitive. This is the figure for the broad subject area${data?.offerAreaName ? ` (${data.offerAreaName})` : ''} (UCAS).`, render: (u) => (u.offerRate != null ? `${Math.round(u.offerRate * 100)}%` : '–') },
    { key: 'salary', group: 'outcomes', width: 66, cls: 'rk-num', lines: ['Median', 'salary'], title: 'Median salary', tip: 'Median graduate salary, 15 months after finishing the course.', render: (u) => (u.medianSalary ? `£${Math.round(u.medianSalary / 1000)}k` : '–') },
    { key: 'employed', group: 'outcomes', width: 72, cls: 'rk-num', lines: ['Employed'], title: 'Employed', tip: 'Percentage of graduates in work or further study 15 months after finishing.', render: (u) => (u.employment != null ? `${u.employment}%` : '–') },
    { key: 'meaningful', group: 'outcomes', width: 78, cls: 'rk-num', lines: ['Meaningful', 'work'], title: 'Meaningful work', tip: 'Percentage of graduates who say their work is meaningful and fits their future plans (Graduate Outcomes survey).', render: (u) => (u.meaningfulWork != null ? `${u.meaningfulWork}%` : '–') },
    { key: 'satisfaction', group: 'outcomes', width: 76, cls: 'rk-num', lines: ['Satisfaction'], title: 'Student satisfaction', tip: 'Average student satisfaction, from the National Student Survey (NSS).', render: (u) => (u.satisfaction != null ? `${u.satisfaction}%` : '–') },
    { key: 'continuation', group: 'outcomes', width: 84, cls: 'rk-num', lines: ['Continuation'], title: 'Continuation', tip: 'Percentage of students who continue their studies past the first year.', render: (u) => (u.continuation != null ? `${u.continuation}%` : '–') },
  ];
  let rkPrevGroup = null;
  const rkCols = rkColumnDefs
    .filter((c) => c.when !== false)
    .map((c) => { const groupStart = c.group !== rkPrevGroup; rkPrevGroup = c.group; return { ...c, groupStart }; });
  // The University track is a CSS variable so the mobile breakpoint can swap it
  // from a flexible 1fr to a fixed width. A flexible 1fr track breaks the sticky
  // column freeze on mobile Safari (columns bleed under the frozen column); a
  // fixed track keeps the freeze solid. Desktop keeps the 1fr fallback.
  const rkGridCols = ['30px', 'var(--rk-uni-col, minmax(0, 1fr))', ...rkCols.map((c) => `${c.width}px`)].join(' ');
  const rkTableMinWidth = 30 + 200 + rkCols.reduce((s, c) => s + c.width, 0);

  return (
    <div className="rk-overlay" role="dialog" aria-modal="true" aria-label="University rankings"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rk-modal">
        <button type="button" className="rk-close" onClick={onClose} aria-label="Close">×</button>

        <div className="rk-head">
          <div>
            <div className="rk-title">CareerDNA 2026 University Rankings™</div>
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

        {(loading || !academicLoaded) ? (
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

            {!showChances ? (
              <p className="rk-chances-prompt">
                Add your predicted A-levels on your <a href="/profile">profile</a> to see your chances at each university.
              </p>
            ) : (!prereq.met && prereqMissing.length ? (
              <p className="rk-prereq-warn">
                This subject usually requires {prereqMissing.join(', ')}, which isn&rsquo;t in your grades yet. Exact requirements vary by university, so always check each course&rsquo;s own entry requirements.
              </p>
            ) : null)}

            <div className="rk-table-outer">
              <span className={`rk-scrollarrow${showArrow ? '' : ' rk-scrollarrow--hidden'}`} aria-hidden="true">›</span>
              <div className="rk-table-wrap" ref={wrapRef} onScroll={updateArrow}>
              <div className="rk-table" style={{ minWidth: rkTableMinWidth }}>
                <div className="rk-row rk-row--head" style={{ gridTemplateColumns: rkGridCols }}>
                  <div>#</div>
                  <div>University</div>
                  {rkCols.map((c) => (
                    <div
                      key={c.key}
                      className={`rk-th${c.groupStart ? ' rk-col-groupstart' : ''}`}
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
                      <div className="rk-row" style={{ gridTemplateColumns: rkGridCols }}>
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
                        {rkCols.map((c) => (
                          <div key={c.key} className={`${c.cls}${c.groupStart ? ' rk-col-groupstart' : ''}`}>
                            {c.render(u)}
                          </div>
                        ))}
                      </div>
                      {isOpen && courses.length ? (
                        <div className="rk-courses">
                          {courses.map((c, ci) => {
                            const cid = courseKey(u.institution, c);
                            const saved = savedCourses.has(cid);
                            return (
                              <button
                                key={ci}
                                type="button"
                                className={`rk-course rk-course--btn${saved ? ' is-saved' : ''}`}
                                onClick={() => setCourseCard({
                                  id: cid, title: c.title, url: c.url || '', university: u.institution,
                                  stats: {
                                    score: u.score, medianSalary: u.medianSalary, employment: u.employment,
                                    meaningfulWork: u.meaningfulWork, satisfaction: u.satisfaction,
                                    continuation: u.continuation, typicalGrades: u.typicalGrades,
                                    offerRate: u.offerRate, tef: u.tef,
                                  },
                                })}
                              >
                                {saved ? <BookmarkSimple size={13} weight="fill" className="rk-course-heart" aria-hidden="true" /> : null}
                                <span className="rk-course-name">{c.title}</span>
                              </button>
                            );
                          })}
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
              {data && data.offerAreaName ? (
                <>
                  {' '}Offer rate is the {data.offerRateYear || 2025} UCAS offer rate for the broad subject
                  {' '}area ({data.offerAreaName}). Figures are rounded and cover UCAS main scheme applicants.
                </>
              ) : null}
              {showChances ? (
                <>
                  {' '}Your chances are based on typical A-level offers only. Exact entry requirements (subjects, GCSEs, admissions tests) vary by university, so always check each course&rsquo;s own page.
                </>
              ) : null}
            </p>
          </>
        )}

        {courseCard ? (
          <div className="rk-course-modal" role="dialog" aria-modal="true" aria-label={`${courseCard.title} — save`}
            onClick={(e) => { if (e.target === e.currentTarget) setCourseCard(null); }}>
            <div className="rk-course-box">
              <button type="button" className="rk-close" onClick={() => setCourseCard(null)} aria-label="Close">×</button>
              <div className="rk-course-modal__title">{courseCard.title}</div>
              <div className="rk-course-modal__uni">{courseCard.university}</div>
              {courseCard.stats ? (
                <div className="rk-course-stats">
                  {courseCard.stats.score != null ? <span className="rk-course-stat"><b>{Math.round(courseCard.stats.score)}</b> CareerDNA rank</span> : null}
                  {courseCard.stats.medianSalary ? <span className="rk-course-stat"><b>£{Math.round(courseCard.stats.medianSalary / 1000)}k</b> median salary</span> : null}
                  {courseCard.stats.employment != null ? <span className="rk-course-stat"><b>{courseCard.stats.employment}%</b> employed</span> : null}
                  {courseCard.stats.satisfaction != null ? <span className="rk-course-stat"><b>{courseCard.stats.satisfaction}%</b> satisfaction</span> : null}
                  {courseCard.stats.typicalGrades ? <span className="rk-course-stat"><b>{courseCard.stats.typicalGrades}</b> typical offer</span> : null}
                  {courseCard.stats.offerRate != null ? <span className="rk-course-stat"><b>{Math.round(courseCard.stats.offerRate * 100)}%</b> offer rate</span> : null}
                  {courseCard.stats.tef ? <span className="rk-course-stat"><b>{courseCard.stats.tef}</b> TEF</span> : null}
                  <span className="rk-course-stats__note">For this subject area at {courseCard.university}. Source: Office for Students, UCAS.</span>
                </div>
              ) : null}
              {courseCard.url ? (
                <a className="rk-course-modal__link" href={courseCard.url} target="_blank" rel="noopener noreferrer">
                  View course <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              <div className="rk-course-react">
                <PathwayReactionRow
                  reaction={savedCourses.has(courseCard.id) ? 'like' : ''}
                  onReact={(r) => handleCourseReact(r)}
                  label="Course feedback"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
