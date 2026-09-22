import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import ResultsComponent from '../Components/Survey/ResultsComponent';
import AccountNavbar from '../Components/Common/AccountNavbar';
import { calculateProfileQualityGate } from '../utils/profileQualityGate';
import {
  getAssessmentRunById,
  runAiSummaryForSavedRun,
  rerunAssessmentWithOutputParameters,
} from '../utils/assessmentRuns';
import { runIsStale } from '../utils/outputVersion';
import './ProfilePage.css';


// In-memory cache of already-loaded runs, so re-opening a result you just viewed
// shows instantly instead of a fresh "Loading your results…" each time. It still
// re-fetches in the background to stay current (stale-while-revalidate).
const savedRunCache = new Map();

export default function SavedResultPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialSection = location.state?.section || '';
  const initialTab = location.state?.tab || '';
  const initialFocus = location.state?.focusTitle || '';
  const [menuOpen, setMenuOpen] = useState(false);
  const [run, setRun] = useState(() => savedRunCache.get(runId) || null);
  const [loading, setLoading] = useState(() => !savedRunCache.has(runId));
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [reportLimitReached, setReportLimitReached] = useState(false);

  // Keep the cache in sync with whatever is currently shown.
  useEffect(() => {
    if (run && runId) savedRunCache.set(runId, run);
  }, [run, runId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!savedRunCache.has(runId)) setLoading(true);
        setErrorMsg('');
        setReportLimitReached(false);
        const data = await getAssessmentRunById(runId);
        if (!cancelled) setRun(data || null);
      } catch (err) {
        if (!cancelled) setErrorMsg(err.message || 'Failed to load saved result.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runId]);

  const handleRunAnalysis = async ({ bypassQualityGate = false } = {}) => {
    const currentSaved = run?.results_json || {};
    const currentGate = calculateProfileQualityGate({
      archetypes: currentSaved?.archetypes || {},
      subdimensionRows: Array.isArray(currentSaved?.subdimensionRows) ? currentSaved.subdimensionRows : [],
      claritySummary: currentSaved?.claritySummary || null,
    });

    if (!bypassQualityGate && currentGate.shouldBlockAnalysis) {
      return;
    }

    try {
      setLoadingSummary(true);
      setErrorMsg('');
      setReportLimitReached(false);
      const updatedRun = await runAiSummaryForSavedRun(runId, { bypassQualityGate });
      setRun(updatedRun);
    } catch (err) {
      if (err?.code === 'PROFILE_QUALITY_GATE_BLOCKED' || err?.message === 'PROFILE_QUALITY_GATE_BLOCKED') {
        return;
      }
      if (err?.code === 'REPORT_LIMIT_REACHED' || err?.message === 'REPORT_LIMIT_REACHED') {
        setReportLimitReached(true);
        setErrorMsg('');
        return;
      }
      setErrorMsg(err.message || 'Failed to run CareerDNA analysis.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleRetake = () => navigate('/start');

  // Re-run a stale result exactly like the "Re-run" action in the profile list:
  // reuse the saved survey profile (the scored first part), create a fresh run,
  // and open it. The new run is dated today, so it opens normally and the user
  // presses "Run CareerDNA Analysis" there — no full backend regeneration here.
  const [rerunningStale, setRerunningStale] = useState(false);
  const handleRerunStale = async () => {
    if (!run) return;
    try {
      setRerunningStale(true);
      setErrorMsg('');
      const newRun = await rerunAssessmentWithOutputParameters(run, run.intro_answers_json || {});
      navigate(`/results/run/${newRun.id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to re-run this result.');
      setRerunningStale(false);
    }
  };

  if (!loading && !run && !errorMsg) {
    return <Navigate to="/profile" replace />;
  }

  const saved = run?.results_json || {};
  const savedArchetypes = saved?.archetypes || {};
  const savedSummary = reportLimitReached ? 'REPORT_LIMIT_REACHED' : (run?.summary_markdown || '');
  const savedAnalysisMeta = saved?.analysisMeta || null;
  const savedIntroName = saved?.introName || '';
  const savedSubdimensionRows = Array.isArray(saved?.subdimensionRows) ? saved.subdimensionRows : [];
  const savedClaritySummary = saved?.claritySummary || null;
  const savedProfileQualityGate = calculateProfileQualityGate({
    archetypes: savedArchetypes,
    subdimensionRows: savedSubdimensionRows,
    claritySummary: savedClaritySummary,
  });

  // Non-blocking: if this result was generated under an older output version,
  // show a banner offering a re-run. It never blocks access to the old result.
  const isStale = !loading && !errorMsg && !!run && runIsStale(run);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', paddingTop: '96px' }}>
      <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {loading ? (
        <div className="profile-runs-loading" style={{ minHeight: '50vh' }} aria-label="Loading your results" aria-busy="true">
          <span className="profile-spinner" aria-hidden="true" />
          <p className="profile-runs-loading-note">Loading your results&hellip;</p>
        </div>
      ) : errorMsg ? (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', color: '#c0392b' }}>
          {errorMsg}
        </div>
      ) : isStale ? (
        <div className="profile-retake-confirm-overlay">
          <section
            className="profile-retake-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cdna-stale-title"
          >
            <h3 id="cdna-stale-title" style={{ marginRight: 0 }}>An earlier version of CareerDNA</h3>
            <p>
              This result was generated with an earlier version of CareerDNA. Re-run it to see your
              results with the latest version.
            </p>

            <div className="profile-retake-confirm-actions">
              <button
                type="button"
                className="profile-retake-confirm-primary"
                onClick={handleRerunStale}
                disabled={rerunningStale}
              >
                {rerunningStale ? 'Re-running…' : 'Re-run'}
              </button>
            </div>
          </section>
        </div>
      ) : (
        <>
          <ResultsComponent
            results={savedArchetypes}
            initialAiSummary={savedSummary}
            loadingSummary={loadingSummary}
            fetchAiSummary={handleRunAnalysis}
            analysisMeta={savedAnalysisMeta}
            introName={savedIntroName}
            archetypes={savedArchetypes}
            summary={savedSummary}
            onRetake={handleRetake}
            onFreshRetake={handleRetake}
            onBack={handleRetake}
            onEditAnswers={handleRetake}
            subdimensionRows={savedSubdimensionRows}
            claritySummary={savedClaritySummary}
            viewerStatus={run?.intro_answers_json?.status || ''}
            uniNeed={run?.intro_answers_json?.uniNeed || ''}
            planUniversity={run?.intro_answers_json?.planUniversity || ''}
            assessmentRunId={run?.id || runId}
            profileQualityGate={savedProfileQualityGate}
            initialSection={initialSection}
            initialTab={initialTab}
            initialFocus={initialFocus}
          />
        </>
      )}
    </div>
  );
}
