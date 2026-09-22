import React, { useRef, useState, useLayoutEffect } from 'react';

/**
 * Finger-tracked section slider (pointer events → works with touch AND mouse).
 *
 * It is "dumb": the parent owns which section is active and passes the rendered
 * current / previous / next slides plus onPrev / onNext callbacks, so the slide
 * shown can never drift out of sync with the menu.
 *
 * At rest ONLY the current section is mounted; a neighbour is mounted only while
 * an active horizontal drag is in progress. Crucially, the track carries a CSS
 * transform ONLY while dragging/animating — never at rest — because a transform
 * turns the element into the containing block for any `position: fixed`
 * descendant, which would break full-screen modals rendered inside a slide.
 *
 * Props:
 *  - activeKey: unique string for the current section (re-centres on change)
 *  - current, prev, next: rendered nodes (prev/next may be null at the ends)
 *  - onPrev, onNext: commit callbacks (change the parent's active section)
 */
export default function SwipeDeck({ activeKey, current, prev, next, onPrev, onNext }) {
  const trackRef = useRef(null);
  const drag = useRef({ x: 0, y: 0, decided: false, horizontal: false, id: null });
  const restTimer = useRef(null);
  const [dragDir, setDragDir] = useState(null); // 'prev' | 'next' | null

  // Apply a live drag/animation transform. rest() removes it entirely so no
  // containing block lingers for fixed-position modals.
  const setTransform = (value, animate) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 280ms ease' : 'none';
    el.style.willChange = 'transform';
    el.style.transform = `translate3d(${value}, 0, 0)`;
  };
  const rest = () => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = 'none';
    el.style.willChange = 'auto';
  };

  // Re-centre (to the no-transform rest state) before paint whenever the active
  // section changes, and drop any mounted neighbour.
  useLayoutEffect(() => {
    if (restTimer.current) { window.clearTimeout(restTimer.current); restTimer.current = null; }
    rest();
    setDragDir(null);
  }, [activeKey]);

  const onPointerDown = (e) => {
    // Swiping between tabs is a touch gesture only. On a PC a mouse drag to
    // change tab is disruptive (it fires during ordinary click-drags and text
    // selection), so ignore mouse input and let touch / pen drive the deck.
    if (e.pointerType === 'mouse') { drag.current.id = null; return; }
    drag.current = { x: e.clientX, y: e.clientY, decided: false, horizontal: false, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    if (drag.current.id === null) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    if (!drag.current.decided) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.current.decided = true;
      drag.current.horizontal = Math.abs(dx) > Math.abs(dy);
      if (drag.current.horizontal) {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      }
    }
    if (!drag.current.horizontal) return;
    const wantDir = dx < 0 ? 'next' : 'prev';
    const canGo = wantDir === 'next' ? !!next : !!prev;
    if (canGo && dragDir !== wantDir) setDragDir(wantDir);
    let d = dx;
    if (!canGo) d *= 0.25; // resist past the ends
    setTransform(`${d}px`, false);
  };

  const endPointer = (e) => {
    if (drag.current.id === null) return;
    const horizontal = drag.current.horizontal;
    const dx = e.clientX - drag.current.x;
    drag.current = { x: 0, y: 0, decided: false, horizontal: false, id: null };
    if (!horizontal) { rest(); setDragDir(null); return; }
    const threshold = 55;
    if (dx <= -threshold && next) {
      setTransform('-100%', true);
      window.setTimeout(() => { if (typeof onNext === 'function') onNext(); }, 280);
      // activeKey will change → layout effect calls rest() + clears the neighbour.
    } else if (dx >= threshold && prev) {
      setTransform('100%', true);
      window.setTimeout(() => { if (typeof onPrev === 'function') onPrev(); }, 280);
    } else {
      // Not far enough: spring back, then drop the transform + neighbour once settled.
      setTransform('0px', true);
      restTimer.current = window.setTimeout(() => { rest(); setDragDir(null); }, 300);
    }
  };

  const sideStyle = (side) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    minWidth: 0,
    transform: side === 'prev' ? 'translateX(-100%)' : 'translateX(100%)',
  });

  return (
    <div
      className="swipe-deck"
      style={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div ref={trackRef} className="swipe-deck__track" style={{ position: 'relative' }}>
        <div className="swipe-deck__slide" style={{ position: 'relative', width: '100%', minWidth: 0 }}>
          {current}
        </div>
        {dragDir === 'prev' && prev ? (
          <div className="swipe-deck__slide" style={sideStyle('prev')} aria-hidden="true">{prev}</div>
        ) : null}
        {dragDir === 'next' && next ? (
          <div className="swipe-deck__slide" style={sideStyle('next')} aria-hidden="true">{next}</div>
        ) : null}
      </div>
    </div>
  );
}
