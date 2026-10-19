// src/pages/SurveyQuestions.js
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import './SurveyQuestions.css';
import SurveyComponent from '../Components/Survey/SurveyComponent';
import { getBankForm, CURRENT_BANK_VERSION, CURRENT_FORM } from '../utils/banks';
import { useSurveyEngine } from '../Hooks/useSurveyEngine';
import { readProgress, writeProgress, clearProgress } from '../Hooks/useProgress';
import ResumeSurveyModal from '../Components/Survey/ResumeSurveyModal';
import StraightLineNudgeModal from '../Components/Survey/StraightLineNudgeModal';
import { saveSurveyAnswersOnFinish } from '../utils/assessmentRuns';

// New surveys always run on the current bank in its current form.
const QUESTIONS = getBankForm(CURRENT_BANK_VERSION, CURRENT_FORM);

const TOTAL_SURVEY_MIN = 15; // evenly split across all questions; matches the "about 15 minutes" shown on the landing page and instructions

// In-survey straight-line check: after this many identical answers in a row
// (in the order shown) a gentle nudge appears. Below the quality gate's
// thresholds (severe 12, block 25 in utils/responseStyle.js) so the student
// hears about it early rather than at the end. Shown at most twice per survey.
const STRAIGHT_LINE_NUDGE_RUN = 10;
const STRAIGHT_LINE_NUDGE_MAX_SHOWS = 2;

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

  // Straight-line nudge state: how many times shown, and the position where it
  // was last shown (so the same run cannot trigger it twice).
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const nudgeShowsRef = useRef(0);
  const nudgeLastIndexRef = useRef(-1);

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
    const merged = { ...existing, [id]: { value, weight: 1 } };
    writeProgress({ answers: merged });

    // If last question: reveal CTA (do not auto-finish)
    if (isLast) {
      setReadyToFinish(true);
      return;
    }

    // Straight-line check: count identical answers ending at this question,
    // in the order the questions are shown. Raw values only; reverse keying
    // is irrelevant here because the check is about the option clicked.
    if (nudgeShowsRef.current < STRAIGHT_LINE_NUDGE_MAX_SHOWS && index - nudgeLastIndexRef.current >= STRAIGHT_LINE_NUDGE_RUN) {
      let run = 0;
      for (let j = index; j >= 0; j -= 1) {
        const prev = merged[questions[j]?.id];
        const v = prev && typeof prev === 'object' && 'value' in prev ? prev.value : prev;
        if (v !== value) break;
        run += 1;
      }
      if (run >= STRAIGHT_LINE_NUDGE_RUN) {
        nudgeShowsRef.current += 1;
        nudgeLastIndexRef.current = index;
        setNudgeOpen(true);
        // Stay on this question until the student chooses; advance on Carry on.
        return;
      }
    }

    // Otherwise advance
    if (index < total - 1) {
      setIndex(i => i + 1);
    }
  };

  const onNudgeCarryOn = () => {
    setNudgeOpen(false);
    if (index < total - 1) setIndex(i => i + 1);
  };

  // Jump back to the first question of the run so the student can re-read
  // them; their answers are kept and shown, so changing one is a single click.
  const onNudgeLookBack = () => {
    setNudgeOpen(false);
    setIndex(i => Math.max(0, i - (STRAIGHT_LINE_NUDGE_RUN - 1)));
  };

  const onBack = () => {
    if (isLast) {
      setReadyToFinish(false);
      setFinishing(false);
      setFinishProgress(0);
    }
    if (index > 0) setIndex(i => i - 1);
  };

  const onFinish = async () => {
    // Mark complete locally
    writeProgress({ questionsDone: true, step: 'results' });

    // Save the finished answer set to the database now, so it exists even if
    // the student never reaches the results page. The results page updates
    // this same row with the full results and the report. Awaited, otherwise
    // the results page can look the row up before this insert has landed and
    // save a second copy (seen 19 Oct 2026: two rows 650 ms apart).
    const p = readProgress();
    await saveSurveyAnswersOnFinish({
      nonce: p.nonce,
      introAnswers: p.introResponses || {},
      surveyAnswers: p.answers || {},
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

      {nudgeOpen && (
        <StraightLineNudgeModal
          run={STRAIGHT_LINE_NUDGE_RUN}
          onCarryOn={onNudgeCarryOn}
          onLookBack={onNudgeLookBack}
        />
      )}

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
