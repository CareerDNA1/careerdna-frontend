import React from 'react';
import './Hero.css';
import heroImage from '../../Assets/images/hero-dna.png';
import Button from '../Common/Button';

export default function Hero() {
  const scrollToStart = () => {
    const target = document.getElementById('start');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    else console.warn('Could not find target element with id="start"');
  };

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
      aria-label="CareerDNA landing hero"
    >
      <div className="hero-overlay">
        <h1 className="hero-title">
          <span className="no-break">Discover the career</span>
          <span className="accent">you are made for.</span>
        </h1>

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
