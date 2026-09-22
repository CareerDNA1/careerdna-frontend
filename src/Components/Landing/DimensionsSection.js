import React, { useEffect, useRef, useState } from 'react';
import './DimensionsSection.css';
import whoImage from '../../Assets/images/who_you_are.jpg';
import loveImage from '../../Assets/images/what_you_love.jpg';
import mattersImage from '../../Assets/images/what_matters.jpg';
import workImage from '../../Assets/images/how_you_work.jpg';

const dimensions = [
  {
    label: 'Who You Are',
    lead: 'personality',
    backTitle: 'Who you are',
    image: whoImage,
    description:
      'How you naturally think, feel, decide and connect with the world around you.',
  },
  {
    label: 'What You Love',
    lead: 'interests',
    backTitle: 'What you love',
    image: loveImage,
    description:
      'The subjects, activities and ideas that spark your curiosity, energy and motivation.',
  },
  {
    label: 'What Matters',
    lead: 'values',
    backTitle: 'What matters',
    image: mattersImage,
    description:
      'The priorities and principles that shape what feels meaningful, rewarding and right for you.',
  },
  {
    label: 'How You Work Best',
    lead: 'style',
    backTitle: 'How you work best',
    image: workImage,
    description:
      'The environments, habits and rhythms that help you focus, perform and thrive.',
  },
];

export default function DimensionsSection() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const [flippedIndex, setFlippedIndex] = useState(null);
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const demoFlipPlayedRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      // Phones (narrow / touch) always say "Tap", even if they report hover.
      setIsHoverDevice(hoverCapable && window.innerWidth > 640);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const sec = sectionRef.current;
    const grid = gridRef.current;
    if (!sec || !grid) return;

    const shouldAnimate = () => window.matchMedia('(min-width: 768px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!shouldAnimate() || prefersReduced) {
      sec.classList.add('story-visible');
      return;
    }

    sec.classList.add('anim-ready');

    const replay = () => {
      if (!shouldAnimate()) return;
      sec.classList.add('story-visible');
      grid.classList.remove('play-fan');
      // eslint-disable-next-line no-unused-expressions
      grid.offsetWidth;
      grid.classList.add('play-fan');

      const isTouchTablet = window.matchMedia(
        '(min-width: 768px) and (max-width: 1366px) and (hover: none) and (pointer: coarse)'
      ).matches;

      if (isTouchTablet && !demoFlipPlayedRef.current) {
        demoFlipPlayedRef.current = true;
        window.setTimeout(() => sec.classList.add('demo-flip'), 900);
        window.setTimeout(() => sec.classList.remove('demo-flip'), 2100);
      }
    };

    const reset = () => {
      sec.classList.remove('story-visible');
      grid.classList.remove('play-fan');
    };

    const rect = sec.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < viewportHeight * 0.78 && rect.bottom > viewportHeight * 0.12) {
      window.requestAnimationFrame(replay);
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!shouldAnimate()) return;
          if (entry.isIntersecting) {
            replay();
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.18,
        rootMargin: '-8% 0px -14% 0px',
      }
    );

    io.observe(sec);

    const onResize = () => {
      reset();
      if (shouldAnimate()) window.requestAnimationFrame(replay);
    };
    window.addEventListener('resize', onResize);

    return () => {
      io.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const handleDimensionClick = (idx) => {
    // any touch device (phones included) toggles the flip via the .is-flipped
    // class. Was restricted to 768-1366, which excluded phones entirely.
    // Desktop keeps hover-to-flip (hover: hover), so it's unaffected.
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!isTouch) return;
    setFlippedIndex((current) => (current === idx ? null : idx));
  };

  return (
    <section id="dimensions" className="dimensions-section section" ref={sectionRef}>
      <div className="section-inner">
        <h2>The four core dimensions</h2>
        <p className="intro-text">
          CareerDNA brings all four dimensions of career identity together in one profile.
          This creates a complete picture of the whole person, helping students make clearer, smarter and more
          confident subject and career decisions.
        </p>
        <div ref={gridRef} className="dimension-grid dimensions-grid">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="dimension-wrapper">
              <button
                type="button"
                className={`dimension-card ${flippedIndex === idx ? 'is-flipped' : ''}`}
                aria-label={`${dim.backTitle}: ${dim.description}`}
                aria-pressed={flippedIndex === idx}
                onClick={() => handleDimensionClick(idx)}
              >
                <span className="dimension-card-inner">
                  <span className="dimension-card-face dimension-card-front">
                    <img src={dim.image} alt="" loading="lazy" aria-hidden="true" />
                  </span>
                  <span className="dimension-card-face dimension-card-back">
                    <strong className="dimension-back-title">{dim.backTitle}</strong>
                    <span className="dimension-back-line" aria-hidden="true" />
                    <span className="dimension-back-text">{dim.description}</span>
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>

        <p className="dimension-tap-hint" aria-hidden="true">
          {isHoverDevice ? 'Hover over a card to explore' : 'Tap a card to explore'}
        </p>
      </div>
    </section>
  );
}
