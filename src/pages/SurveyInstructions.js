// src/pages/SurveyInstructions.js
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import Instructions from '../Components/Survey/Instructions';
import useStepMount from '../Hooks/useStepMount';
import { readProgress, writeProgress } from '../Hooks/useProgress';

export default function SurveyInstructions() {
  const navigate = useNavigate();
  const location = useLocation();
  const focusRef = useRef(null);
  useStepMount(focusRef);

  const progress = readProgress();
  const started = !!progress.started;
  const introDone = !!progress.introDone;

  // Compute dev flag WITHOUT a hook and BEFORE any early return
  const qs = new URLSearchParams(location.search);
  const isDev = process.env.NODE_ENV !== 'production' || qs.has('dev');

  // Guards in an effect
  useEffect(() => {
    if (!started) {
      navigate('/', { replace: true });
    } else if (!introDone) {
      navigate('/survey/intro', { replace: true });
    }
  }, [started, introDone, navigate]);

  if (!started || !introDone) return null;

  const handleStart = () => {
    writeProgress({ instructionsDone: true, step: 'questions' });
    navigate('/survey/questions');
  };

  // DEV: auto-complete survey
  const handleSimulate = () => {
    const intro = progress.introResponses || {
      age: '16-18',
      status: 'school',
      schoolSubjects: ['Maths', 'Business'],
    };

    const mockResults = {
      Achiever: 78,
      Connector: 64,
      Creator: 55,
      Explorer: 71,
      Organizer: 62,
      Thinker: 83,
      Visionary: 59,
    };

    writeProgress({
      started: true,
      introResponses: intro,
      introDone: true,
      instructionsDone: true,
      answers: {},
      results: mockResults,
      step: 'results',
    });

    navigate('/results', { replace: true });
  };

  return (
    <SurveyWrapper>
      <div ref={focusRef}>
        <Instructions
          onStart={handleStart}
          // Show the dev button only when allowed
          onSimulate={isDev ? handleSimulate : undefined}
        />
      </div>
    </SurveyWrapper>
  );
}
