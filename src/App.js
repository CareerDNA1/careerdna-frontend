import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AUTH_EXPIRED_EVENT } from './utils/apiFetch';
import LandingPage from './pages/LandingPage';
import TeamPage from './pages/TeamPage';

import Start from './pages/Start';
import SurveyIntro from './pages/SurveyIntro';
import SurveyInstructions from './pages/SurveyInstructions';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LegalPage, { PrivacyPage, TermsPage, LegalModal } from './pages/LegalPage';
import ReportProblemModal from './Components/Common/ReportProblemModal';
import LegalUpdateGate from './Components/Common/LegalUpdateGate';
import WelcomeEmailTrigger from './Components/Common/WelcomeEmailTrigger';
import GlobalFocusTrap from './Components/Common/GlobalFocusTrap';
import ServiceBanner from './Components/Common/ServiceBanner';
import ReportLimitModal from './Components/Common/ReportLimitModal';
import { applyCouponCode } from './utils/applyCoupon';
import { getMyProfile } from './utils/profile';
import {
  PREMIUM_FEATURE_ATTR,
  PREMIUM_FEATURE_LABELS,
  getCurrentPlan,
  isPremiumPlan,
} from './utils/premiumGate';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ErrorBoundary from './pages/ErrorBoundary';

import TrustSecurityPage from './pages/TrustSecurityPage';
import NotFoundPage from './pages/NotFoundPage';

import {
  RequireAuth,
  StartedGuard,
  IntroGuard,
  InstructionsGuard,
  ResultsGuard,
  RequireAdmin,
} from './pages/RouteGuards';

