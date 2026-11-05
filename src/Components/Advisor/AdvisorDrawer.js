import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'phosphor-react';
import AdvisorAvatar from './AdvisorAvatar';
import CareerAdvisorChat from './CareerAdvisorChat';
import { useAdvisorPanel, openAdvisor, closeAdvisor, toggleAdvisor, setAdvisorFacts, registerAdvisorAvailable } from '../../utils/advisorPanel';
import { advisorContextFor, advisorGeneralQuestions } from '../../utils/advisorQuestions';
import { getMyAcademicProfile, hasAcademicData } from '../../utils/academicProfile';
import { getFavouritesByCategory } from '../../utils/favourites';
import { listApplications } from '../../utils/applications';
import { lockPageScroll, unlockPageScroll } from '../../utils/scrollLock';
import './AdvisorDrawer.css';

// "Your Advisor": one persistent panel for the whole results area. On wide
// screens it is a right-hand drawer that pushes the page over so the student
// can read and talk at once; on phones it is a bottom sheet. Opened by the edge
// tab, an "Ask your advisor" button anywhere in the app, or a swipe from the
// right edge (up from the bottom bar on phones); closed by the ×, Escape, the
// tab again, or a swipe back. The open state is remembered.
// Phones held upright, and phones in landscape (short and not too wide).
const PHONE = '(max-width: 760px), (max-height: 500px) and (max-width: 1000px)';
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

  // Tell the top bar an advisor is available here (it shows its own button).
  useEffect(() => {
    if (!assessmentRunId) return undefined;
    return registerAdvisorAvailable();
  }, [assessmentRunId]);

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

  // Phones: pin the page behind the open sheet. overflow:hidden on <body> (the
  // class above) is ignored by iOS Safari for touch, so the page kept scrolling
  // under the finger, most of all when the swipe started on the text box at the
  // bottom. The shared lock pins <body> in place and puts it back on close.
  useEffect(() => {
    if (!open || !isPhone()) return undefined;
    lockPageScroll();
    return () => unlockPageScroll();
  }, [open]);

  // Move keyboard focus into the drawer when it opens and back to the tab when it closes.
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const t = window.setTimeout(() => {
      // On phones, focusing the text box pops the keyboard up and scrolls the
      // sheet; focus the close button there and let the student tap the box.
      const target = isPhone()
        ? document.querySelector('.advisor-drawer__close')
        : document.querySelector('.advisor-drawer textarea, .advisor-drawer input, .advisor-drawer__close');
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

  // Pill position: centred at the bottom of the window (stylesheet). It rises
  // only when the page footer comes into view, so it never covers the footer.
  const tabRef = useRef(null);
  const [tabPos, setTabPos] = useState(null);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const EDGE = 22;      // distance from the window edge in the default corner
    let raf = 0;
    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      // Phones keep the centred bar; short wide screens (phones in landscape) keep
      // the compact corner button from the stylesheet.
      if (window.matchMedia(PHONE).matches || vh <= 520) { setTabPos(null); return; }
      let bottom = EDGE;
      // Once the page footer scrolls into view, rise so the pill sits just
      // above it instead of covering the footer links.
      const footerTop = Array.from(document.querySelectorAll('footer[aria-label="CareerDNA footer"]'))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.height > 0)
        .reduce((m, r) => Math.min(m, r.top), Infinity);
      if (footerTop < vh) bottom = Math.max(EDGE, Math.round(vh - footerTop + 14));
      // Horizontally the pill is centred by the stylesheet; only lift it here.
      setTabPos(bottom === EDGE ? null : { bottom });
    };
    const schedule = () => { if (!raf) raf = window.requestAnimationFrame(measure); };
    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    // body never changes size when the page is shorter than the window
    // (html/body have min-height: 100%), so watch the page itself: any change
    // to the app's content (sections opening, data arriving) re-measures.
    const root = document.getElementById('root') || document.body;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro) {
      ro.observe(root);
      Array.from(root.children).forEach((el) => ro.observe(el));
    }
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null;
    if (mo) mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open'] });
    const late = [300, 1000, 2500].map((ms) => window.setTimeout(schedule, ms));
    return () => {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      late.forEach((t) => window.clearTimeout(t));
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  if (!assessmentRunId) return null;

  // Rendered on <body>: the results page uses transforms for its swipe slider,
  // which would otherwise turn our fixed positioning into page-relative.
  return createPortal(
    <>
      {/* Edge tab (desktop/tablet) and bottom bar (phones) when closed */}
      {!open ? (
        <button
          type="button"
          className={`advisor-tab${dragging ? ' is-dragging' : ''}${showHint ? ' show-hint' : ''}`}
          ref={tabRef}
          style={tabPos || undefined}
          onClick={() => openAdvisor()}
          aria-label="Open Your Advisor"
          aria-expanded={false}
        >
          <span className="advisor-tab__icon" aria-hidden="true"><AdvisorAvatar /></span>
          <span className="advisor-tab__label"><span className="advisor-tab__ask">Ask </span>Your Advisor</span>
          <span className="advisor-tab__hint" aria-hidden="true">{context?.title ? `Ask about ${context.title}` : 'Ask about your results'}</span>
        </button>
      ) : null}

      {open ? <div className="advisor-backdrop" onClick={() => closeAdvisor()} aria-hidden="true" /> : null}
      <aside className={`advisor-drawer${open ? ' is-open' : ''}`} role="region" aria-label="Your Advisor" aria-hidden={!open} inert={open ? undefined : true}>
        <div className="advisor-drawer__handle" onTouchStart={onHandleTouchStart} onTouchEnd={onHandleTouchEnd} aria-hidden="true"><span /></div>
        <header className="advisor-drawer__head" onTouchStart={onHandleTouchStart} onTouchEnd={onHandleTouchEnd}>
          <span className="advisor-drawer__avatar career-advisor-avatar" aria-hidden="true"><AdvisorAvatar /></span>
          <div className="advisor-drawer__titles">
            <div className="advisor-drawer__title">Your CareerDNA Advisor</div>
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
              active={open}
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
