// src/pages/SurveyQuestions.js
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import './SurveyQuestions.css';
import SurveyComponent from '../Components/Survey/SurveyComponent';
import QUESTIONS from '../utils/questions_a';
import { useSurveyEngine } from '../Hooks/useSurveyEngine';
import { readProgress, writeProgress, clearProgress } from '../Hooks/useProgress';
import ResumeSurveyModal from '../Components/Survey/ResumeSurveyModal';
import { sendSurveyComplete } from '../utils/telemetry'; // <-- telemetry

const TOTAL_SURVEY_MIN = 20; // evenly split across all questions

// Fixed simulation built from the user's completed spreadsheet responses.

export default function SurveyQuestions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { answers, setAnswers } = useSurveyEngine();
  const progress = readProgress();

  // Flatten questions if grouped by sections
  const questions = useMemo(() => {
    if (!QUESTIONS) return [];
    if (Array.isArray(QUESTIONS) && QUESTIONS.length && QUESTIONS[0]?.items) {
      return QUESTIONS.flatMap(section => section.items || []);
    }
    return QUESTIONS;
  }, []);

  // Index local to this page (answers are in engine). Restored from saved
  // progress so a reload lands on the question the student was on.
  const [index, setIndex] = useState(() => {
    const saved = readProgress();
    const count = saved.answers ? Object.keys(saved.answers).length : 0;
    if (questions.length && count >= questions.length) return questions.length - 1;
    return typeof saved.index === 'number' && saved.index >= 0 ? saved.index : 0;
  });

  // "Continue where you left off?" prompt, shown when /start found an
  // unfinished survey for this user on this device.
  const [askResume, setAskResume] = useState(() => Boolean(location.state && location.state.askResume));

  // Last-question finish flow
  // If every question already has an answer (student left at the completion
  // screen and came back), go straight to that screen again.
  const [readyToFinish, setReadyToFinish] = useState(() => {
    const saved = readProgress();
    const count = saved.answers ? Object.keys(saved.answers).length : 0;
    return count > 0 && count >= (questions.length || Infinity);
  });
  const [finishing, setFinishing] = useState(false);
  const [finishProgress, setFinishProgress] = useState(0);

  const total = questions.length;
  const currentQuestion = total > 0 ? questions[index] : null;
  const isLast = total > 0 && index === total - 1;

  useEffect(() => {
    writeProgress({ step: 'questions' });
  }, []);

  // Keep the saved question index in step with the one on screen.
  useEffect(() => {
    if (total > 0) writeProgress({ index: Math.min(index, total - 1) });
  }, [index, total]);

  const onResumeContinue = () => {
    setAskResume(false);
    window.history.replaceState({}, document.title, window.location.pathname);
    if (readyToFinish) onShowResults();
  };

  // Arriving from the profile's "See my results" with every question already
  // answered: skip the congratulations screen and generate straight away.
  const autoFinishRef = useRef(false);
  useEffect(() => {
    if (autoFinishRef.current) return;
    if (location.state && location.state.autoFinish && readyToFinish && !finishing) {
      autoFinishRef.current = true;
      window.history.replaceState({}, document.title, window.location.pathname);
      onShowResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToFinish]);

  const onResumeRestart = () => {
    setAskResume(false);
    clearProgress();
    setAnswers({});
    navigate('/start?fresh=1', { replace: true });
  };

  // --------- HARDENED JUMP-TO-LAST LOGIC ----------
  // 1) Route state: location.state.jumpTo === 'last'
  // 2) Session flag: sessionStorage.cdna_jump_last === '1'
  // 3) Progress says we came from results
  const jumpedRef = useRef(false);

  useLayoutEffect(() => {
    if (jumpedRef.current) return;
    if (total <= 0) return;

    const fromState = location.state && location.state.jumpTo === 'last';
    let fromSession = false;
    try { fromSession = sessionStorage.getItem('cdna_jump_last') === '1'; } catch {}

    const fromProgress = progress?.step === 'results' && progress?.questionsDone;

    if (fromState || fromSession || fromProgress) {
      jumpedRef.current = true;
      const target = total - 1;
      setIndex(target);

      try { sessionStorage.removeItem('cdna_jump_last'); } catch {}
      if (fromState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [total, location.state, progress]);

  const onAnswer = (value) => {
    if (!currentQuestion) return;
    const { id } = currentQuestion;

    // Save to engine
    setAnswers(prev => {
      const next = { ...prev, [id]: { value, weight: 1 } };
      return next;
    });

    // Persist answers to progress (session/local storage)
    const existing = readProgress().answers || {};
    writeProgress({
      answers: { ...existing, [id]: { value, weight: 1 } },
    });

    // If last question: reveal CTA (do not auto-finish)
    if (isLast) {
      setReadyToFinish(true);
      return;
    }

    // Otherwise advance
    if (index < total - 1) {
      setIndex(i => i + 1);
    }
  };

  const onBack = () => {
    if (isLast) {
      setReadyToFinish(false);
      setFinishing(false);
      setFinishProgress(0);
    }
    if (index > 0) setIndex(i => i - 1);
  };

  const onFinish = () => {
    // Mark complete locally
    writeProgress({ questionsDone: true, step: 'results' });

    // Snapshot latest for telemetry
    const p = readProgress();

    // Fire-and-forget completion telemetry (name is redacted in helper)
    sendSurveyComplete({
      nonce: p.nonce,
      introResponses: p.introResponses || {},
      answers: p.answers || {},
      finishedAt: new Date().toISOString(),
    });

    // Go to results
    navigate('/results', {
      replace: true,
      state: { introResponses: p.introResponses || {} },
    });
  };

  const onShowResults = () => {
    setFinishing(true);
    setFinishProgress(0);

    const stepMs = 280; // 20 * 280ms ≈ 5.6s
    const steps = 20;
    let n = 0;

    const interval = setInterval(() => {
      n += 1;
      setFinishProgress(Math.min(100, Math.round((n / steps) * 100)));
      if (n >= steps) {
        clearInterval(interval);
        onFinish();
      }
    }, stepMs);
  };

  // Exit keeps the saved answers so the student can resume from their profile.
  const onExitSurvey = () => {
    navigate('/profile', { replace: true });
  };

  // Progress % for bar fill (0..100). Use index+1 so Q96 hits 100%.
  const progressPercentage =
    total > 0
      ? Math.min(100, Math.max(0, Math.round(((index + 1) / total) * 100)))
      : 0;

  // Even-split time left, rounded UP to minutes
  const perQuestionSec = total > 0 ? ((TOTAL_SURVEY_MIN * 60) / total) : 0;
  const remainingSec = Math.max(0, perQuestionSec * (total - (index + 1)));
  const remainingMinCeil = Math.ceil(remainingSec / 60);
  const timeLeftLabel = `${remainingMinCeil} minute${remainingMinCeil === 1 ? '' : 's'} left`;

  // Encouragement banner visibility (outside the card at 50% and 75%)
  const showBanner =
    total > 0 &&
    (index === Math.floor(total / 2) || index === Math.floor((total * 3) / 4));

  return (
    <>
      <SurveyWrapper>
        <SurveyComponent
          currentQuestion={currentQuestion}
          currentIndex={index}
          total={total}
          answers={answers}
          onAnswer={onAnswer}
          onBack={onBack}
          onFinish={onFinish}
          progressPercentage={progressPercentage}
          timeLeftLabel={timeLeftLabel}
          isLast={isLast}
          readyToFinish={readyToFinish}
          finishing={finishing}
          finishProgress={finishProgress}
          onShowResults={onShowResults}
          onExitSurvey={onExitSurvey}
        />

      </SurveyWrapper>

      {askResume && (
        <ResumeSurveyModal
          complete={readyToFinish}
          answered={Object.keys(readProgress().answers || {}).length}
          total={total}
          onContinue={onResumeContinue}
          onRestart={onResumeRestart}
        />
      )}

      {showBanner && (
        <>
          <div className="survey-confetti" aria-hidden="true" key={`confetti-${index}`}>
            {Array.from({ length: 70 }, (_, i) => (
              <span
                key={i}
                className="survey-confetti__piece"
                style={{
                  left: `${(i * 37) % 100}%`,
                  animationDelay: `${(i % 9) * 90}ms`,
                  animationDuration: `${2600 + (i % 6) * 320}ms`,
                  background: ['#2f6fed', '#f5b400', '#e63b57', '#1f9e6b', '#8b5cf6'][i % 5],
                  transform: `rotate(${(i * 53) % 360}deg)`,
                  width: i % 3 === 0 ? 12 : 8,
                  height: i % 3 === 0 ? 16 : 11,
                }}
              />
            ))}
          </div>
          <div
            key={`milestone-${index}`}
            className={`survey-milestone${index === Math.floor(total / 2) ? ' survey-milestone--half' : ' survey-milestone--three-quarters'}`}
            role="status"
            aria-live="polite"
          >
            {index === Math.floor(total / 2) ? (
              <><strong>Halfway there.</strong> Your profile is already taking shape. Keep going.</>
            ) : (
              <><strong>Three quarters done.</strong> Only a few minutes left. Nearly there.</>
            )}
          </div>
        </>
      )}
    </>
  );
}
