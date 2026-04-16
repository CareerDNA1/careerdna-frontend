import React, { useEffect, useId, useRef, useState } from 'react';
import './WhySection.css';
import { Compass, BarChart2, Brain } from 'lucide-react';

/** Reusable evidence line with accessible hover/focus tooltip */
function Evidence({ children, source }) {
  const [open, setOpen] = useState(false);
  const tid = useId();
  return (
    <div
      className="stat-quote evidence"
      aria-describedby={tid}
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <span id={tid} role="tooltip" className={`evidence-tooltip ${open ? 'show' : ''}`}>
        {source}
      </span>
    </div>
  );
}

export default function WhySection() {
  const sectionRef = useRef(null);

  // Desktop-only, re-triggering reveal on scroll (respects reduced motion)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const isDesktop = window.matchMedia('(min-width: 981px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isDesktop || prefersReduced) return;

    el.classList.add('anim-ready');

    const targets = [
      ...el.querySelectorAll('.reveal-card'),
      ...el.querySelectorAll('.reveal-evidence'),
    ];

    // Stagger: cards left→right, then evidence left→right
    const cards = Array.from(el.querySelectorAll('.reveal-card'));
    const evidences = Array.from(el.querySelectorAll('.reveal-evidence'));
    cards.forEach((c, i) => c.style.setProperty('--delay', `${i * 160}ms`));
    evidences.forEach((c, i) => c.style.setProperty('--delay', `${260 + i * 160}ms`));

    // Reveal any targets already in view at mount
    const revealIfVisible = (node) => {
      const r = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.98 && r.bottom > 0) node.classList.add('is-revealed');
    };
    targets.forEach(revealIfVisible);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-revealed');
          else entry.target.classList.remove('is-revealed');
        });
      },
      { threshold: 0.01, rootMargin: '0px' }
    );

    targets.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="why" className="why-section section" aria-labelledby="why-heading">
      <div className="section-inner">
        <h2 id="why-heading">Why CareerDNA Matters</h2>

        {/* NEW: three columns; each column = card + its evidence */}
        <div className="why-grid">
          {/* Column 1 */}
          <div className="why-col">
            <article className="why-card reveal-card" aria-labelledby="why-problem">
              <div className="icon-circle" aria-hidden="true"><Compass size={20} /></div>
              <h3 id="why-problem" className="why-title">The early-choice trap</h3>
              <p className="why-body">
                Students are asked to make life-shaping decisions before they fully understand themselves. This often leads to choices that don’t fit well, affecting their confidence and career outcomes.
              </p>
            </article>

            <div className="evidence-col reveal-evidence">
              <Evidence source="HEPI Student Academic Experience Survey (2023)">
                <strong>40%</strong> of undergraduates say they would choose a different subject if they could.
              </Evidence>
              <Evidence source="Institute of Student Employers (2024)">
                <strong>60%</strong> of graduates say they would switch industry entirely within just three years.
              </Evidence>
            </div>
          </div>

          {/* Column 2 */}
          <div className="why-col">
            <article className="why-card reveal-card" aria-labelledby="why-market">
              <div className="icon-circle" aria-hidden="true"><BarChart2 size={20} /></div>
              <h3 id="why-market" className="why-title">The graduate market reality</h3>
              <p className="why-body">
                Technology, AI and new business models are reshaping early careers. Entry-level roles are fewer and competition is tougher. Employers now prize adaptability, AI literacy and human strengths over narrow technical skills.
              </p>
            </article>

            <div className="evidence-col reveal-evidence">
              <Evidence source="Financial Times (2025)">
                Graduate vacancies are at a <strong>five-year low</strong>, and outcomes are stalling.
              </Evidence>
              <Evidence source="World Economic Forum (2025)">
                <strong>30%</strong> of graduate jobs will be disrupted by 2030 as automation absorbs routine tasks once defining
                entry routes.
              </Evidence>
            </div>
          </div>

          {/* Column 3 */}
          <div className="why-col">
            <article className="why-card reveal-card" aria-labelledby="why-solution">
              <div className="icon-circle" aria-hidden="true"><Brain size={20} /></div>
              <h3 id="why-solution" className="why-title">The solution</h3>
              <p className="why-body">
                <span className="brand">CareerDNA</span> helps young people uncover how they think, what motivates them and where they thrive. With these insights, they can make better study and career choices and adapt with confidence as the world of work keeps shifting.
              </p>
            </article>

            <div className="evidence-col reveal-evidence">
              <Evidence source="Harvard Business Review (2018)">
                Self-awareness is the <strong>strongest</strong> predictor of career success, ahead of technical skill.
              </Evidence>
              <Evidence source="Korn Ferry Institute (2020)">
                People with higher self-awareness show <strong>20–30%</strong> higher job satisfaction and persistence, boosting
                long-term career success.
              </Evidence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
