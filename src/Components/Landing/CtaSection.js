import React from 'react';
import './CtaSection.css';
import { useNavigate } from 'react-router-dom';
import Button from '../Common/Button';
import { useAuth } from '../../context/AuthContext';
import dnaWhiteLogo from '../../Assets/images/logo-dna-white.png';

export default function CtaSection() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [opening, setOpening] = React.useState(false);

  React.useEffect(() => {
    const section = document.querySelector('.cta-section.reveal');
    if (!section) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      section.classList.add('is-in');
      return;
    }

    if (!('IntersectionObserver' in window)) {
      section.classList.add('is-in');
      return;
    }

    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < viewportHeight * 0.82 && rect.bottom > viewportHeight * 0.12) {
      window.requestAnimationFrame(() => section.classList.add('is-in'));
    }

    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          section.classList.add('is-in');
          obs.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: '-8% 0px -14% 0px' }
    );

    io.observe(section);
    return () => io.disconnect();
  }, []);

  const handleClick = () => {
    if (opening || authLoading) return;
    setOpening(true);

    if (user) {
      navigate('/profile');
      return;
    }

    navigate('/login', {
      state: { from: { pathname: '/profile' } },
    });
  };

  return (
    <section id="start" className="cta-section section reveal">
      <div className="section-inner">
        <h2>Ready to gain clarity about your future?</h2>

        <p>
          Take the CareerDNA assessment and discover the patterns that shape your strengths, interests, motivations and future opportunities. Your next step starts with understanding yourself.
        </p>

        <div className="cta-button-wrap">
          <Button
            type="primary"
            size="xl"
            shine
            loading={opening || authLoading}
            onClick={handleClick}
            aria-label="Try CareerDNA Now"
            htmlType="button"
            className="cta-btn"
            data-analytics="cta_try_careerdna"
          >
            <img
              src={dnaWhiteLogo}
              alt=""
              aria-hidden="true"
              style={{
                width: 16,
                height: 16,
                objectFit: 'contain',
                marginRight: 8,
                display: 'inline-block',
                verticalAlign: 'middle',
                flexShrink: 0,
                opacity: 0.60,
              }}
            />
            {opening || authLoading ? 'Opening…' : 'Try CareerDNA Now'}
          </Button>
        </div>

        <footer className="cta-footer" aria-label="CareerDNA footer">
          <p className="cta-footer-tagline">
            Science-backed career discovery for students and early career explorers.
          </p>

          <nav className="cta-footer-links" aria-label="Footer links">
            <a href="/legal#privacy">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="/legal#terms">Terms of Use</a>
            <span aria-hidden="true">·</span>
            <a href="mailto:hello@mycareerdna.io">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="#report-problem">Report a problem</a>
          </nav>

          <p className="cta-footer-copy">
            © 2026 CareerDNA. All rights reserved.
          </p>
        </footer>
      </div>
    </section>
  );
}
