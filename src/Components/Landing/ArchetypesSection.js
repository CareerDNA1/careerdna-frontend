// components/landing/ArchetypesSection.js

import React, { useEffect, useRef, useState } from 'react';
import './ArchetypesSection.css';
import {
  Compass,
  ClipboardList,
  Lightbulb,
  Trophy,
  Brain,
  Paintbrush,
  Handshake,
} from 'lucide-react';

const profiles = [
  {
    name: 'Explorer',
    icon: <Compass aria-hidden="true" />,
    title: 'The Explorer',
    short: 'Curious and adventurous.',
    description:
      'Curious and adventurous. Explorers love discovering new ideas, places and experiences. They thrive in fast-changing environments and are motivated by learning and growth.',
    color: '#2f80ed',
  },
  {
    name: 'Organiser',
    icon: <ClipboardList aria-hidden="true" />,
    title: 'The Organiser',
    short: 'Reliable and methodical.',
    description:
      'Reliable and methodical. Organisers enjoy bringing order to complexity, creating systems, and keeping projects on track.',
    color: '#7c5cff',
  },
  {
    name: 'Visionary',
    icon: <Lightbulb aria-hidden="true" />,
    title: 'The Visionary',
    short: 'Bold and future-focused.',
    description:
      'Bold and future-focused. Visionaries see possibilities others miss and enjoy inspiring people with big ideas.',
    color: '#f59e0b',
  },
  {
    name: 'Achiever',
    icon: <Trophy aria-hidden="true" />,
    title: 'The Achiever',
    short: 'Driven and determined.',
    description:
      'Driven and determined. Achievers set high goals, work hard to reach them, and bring focus, energy and persistence.',
    color: '#22a779',
  },
  {
    name: 'Thinker',
    icon: <Brain aria-hidden="true" />,
    title: 'The Thinker',
    short: 'Analytical and reflective.',
    description:
      'Analytical and reflective. Thinkers love tackling complex problems, spotting patterns, and working through big questions.',
    color: '#ff6b3d',
  },
  {
    name: 'Creator',
    icon: <Paintbrush aria-hidden="true" />,
    title: 'The Creator',
    short: 'Imaginative and expressive.',
    description:
      'Imaginative and expressive. Creators enjoy bringing new ideas, designs or stories to life and putting a personal stamp on their work.',
    color: '#ec5db4',
  },
  {
    name: 'Connector',
    icon: <Handshake aria-hidden="true" />,
    title: 'The Connector',
    short: 'Friendly and collaborative.',
    description:
      'Friendly and collaborative. Connectors are motivated by relationships and thrive when working with and for others.',
    color: '#2f80ed',
  },
];

function getCircularPosition(index, activeIndex, total) {
  let diff = index - activeIndex;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return Math.max(-3, Math.min(3, diff));
}

function isTabletOrTouchDevice() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(pointer: coarse), (hover: none), (min-width: 601px) and (max-width: 1180px)').matches;
}

