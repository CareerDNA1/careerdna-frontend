// components/landing/ScienceSection.js

import React, { useEffect, useRef } from 'react';
import './ScienceSection.css';
import { FaFlask, FaUserGraduate, FaRobot } from 'react-icons/fa';

export default function ScienceSection() {
  const sectionRef = useRef(null);

  // Desktop-only scroll reveal (same engine pattern as Why / How)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const isDesktop = window.matchMedia('(min-width: 981px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isDesktop || prefersReduced) return;

    el.classList.add('anim-ready');

    // Ensure elements have the reveal class without changing your markup
    const heading = el.querySelector('h2');
    if (heading && !heading.classList.contains('reveal-card')) heading.classList.add('reveal-card');
    const cards = Array.from(el.querySelectorAll('.science-card'));
    cards.forEach((c) => c.classList.add('reveal-card'));

    const targets = [heading, ...cards].filter(Boolean);

    // Stagger left→right like How
    cards.forEach((c, i) => c.style.setProperty('--delay', `${i * 160}ms`));

    // Reveal any already-in-view nodes
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
    <section ref={sectionRef} id="science" className="science-section section">
      <div className="section-inner">
        <h2>The Science Behind CareerDNA</h2>
        <div className="science-grid">
          <div className="science-card">
            <div className="science-icon"><FaFlask /></div>
            <h3>Built on latest career science </h3>
            <p>
              CareerDNA brings together the latest research from psychology, behavioural and data sciences to help you understand how you think, what drives you and where you're most likely to thrive.
            </p>
          </div>

          <div className="science-card">
            <div className="science-icon"><FaUserGraduate /></div>
            <h3>Designed around students</h3>
            <p>
              Everything is shaped by how real students learn, reflect and make decisions. The questions, structure and feedback are built to feel relevant, engaging and easy to connect with.
            </p>
          </div>

          <div className="science-card">
            <div className="science-icon"><FaRobot /></div>
            <h3>Purpose-Built AI for Career Insight</h3>
            <p>
              CareerDNA uses its own bespoke algorithm and AI prompting engine, built to translate your answers into guidance that feels personal and relevant.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
