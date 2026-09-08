// components/landing/ScienceSection.js

import React, { useEffect, useRef } from 'react';
import './ScienceSection.css';
import scienceImage from '../../Assets/images/hero-dna2.jpg';
import {
  BrainCircuit,
  Network,
  Sparkles,
  ClipboardCheck,
  Grip,
  UsersRound,
  Database,
  Search,
  Compass,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

const scienceCards = [
  {
    variant: 'science-card--science',
    icon: BrainCircuit,
    title: 'The science of career identity',
    body: 'CareerDNA combines behavioural science, vocational psychology, motivation research and career development theory into a single career identity framework. By analysing the patterns that shape how people think, engage, decide and perform, it provides a deeper understanding of what drives long-term fulfilment and success.',
    detailTitle: 'Built on',
    detailType: 'stats',
    details: [
      { icon: ClipboardCheck, value: '100', label: 'Assessment Items' },
      { icon: Grip, value: '4', label: 'Career Identity Dimensions' },
      { icon: UsersRound, value: '25', label: 'Behavioural Traits' },
      { icon: Database, value: '7', label: 'Career Identity Profiles' },
    ],
  },
  {
    variant: 'science-card--engine',
    icon: Network,
    title: 'The matching engine',
    body: 'At the heart of CareerDNA is a proprietary intelligence engine that transforms behavioural data into personalised recommendations. By combining psychological patterns, career identity signals and pathway intelligence, it identifies the environments, subjects and opportunities where you are most likely to thrive.',
    detailTitle: 'Matches against',
    detailType: 'stats',
    details: [
      { icon: Search, value: '21', label: 'Strength Themes' },
      { icon: Compass, value: '18', label: 'Thrive Environments' },
      { icon: MessageSquare, value: '114', label: 'Academic Pathways' },
      { icon: CheckCircle2, value: '444', label: 'Career Pathways' },
    ],
  },
  {
    variant: 'science-card--insight',
    icon: Sparkles,
    title: 'AI-powered career insight',
    body: 'Behind the scenes, CareerDNA uses a bespoke AI intelligence engine designed specifically for career discovery. By combining your results, profile patterns and recommendation matches, it creates personalised explanations, answers your questions and helps you explore future possibilities with greater confidence and clarity.',
    detailTitle: 'Helps you',
    detailType: 'chips',
    details: [
      { icon: Search, label: 'Decode your profile' },
      { icon: Compass, label: 'Explore opportunities' },
      { icon: MessageSquare, label: 'Clarify your thinking' },
      { icon: CheckCircle2, label: 'Plan your next steps' },
    ],
  },
];

export default function ScienceSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    const cards = Array.from(el.querySelectorAll('.science-card'));
    const grid = el.querySelector('.science-grid');
    // was 768 — excluded phones from the reveal entirely. 360 lets phones animate too.
    const canAnimate = window.matchMedia('(min-width: 360px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ticking = false;

    const updateScienceBackgroundMotion = () => {
      ticking = false;

      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      // One fixed, hero-style background layer on ALL devices: it stays anchored to
      // the viewport so the content floats over it (the same slow effect as the
      // hero and iPad/iPhone). We only fade it in while the section is on screen,
      // otherwise a fixed layer would show over the other sections too.
      const visible = rect.bottom > viewportHeight * 0.08 && rect.top < viewportHeight * 0.92;
      el.style.setProperty('--science-bg-opacity', (prefersReduced || visible) ? '1' : '0');
    };

    const requestScienceBackgroundMotion = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScienceBackgroundMotion);
      }
    };

    if (!canAnimate || prefersReduced) {
      el.classList.add('story-visible');
      cards.forEach((card) => card.classList.add('is-revealed'));
      grid?.classList.add('path-visible');
      updateScienceBackgroundMotion();
      window.addEventListener('scroll', requestScienceBackgroundMotion, { passive: true });
      window.addEventListener('resize', requestScienceBackgroundMotion);

      return () => {
        window.removeEventListener('scroll', requestScienceBackgroundMotion);
        window.removeEventListener('resize', requestScienceBackgroundMotion);
      };
    }

    el.classList.add('anim-ready');
    cards.forEach((card) => card.classList.add('reveal-card'));

    updateScienceBackgroundMotion();
    window.addEventListener('scroll', requestScienceBackgroundMotion, { passive: true });
    window.addEventListener('resize', requestScienceBackgroundMotion);

    // Section-level: heading + connector rail.
    const observer = new IntersectionObserver(
      ([entry]) => {
        // One-way: reveal on enter, never re-hide.
        if (entry.isIntersecting) {
          el.classList.add('story-visible');
          grid?.classList.add('path-visible');
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(el);

    // Per-CARD reveal on scroll — matches the Why section. One-way.
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // One-way: add on enter, never remove — so it doesn't replay on scroll-back.
          if (entry.isIntersecting) entry.target.classList.add('is-revealed');
        });
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' }
    );
    cards.forEach((card) => cardObserver.observe(card));

    return () => {
      observer.disconnect();
      cardObserver.disconnect();
      window.removeEventListener('scroll', requestScienceBackgroundMotion);
      window.removeEventListener('resize', requestScienceBackgroundMotion);
    };
  }, []);

  return (
    <section ref={sectionRef} id="science" className="science-section section" aria-labelledby="science-heading">
      <div
        className="science-bg-motion"
        style={{ backgroundImage: `url(${scienceImage})` }}
        aria-hidden="true"
      />

      <div className="section-inner">
        <h2 id="science-heading" className="science-heading">
          <span className="science-heading-white">The science behind </span>
          <span className="science-heading-blue">CareerDNA</span>
          <span className="science-heading-line" aria-hidden="true" />
        </h2>

        <div className="science-grid">
          {scienceCards.map(({ variant, icon: Icon, title, body, detailTitle, detailType, details }, index) => (
            <article className={`science-card ${variant} reveal-card`} aria-labelledby={`science-card${index + 1}`} key={title}>
              <div className="science-icon-circle" aria-hidden="true">
                <Icon size={26} strokeWidth={1.7} />
              </div>

              <h3 id={`science-card${index + 1}`}>{title}</h3>
              <p>{body}</p>

              <div className="science-card-detail">
                <h4>{detailTitle}</h4>

                {detailType === 'bullets' && (
                  <ul className="science-bullet-list">
                    {details.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}

                {detailType === 'stats' && (
                  <div className="science-stat-row">
                    {details.map(({ icon: StatIcon, value, label }) => (
                      <div className="science-stat" key={label}>
                        <StatIcon size={20} strokeWidth={1.7} aria-hidden="true" />
                        <strong>{value}</strong>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {detailType === 'chips' && (
                  <div className="science-chip-grid">
                    {details.map(({ icon: ChipIcon, label }) => (
                      <span className="science-chip" key={label}>
                        <ChipIcon size={14} strokeWidth={1.8} aria-hidden="true" />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
