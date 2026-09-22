// components/landing/HowSection.js
import React, { useEffect, useRef } from 'react';
import './HowSection.css';
import howImage from '../../Assets/images/hero-dna4.jpg';
import {
  ClipboardCheck,
  UserRound,
  ChartBarBig,
  Sparkles,
  BrainCircuit,
  Heart,
  SlidersHorizontal,
  BriefcaseBusiness,
  Grip,
  Gauge,
  Search,
  GraduationCap,
  MessagesSquare,
  Compass,
  MessageCircleQuestion,
  Route,
  CheckCircle2,
} from 'lucide-react';

const steps = [
  {
    variant: 'how-card--discover',
    icon: ClipboardCheck,
    title: 'Build your CareerDNA',
        body: 'Answer 100 carefully designed questions about how you think, what motivates you and how you like to work. In about 15 minutes, CareerDNA builds a detailed picture of the patterns that make you unique.',
    detailTitle: 'Assessment explores',
    detailType: 'bullets',
    details: [
      { icon: BrainCircuit, label: 'Personality' },
      { icon: Heart, label: 'Motivation' },
      { icon: Search, label: 'Interests' },
      { icon: SlidersHorizontal, label: 'Working style' },
    ],
  },
  {
    variant: 'how-card--profile',
    icon: UserRound,
    title: 'Discover your career identity',
    body: 'Your answers are transformed into a personal CareerDNA profile: your strengths, motivations and the way you work best, mapped across 25 traits and seven career profiles. It’s the clearest read of yourself you’ve probably ever had on a page.',
    detailTitle: 'Your profile shows',
    detailType: 'chips',
    details: [
      { icon: Grip, label: '7 Career Profiles' },
      { icon: ChartBarBig, label: '25 Dimensions' },
      { icon: Gauge, label: 'Profile clarity' },
      { icon: UserRound, label: 'Self-insight' },
    ],
  },
  {
    variant: 'how-card--potential',
    icon: Sparkles,
    title: 'Explore where you could thrive',
    body: 'Explore the subjects, work environments and career paths that fit your profile best. From university degrees and apprenticeships to specific career roles, each with a clear match strength, along with subject rankings, your chances of getting in and the graduate jobs and internships open right now.',
    detailTitle: 'Explore options across',
    detailType: 'chips',
    details: [
      { icon: BriefcaseBusiness, label: 'Career Worlds' },
      { icon: Route, label: 'Pathways' },
      { icon: GraduationCap, label: 'Course rankings' },
      { icon: Compass, label: 'Roles & jobs' },
    ],
  },
  {
    variant: 'how-card--guidance',
    icon: MessagesSquare,
    title: 'Turn insight into action',
    body: "Use CareerDNA as your personal career guide. Ask it anything about your strengths, results or matches, compare the options you're weighing up, put your profile into words for applications and save the courses, careers and openings you like. When it's time to apply, you already know where and why.",
    detailTitle: 'CareerDNA can help you',
    detailType: 'bullets',
    details: [
      { icon: MessageCircleQuestion, label: 'Ask about your results' },
      { icon: Compass, label: 'Compare your options' },
      { icon: CheckCircle2, label: 'Build a shortlist' },
      { icon: GraduationCap, label: 'Prepare your applications' },
    ],
  },
];

export default function HowSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    const cards = Array.from(el.querySelectorAll('.how-card'));
    const grid = el.querySelector('.how-grid');
    // was 768 — excluded phones from the reveal entirely. 360 lets phones animate too.
    const canAnimate = window.matchMedia('(min-width: 360px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ticking = false;

    const updateHowBackgroundMotion = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      // One fixed, hero-style background layer on ALL devices: it stays anchored to
      // the viewport so the content floats over it (the same slow effect as the
      // hero and iPad/iPhone). Faded in only while the section is on screen,
      // otherwise a fixed layer would show over the other sections too.
      const visible = rect.bottom > viewportHeight * 0.08 && rect.top < viewportHeight * 0.92;
      el.style.setProperty('--how-bg-opacity', (prefersReduced || visible) ? '1' : '0');
    };

    const requestHowBackgroundMotion = () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateHowBackgroundMotion); }
    };

    updateHowBackgroundMotion();
    window.addEventListener('scroll', requestHowBackgroundMotion, { passive: true });
    window.addEventListener('resize', requestHowBackgroundMotion);

    if (!canAnimate || prefersReduced) {
      el.classList.add('story-visible');
      cards.forEach((card) => card.classList.add('is-revealed'));
      grid?.classList.add('path-visible');
      return undefined;
    }

    el.classList.add('anim-ready');
    cards.forEach((card) => card.classList.add('reveal-card'));

    // Section-level: heading + the connector rail.
    const observer = new IntersectionObserver(
      ([entry]) => {
        // One-way: reveal on enter, never re-hide (re-adding a class is a no-op).
        if (entry.isIntersecting) {
          el.classList.add('story-visible');
          grid?.classList.add('path-visible');
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(el);

    // Per-CARD: each card fades up as it reaches the viewport, one by one on scroll
    // (matches the Why section). In a desktop row they enter together, so it still
    // reads as a single reveal there. One-way — unobserve once shown.
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
      window.removeEventListener('scroll', requestHowBackgroundMotion);
      window.removeEventListener('resize', requestHowBackgroundMotion);
    };
  }, []);

  return (
    <section ref={sectionRef} id="how" className="how-section section" aria-labelledby="how-heading">
      <div
        className="how-bg-motion"
        style={{ backgroundImage: `url(${howImage})` }}
        aria-hidden="true"
      />
      <div className="section-inner">
        <h2 id="how-heading" className="how-heading">
          <span className="how-heading-white">Your </span>
          <span className="how-heading-blue">CareerDNA</span>
          <span className="how-heading-white"> journey</span>
          <span className="how-heading-line" aria-hidden="true" />
        </h2>

        <div className="how-grid">
          {steps.map(({ variant, icon: Icon, title, body, detailTitle, detailType, details }, index) => (
            <article className={`how-card ${variant} reveal-card`} aria-labelledby={`how-step${index + 1}`} key={title}>
              <div className="how-icon-circle" aria-hidden="true">
                <Icon size={24} strokeWidth={1.7} />
              </div>

              <h3 id={`how-step${index + 1}`}>{title}</h3>
              <p>{body}</p>

              <div className="how-card-detail">
                <h4>{detailTitle}</h4>

                {detailType === 'bullets' && (
                  <ul className="how-bullet-list">
                    {details.map(({ icon: DetailIcon, label }) => (
                      <li key={label}>
                        <DetailIcon size={15} strokeWidth={1.8} aria-hidden="true" />
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {detailType === 'chips' && (
                  <div className="how-chip-grid">
                    {details.map(({ icon: ChipIcon, label }) => (
                      <span className="how-chip" key={label}>
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
