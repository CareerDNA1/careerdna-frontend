import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TeamPage from './pages/TeamPage';

import Start from './pages/Start';
import SurveyIntro from './pages/SurveyIntro';
import SurveyInstructions from './pages/SurveyInstructions';
import SurveyQuestions from './pages/SurveyQuestions';
import ResultsPage from './pages/ResultsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LegalPage, { PrivacyPage, TermsPage, LegalModal } from './pages/LegalPage';
import ReportProblemModal from './Components/Common/ReportProblemModal';
import ServiceBanner from './Components/Common/ServiceBanner';
import RankingsModal from './Components/Rankings/RankingsModal';
import ReportLimitModal from './Components/Common/ReportLimitModal';
import { applyCouponCode } from './utils/applyCoupon';
import { getMyProfile } from './utils/profile';
import { hideSelectionTooltip } from './Components/Survey/SelectionInsightExplorer';
import {
  PREMIUM_FEATURE_ATTR,
  PREMIUM_FEATURE_LABELS,
  getCurrentPlan,
  isPremiumPlan,
} from './utils/premiumGate';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SavedResultPage from './pages/SavedResultPage';
import AdminDashboard from './pages/AdminDashboard';
import ErrorBoundary from './pages/ErrorBoundary';
import TrustSecurityPage from './pages/TrustSecurityPage';

import {
  RequireAuth,
  StartedGuard,
  IntroGuard,
  InstructionsGuard,
  ResultsGuard,
} from './pages/RouteGuards';

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
    <RankingsModal
      subjectId={target.subjectId}
      subjectTitle={target.subjectTitle}
      onClose={() => setTarget(null)}
    />
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

// Body-level tooltips (archetype, trait, clarity, feedback and the pinned
// definition boxes) live outside React, so a page change would otherwise leave
// one floating on the next page. Hide them all whenever the route changes.
export function hideAllFloatingTooltips() {
  try { hideSelectionTooltip({ force: true }); } catch (_) { /* ignore */ }
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
      <GlobalReportProblemModal />
      <GlobalPremiumGate />
      <GlobalRankingsModal />
      <ErrorBoundary>
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
          <Route path="/admin" element={<AdminDashboard />} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
