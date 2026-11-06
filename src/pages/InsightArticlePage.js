import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import INSIGHTS, { getInsight, AUTHOR } from '../data/insights';
import { ArticleBody, Byline, Sources, Cover, Buddy, themeFor } from '../Components/Common/InsightsCard';
import '../Components/Common/InsightsCard.css';
import './TeamPage.css';
import './InsightsPages.css';
import logo from '../Assets/images/logo-career-dna.png';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'school', label: 'At school' },
  { id: 'university', label: 'At university' },
];

const AUDIENCE_LABEL = { all: 'For students at school and university', school: 'For students at school and parents', university: 'For university students' };

function setMeta(title, description) {
  document.title = title;
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', 'description'); document.head.appendChild(tag); }
  tag.setAttribute('content', description);
}

// Same frame as Our Team and Trust & Security: logo top left, one link top
// right, the shared light background and the shared footer.
function PageShell({ children, back = 'home' }) {
  return (
    <main className="team-page insp-page">
      <header className="team-page-nav" aria-label="Insights navigation">
        <Link to="/" className="team-page-logo-link" aria-label="Back to CareerDNA home">
          <img src={logo} alt="CareerDNA Logo" className="team-page-logo" />
        </Link>
        {back === 'insights' ? (
          <Link to="/insights" className="team-page-home-link">
            <span aria-hidden="true" className="team-page-home-icon">‹</span>
            <span>All insights</span>
          </Link>
        ) : (
          <Link to="/" className="team-page-home-link" aria-label="Back to CareerDNA home">
            <span aria-hidden="true" className="team-page-home-icon">⌂</span>
            <span>Back to home</span>
            <span aria-hidden="true" className="team-page-home-arrow">›</span>
          </Link>
        )}
      </header>

      <section className="team-section insp-section">
        <div className="insp-inner">{children}</div>
      </section>

      <footer className="team-footer" aria-label="CareerDNA footer">
        <div className="team-footer-inner">
          <p className="team-footer-tagline">
            Science-backed career discovery for students and early career explorers.
          </p>
          <nav className="team-footer-links" aria-label="Footer links">
            <a href="/legal#privacy">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="/legal#terms">Terms of Use</a>
            <span aria-hidden="true">·</span>
            <a href="/trust-security#accessibility">Accessibility</a>
            <span aria-hidden="true">·</span>
            <a href="mailto:support@mycareerdna.io">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="#report-problem">Report a problem</a>
          </nav>
          <p className="team-footer-copy">© 2026 CareerDNA. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

// One article on its own page: shareable link, readable by search engines.
export function InsightArticlePage() {
  const { id } = useParams();
  const a = getInsight(id);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (a) setMeta(`${a.title} | CareerDNA Insights`, a.summary);
    else setMeta('Article not found | CareerDNA Insights', 'CareerDNA Insights');
  }, [a]);

  if (!a) {
    return (
      <PageShell>
        <div className="insp-missing">
          <h1>We couldn't find that article</h1>
          <p>It may have moved. <Link to="/insights">See all insights</Link>.</p>
        </div>
      </PageShell>
    );
  }

  const more = INSIGHTS.filter((x) => x.id !== a.id).slice(0, 3);
  return (
    <PageShell back="insights">
      <article className="insp-card">
        <header className="insp-hero" style={{ background: themeFor(a.tag).bg }}>
          <span className="ins-cover__blob ins-cover__blob--1" aria-hidden="true" />
          <span className="insp-hero__buddy" aria-hidden="true"><Buddy id={a.id} tag={a.tag} size={64} /></span>
          <span className="ins-cover__chip insp-hero__chip">{a.tag}</span>
          <h1 className="insp-hero__title">{a.title}</h1>
          <p className="insp-hero__meta">By {AUTHOR.name} · {a.minutes} min read · {AUDIENCE_LABEL[a.audience] || ''}</p>
        </header>
        <div className="ins-reader__body insp-body">
          <p className="insp-lead">{a.summary}</p>
          <ArticleBody body={a.body} sources={a.sources} />
          <Byline />
          <Sources sources={a.sources} />
        </div>
      </article>

      <h2 className="insp-more-title">More insights</h2>
      <div className="insp-grid">
        {more.map((x) => <Cover key={x.id} a={x} size="big" href={`/insights/${x.id}`} />)}
      </div>
    </PageShell>
  );
}

// All articles, with the same school / university filter as the landing page.
export default function InsightsIndexPage() {
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    window.scrollTo(0, 0);
    setMeta('Insights: research and careers advice | CareerDNA', 'Evidence-based careers advice for students at school and university, and their parents.');
  }, []);
  const list = INSIGHTS.filter((a) => filter === 'all' || a.audience === 'all' || a.audience === filter);
  return (
    <PageShell>
      <div className="team-heading">
        <h1>Insights from CareerDNA</h1>
        <p>Short, evidence-based reads for students, parents and advisors, drawing on the latest research from universities, employers and organisations such as the OECD and the World Economic Forum. Every claim links to its source.</p>
        <div className="team-section-divider" />
      </div>
      <div className="insights-filters insp-filters" role="group" aria-label="Show articles for">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`insights-chip${filter === f.id ? ' is-on' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      <div className="insp-grid">
        {list.map((x) => <Cover key={x.id} a={x} size="big" href={`/insights/${x.id}`} />)}
      </div>
    </PageShell>
  );
}
