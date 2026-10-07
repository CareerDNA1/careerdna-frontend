import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'phosphor-react';
import { BrainCircuit } from 'lucide-react';
import CareerAdvisorChat from './CareerAdvisorChat';
import { useAdvisorPanel, openAdvisor, closeAdvisor, toggleAdvisor, setAdvisorFacts } from '../../utils/advisorPanel';
import { advisorContextFor, advisorGeneralQuestions } from '../../utils/advisorQuestions';
import { getMyAcademicProfile, hasAcademicData } from '../../utils/academicProfile';
import { getFavouritesByCategory } from '../../utils/favourites';
import { listApplications } from '../../utils/applications';
import './AdvisorDrawer.css';

// "Your Advisor": one persistent panel for the whole results area. On wide
// screens it is a right-hand drawer that pushes the page over so the student
// can read and talk at once; on phones it is a bottom sheet. Opened by the edge
// tab, an "Ask your advisor" button anywhere in the app, or a swipe from the
// right edge (up from the bottom bar on phones); closed by the ×, Escape, the
// tab again, or a swipe back. The open state is remembered.
const PHONE = '(max-width: 760px)';
const isPhone = () => window.matchMedia(PHONE).matches;

// stage: 'school' or 'university' (the report's viewer status). The drawer
// resolves the suggested questions for the current section from the shared
// config, using what the student has entered so far (grades, favourites,
// applications) to decide which questions to offer.
export default function AdvisorDrawer({ assessmentRunId, stage = '' }) {
  const { open, context: rawContext, prefill, prefillSend, facts } = useAdvisorPanel();
  const context = useMemo(() => {
    if (!rawContext) return null;
    const resolved = advisorContextFor(rawContext.section, facts.stage || stage, facts);
    return resolved || rawContext;
  }, [rawContext, facts, stage]);
  const generalQuestions = useMemo(() => advisorGeneralQuestions(facts.stage || stage), [facts.stage, stage]);

  // Load the facts once per report: stage, grades entered, favourites saved,
  // applications made. Refreshed when the drawer opens so new saves show.
  useEffect(() => {
    if (!assessmentRunId) return undefined;
    let cancelled = false;
    (async () => {
      const [ap, favs, apps] = await Promise.all([
        getMyAcademicProfile().catch(() => null),
        getFavouritesByCategory(assessmentRunId).catch(() => []),
        listApplications().catch(() => []),
      ]);
      if (cancelled) return;
      const savedCount = (Array.isArray(favs) ? favs : []).reduce((n, g) => n + ((g && g.items && g.items.length) || 0), 0);
      setAdvisorFacts({
        stage: stage || '',
        grades: hasAcademicData(ap),
        saved: savedCount > 0,
        applied: Array.isArray(apps) && apps.length > 0,
      });
    })();
    return () => { cancelled = true; };
  }, [assessmentRunId, stage, open]);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(null);

  // Push the page content over while the drawer is open (desktop only; CSS),
  // and start the drawer under the fixed navbar, whatever its height. On
  // phones the sheet covers the page, so the page must not scroll behind it.
  useEffect(() => {
    document.body.classList.toggle('cdna-advisor-open', open);
    document.documentElement.classList.toggle('cdna-advisor-open', open);
    const lock = open && isPhone();
    document.body.classList.toggle('cdna-advisor-lock', lock);
    const nav = document.querySelector('.account-navbar-wrapper');
    const top = nav && getComputedStyle(nav).position === 'fixed' ? Math.round(nav.getBoundingClientRect().bottom) : 0;
    document.documentElement.style.setProperty('--advisor-drawer-top', `${Math.max(0, top)}px`);
    return () => { document.body.classList.remove('cdna-advisor-open'); document.documentElement.classList.remove('cdna-advisor-open'); document.body.classList.remove('cdna-advisor-lock'); };
  }, [open]);

  // Move keyboard focus into the drawer when it opens and back to the tab when it closes.
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const t = window.setTimeout(() => {
      const target = document.querySelector('.advisor-drawer textarea, .advisor-drawer input, .advisor-drawer__close');
      if (target && !document.querySelector('[role="dialog"][aria-modal="true"]')) target.focus({ preventScroll: true });
    }, 60);
    return () => {
      window.clearTimeout(t);
      if (opener && document.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (_) { /* ignore */ } }
    };
  }, [open]);

  // Escape closes the drawer unless a modal above it is handling the key.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.rk-overlay, .fav-overlay, .acad-overlay, .report-limit-modal-overlay, .pick-sheet-backdrop, .cascade-overlay')) return;
      closeAdvisor();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Edge swipe to open (from the right edge on desktop/tablet, up from the
  // bottom bar on phones) and swipe to close on the drawer's own handle.
  useEffect(() => {
    const onStart = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      const phone = isPhone();
      const fromEdge = phone ? (t.clientY > window.innerHeight - 56) : (t.clientX > window.innerWidth - 24);
      if (!open && fromEdge) { startRef.current = { x: t.clientX, y: t.clientY, phone }; setDragging(true); }
    };
    const onEnd = (e) => {
      const s = startRef.current;
      startRef.current = null;
      setDragging(false);
      if (!s) return;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - s.x; const dy = t.clientY - s.y;
      if (s.phone ? dy < -60 : dx < -60) openAdvisor();
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => { document.removeEventListener('touchstart', onStart); document.removeEventListener('touchend', onEnd); };
  }, [open]);

  const handleStart = useRef(null);
  const onHandleTouchStart = (e) => { const t = e.touches[0]; handleStart.current = { x: t.clientX, y: t.clientY }; };
  const onHandleTouchEnd = (e) => {
    const s = handleStart.current; handleStart.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    if (isPhone() ? t.clientY - s.y > 60 : t.clientX - s.x > 60) closeAdvisor();
  };

  // Show the context hint briefly whenever the section changes (desktop pill).
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (open || !context?.title) return undefined;
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(t);
  }, [open, context?.title]);

  if (!assessmentRunId) return null;

  const contextTitle = context?.title ? `Ask about ${context.title}` : 'Ask anything about your results';

  // Rendered on <body>: the results page uses transforms for its swipe slider,
  // which would otherwise turn our fixed positioning into page-relative.
  return createPortal(
    <>
      {/* Edge tab (desktop/tablet) and bottom bar (phones) when closed */}
      {!open ? (
        <button
          type="button"
          className={`advisor-tab${dragging ? ' is-dragging' : ''}${showHint ? ' show-hint' : ''}`}
          onClick={() => openAdvisor()}
          aria-label="Open Your Advisor"
          aria-expanded={false}
        >
          <span className="advisor-tab__icon" aria-hidden="true"><BrainCircuit /></span>
          <span className="advisor-tab__label"><span className="advisor-tab__ask">Ask </span>Your Advisor</span>
          <span className="advisor-tab__hint" aria-hidden="true">{context?.title ? `Ask about ${context.title}` : 'Ask about your results'}</span>
        </button>
      ) : null}

      {open ? <div className="advisor-backdrop" onClick={() => closeAdvisor()} aria-hidden="true" /> : null}
      <aside className={`advisor-drawer${open ? ' is-open' : ''}`} role="region" aria-label="Your Advisor" aria-hidden={!open} inert={open ? undefined : true}>
        <div className="advisor-drawer__handle" onTouchStart={onHandleTouchStart} onTouchEnd={onHandleTouchEnd} aria-hidden="true"><span /></div>
        <header className="advisor-drawer__head" onTouchStart={onHandleTouchStart} onTouchEnd={onHandleTouchEnd}>
          <span className="advisor-drawer__avatar career-advisor-avatar" aria-hidden="true"><BrainCircuit /></span>
          <div className="advisor-drawer__titles">
            <div className="advisor-drawer__title">Your CareerDNA Advisor</div>
            <div className="advisor-drawer__sub">{contextTitle}</div>
          </div>
          <button type="button" className="advisor-drawer__close" onClick={() => toggleAdvisor()} aria-label="Close Your Advisor">
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </header>
        <div className="advisor-drawer__body">
          {open ? (
            <CareerAdvisorChat
              assessmentRunId={assessmentRunId}
              variant="drawer"
              context={context}
              generalQuestions={generalQuestions}
              prefill={prefill}
              prefillSend={prefillSend}
            />
          ) : null}
        </div>
      </aside>
    </>,
    document.body
  );
}
