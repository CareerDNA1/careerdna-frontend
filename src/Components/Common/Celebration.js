import React, { useEffect, useMemo } from 'react';
import './Celebration.css';

// A short burst of confetti for good news (an offer, a firm choice, a place).
// Pure CSS, no library; unmounts itself after the animation. Respects
// prefers-reduced-motion (the CSS hides the pieces).
//
// Usage: const [party, setParty] = useState(0); ... <Celebration key={party} show={party > 0} />
// and bump `party` whenever something worth celebrating happens.
const COLOURS = ['#2f6fed', '#0f6e56', '#9fe1cb', '#f5b301', '#e8467c', '#7c5cff'];

export default function Celebration({ show, onDone, pieces = 42, duration = 1600 }) {
  const items = useMemo(() => Array.from({ length: pieces }).map((_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 250,
    drift: (Math.random() - 0.5) * 220,
    spin: (Math.random() - 0.5) * 900,
    size: 6 + Math.random() * 6,
    colour: COLOURS[i % COLOURS.length],
    round: Math.random() > 0.6,
  })), [pieces]);
  useEffect(() => {
    if (!show) return undefined;
    const t = setTimeout(() => { if (onDone) onDone(); }, duration + 300);
    return () => clearTimeout(t);
  }, [show, onDone, duration]);
  if (!show) return null;
  return (
    <div className="celebrate" aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.id}
          className={`celebrate-piece${p.round ? ' celebrate-piece--round' : ''}`}
          style={{
            left: `${p.left}%`,
            width: p.size, height: p.size * (p.round ? 1 : 0.6),
            background: p.colour,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${duration}ms`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
