// src/pages/ResultsPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AccountNavbar from '../Components/Common/AccountNavbar';
import ResultsComponent from '../Components/Survey/ResultsComponent';
import { useSurveyEngine } from '../Hooks/useSurveyEngine';

import scoreSubdimensions from '../utils/scoreSubdimensions';
import QUESTIONS from '../utils/questions';
import { computeClarityPercents } from '../utils/selfAwarenessSummary';
import { saveAssessmentRun, updateAssessmentRun } from '../utils/assessmentRuns';
import { useAuth } from '../context/AuthContext';
import { readProgress } from '../Hooks/useProgress';
import { calculateProfileQualityGate } from '../utils/profileQualityGate';

// Safe JSON getter from localStorage
function getJSON(key, fallback = {}) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}



export default function ResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assessmentRunId, setAssessmentRunId] = useState('');

  const {
    archetypes,
    summary,
    loading,
    generateSummary,
    analysisMeta,
    introResponses,
    answers,
    questions,
    state,
  } = useSurveyEngine();

  const hasResults =
    archetypes && typeof archetypes === 'object' && Object.keys(archetypes).length > 0;

  // --- robust fallbacks for answers & questions ---
  const answersFallback =
    answers ||
    state?.answers ||
    getJSON('cdna_answers', {}) ||
    getJSON('answers', {});

  const questionsFallback =
    (Array.isArray(questions) && questions.length ? questions : null) ||
    (Array.isArray(state?.questions) && state.questions.length ? state.questions : null) ||
    QUESTIONS;

  // --- subdimensions (for dimensions carousel & for PDF) ---
  const subdimensionRows = scoreSubdimensions(answersFallback, questionsFallback);

  // --- clarity (for PDF) ---
  const claritySummary = computeClarityPercents(questionsFallback, answersFallback, {
    dimensionOrder: ['Who You Are', 'What You Love', 'What Matters', 'How You Work Best'],
  });

  const profileQualityGate = calculateProfileQualityGate({
    archetypes,
    subdimensionRows,
    claritySummary,
  });

  useEffect(() => {
    const trimmedSummary = typeof summary === 'string' ? summary.trim() : '';
    if (!user || !hasResults) return;

    const progress = readProgress();
    const nonce = progress?.nonce || 'no-nonce';
    const saveKey = `cdna_saved_run_${user.id}_${nonce}`;

    const resultsPayload = {
      archetypes,
      analysisMeta: analysisMeta || null,
      introName: introResponses?.name || '',
      subdimensionRows,
      claritySummary,
      profileQualityGate,
    };

    let cancelled = false;

    (async () => {
      try {
        let existingSavedRunId = '';
        try {
          existingSavedRunId = sessionStorage.getItem(saveKey) || '';
        } catch {}

        // A concurrent effect run (summary streaming in, or a StrictMode
        // double-invoke) has already claimed the insert — bail so we don't
        // create a duplicate assessment run for the same survey.
        if (existingSavedRunId === 'pending') return;

        if (existingSavedRunId && existingSavedRunId !== '1') {
          if (!cancelled) setAssessmentRunId(existingSavedRunId);

          if (trimmedSummary) {
            const summaryUpdateKey = `${saveKey}_summary_${trimmedSummary.length}`;
            let alreadyUpdated = false;
            try {
              alreadyUpdated = sessionStorage.getItem(summaryUpdateKey) === '1';
            } catch {}

            if (!alreadyUpdated) {
              await updateAssessmentRun(existingSavedRunId, {
                summary_markdown: trimmedSummary,
                results_json: resultsPayload,
              });

              try {
                sessionStorage.setItem(summaryUpdateKey, '1');
              } catch {}
            }
          }

          return;
        }

        // Claim the save slot synchronously (before the await) so a second
        // effect run can't pass the empty check and insert a duplicate.
        try {
          sessionStorage.setItem(saveKey, 'pending');
        } catch {}

        let savedRun;
        try {
          savedRun = await saveAssessmentRun({
            introAnswers: introResponses || {},
            surveyAnswers: answersFallback || {},
            resultsJson: resultsPayload,
            summaryMarkdown: trimmedSummary,
          });
        } catch (saveErr) {
          // Release the slot so a retry can save instead of being blocked.
          try {
            sessionStorage.setItem(saveKey, '');
          } catch {}
          throw saveErr;
        }

        const savedRunId = savedRun?.id || savedRun?.data?.id || savedRun?.[0]?.id || '';
        if (savedRunId) setAssessmentRunId(savedRunId);
        try {
          sessionStorage.setItem(saveKey, savedRunId || '1');
        } catch {}
      } catch (err) {
        console.error('Failed to save assessment run:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    hasResults,
    summary,
    archetypes,
    analysisMeta,
    introResponses,
    answersFallback,
    subdimensionRows,
    claritySummary,
  ]);

  const renderPageShell = (content) => (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', paddingTop: '96px' }}>
      <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {content}
    </div>
  );

  if (!hasResults) {
    return renderPageShell(
      <div
        style={{
          maxWidth: '760px',
          margin: '48px auto',
          padding: '32px',
          background: '#fff',
          border: '1px solid #e5ecf5',
          borderRadius: '24px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: '#2f80ed', marginTop: 0, marginBottom: '12px' }}>
          No CareerDNA results yet
        </h2>
        <p style={{ color: '#5b6677', marginBottom: '22px', lineHeight: 1.6 }}>
          Please complete the survey first to view your results.
        </p>
        <button
          type="button"
          onClick={() => navigate('/survey/intro')}
          style={{
            background: '#2f80ed',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 18px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Go to Survey
        </button>
      </div>
    );
  }

  const handleBackToSurvey = () => {
    try {
      sessionStorage.setItem('cdna_jump_last', '1');
    } catch {}
    navigate('/survey/questions', { state: { jumpTo: 'last' } });
  };

  // Quality-gate "Retake the assessment": a genuine FRESH start. Clear the saved
  // answers/progress so the survey begins blank at Q1 (via /start), rather than
  // resuming the previous — flagged-as-random — answers at the last question.
  const handleFreshRetake = () => {
    try {
      sessionStorage.removeItem('cdna_progress_v1');
      sessionStorage.removeItem('cdna_jump_last');
    } catch {}
    navigate('/start');
  };

  const handleBackHome = () => navigate('/');

  return renderPageShell(
    <ResultsComponent
      results={archetypes}
      initialAiSummary={summary}
      loadingSummary={!!loading}
      fetchAiSummary={typeof generateSummary === 'function' ? generateSummary : undefined}
      analysisMeta={analysisMeta}
      introName={introResponses?.name || ''}
      archetypes={archetypes}
      summary={summary}
      onRetake={handleBackToSurvey}
      onFreshRetake={handleFreshRetake}
      onBack={handleBackToSurvey}
      onEditAnswers={handleBackToSurvey}
      onBackHome={handleBackHome}
      subdimensionRows={subdimensionRows}
      claritySummary={claritySummary}
      viewerStatus={introResponses?.status || ''}
      uniNeed={introResponses?.uniNeed || ''}
      planUniversity={introResponses?.planUniversity || ''}
      assessmentRunId={assessmentRunId}
      profileQualityGate={profileQualityGate}
    />
  );
}
