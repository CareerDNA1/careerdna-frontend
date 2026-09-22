import React, { useEffect, useRef } from 'react';
import './WhySection.css';
import {
  Compass,
  BarChart2,
  Brain,
  Users,
  Briefcase,
  TrendingDown,
  Cpu,
  Star,
  GraduationCap,
} from 'lucide-react';

function Evidence({ children, source, icon: Icon }) {
  return (
    <div className="stat-quote evidence">
      {Icon && (
        <span className="evidence-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      )}
      <span className="evidence-text">{children}</span>
      <span className="evidence-source">Source: {source}</span>
    </div>
  );
}

export default function WhySection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // was 768px, which excluded phones entirely — they got everything dumped in at
    // once with no reveal. A phone is a pure vertical scroll, which is the ideal
    // case for the card-by-card reveal, so the gate now only skips tiny screens.
    const canAnimate = window.matchMedia('(min-width: 360px)').matches;

    if (!canAnimate || prefersReduced) {
      el.classList.add('story-visible');
      return undefined;
    }

    const columns = Array.from(el.querySelectorAll('.why-col'));
    el.classList.add('anim-ready');

    const cleanups = columns.map((column) => {
      const lockEvidenceOpen = () => {
        column.classList.add('evidence-revealed');
      };

      column.addEventListener('mouseenter', lockEvidenceOpen);
      column.addEventListener('focusin', lockEvidenceOpen);
      column.addEventListener('click', lockEvidenceOpen);

      return () => {
        column.removeEventListener('mouseenter', lockEvidenceOpen);
        column.removeEventListener('focusin', lockEvidenceOpen);
        column.removeEventListener('click', lockEvidenceOpen);
      };
    });

    let revealTimers = [];
    const clearRevealTimers = () => {
      revealTimers.forEach(window.clearTimeout);
      revealTimers = [];
    };

    // STAGE 1 — section scrolls into view: the three narrative cards appear.
    const reveal = () => {
      el.classList.add('story-visible');
    };

    const reset = () => {
      el.classList.remove('story-visible');
      // scrolled fully away — clear stage 2 and re-arm it so it can replay
      resetEvidence();
      observeEvidence();
      statCards.forEach((c) => c.classList.remove('q-in'));
      columns.forEach((c) => c.classList.remove('q-in'));
      observeCards();
    };

    /* STAGE 2 — the evidence.
       Anchored to each column's OWN .reveal-evidence element rather than to the
       section. Anchoring to the section did not work: by the time you have scrolled
       to the cards the section is already deep in view, so both stages fired at once.
       The collapsed evidence block sits directly beneath its card, so watching it
       means the reveal happens exactly when that part of the page arrives. */
    const evidenceAnchors = columns
      .map((column) => column.querySelector('.reveal-evidence'))
      .filter(Boolean);

    const resetEvidence = () => {
      clearRevealTimers();
      columns.forEach((column) => column.classList.remove('evidence-revealed'));
    };

    let hasRevealed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasRevealed = true;
          window.requestAnimationFrame(reveal);
        } else if (!hasRevealed) {
          reset();
        }
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    observer.observe(el);

    /* Reveal is ONE-WAY per anchor: once revealed we stop observing it. The evidence
       expands when revealed, which moves the anchor — if we kept observing, that
       movement could immediately un-trigger it and cause a flicker loop.
       rootMargin bottom -45% = fires when the anchor rises above the 55% line.
       Increase the 45% to make the evidence appear later, decrease for earlier. */
    const evidenceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const column = entry.target.closest('.why-col');
          if (column) column.classList.add('evidence-revealed');
          evidenceObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -45% 0px',
      }
    );

    const observeEvidence = () => evidenceAnchors.forEach((a) => evidenceObserver.observe(a));
    observeEvidence();

    /* Per-CARD reveal, used by the 2-column layout (768-1180) where the evidence
       column is permanently open. Each .stat-quote fades up as it reaches the
       viewport, so the right-hand column fills in one card at a time as you scroll.
       One-way, same reasoning as above. Harmless at >=1181: the class is added but
       no CSS listens for it there, so the column-level reveal is unaffected. */
    // narrative cards included so phones can reveal both card types as they scroll
    const statCards = Array.from(el.querySelectorAll('.stat-quote, .why-card'));

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('q-in');
          // mark the parent column too, so the phone timeline dot can fade in
          // without needing CSS :has() (which would hide dots if unsupported)
          if (entry.target.classList.contains('why-card')) {
            const col = entry.target.closest('.why-col');
            if (col) col.classList.add('q-in');
          }
          cardObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -18% 0px',
      }
    );

    const observeCards = () => statCards.forEach((c) => cardObserver.observe(c));
    observeCards();

    return () => {
      observer.disconnect();
      evidenceObserver.disconnect();
      cardObserver.disconnect();
      clearRevealTimers();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <section ref={sectionRef} id="why" className="why-section section" aria-labelledby="why-heading">
      <div className="section-inner">
        <h2 id="why-heading">
          <span className="why-heading-dark">Why </span>
          <span className="why-heading-blue">CareerDNA</span>
          <span className="why-heading-dark"> matters</span>
          <span className="why-heading-line" aria-hidden="true" />
        </h2>

        <div className="why-grid">
          <div className="why-col">
            <article className="why-card reveal-card" aria-labelledby="why-problem">
              <div className="icon-circle" aria-hidden="true"><Compass size={21} strokeWidth={1.8} /></div>
              <h3 id="why-problem" className="why-title">The early-choice trap</h3>
              <p className="why-body">
                Young people are asked to make subject and career choices before they fully understand themselves. The result is often a path that doesn’t fit, a knock to confidence and outcomes that are hard to undo.
              </p>
            </article>

            <div className="evidence-col reveal-evidence">
              <Evidence source="HEPI/Advance HE, Student Academic Experience Survey (2024)" icon={Users}>
                <strong className="stat-big">40%</strong> of undergraduates would make a different higher education choice if deciding again.
              </Evidence>
              <Evidence source="Prospects/Jisc, Early Careers Survey 2024." icon={Briefcase}>
                <strong className="stat-big">39%</strong> of early-careers respondents said their career plans had changed in the last year.
              </Evidence>
            </div>
          </div>

          <div className="why-col">
            <article className="why-card reveal-card" aria-labelledby="why-market">
              <div className="icon-circle" aria-hidden="true"><BarChart2 size={21} strokeWidth={1.8} /></div>
              <h3 id="why-market" className="why-title">The graduate market reality</h3>
              <p className="why-body">
                AI and automation are reshaping entry-level work. There are fewer graduate roles and more competition, and employers increasingly hire for adaptability and human strengths rather than a list of technical skills.
              </p>
            </article>

            <div className="evidence-col reveal-evidence">
              <Evidence source="Institute of Student Employers, Student Recruitment Survey 2025" icon={TrendingDown}>
                Graduate hiring fell by <strong className="stat-big">8%</strong> year-on-year, while the wider entry-level market declined by <strong className="stat-big">5%</strong>.
              </Evidence>
              <Evidence source="World Economic Forum, Future of Jobs Report 2025." icon={Cpu}>
                Employers expect <strong className="stat-big">39%</strong> of workers’ core skills to change by 2030 as technology reshapes work.
              </Evidence>
            </div>
          </div>

          <div className="why-col">
            <article className="why-card reveal-card" aria-labelledby="why-solution">
              <div className="icon-circle" aria-hidden="true"><Brain size={21} strokeWidth={1.8} /></div>
              <h3 id="why-solution" className="why-title">A smarter way forward</h3>
              <p className="why-body">
                Most people only find out which careers really suit them years after they&rsquo;ve chosen. {' '}
                <span className="brand">CareerDNA</span> brings that discovery forward, before you pick your subjects,
                your course or your first job. It builds a complete behavioural profile of you and matches it to the
                environments you&rsquo;d thrive in and the careers where people like you do well, so you get the big
                decisions right the first time.
              </p>
            </article>


            <div className="evidence-col reveal-evidence">
              <Evidence source="NACE Career Readiness Competencies (2025)" icon={Star}>
                Career self-development and awareness are recognised as core career readiness competencies.
              </Evidence>
              <Evidence source="OECD Career Readiness Indicators (2021)" icon={GraduationCap}>
                Evidence across <strong>8 countries</strong> links teenage career exploration with better adult employment outcomes.
              </Evidence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
