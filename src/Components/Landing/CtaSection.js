import React from 'react';
import './CtaSection.css';
import { useNavigate } from 'react-router-dom';
import Button from '../Common/Button';

export default function CtaSection() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  // Optional: section reveal on scroll (kept as-is)
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
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && section.classList.add('is-in'),
      { threshold: 0.2 }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    navigate('/start');
  };

  return (
    <section id="start" className="cta-section section reveal">
      <div className="section-inner">
        <h2>Ready to Shape Your Career Journey?</h2>

        <p>
          Take the CareerDNA assessment. It is free to try, works on any device and offers a simple,
          powerful way to explore your identity and future direction.
        </p>

        <div className="cta-button-wrap">
          <Button
            type="primary"
            size="xl"
            shine
            loading={loading}
            onClick={handleClick}
            aria-label="Try CareerDNA Now"
            htmlType="button"
            className="cta-btn"
            data-analytics="cta_try_careerdna"
          >
            {loading ? 'Opening…' : 'Try CareerDNA Now'}
          </Button>
        </div>

        <p className="disclaimer">
          This is a beta version. We welcome feedback as we continue improving the experience.
        </p>
      </div>
    </section>
  );
}
