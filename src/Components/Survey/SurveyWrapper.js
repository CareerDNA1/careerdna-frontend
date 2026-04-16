import React from 'react';
import './SurveyWrapper.css';
import Header from '../Common/Header';
import IntroQuestions from './IntroQuestions';

export default function SurveyWrapper({ children }) {
  return (
    <>
      <Header />  {/* Now full-width */}
      <div className="survey-app">
        <main className="survey-content">
          {children}
        </main>
      </div>
    </>
  );
}