import React, { useEffect, useRef } from 'react';
import './Hero.css';
import heroImage from '../../Assets/images/hero-dna4.jpg';
import Button from '../Common/Button';

export default function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    let ticking = false;

    const updateHeroMotion = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const rawProgress = -rect.top / Math.max(viewportHeight, 1);
      const progress = Math.max(0, Math.min(1, rawProgress));
      const visible = rect.bottom > viewportHeight * 0.08 && rect.top < viewportHeight * 0.92;

      // iPad/iPhone fallback for background-attachment: fixed.
      // The background layer is fixed, then nudged as the user scrolls so the image visibly slides.
      el.style.setProperty('--hero-bg-opacity', visible ? '1' : '0');
      el.style.setProperty('--hero-scroll-x', `${progress * 60}px`);
      el.style.setProperty('--hero-scroll-y', `${progress * 150}px`);
      el.style.setProperty('--hero-scroll-scale', String(1 + progress * 0.09));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeroMotion);
      }
    };

    updateHeroMotion();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const scrollToStart = () => {
    const target = document.getElementById('start');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    else console.warn('Could not find target element with id="start"');
  };

  return (
    <section
      ref={heroRef}
      className="hero"
      aria-label="CareerDNA landing hero"
    >
      <div
        className="hero-bg-motion"
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden="true"
      />
      <div className="hero-top-fade" aria-hidden="true" />

      <div className="hero-overlay">
        <h1 className="hero-title">
          <span className="no-break">The science of</span>
          <span className="accent">building your future</span>
        </h1>

        <div className="hero-title-line" aria-hidden="true" />

        <p className="hero-combined">
          CareerDNA is a breakthrough career discovery platform for students and early-career explorers.
          By combining psychology, behavioural science and AI, it helps you understand what drives you and
          make smarter choices about your future.
        </p>

        <div className="cta-button-wrapper">
          <Button
            type="primary"
            size="xl"
            className="hero-variant"
            onClick={scrollToStart}
            aria-label="Start your journey"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </section>
  );
}
