import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { insightsFor } from '../../data/insights';
import './InsightsCard.css';

// Cover colours by topic. Unknown tags fall back to the brand blue.
const THEMES = {
  'The science': { bg: 'linear-gradient(135deg, #5b5fd6, #8a5cf6)', icon: 'flask' },
  Research: { bg: 'linear-gradient(135deg, #5b5fd6, #8a5cf6)', icon: 'flask' },
  UCAS: { bg: 'linear-gradient(135deg, #2f6fed, #14b8a6)', icon: 'pen' },
  Apprenticeships: { bg: 'linear-gradient(135deg, #0f9d8a, #65c466)', icon: 'case' },
  News: { bg: 'linear-gradient(135deg, #f08a24, #f2b84b)', icon: 'calendar' },
  Guides: { bg: 'linear-gradient(135deg, #e0527e, #f08a6c)', icon: 'compass' },
};
const themeFor = (tag) => THEMES[tag] || { bg: 'linear-gradient(135deg, #2f6fed, #5b8def)', icon: 'book' };

function TopicIcon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'flask') return <svg {...p}><path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" /><path d="M7 15h10" /></svg>;
  if (name === 'pen') return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>;
  if (name === 'case') return <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
  if (name === 'compass') return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>;
  if (name === 'calendar') return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
  return <svg {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M9 8h7M9 11.5h5" /></svg>;
}

function ArticleBody({ body }) {
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) { out.push(<ul key={`ul-${out.length}`}>{list.map((t, i) => <li key={i}>{t}</li>)}</ul>); list = []; }
  };
  body.forEach((line, i) => {
    if (line.startsWith('- ')) { list.push(line.slice(2)); return; }
    flush();
    if (line.startsWith('## ')) out.push(<h3 key={i}>{line.slice(3)}</h3>);
    else out.push(<p key={i}>{line}</p>);
  });
  flush();
  return <>{out}</>;
}

function Cover({ a, size = 'big', onOpen }) {
  const th = themeFor(a.tag);
  return (
    <button type="button" className={`ins-cover ins-cover--${size}`} style={{ background: th.bg }} onClick={() => onOpen(a)}>
      <span className="ins-cover__blob ins-cover__blob--1" aria-hidden="true" />
      <span className="ins-cover__blob ins-cover__blob--2" aria-hidden="true" />
      <span className="ins-cover__chip">{a.tag}</span>
      <span className="ins-cover__icon" aria-hidden="true"><TopicIcon name={th.icon} size={size === 'big' ? 22 : 17} /></span>
      <span className="ins-cover__title">{a.title}</span>
      {size === 'big' ? <span className="ins-cover__excerpt">{a.summary}</span> : null}
      <span className="ins-cover__meta">
        <span>{a.minutes} min read</span>
        {size === 'big' ? <span className="ins-cover__go">Read</span> : null}
      </span>
    </button>
  );
}

// Insights: magazine-style tiles. One article fills the card; with more, the
// newest is a large cover beside up to two smaller covers. "See all" opens the
// full library when there are more than three.
export default function InsightsCard({ stage = 'school' }) {
  const articles = insightsFor(stage);
  const [open, setOpen] = useState(null);        // article being read
  const [library, setLibrary] = useState(false); // full list open

  useEffect(() => {
    if (!open && !library) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (open) setOpen(null); else setLibrary(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, library]);

  const [lead, ...rest] = articles;
  const side = rest.slice(0, 2);
  // Phones: a swipeable carousel of full covers (CSS decides which layout shows).
  const trackRef = useRef(null);
  const [slide, setSlide] = useState(0);
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const w = el.children[0].getBoundingClientRect().width + 12;
    setSlide(Math.max(0, Math.min(articles.length - 1, Math.round(el.scrollLeft / w))));
  };
  const goTo = (i) => {
    const el = trackRef.current;
    if (!el || !el.children[i]) return;
    el.scrollTo({ left: el.children[i].offsetLeft - el.children[0].offsetLeft, behavior: 'smooth' });
  };

  return (
    <section className="ins-card">
      <div className="ins-head">
        <div>
          <h2 className="ins-title">Insights</h2>
          <p className="ins-sub">Advice and news from the CareerDNA team</p>
        </div>
        {articles.length > 3 ? (
          <button type="button" className="ins-seeall" onClick={() => setLibrary(true)}>See all {articles.length} →</button>
        ) : null}
      </div>

      {lead && articles.length > 1 ? (
        <div className="ins-carousel">
          <div className="ins-carousel__track" ref={trackRef} onScroll={onTrackScroll}>
            {articles.map((a) => <Cover key={a.id} a={a} size="big" onOpen={setOpen} />)}
          </div>
          <div className="ins-carousel__dots" role="tablist" aria-label="Choose article">
            {articles.map((a, i) => (
              <button key={a.id} type="button" role="tab" aria-selected={i === slide} aria-label={a.title} className={i === slide ? 'is-on' : ''} onClick={() => goTo(i)} />
            ))}
          </div>
        </div>
      ) : null}
      {lead ? (
        <div className={`ins-tiles${side.length ? '' : ' ins-tiles--one'}`}>
          <Cover a={lead} size="big" onOpen={setOpen} />
          {side.length ? (
            <div className={`ins-side ins-side--${side.length}`}>
              {side.map((a) => <Cover key={a.id} a={a} size="small" onOpen={setOpen} />)}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="ins-empty">New articles are on their way.</p>
      )}

      {library && !open ? createPortal(
        <div className="ins-overlay" role="dialog" aria-modal="true" aria-label="All insights" onClick={(e) => { if (e.target === e.currentTarget) setLibrary(false); }}>
          <div className="ins-reader">
            <button type="button" className="ins-close" onClick={() => setLibrary(false)} aria-label="Close">×</button>
            <h2 className="ins-reader__title">Insights</h2>
            <div className="ins-lib">
              {articles.map((a) => {
                const th = themeFor(a.tag);
                return (
                  <button key={a.id} type="button" className="ins-lib__row" onClick={() => setOpen(a)}>
                    <span className="ins-lib__ic" style={{ background: th.bg }}><TopicIcon name={th.icon} /></span>
                    <span className="ins-lib__text">
                      <span className="ins-lib__title">{a.title}</span>
                      <span className="ins-lib__meta">{a.tag} · {a.minutes} min read</span>
                    </span>
                    <span className="ins-lib__chev" aria-hidden="true">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {open ? createPortal(
        <div className="ins-overlay" role="dialog" aria-modal="true" aria-label={open.title} onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <article className="ins-reader ins-reader--article">
            <div className="ins-reader__hero" style={{ background: themeFor(open.tag).bg }}>
              <span className="ins-cover__blob ins-cover__blob--1" aria-hidden="true" />
              <span className="ins-cover__chip">{open.tag}</span>
              <h2 className="ins-reader__herotitle">{open.title}</h2>
              <span className="ins-reader__herometa">{open.minutes} min read</span>
            </div>
            <button type="button" className="ins-close ins-close--light" onClick={() => setOpen(null)} aria-label="Close">×</button>
            <div className="ins-reader__body"><ArticleBody body={open.body} /></div>
          </article>
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
