import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { insightsFor, CHARTS, AUTHOR } from '../../data/insights';
import georgePhoto from '../../Assets/images/George-opt.jpg';
import './InsightsCard.css';

// Cover colours by topic. Unknown tags fall back to the brand blue.
const THEMES = {
  'Career identity': { bg: 'linear-gradient(135deg, #5b5fd6, #8a5cf6)', icon: 'flask' },
  Employability: { bg: 'linear-gradient(135deg, #2f6fed, #14b8a6)', icon: 'case' },
  Applying: { bg: 'linear-gradient(135deg, #e0527e, #f08a6c)', icon: 'pen' },
  Routes: { bg: 'linear-gradient(135deg, #0f9d8a, #65c466)', icon: 'compass' },
  Skills: { bg: 'linear-gradient(135deg, #f08a24, #f2b84b)', icon: 'book' },
  'Future of work': { bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', icon: 'calendar' },
  'The science': { bg: 'linear-gradient(135deg, #5b5fd6, #8a5cf6)', icon: 'flask' },
  Research: { bg: 'linear-gradient(135deg, #5b5fd6, #8a5cf6)', icon: 'flask' },
  UCAS: { bg: 'linear-gradient(135deg, #2f6fed, #14b8a6)', icon: 'pen' },
  Apprenticeships: { bg: 'linear-gradient(135deg, #0f9d8a, #65c466)', icon: 'case' },
  News: { bg: 'linear-gradient(135deg, #f08a24, #f2b84b)', icon: 'calendar' },
  Guides: { bg: 'linear-gradient(135deg, #e0527e, #f08a6c)', icon: 'compass' },
};
export const themeFor = (tag) => THEMES[tag] || { bg: 'linear-gradient(135deg, #2f6fed, #5b8def)', icon: 'book' };

// Playful buddy that peeks over a ledge in the cover's top-right corner, in
// place of the old topic icon. Same family as the advisor face; the mood
// changes with the topic so each cover has its own character.
const INK = {
  'Career identity': '#5b4fd6',
  Employability: '#1f6fd6',
  Applying: '#c43d6a',
  Routes: '#0f8a74',
  Skills: '#d4740f',
  'Future of work': '#1e3a8a',
};
// Per article: its own character, chosen to match the title, peeking over a
// ledge with both hands on the edge (same "peeking buddy" idea for all).
const CHARACTER_BY_ARTICLE = {
  'career-identity': 'fingerprint',          // Know who you are
  'employers-self-awareness': 'owl',         // What employers cannot find (searching)
  'graduate-cover-letter': 'envelope',       // Cover letter
  'apprenticeships-plan-a': 'gear',          // Apprenticeships (hands-on, hard hat)
  'graduate-skills': 'bulb',                 // Skills (bright idea, grad cap)
  'ai-future-jobs': 'robot',                 // AI
  'personal-statement': 'pencil',            // Personal statement
};

function Hands() {
  return (
    <>
      <rect x="0" y="45" width="64" height="7" rx="3.5" fill="#fff" opacity="0.45" />
      <ellipse cx="13" cy="44" rx="6.5" ry="5" fill="#fff" />
      <ellipse cx="51" cy="44" rx="6.5" ry="5" fill="#fff" />
    </>
  );
}


// Calm faces (option A, 6 Nov 2026): dot eyes and a small even smile on every
// character. No hearts, winks, blush or thought bubbles.
const calmFace = (ink, y) => (
  <>
    <circle cx="25" cy={y} r="3.2" fill={ink} />
    <circle cx="39" cy={y} r="3.2" fill={ink} />
    <path d={`M28 ${y + 7}q4 3 8 0`} stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
  </>
);

function Character({ kind, ink }) {
  switch (kind) {
    case 'fingerprint':
      return (
        <g>
          <ellipse cx="32" cy="27" rx="21" ry="23" fill="#fff" />
          <g fill="none" stroke={ink} strokeOpacity="0.15" strokeWidth="1.5">
            <path d="M16 20a17 17 0 0 1 32 0" /><path d="M20 12a14 14 0 0 1 24 0" />
          </g>
          {calmFace(ink, 29)}
        </g>
      );
    case 'owl':
      return (
        <g>
          <path d="M10 14L15 2L22 11z" fill="#fff" /><path d="M54 14L49 2L42 11z" fill="#fff" />
          <path d="M8 47V27a24 21 0 0 1 48 0v20z" fill="#fff" />
          <circle cx="23" cy="25" r="7" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="41" cy="25" r="7" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="23" cy="25" r="3" fill={ink} /><circle cx="41" cy="25" r="3" fill={ink} />
          <path d="M29.5 32h5l-2.5 4z" fill="#e9a03c" />
        </g>
      );
    case 'envelope':
      return (
        <g>
          <rect x="7" y="10" width="50" height="36" rx="5" fill="#fff" />
          <path d="M8 12l24 16 24-16" stroke={ink} strokeOpacity="0.3" strokeWidth="2" fill="none" />
          {calmFace(ink, 35)}
        </g>
      );
    case 'gear':
      return (
        <g>
          <path d="M15 16a17 13 0 0 1 34 0z" fill="#f2b44a" />
          <rect x="11" y="14" width="42" height="5" rx="2.5" fill="#d99428" />
          <rect x="13" y="19" width="38" height="28" rx="12" fill="#fff" />
          {calmFace(ink, 29)}
        </g>
      );
    case 'bulb':
      return (
        <g>
          <circle cx="32" cy="25" r="17" fill="#fff" />
          <rect x="23" y="39" width="18" height="8" rx="2" fill="#dfe3ea" />
          <rect x="22" y="6" width="20" height="5" rx="2" fill="#26344f" />
          <path d="M32 -3L52 3L32 9L12 3z" fill="#26344f" />
          {calmFace(ink, 25)}
        </g>
      );
    case 'robot':
      return (
        <g>
          <path d="M32 9V1" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="32" cy="0" r="3" fill="#fff" />
          <rect x="9" y="9" width="46" height="38" rx="11" fill="#fff" />
          <rect x="15" y="17" width="34" height="17" rx="7" fill={ink} />
          <circle cx="25" cy="25.5" r="3.6" fill="#fff" /><circle cx="39" cy="25.5" r="3.6" fill="#fff" />
        </g>
      );
    case 'pencil':
      return (
        <g>
          <path d="M20 9L32 -8L44 9z" fill="#f4dcb4" />
          <rect x="20" y="8" width="24" height="40" rx="3" fill="#f2b44a" />
          {calmFace(ink, 22)}
        </g>
      );
    default:
      return (
        <g>
          <path d="M5 47V31a27 25 0 0 1 54 0v16z" fill="#fff" />
          {calmFace(ink, 28)}
        </g>
      );
  }
}

export function Buddy({ id, tag, size = 64 }) {
  const ink = INK[tag] || '#2f6fed';
  const kind = CHARACTER_BY_ARTICLE[id] || 'blob';
  return (
    <svg width={size} height={size * (62 / 72)} viewBox="-4 -10 72 62" aria-hidden="true" focusable="false">
      <Character kind={kind} ink={ink} />
      <Hands />
    </svg>
  );
}

export function TopicIcon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'flask') return <svg {...p}><path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" /><path d="M7 15h10" /></svg>;
  if (name === 'pen') return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
  if (name === 'case') return <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
  if (name === 'compass') return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>;
  if (name === 'calendar') return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
  return <svg {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M9 8h7M9 11.5h5" /></svg>;
}

