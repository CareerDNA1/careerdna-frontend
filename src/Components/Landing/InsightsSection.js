import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import INSIGHTS from '../../data/insights';
import { Cover } from '../Common/InsightsCard';
import '../Common/InsightsCard.css';
import './InsightsSection.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'school', label: 'At school' },
  { id: 'university', label: 'At university' },
];

// Landing page: research and advice articles, as a carousel of covers that
// link to each article's own page. Sits between The Science and the final CTA.
export default function InsightsSection() {
  const [filter, setFilter] = useState('all');
  const articles = useMemo(
    () => INSIGHTS.filter((a) => filter === 'all' || a.audience === 'all' || a.audience === filter),
    [filter],
  );

  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  useEffect(() => { onScroll(); });
  useEffect(() => { trackRef.current?.scrollTo({ left: 0 }); }, [filter]);

  const step = (dir) => {
    const el = trackRef.current;
    if (!el || !el.children.length) return;
    const base = el.children[0].offsetLeft;
    const lefts = [...el.children].map((c) => c.offsetLeft - base);
    const x = el.scrollLeft;
    const target = dir > 0 ? lefts.find((l) => l > x + 4) : [...lefts].reverse().find((l) => l < x - 4);
    el.scrollTo({ left: target ?? (dir > 0 ? el.scrollWidth : 0), behavior: 'smooth' });
  };

  return (
    <section id="insights" className="insights-section section" aria-labelledby="insights-heading">
      <div className="insights-inner">
        <h2 id="insights-heading" className="insights-heading">
          <span className="insights-heading-dark">Insights from </span>
          <span className="insights-heading-blue">CareerDNA</span>
          <span className="insights-heading-line" aria-hidden="true" />
        </h2>
        <p className="insights-lede">
          Short, evidence-based reads for students, parents and advisors, drawing on the latest research from universities,
          employers and organisations such as the OECD and the World Economic Forum.
        </p>

        <div className="insights-bar">
          <div className="insights-filters" role="group" aria-label="Show articles for">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`insights-chip${filter === f.id ? ' is-on' : ''}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ins-arrows">
            <button type="button" className="ins-arrow" onClick={() => step(-1)} disabled={atStart} aria-label="Previous articles">‹</button>
            <button type="button" className="ins-arrow" onClick={() => step(1)} disabled={atEnd} aria-label="More articles">›</button>
          </div>
        </div>

        <div className="insights-track" ref={trackRef} onScroll={onScroll}>
          {articles.map((a) => <Cover key={a.id} a={a} size="big" href={`/insights/${a.id}`} />)}
        </div>

        <div className="insights-more">
          <Link to="/insights" className="insights-all">See all insights <span aria-hidden="true">›</span></Link>
        </div>
      </div>
    </section>
  );
}
