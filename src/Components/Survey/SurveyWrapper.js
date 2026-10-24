import React from 'react';
import './SurveyWrapper.css';
import Header from '../Common/Header';

export default function SurveyWrapper({ children, hideBack = false }) {
  return (
    <>
      <Header hideBack={hideBack} />
      <div className="survey-app">
        <main className="survey-content">
          {children}
        </main>
      </div>
    </>
  );
}