// Heavy screens load on demand so the landing, login and signup pages arrive
// first. Each becomes its own file that the browser fetches when first needed.
const SurveyQuestions = lazy(() => import('./pages/SurveyQuestions'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const SavedResultPage = lazy(() => import('./pages/SavedResultPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const RankingsModal = lazy(() => import('./Components/Rankings/RankingsModal'));

function RouteLoading() {
  return (
    <div className="cdna-route-loading" role="status" aria-live="polite">
      <span className="cdna-route-loading-dot" />
      <span className="cdna-route-loading-dot" />
      <span className="cdna-route-loading-dot" />
    </div>
  );
}

// Intercepts clicks on footer Privacy/Terms links anywhere in the app and opens
// the legal content as an in-place modal, instead of navigating to the full
// /legal page. Mounted once, globally, inside the Router.
function GlobalLegalModal() {
  const [tab, setTab] = useState(null); // null = closed; 'privacy' | 'terms'

  useEffect(() => {
    const onClick = (e) => {
      // Respect modified clicks (new tab / new window) and non-primary buttons.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      const href = anchor.getAttribute('href') || '';
      const m = href.match(/^\/(legal|terms|privacy)(#(privacy|terms))?$/);
      if (!m) return;
      e.preventDefault();
      const hashTab = m[3];
      const baseTab = m[1] === 'privacy' ? 'privacy' : m[1] === 'terms' ? 'terms' : 'privacy';
      setTab(hashTab || baseTab);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!tab) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setTab(null); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [tab]);

  if (!tab) return null;
  return <LegalModal initialTab={tab} onClose={() => setTab(null)} />;
}

// Intercepts clicks on any footer "Report a problem" link (href="#report-problem")
// anywhere in the app and opens the report modal in place. Mounted once, globally.
function GlobalReportProblemModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target && e.target.closest ? e.target.closest('a[href$="#report-problem"]') : null;
      if (!anchor) return;
      e.preventDefault();
      setOpen(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  return <ReportProblemModal onClose={() => setOpen(false)} />;
}

// Opens the CareerDNA University Rankings for a subject when any element with a
// data-rankings-subject / data-rankings-title attribute is clicked. Mounted once.
function GlobalRankingsModal() {
  const [target, setTarget] = useState(null); // { subjectId, subjectTitle }

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target && e.target.closest ? e.target.closest('[data-rankings-subject],[data-rankings-title]') : null;
      if (!el) return;
      e.preventDefault();
      setTarget({
        subjectId: el.getAttribute('data-rankings-subject') || '',
        subjectTitle: el.getAttribute('data-rankings-title') || '',
      });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (!target) return null;
  return (
    <Suspense fallback={null}>
      <RankingsModal
        subjectId={target.subjectId}
        subjectTitle={target.subjectTitle}
        onClose={() => setTarget(null)}
      />
    </Suspense>
  );
}

// Premium gate. The Premium boxes stay visible to everyone; this intercepts the
// action inside them. Any element with data-premium-feature="<feature>" opens the
// standard upgrade prompt for non-Premium users instead of doing its action.
// Runs in the capture phase so it fires before React handlers, link navigation
// and the rankings listener above. Mounted once.
function GlobalPremiumGate() {
  const [gate, setGate] = useState(null); // { feature }

  useEffect(() => {
    const onClickCapture = (e) => {
      if (e.button !== 0) return;
      const el = e.target && e.target.closest ? e.target.closest(`[${PREMIUM_FEATURE_ATTR}]`) : null;
      if (!el) return;
      if (isPremiumPlan(getCurrentPlan())) return;
      e.preventDefault();
      e.stopPropagation();
      setGate({ feature: el.getAttribute(PREMIUM_FEATURE_ATTR) || '' });
    };
    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, []);

  useEffect(() => {
    if (!gate) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setGate(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [gate]);

  if (!gate) return null;
  return (
    <ReportLimitModal
      mode="premium"
      currentPlan={getCurrentPlan() || 'free'}
      featureLabel={PREMIUM_FEATURE_LABELS[gate.feature] || ''}
      onClose={() => setGate(null)}
      onApplyCoupon={async (code) => {
        await applyCouponCode(code);
        await getMyProfile(); // refreshes the plan held by the gate
        setGate(null);
      }}
    />
  );
}

// Shown when the backend stops accepting the session (apiFetch raises
// cdna:auth-expired on a 401). Only for people who were signed in during this
// visit, and never on the auth pages themselves, so anonymous visitors on public
// pages are left alone. Same card style as ResumeSurveyModal.
const AUTH_PAGES = new Set(['/login', '/signup', '/reset-password']);

function SessionExpiredGate() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const wasSignedIn = useRef(false);
  if (user) wasSignedIn.current = true;

  useEffect(() => {
    const onExpired = () => {
      if (!wasSignedIn.current) return;
      if (AUTH_PAGES.has(window.location.pathname)) return;
      setOpen(true);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  // Fresh sign-in clears it.
  useEffect(() => { if (user) setOpen(false); }, [user]);

  if (!open) return null;

  const goToLogin = async () => {
    const from = { pathname: location.pathname, search: location.search };
    setOpen(false);
    wasSignedIn.current = false;
    try { await signOut(); } catch (_) { /* the session is already gone */ }
    navigate('/login', { replace: true, state: { from } });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20, background: 'rgba(15, 23, 42, 0.34)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sessionExpiredTitle"
        style={{
          width: 'min(100%, 430px)', borderRadius: 20, background: '#ffffff',
          boxShadow: '0 22px 60px rgba(15, 23, 42, 0.22)', padding: '26px 28px 24px',
          color: '#172033', textAlign: 'left',
        }}
      >
        <h3
          id="sessionExpiredTitle"
          style={{ margin: '0 0 10px', color: '#172033', fontSize: 20, lineHeight: 1.25, fontWeight: 750, letterSpacing: '-0.02em' }}
        >
          Your session has ended
        </h3>
        <p style={{ margin: '0 0 22px', color: '#52667f', fontSize: 14, lineHeight: 1.6 }}>
          Your session has ended. Log in again to carry on where you were.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={goToLogin}
            style={{
              minHeight: 36, padding: '8px 18px', borderRadius: 999, border: 0,
              background: '#2f6fed', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Log in
          </button>
        </div>
      </section>
    </div>
  );
}

// Body-level tooltips (archetype, trait, clarity, feedback and the pinned
// definition boxes) live outside React, so a page change would otherwise leave
// one floating on the next page. Hide them all whenever the route changes.
export function hideAllFloatingTooltips() {
  try { window.dispatchEvent(new Event('cdna:hide-tooltips')); } catch (_) { /* ignore */ }
  document
    .querySelectorAll('.cdna-archetype-tooltip, .cdna-clarity-tooltip, .cdna-subdim-tooltip, .cdna-feedback-tooltip, .selection-floating-tooltip')
    .forEach((el) => { el.style.opacity = '0'; el.classList.remove('is-pinned'); });
}

function RouteChangeCleanup() {
  const location = useLocation();
  useEffect(() => { hideAllFloatingTooltips(); }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <RouteChangeCleanup />
      <ServiceBanner />
      <GlobalLegalModal />
      <LegalUpdateGate />
      <SessionExpiredGate />
      <WelcomeEmailTrigger />
      <GlobalFocusTrap />
      <GlobalReportProblemModal />
      <GlobalPremiumGate />
      <GlobalRankingsModal />
      <ErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/trust-security" element={<TrustSecurityPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route path="/start" element={<Start />} />
          <Route path="/app" element={<Navigate to="/start" replace />} />
          <Route path="/results/run/:runId" element={<SavedResultPage />} />

          <Route element={<StartedGuard />}>
            <Route path="/survey/intro" element={<SurveyIntro />} />
          </Route>

          <Route element={<IntroGuard />}>
            <Route path="/survey/instructions" element={<SurveyInstructions />} />
          </Route>

          <Route element={<InstructionsGuard />}>
            <Route path="/survey/questions" element={<SurveyQuestions />} />
          </Route>

          <Route element={<ResultsGuard />}>
            <Route path="/results" element={<ResultsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}
