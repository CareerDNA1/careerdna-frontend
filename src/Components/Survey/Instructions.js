import React, { useEffect, useRef } from 'react';
import { Fingerprint, Timer, Headphones, Brain, Scales } from 'phosphor-react';
import Button from '../Common/Button';
import instructionsGraphic from '../../Assets/images/instructions_graphic.jpg';
import logo from '../../Assets/images/logo-career-dna.png';
import './Instructions.css';

const iconProps = { size: 18, weight: 'duotone' };

const instructionItems = [
  {
    icon: <Fingerprint {...iconProps} />,
    text: <>This survey is designed to help you discover your unique <strong>Career DNA</strong>.</>,
  },
  {
    icon: <Timer {...iconProps} />,
    text: <>There are <strong>96 short questions</strong> (1–5 or binary choices). Most people finish in <strong>20–25 mins</strong> in one sitting and your progress <strong>auto-saves</strong> as you go.</>,
  },
  {
    icon: <Headphones {...iconProps} />,
    text: <><strong>Quiet space:</strong> switch on <em>Do Not Disturb</em>, mute notifications, and use headphones if it’s noisy. Full-screen your browser to stay focused.</>,
  },
  {
    icon: <Brain {...iconProps} />,
    text: <>Answer <strong>honestly and instinctively</strong>. Go with your first reaction rather than overthinking. But it's fine to pause and think of situations.</>,
  },
  {
    icon: <Scales {...iconProps} />,
    text: <>Choosing the <strong>middle option</strong> (option 3) is fine if you're unsure, but the ends of the scale (1 or 5) signal a stronger view.</>,
  },
];

export default function Instructions({ onStart }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = instructionsGraphic;
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('instp-visible');
      return undefined;
    }

    el.classList.add('instp-anim-ready');
    window.requestAnimationFrame(() => el.classList.add('instp-visible'));

    return undefined;
  }, []);

  return (
    <main ref={sectionRef} className="instp">
      <img className="instp-logo" src={logo} alt="CareerDNA" />

      <section className="instp-stage" aria-labelledby="instp-title">
        <div className="instp-copy">
          <img
            className="instp-mobile-graphic"
            src={instructionsGraphic}
            alt=""
            aria-hidden="true"
            width="1024"
            height="1536"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />

          <h1 id="instp-title">
            <span className="instp-title-dark">Before You </span>
            <span className="instp-title-blue">Begin...</span>
          </h1>

          <p className="instp-subtitle">
            A few quick things to know before we get started.<br />
            This helps you get the most accurate results.
          </p>

          <ul className="instp-list">
            {instructionItems.map((item, index) => (
              <li key={index} style={{ '--instp-delay': `${160 + index * 85}ms` }}>
                <span className="i" aria-hidden="true">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="instp-visual" aria-label="Survey illustration">
          <div className="instp-blob" aria-hidden="true">
            <img
              className="instp-graphic"
              src={instructionsGraphic}
              alt=""
              width="1024"
              height="1536"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
          </div>
        </aside>
      </section>

      {/* CTA is a direct child of the page (not the right column) so that if the
          stylesheet applies a beat late — e.g. the dev server injects CSS via JS
          after first paint — the un-positioned fallback sits at the bottom of the
          page in normal flow (roughly centred) instead of flashing in the narrow
          right-hand column and then snapping to the middle. */}
      <div className="instp-left-cta">
        <Button type="primary" size="xl" shine className="panel-cta" onClick={onStart}>
          Start CareerDNA Survey <span aria-hidden="true">→</span>
        </Button>
      </div>
    </main>
  );
}