// Inline text: [n] becomes a small linked number to source n, *text* italics.
function Inline({ text, sources = [] }) {
  const parts = String(text).split(/(\[\d+\]|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const cite = part.match(/^\[(\d+)\]$/);
    if (cite) {
      const n = Number(cite[1]);
      const src = sources[n - 1];
      if (!src) return null;
      return (
        <sup key={i} className="ins-cite">
          <a href={src.url} target="_blank" rel="noopener noreferrer" title={src.text} aria-label={`Source ${n}: ${src.text}`}>{n}</a>
        </sup>
      );
    }
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const fmtValue = (v, format) => {
  if (format === 'r') return v < 0 ? `−${Math.abs(v).toFixed(2)}` : v.toFixed(2);
  if (format === 'pct') return `${v}%`;
  if (format === 'points') return `+${v} points`;
  return String(v);
};

// Charts are drawn in HTML so the text stays readable on phones.
export function InsightChart({ id }) {
  const c = CHARTS[id];
  if (!c) return null;
  const diverging = c.type === 'bars' && c.rows.some((r) => r.value < 0);
  const pctOf = (v) => Math.min(100, (Math.abs(v) / c.max) * 100);
  return (
    <figure className="ins-chart" aria-label={c.title}>
      <figcaption>
        <span className="ins-chart__title">{c.title}</span>
        {c.subtitle ? <span className="ins-chart__sub">{c.subtitle}</span> : null}
      </figcaption>

      {c.type === 'groups' ? (
        <div className="ins-chart__legend" aria-hidden="true">
          {c.series.map((s, j) => (
            <span key={s}><i style={{ opacity: 0.35 + (0.65 * (j + 1)) / c.series.length }} />{s}</span>
          ))}
        </div>
      ) : null}
      {diverging ? (
        <div className="ins-chart__axislabels" aria-hidden="true">
          <span>{c.leftLabel}</span><span>{c.rightLabel}</span>
        </div>
      ) : null}

      <div className="ins-chart__rows">
        {c.rows.map((r) => (
          <div key={r.label} className={`ins-chart__row${r.accent ? ' is-accent' : ''}`}>
            <div className="ins-chart__label">{r.label}</div>
            {c.type === 'groups' ? (
              <div className="ins-chart__group">
                {r.values.map((v, j) => (
                  <div key={c.series[j]} className="ins-chart__track">
                    <span className="ins-chart__series">{c.series[j]}</span>
                    <span className="ins-chart__bar" style={{ width: `calc(${pctOf(v)}% * 0.8)`, opacity: 0.35 + (0.65 * (j + 1)) / c.series.length }} title={`${r.label}, ${c.series[j]}: ${fmtValue(v, c.format)}`} />
                    <span className="ins-chart__val">{fmtValue(v, c.format)}</span>
                  </div>
                ))}
              </div>
            ) : diverging ? (
              <div className="ins-chart__track ins-chart__track--div">
                <span className="ins-chart__zero" aria-hidden="true" />
                <span
                  className={`ins-chart__bar${r.value < 0 ? ' is-neg' : ''}`}
                  style={r.value < 0 ? { right: '50%', width: `${pctOf(r.value) / 2}%` } : { left: '50%', width: `${pctOf(r.value) / 2}%` }}
                />
                <span className="ins-chart__val" style={r.value < 0 ? { right: `calc(50% + ${pctOf(r.value) / 2}% + 6px)` } : { left: `calc(50% + ${pctOf(r.value) / 2}% + 6px)` }}>
                  {fmtValue(r.value, c.format)}
                </span>
              </div>
            ) : (
              <div className="ins-chart__track">
                <span className="ins-chart__bar" style={{ width: `calc(${pctOf(r.value)}% * 0.8)` }} />
                <span className="ins-chart__val">{fmtValue(r.value, c.format)}{r.tag ? <small> {r.tag}</small> : null}</span>
                {c.reference ? <span className="ins-chart__ref" style={{ left: `calc(${pctOf(c.reference.value)}% * 0.8)` }} aria-hidden="true" /> : null}
              </div>
            )}
          </div>
        ))}
      </div>
      {c.reference ? <div className="ins-chart__reflabel">Dashed line: {c.reference.label}</div> : null}
      {c.note ? <p className="ins-chart__note">{c.note}</p> : null}
      {c.source ? <p className="ins-chart__source">Source: {c.source}</p> : null}
    </figure>
  );
}

export function ArticleBody({ body, sources }) {
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) { out.push(<ul key={`ul-${out.length}`}>{list.map((t, i) => <li key={i}><Inline text={t} sources={sources} /></li>)}</ul>); list = []; }
  };
  body.forEach((line, i) => {
    if (line.startsWith('- ')) { list.push(line.slice(2)); return; }
    flush();
    if (line.startsWith('## ')) out.push(<h3 key={i}>{line.slice(3)}</h3>);
    else if (line.startsWith('@chart:')) out.push(<InsightChart key={i} id={line.slice(7).trim()} />);
    else out.push(<p key={i}><Inline text={line} sources={sources} /></p>);
  });
  flush();
  return <>{out}</>;
}

export function Sources({ sources }) {
  if (!Array.isArray(sources) || !sources.length) return null;
  return (
    <section className="ins-sources">
      <h3>Sources</h3>
      <ol>
        {sources.map((s, i) => (
          <li key={i}>
            {s.text}{' '}
            <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label || 'Link'}</a>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Byline() {
  return (
    <div className="ins-byline">
      <img src={georgePhoto} alt={AUTHOR.name} className="ins-byline__photo" />
      <div>
        <div className="ins-byline__name">{AUTHOR.name}</div>
        <div className="ins-byline__role">{AUTHOR.role}</div>
      </div>
    </div>
  );
}

// A cover links to the article page when `href` is given (public pages),
// otherwise it calls onOpen (profile reader).
export function Cover({ a, size = 'big', onOpen, href }) {
  const th = themeFor(a.tag);
  const inner = (
    <>
      <span className="ins-cover__blob ins-cover__blob--1" aria-hidden="true" />
      <span className="ins-cover__blob ins-cover__blob--2" aria-hidden="true" />
      <span className="ins-cover__chip">{a.tag}</span>
      <span className="ins-cover__buddy" aria-hidden="true"><Buddy id={a.id} tag={a.tag} size={size === 'big' ? 50 : 40} /></span>
      <span className="ins-cover__title">{a.title}</span>
      {size === 'big' ? <span className="ins-cover__excerpt">{a.summary}</span> : null}
      <span className="ins-cover__meta">
        <span>{a.minutes} min read</span>
        {size === 'big' ? <span className="ins-cover__go">Read</span> : null}
      </span>
    </>
  );
  const cls = `ins-cover ins-cover--${size}`;
  if (href) return <Link to={href} className={cls} style={{ background: th.bg }}>{inner}</Link>;
  return <button type="button" className={cls} style={{ background: th.bg }} onClick={() => onOpen(a)}>{inner}</button>;
}

// Insights: magazine-style tiles. One article fills the card; with more, the
// articles sit in a swipeable carousel with arrows and dots (no library pop-up).
export default function InsightsCard({ stage = 'school' }) {
  const articles = insightsFor(stage);
  const [open, setOpen] = useState(null);        // article being read

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const lead = articles[0];
  // Phones: a swipeable carousel of full covers (CSS decides which layout shows).
  const trackRef = useRef(null);
  const [slide, setSlide] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const w = el.children[0].getBoundingClientRect().width + 12;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setAtEnd(end);
    // At the far end the last card is the current one, so the last dot lights up.
    setSlide(end ? articles.length - 1 : Math.max(0, Math.min(articles.length - 1, Math.round(el.scrollLeft / w))));
  };
  useEffect(() => { onTrackScroll(); }); // keep arrows right after layout changes
  const goTo = (i) => {
    const el = trackRef.current;
    const n = Math.max(0, Math.min(articles.length - 1, i));
    if (!el || !el.children[n]) return;
    el.scrollTo({ left: el.children[n].offsetLeft - el.children[0].offsetLeft, behavior: 'smooth' });
  };
  // Arrows move one card from where the track actually is. (At the far end the
  // last dot is lit but the track is parked before the last card's start, so
  // stepping by dot index made "previous" scroll nowhere.)
  const step = (dir) => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const base = el.children[0].offsetLeft;
    const lefts = [...el.children].map((c) => c.offsetLeft - base);
    const x = el.scrollLeft;
    const target = dir > 0
      ? lefts.find((l) => l > x + 4)
      : [...lefts].reverse().find((l) => l < x - 4);
    el.scrollTo({ left: target ?? (dir > 0 ? el.scrollWidth : 0), behavior: 'smooth' });
  };

  return (
    <section className="ins-card">
      <div className="ins-head">
        <div>
          <h2 className="ins-title">Insights</h2>
          <p className="ins-sub">Advice and news from the CareerDNA team</p>
        </div>
        {articles.length > 1 ? (
          <div className="ins-arrows">
            <button type="button" className="ins-arrow" onClick={() => step(-1)} disabled={slide <= 0 && !atEnd} aria-label="Previous article">‹</button>
            <button type="button" className="ins-arrow" onClick={() => step(1)} disabled={atEnd} aria-label="Next article">›</button>
          </div>
        ) : null}
      </div>

      {lead ? (
        <div className="ins-carousel">
          <div className="ins-carousel__track" ref={trackRef} onScroll={onTrackScroll}>
            {articles.map((a) => <Cover key={a.id} a={a} size="big" onOpen={setOpen} />)}
          </div>
          {articles.length > 1 ? (
            <div className="ins-carousel__dots" role="tablist" aria-label="Choose article">
              {articles.map((a, i) => (
                <button key={a.id} type="button" role="tab" aria-selected={i === slide} aria-label={a.title} className={i === slide ? 'is-on' : ''} onClick={() => goTo(i)} />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="ins-empty">New articles are on their way.</p>
      )}

      {open ? createPortal(
        <div className="ins-overlay" role="dialog" aria-modal="true" aria-label={open.title} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <article className="ins-reader ins-reader--article">
            <div className="ins-reader__hero" style={{ background: themeFor(open.tag).bg }}>
              <span className="ins-cover__blob ins-cover__blob--1" aria-hidden="true" />
              <span className="ins-cover__chip">{open.tag}</span>
              <h2 className="ins-reader__herotitle">{open.title}</h2>
              <span className="ins-reader__herometa">By {AUTHOR.name} · {open.minutes} min read</span>
            </div>
            <button type="button" className="ins-close ins-close--light" onClick={() => setOpen(null)} aria-label="Close">×</button>
            <div className="ins-reader__body">
              <ArticleBody body={open.body} sources={open.sources} />
              <Byline />
              <Sources sources={open.sources} />
            </div>
          </article>
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
