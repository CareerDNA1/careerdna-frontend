// components/landing/HowSection.js
import React, { useEffect, useRef } from 'react';
import './HowSection.css';

export default function HowSection() {
  const sectionRef = useRef(null);

  // Desktop-only scroll reveal (mirrors WhySection)
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
    <section ref={sectionRef} id="how" className="how-section section" aria-labelledby="how-heading">
      <div className="section-inner">
        <h2 id="how-heading">How CareerDNA Works</h2>

        <div className="how-grid">
          {/* Card 1 */}
          <article className="how-card reveal-card" aria-labelledby="how-step1">
            <div className="step-badge">1</div>
            <h3 id="how-step1">Take the career DNA assessment</h3>
            <p>
              Answer an engaging set of questions built on psychology and behavioural science. Designed by career experts, it reveals unique patterns in your personality, interests, values and working style.
            
            </p>
          </article>

          {/* Card 2 */}
          <article className="how-card reveal-card step-2" aria-labelledby="how-step2">
            <div className="step-badge">2</div>
            <h3 id="how-step2">See your CareerDNA profile</h3>
            <p>
              Your answers are combined into one clear, multidimensional profile. It maps your unique blend across the four dimensions and shows how you connect to the seven powerful CareerDNA profiles.
            </p>
          </article>

          {/* Card 3 */}
          <article className="how-card reveal-card step-3" aria-labelledby="how-step3">
            <div className="step-badge">3</div>
            <h3 id="how-step3">Read the story behind your data</h3>
            <p>
            Our custom AI engine analyses your results and generates a personalised narrative. It explains the patters behind your profile and highlights study paths and careers that align with your profile.
           </p>
          </article>

          {/* Card 4 */}
          <article className="how-card reveal-card step-4" aria-labelledby="how-step4">
            <div className="step-badge">4</div>
            <h3 id="how-step4">Put insights into action</h3>
            <p>
              Use your CareerDNA to make confident subject and career choices, strengthen applications and guide conversations with parents, advisors or employers. Revisit your profile as you grow and your interests evolve.
            </p>
          </article>
        </div>

        </div>
    </section>
  );
}
