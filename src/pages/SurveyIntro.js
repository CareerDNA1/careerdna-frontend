import instructionsGraphic from '../Assets/images/instructions_graphic.webp';
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import IntroQuestions from '../Components/Survey/IntroQuestions';
import useStepMount from '../Hooks/useStepMount';
import { readProgress, writeProgress } from '../Hooks/useProgress';
import { getLatestAssessmentRun } from '../utils/assessmentRuns';

export default function SurveyIntro() {
  const navigate = useNavigate();
  const focusRef = useRef(null);
  useStepMount(focusRef);

  // Warm the browser cache with the next page's illustration so it appears
  // together with the text rather than a beat later.
  useEffect(() => { const img = new Image(); img.src = instructionsGraphic; }, []);

  const progress = readProgress();
  const started = !!progress.started;

  useEffect(() => {
    if (!started) navigate('/', { replace: true });
  }, [started, navigate]);

  const [introResponses, setIntroResponses] = useState(() => (
    progress.introResponses || {
      name: '', country: '', age: '', status: '',
      institution: '', schoolSubjects: [], uniSubject: '',
      schoolScope: '', uniNeed: ''
    }
  ));

  // Retake: start from the answers given on the latest report, so a returning
  // student confirms or adjusts rather than typing everything again. Only when
  // nothing has been entered in this attempt yet.
  useEffect(() => {
    if (progress.introResponses) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const run = await getLatestAssessmentRun();
        const prev = run?.intro_answers_json;
        if (cancelled || !prev || typeof prev !== 'object') return;
        setIntroResponses((cur) => {
          const untouched = !cur.country && !cur.status && !cur.institution;
          return untouched ? { ...cur, ...prev } : cur;
        });
      } catch (_) { /* no previous run, or not signed in */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    writeProgress({ introResponses, introDone: true, step: 'instructions' });
    navigate('/survey/instructions'); // <-- push, not replace
  };

  if (!started) return null;

  return (
    <SurveyWrapper>
      <div ref={focusRef}>
        <IntroQuestions
          introResponses={introResponses}
          setIntroResponses={setIntroResponses}
          onStartSurvey={handleContinue}
        />
      </div>
    </SurveyWrapper>
  );
}