export default function ArchetypesSection() {
  const [activeIndex, setActiveIndex] = useState(1);
  const sectionRef = useRef(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    dragging: false,
    moved: false,
    suppressClick: false,
    pointerId: null,
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    const shouldAnimate = window.matchMedia('(min-width: 768px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!shouldAnimate || prefersReduced) {
      el.classList.add('story-visible');
      return undefined;
    }

    el.classList.add('anim-ready');

    let entranceTimer;

    const reveal = () => {
      el.classList.add('story-visible');
      window.clearTimeout(entranceTimer);
      entranceTimer = window.setTimeout(() => {
        el.classList.add('entrance-complete');
      }, 760);
    };

    const reset = () => {
      window.clearTimeout(entranceTimer);
      el.classList.remove('story-visible');
      el.classList.remove('entrance-complete');
    };

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < viewportHeight * 0.86 && rect.bottom > 0) {
      window.requestAnimationFrame(reveal);
    }

    let hasRevealed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasRevealed = true;
          reveal();
        } else if (!hasRevealed) {
          reset();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => {
      window.clearTimeout(entranceTimer);
      observer.disconnect();
    };
  }, []);

  const showProfile = (index) => {
    const total = profiles.length;
    setActiveIndex(((index % total) + total) % total);
  };

  const handleCoverflowClick = (event) => {
    if (isTabletOrTouchDevice()) return;
    if (dragRef.current.moved || dragRef.current.suppressClick) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const xFromCenter = event.clientX - (rect.left + rect.width / 2);
    const absX = Math.abs(xFromCenter);

    let slots;
    if (window.matchMedia('(max-width: 600px)').matches) {
      slots = [0, 130];
    } else if (window.matchMedia('(max-width: 1024px)').matches) {
      slots = [0, 176, 320];
    } else {
      slots = [0, 218, 404, 562];
    }

    let closestSlotIndex = 0;
    let closestDistance = Infinity;

    slots.forEach((slot, slotIndex) => {
      const distance = Math.abs(absX - slot);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSlotIndex = slotIndex;
      }
    });

    const position = closestSlotIndex === 0 ? 0 : (xFromCenter > 0 ? 1 : -1) * closestSlotIndex;

    if (position !== 0) {
      event.preventDefault();
      event.stopPropagation();
      showProfile(activeIndex + position);
    }
  };

  const handlePointerDown = (event) => {
    if (!isTabletOrTouchDevice()) return;

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      dragging: true,
      moved: false,
      suppressClick: true,
      pointerId: event.pointerId,
    };


    if (event.currentTarget?.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional.
      }
    }
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.dragging || !isTabletOrTouchDevice()) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const horizontalIntent = Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.15;

    if (!horizontalIntent && !drag.moved) return;

    drag.moved = true;
    drag.suppressClick = true;

    if (event.cancelable) event.preventDefault();
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const isSwipe = Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25;
    const isTap = Math.abs(dx) < 10 && Math.abs(dy) < 10;

    if (event.currentTarget?.releasePointerCapture && drag.pointerId != null) {
      try {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        // Safe fallback.
      }
    }


    dragRef.current = {
      startX: 0,
      startY: 0,
      dragging: false,
      moved: isSwipe,
      suppressClick: true,
      pointerId: null,
    };

    if (isSwipe) {
      setActiveIndex((current) => {
        const next = dx < 0 ? current + 1 : current - 1;
        return (next + profiles.length) % profiles.length;
      });
    } else if (isTap && isTabletOrTouchDevice()) {
      const rect = event.currentTarget.getBoundingClientRect();
      const xFromCenter = event.clientX - (rect.left + rect.width / 2);
      const absX = Math.abs(xFromCenter);

      let slots;
      if (window.matchMedia('(max-width: 600px)').matches) {
        slots = [0, 130];
      } else if (window.matchMedia('(min-width: 900px) and (max-width: 1180px)').matches) {
        slots = [0, 205, 365, 500];
      } else if (window.matchMedia('(min-width: 601px) and (max-width: 1180px)').matches) {
        slots = [0, 170, 292, 390];
      } else if (window.matchMedia('(max-width: 1024px)').matches) {
        slots = [0, 176, 320];
      } else {
        slots = [0, 218, 404, 562];
      }

      let closestSlotIndex = 0;
      let closestDistance = Infinity;

      slots.forEach((slot, slotIndex) => {
        const distance = Math.abs(absX - slot);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSlotIndex = slotIndex;
        }
      });

      const position = closestSlotIndex === 0 ? 0 : (xFromCenter > 0 ? 1 : -1) * closestSlotIndex;

      if (position !== 0) {
        showProfile(activeIndex + position);
      }
    }

    window.setTimeout(() => {
      dragRef.current.moved = false;
      dragRef.current.suppressClick = false;
    }, 120);
  };

  const handlePointerCancel = () => {
    dragRef.current = {
      startX: 0,
      startY: 0,
      dragging: false,
      moved: false,
      suppressClick: false,
      pointerId: null,
    };
  };

  return (
    <section ref={sectionRef} id="archetypes" className="archetypes-section section">
      <div className="section-inner">
        <h2>Your career identity profile</h2>
        <p className="intro-text">
          Seven career profiles combine to create your unique CareerDNA. Together they help explain how
  you think, grow, work and thrive, giving you a clearer picture of the environments and
  opportunities that fit you best.
        </p>

        <div
          className="archetype-coverflow"
          aria-label="Career profile carousel"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          onClickCapture={handleCoverflowClick}
        >
          {profiles.map((profile, index) => {
            const position = getCircularPosition(index, activeIndex, profiles.length);
            const isActive = position === 0;

            return (
              <button
                key={profile.name}
                type="button"
                className={`archetype-card position-${position} ${isActive ? 'is-active' : ''}`}
                style={{ '--profile-color': profile.color }}
                onClick={(event) => {
                  event.preventDefault();
                }}
                aria-pressed={isActive}
                aria-label={`Show ${profile.title}`}
              >
                <span className="icon">{profile.icon}</span>
                <span className="title-text">{profile.title}</span>
                <span className="short-text">{isActive ? profile.description : profile.short}</span>
              </button>
            );
          })}
        </div>

        <div className="archetype-dots" aria-label="Select career profile">
          {profiles.map((profile, index) => (
            <button
              key={profile.name}
              type="button"
              className={activeIndex === index ? 'is-active' : ''}
              onClick={() => {
                if (isTabletOrTouchDevice()) return;
                if (dragRef.current.moved || dragRef.current.suppressClick) return;
                showProfile(index);
              }}
              aria-label={`Show ${profile.title}`}
              aria-pressed={activeIndex === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
