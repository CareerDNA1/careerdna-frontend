// src/pages/SurveyQuestions.js
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import SurveyComponent from '../Components/Survey/SurveyComponent';
import QUESTIONS from '../utils/questions_a';
import { useSurveyEngine } from '../Hooks/useSurveyEngine';
import { readProgress, writeProgress } from '../Hooks/useProgress';
import { sendSurveyComplete } from '../utils/telemetry'; // <-- telemetry

const TOTAL_SURVEY_MIN = 20; // evenly split across all questions

// Fixed simulation built from the user's completed spreadsheet responses.
const PERSONAL_PROFILE_ANSWERS = {
  "Q85": {
    "value": 1,
    "weight": 1
  },
  "Q60": {
    "value": 1,
    "weight": 1
  },
  "Q63": {
    "value": "B",
    "weight": 1
  },
  "Q10": {
    "value": 1,
    "weight": 1
  },
  "Q34": {
    "value": 2,
    "weight": 1
  },
  "Q27": {
    "value": "B",
    "weight": 1
  },
  "Q2": {
    "value": 5,
    "weight": 1
  },
  "Q16": {
    "value": 5,
    "weight": 1
  },
  "Q64": {
    "value": 1,
    "weight": 1
  },
  "Q11": {
    "value": "A",
    "weight": 1
  },
  "Q53": {
    "value": 5,
    "weight": 1
  },
  "Q75": {
    "value": "A",
    "weight": 1
  },
  "Q52": {
    "value": 4,
    "weight": 1
  },
  "Q90": {
    "value": 5,
    "weight": 1
  },
  "Q50": {
    "value": 1,
    "weight": 1
  },
  "Q42": {
    "value": 5,
    "weight": 1
  },
  "Q31": {
    "value": "B",
    "weight": 1
  },
  "Q56": {
    "value": 1,
    "weight": 1
  },
  "Q73": {
    "value": 2,
    "weight": 1
  },
  "Q46": {
    "value": 1,
    "weight": 1
  },
  "Q33": {
    "value": 4,
    "weight": 1
  },
  "Q81": {
    "value": 2,
    "weight": 1
  },
  "Q68": {
    "value": 1,
    "weight": 1
  },
  "Q92": {
    "value": 1,
    "weight": 1
  },
  "Q9": {
    "value": 1,
    "weight": 1
  },
  "Q38": {
    "value": 5,
    "weight": 1
  },
  "Q77": {
    "value": 2,
    "weight": 1
  },
  "Q80": {
    "value": 5,
    "weight": 1
  },
  "Q48": {
    "value": 5,
    "weight": 1
  },
  "Q45": {
    "value": 1,
    "weight": 1
  },
  "Q43": {
    "value": "B",
    "weight": 1
  },
  "Q95": {
    "value": "A",
    "weight": 1
  },
  "Q51": {
    "value": "A",
    "weight": 1
  },
  "Q83": {
    "value": "A",
    "weight": 1
  },
  "Q37": {
    "value": 5,
    "weight": 1
  },
  "Q24": {
    "value": 1,
    "weight": 1
  },
  "Q40": {
    "value": 1,
    "weight": 1
  },
  "Q41": {
    "value": 5,
    "weight": 1
  },
  "Q19": {
    "value": "A",
    "weight": 1
  },
  "Q78": {
    "value": 4,
    "weight": 1
  },
  "Q71": {
    "value": "A",
    "weight": 1
  },
  "Q57": {
    "value": 5,
    "weight": 1
  },
  "Q8": {
    "value": 2,
    "weight": 1
  },
  "Q35": {
    "value": "A",
    "weight": 1
  },
  "Q79": {
    "value": "A",
    "weight": 1
  },
  "Q47": {
    "value": "A",
    "weight": 1
  },
  "Q3": {
    "value": "B",
    "weight": 1
  },
  "Q17": {
    "value": 3,
    "weight": 1
  },
  "Q39": {
    "value": "B",
    "weight": 1
  },
  "Q67": {
    "value": "B",
    "weight": 1
  },
  "Q23": {
    "value": "A",
    "weight": 1
  },
  "Q59": {
    "value": "B",
    "weight": 1
  },
  "Q25": {
    "value": 5,
    "weight": 1
  },
  "Q6": {
    "value": 1,
    "weight": 1
  },
  "Q7": {
    "value": "B",
    "weight": 1
  },
  "Q22": {
    "value": 3,
    "weight": 1
  },
  "Q49": {
    "value": 4,
    "weight": 1
  },
  "Q62": {
    "value": 5,
    "weight": 1
  },
  "Q89": {
    "value": 5,
    "weight": 1
  },
  "Q20": {
    "value": 2,
    "weight": 1
  },
  "Q74": {
    "value": 1,
    "weight": 1
  },
  "Q44": {
    "value": 1,
    "weight": 1
  },
  "Q84": {
    "value": 3,
    "weight": 1
  },
  "Q21": {
    "value": 1,
    "weight": 1
  },
  "Q1": {
    "value": 1,
    "weight": 1
  },
  "Q93": {
    "value": 2,
    "weight": 1
  },
  "Q58": {
    "value": 5,
    "weight": 1
  },
  "Q91": {
    "value": "A",
    "weight": 1
  },
  "Q54": {
    "value": 5,
    "weight": 1
  },
  "Q88": {
    "value": 5,
    "weight": 1
  },
  "Q26": {
    "value": 5,
    "weight": 1
  },
  "Q72": {
    "value": 4,
    "weight": 1
  },
  "Q96": {
    "value": 4,
    "weight": 1
  },
  "Q65": {
    "value": 5,
    "weight": 1
  },
  "Q30": {
    "value": 5,
    "weight": 1
  },
  "Q28": {
    "value": 1,
    "weight": 1
  },
  "Q86": {
    "value": 4,
    "weight": 1
  },
  "Q94": {
    "value": 4,
    "weight": 1
  },
  "Q5": {
    "value": 3,
    "weight": 1
  },
  "Q55": {
    "value": "B",
    "weight": 1
  },
  "Q76": {
    "value": 5,
    "weight": 1
  },
  "Q12": {
    "value": 5,
    "weight": 1
  },
  "Q70": {
    "value": 5,
    "weight": 1
  },
  "Q87": {
    "value": "A",
    "weight": 1
  },
  "Q14": {
    "value": 1,
    "weight": 1
  },
  "Q18": {
    "value": 5,
    "weight": 1
  },
  "Q29": {
    "value": 5,
    "weight": 1
  },
  "Q32": {
    "value": 1,
    "weight": 1
  },
  "Q36": {
    "value": 4,
    "weight": 1
  },
  "Q4": {
    "value": 5,
    "weight": 1
  },
  "Q15": {
    "value": "A",
    "weight": 1
  },
  "Q82": {
    "value": 4,
    "weight": 1
  }
};

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

  // Index local to this page (answers are in engine)
  const [index, setIndex] = useState(0);

  // Last-question finish flow
  const [readyToFinish, setReadyToFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishProgress, setFinishProgress] = useState(0);

  const total = questions.length;
  const currentQuestion = total > 0 ? questions[index] : null;
  const isLast = total > 0 && index === total - 1;

  useEffect(() => {
    writeProgress({ step: 'questions' });
  }, []);

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

  const onExitSurvey = () => {
    try {
      sessionStorage.removeItem('cdna_progress_v1');
      sessionStorage.removeItem('cdna_jump_last');
      sessionStorage.removeItem('cdna_subdims_v1');
    } catch {}

    setAnswers({});
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

  // Dev helpers
  const isDev = process.env.NODE_ENV !== 'production';
  const showDevButtons = false;

  const getSimulationIntro = () => {
    const p = readProgress();
    return p.introResponses || {
      age: 'dev',
      status: 'dev',
      schoolSubjects: [],
      uniSubject: 'dev',
      country: 'dev',
      city: 'dev',
    };
  };

  const runSimulation = (simulated) => {
    setAnswers(() => simulated);

    const p = readProgress();
    const intro = getSimulationIntro();

    writeProgress({
      started: true,
      nonce: p.nonce || `dev-${Date.now()}`,
      introResponses: intro,
      introDone: true,
      instructionsDone: true,
      questionsDone: true,
      answers: simulated,
      step: 'results',
    });

    navigate('/results', { replace: true, state: { introResponses: intro } });
  };

  const simulateAndGo = () => {
    const simulated = {};
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const isForced = (q.type || '').toLowerCase() === 'forced';
      const val = isForced ? (Math.random() < 0.5 ? 'A' : 'B') : 1 + Math.floor(Math.random() * 5);
      simulated[q.id] = { value: val, weight: 1 };
    }

    runSimulation(simulated);
  };

  const simulatePersonalProfile = () => {
    if (!PERSONAL_PROFILE_ANSWERS || !Object.keys(PERSONAL_PROFILE_ANSWERS).length) {
      window.alert('No personal profile answers have been embedded yet.');
      return;
    }

    runSimulation(PERSONAL_PROFILE_ANSWERS);
  };

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

      {showBanner && (
        <div
          style={{
            margin: '16px auto 0',
            maxWidth: 700,
            background: 'linear-gradient(135deg, #eef2ff, #f5f7fb)',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '14px 16px',
            textAlign: 'center',
            color: '#374151',
            boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
          }}
          role="status"
          aria-live="polite"
        >
          {index === Math.floor(total / 2)
            ? "You're halfway through. Keep going!"
            : "You've completed 75% of the survey! You're finishing very soon."}
        </div>
      )}
    </>
  );
}
