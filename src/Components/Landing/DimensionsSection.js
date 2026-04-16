import React, { useEffect, useRef } from 'react';
import './DimensionsSection.css';
import whoImage from '../../Assets/images/who_you_are.png';
import loveImage from '../../Assets/images/what_you_love.png';
import mattersImage from '../../Assets/images/what_matters.png';
import workImage from '../../Assets/images/how_you_work.png';

const dimensions = [
  {
    label: 'Who You Are',
    lead: 'Your personality',
    image: whoImage,
    description:
      'The way you naturally think, feel and approach the world. It shapes how you handle challenges, make decisions and build relationships, giving you a clear view of your strengths and tendencies.',
  },
  {
    label: 'What You Love',
    lead: 'Your interests',
    image: loveImage,
    description:
      'The subjects, topics and activities that spark your curiosity and energy. These are the things you’re drawn to explore, learn about and spend time on, even when no one tells you to.',
  },
  {
    label: 'What Matters',
    lead: 'Your values',
    image: mattersImage,
    description:
      'The principles and priorities that guide your motivation and choices. From purpose and impact to recognition, belonging or security, they explain why certain options feel right for you.',
  },
  {
    label: 'How You Work Best',
    lead: 'Your style',
    image: workImage,
    description:
      'The environments and habits where you can thrive. Whether you prefer clear structure or flexibility, solo focus or collaboration, fast pace or steady rhythm, this shows how you perform at your best.',
  },
];

export default function DimensionsSection() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const sec = sectionRef.current;
    const grid = gridRef.current;
    if (!sec || !grid) return;

    const isDesktop = () => window.matchMedia('(min-width: 981px)').matches;

    // Helper to (re)start the CSS animation cleanly
    const replay = () => {
      if (!isDesktop()) return;
      grid.classList.remove('play-fan');   // reset
      // force reflow so CSS animation can restart
      // eslint-disable-next-line no-unused-expressions
      grid.offsetWidth;
      grid.classList.add('play-fan');      // play
    };

    // Run once if already in view on mount
    replay();

    // Toggle on enter/exit so it replays whenever you scroll back
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isDesktop()) return;
          if (entry.isIntersecting) {
            replay();
          } else {
            grid.classList.remove('play-fan'); // reset on exit
          }
        });
      },
      {
        root: null,
        threshold: 0.25,
        rootMargin: '-10% 0px -10% 0px',
      }
    );

    io.observe(sec);

    // Also handle desktop <-> mobile switches
    const onResize = () => {
      grid.classList.remove('play-fan');
      if (isDesktop()) replay();
    };
    window.addEventListener('resize', onResize);

    return () => {
      io.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section id="dimensions" className="dimensions-section section" ref={sectionRef}>
      <div className="section-inner">
        <h2>Your Four Core Dimensions</h2>
        <p className="intro-text">
          CareerDNA is the first platform to unite all four dimensions of career identity into one profile.
          This creates a complete picture of the whole person, helping students make clearer, smarter and more
          confident subject and career decisions.
        </p>

        <div ref={gridRef} className="dimension-grid dimensions-grid">
          {dimensions.map((dim, idx) => (
            <div key={idx} className="dimension-wrapper">
              <div className="dimension-block">
                <img src={dim.image} alt={dim.label} loading="lazy" />
              </div>
              <div className="dimension-description always-show-on-mobile">
                <strong className="dimension-label">{dim.lead}</strong>
                <p>{dim.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
