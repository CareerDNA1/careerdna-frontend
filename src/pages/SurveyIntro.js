import instructionsGraphic from '../Assets/images/instructions_graphic.webp';
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import IntroQuestions from '../Components/Survey/IntroQuestions';
import useStepMount from '../Hooks/useStepMount';
import { readProgress, writeProgress } from '../Hooks/useProgress';

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
