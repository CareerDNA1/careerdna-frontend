// src/pages/ResultsPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import ResultsComponent from '../Components/Survey/ResultsComponent';
import { useSurveyEngine } from '../Hooks/useSurveyEngine';

import scoreSubdimensions from '../utils/scoreSubdimensions';
import QUESTIONS from '../utils/questions';
import { computeClarityPercents } from '../utils/selfAwarenessSummary';
import { saveAssessmentRun } from '../utils/assessmentRuns';
import { useAuth } from '../context/AuthContext';
import { readProgress } from '../Hooks/useProgress';

// Safe JSON getter from localStorage
function getJSON(key, fallback = {}) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const PassThrough = ({ children }) => children;

export default function ResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  useEffect(() => {
    const trimmedSummary = typeof summary === 'string' ? summary.trim() : '';
    if (!user || !hasResults || !trimmedSummary) return;

    const progress = readProgress();
    const nonce = progress?.nonce || 'no-nonce';
    const saveKey = `cdna_saved_run_${user.id}_${nonce}`;

    try {
      if (sessionStorage.getItem(saveKey)) return;
    } catch {}

    let cancelled = false;

    (async () => {
      try {
        await saveAssessmentRun({
          introAnswers: introResponses || {},
          surveyAnswers: answersFallback || {},
          resultsJson: {
            archetypes,
            analysisMeta: analysisMeta || null,
            introName: introResponses?.name || '',
            subdimensionRows,
            claritySummary,
          },
          summaryMarkdown: summary,
        });

        if (!cancelled) {
          try {
            sessionStorage.setItem(saveKey, '1');
          } catch {}
        }
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

  if (!hasResults) {
    return (
      <PassThrough>
        <SurveyWrapper>
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
        </SurveyWrapper>
      </PassThrough>
    );
  }

  const handleBackToSurvey = () => {
    try {
      sessionStorage.setItem('cdna_jump_last', '1');
    } catch {}
    navigate('/survey/questions', { state: { jumpTo: 'last' } });
  };

  const handleBackHome = () => navigate('/');

  return (
    <PassThrough>
      <SurveyWrapper>
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
          onBack={handleBackToSurvey}
          onEditAnswers={handleBackToSurvey}
          onBackHome={handleBackHome}
          subdimensionRows={subdimensionRows}
          claritySummary={claritySummary}
          viewerStatus={introResponses?.status || ''}
        />
      </SurveyWrapper>
    </PassThrough>
  );
}
