import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import ResultsComponent from '../Components/Survey/ResultsComponent';
import AccountNavbar from '../Components/Common/AccountNavbar';
import {
  getAssessmentRunById,
  runAiSummaryForSavedRun,
} from '../utils/assessmentRuns';

export default function SavedResultPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { runId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg('');
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

  const handleRunAnalysis = async () => {
    try {
      setLoadingSummary(true);
      setErrorMsg('');
      const updatedRun = await runAiSummaryForSavedRun(runId);
      setRun(updatedRun);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to run CareerDNA analysis.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleRetake = () => navigate('/start');

  if (!loading && !run && !errorMsg) {
    return <Navigate to="/profile" replace />;
  }

  const saved = run?.results_json || {};
  const savedArchetypes = saved?.archetypes || {};
  const savedSummary = run?.summary_markdown || '';
  const savedAnalysisMeta = saved?.analysisMeta || null;
  const savedIntroName = saved?.introName || '';
  const savedSubdimensionRows = Array.isArray(saved?.subdimensionRows) ? saved.subdimensionRows : [];
  const savedClaritySummary = saved?.claritySummary || null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', paddingTop: '96px' }}>
      <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {loading ? (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
          Loading saved result...
        </div>
      ) : errorMsg ? (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', color: '#c0392b' }}>
          {errorMsg}
        </div>
      ) : (
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
          onBack={handleRetake}
          onEditAnswers={handleRetake}
          subdimensionRows={savedSubdimensionRows}
          claritySummary={savedClaritySummary}
          viewerStatus={run?.intro_answers_json?.status || ''}
        />
      )}
    </div>
  );
}
