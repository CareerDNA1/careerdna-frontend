import React, { useState } from 'react';
import useSurveyEngine from '../Hooks/useSurveyEngine';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import Instructions from '../Components/Survey/Instructions';
import SurveyComponent from '../Components/Survey/SurveyComponent';
import ResultsComponent from '../Components/Survey/ResultsComponent';
import IntroQuestions from '../Components/Survey/IntroQuestions';

export default function SurveyPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [introResponses, setIntroResponses] = useState({
    name: '',
    country: '',
    age: '',
    status: '',
    institution: '',
    schoolSubjects: [],
    uniSubject: '',
    planUniversity: '',
  });

  const {
    screen,
    results,
    archetypes,
    currentQuestion,
    currentIndex,
    answers,
    aiSummary,
    loadingSummary,
    chartRef,
    pdfRef,
    handleAnswer,
    goBack,
    simulateSurvey,
    fetchAiSummary,
    progressPercentage,
    setScreen,
    showMidpointMessage,
  } = useSurveyEngine(introResponses);

  const getSubject = () => {
    if (introResponses.status === 'school') {
      return introResponses.schoolSubjects || [];
    } else if (
      introResponses.status === 'undergraduate' ||
      introResponses.status === 'postgraduate'
    ) {
      return introResponses.uniSubject || '';
    } else {
      return '';
    }
  };

  const getInterests = () => {
    if (introResponses.status === 'school') {
      return introResponses.schoolSubjects || [];
    } else if (
      introResponses.status === 'undergraduate' ||
      introResponses.status === 'postgraduate'
    ) {
      return [introResponses.uniSubject] || [];
    } else {
      return [];
    }
  };

  console.log('SurveyPage screen:', screen);
  console.log('SurveyPage results:', results);
  console.log('SurveyPage archetypes:', archetypes);
  console.log('SurveyPage rendering ResultsComponent:', !!archetypes && Object.keys(archetypes).length > 0);

  return (
    <SurveyWrapper>
      {showIntro ? (
        <IntroQuestions
          introResponses={introResponses}
          setIntroResponses={setIntroResponses}
          onStartSurvey={() => {
            console.log('✅ Starting survey with:', introResponses);
            setShowIntro(false);
          }}
        />
      ) : screen === 'instructions' ? (
        <Instructions
          onStart={() => setScreen('survey')}
          onSimulate={simulateSurvey}
        />
      ) : screen === 'survey' && (!archetypes || Object.keys(archetypes).length === 0) ? (
        <>
          {showMidpointMessage && (
            <div className="midpoint-message">
              🎉 You're halfway through! Keep going, you're doing great and your insights are helping shape your unique CareerDNA.
            </div>
          )}
          <SurveyComponent
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            answers={answers}
            onAnswer={handleAnswer}
            onBack={goBack}
            progressPercentage={progressPercentage}
          />
        </>
      ) : (
        <ResultsComponent
          results={archetypes}
          initialAiSummary={aiSummary}
          fetchAiSummary={fetchAiSummary}
          loadingSummary={loadingSummary}
          chartRef={chartRef}
          pdfRef={pdfRef}
          age={introResponses.age}
          status={introResponses.status}
          schoolSubjects={introResponses.schoolSubjects || []}
          uniSubject={introResponses.uniSubject || ''}
        />
      )}
    </SurveyWrapper>
  );
}