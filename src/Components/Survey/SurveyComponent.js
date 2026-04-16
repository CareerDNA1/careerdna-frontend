// components/survey/SurveyComponent.js
import React, { useEffect, useRef } from 'react';
import './SurveyComponent.css';
import Button from '../Common/Button';

export default function SurveyComponent({
  currentQuestion,
  currentIndex,
  total,
  answers,
  onAnswer,
  onBack,
  onFinish,
  progressPercentage,

  // NEW
  timeLeftLabel, // e.g., "6 minutes left"

  // last-question flow
  isLast,
  readyToFinish,
  finishing,
  finishProgress,
  onShowResults,
}) {
  // --- prevent focus caret flashing top-left ---
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.focus();
    } else if (document.activeElement) {
      document.activeElement.blur();
    }
  }, []);

  // Block browser Back on Q1+, allow it on Q0 (back to Instructions)
  useEffect(() => {
    const onPop = () => {
      if (typeof currentIndex === 'number' && currentIndex > 0) {
        window.history.go(1); // neutralize back
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [currentIndex]);

  // seed sentinel on Q1+
  useEffect(() => {
    if (currentIndex > 0) {
      try {
        const url = new URL(window.location.href);
        window.history.pushState({ cdnaSentinel: true }, '', url);
      } catch {}
    }
  }, [currentIndex]);

  const selectedVal = answers?.[currentQuestion?.id]?.value;
  const getButtonStyle = (val) => ({
    backgroundColor: selectedVal === val ? '#2f80ed' : '#f0f0f0',
    color: selectedVal === val ? 'white' : '#333',
    border: '1px solid #ccc',
    padding: '10px 15px',
    fontSize: '15px',
    borderRadius: '6px',
    cursor: 'pointer',
  });

  // forced-choice parser
  const parseForcedParts = (text = '') => {
    const m = text.match(/A:\s*([\s\S]*?)\s*B:\s*([\s\S]*)$/);
    const a = m?.[1]?.trim() || 'Option A';
    const b = m?.[2]?.trim() || 'Option B';
    const aIdx = text.indexOf('A:');
    const prompt = aIdx > -1 ? text.slice(0, aIdx).trim() : text.trim();
    return { prompt, a, b };
  };

  const renderForcedButtons = () => {
    const { a, b } = parseForcedParts(currentQuestion.text);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={() => onAnswer('A')} style={getButtonStyle('A')}>
          {a}
        </button>
        <button onClick={() => onAnswer('B')} style={getButtonStyle('B')}>
          {b}
        </button>
      </div>
    );
  };

  const renderLikertButtons = () => (
    <div className="likert-buttons">
      <div className="scale-label">
        <span>Disagree</span>
        <div className="scale-icon">👎</div>
      </div>

      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onAnswer(n)} style={getButtonStyle(n)}>
          {n}
        </button>
      ))}

      <div className="scale-label">
        <span>Agree</span>
        <div className="scale-icon">👍</div>
      </div>
    </div>
  );

  const isForced = currentQuestion?.type?.toLowerCase() === 'forced';
  const forcedParts = isForced ? parseForcedParts(currentQuestion?.text) : null;

  return (
    <div
      className="survey-wrapper"
      ref={wrapperRef}
      tabIndex={-1}
    >
      <h2 className="section-title">CareerDNA Survey</h2>

      {/* Progress + Question count */}
      <div className="progress-wrapper">
        {/* NEW: time pill above the bar, right-aligned */}
        <div className="progress-meta" aria-label={`Approximately ${timeLeftLabel}`}>
          <span className="time-pill">{timeLeftLabel}</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
          {/* removed the old inline text inside the bar */}
        </div>
        <p className="progress-label">
          Question {Math.min(currentIndex + 1, total || 0)} of {total || 0}
        </p>
      </div>

      {/* Question */}
      <p className="survey-question-text">
        {isForced ? forcedParts?.prompt : currentQuestion.text}
      </p>

      {/* Answer options */}
      <div className="survey-question">
        {isForced ? renderForcedButtons() : renderLikertButtons()}
      </div>

      {/* Back button */}
      {currentIndex > 0 && (
        <button onClick={onBack} className="secondary-button">
          Back
        </button>
      )}

      {/* LAST QUESTION: CTA appears only AFTER they answer the 96th question */}
      {isLast && readyToFinish && !finishing && (
        <div className="finish-cta">
          <Button
            type="primary"
            size="xl"
            onClick={onShowResults}
            ariaLabel="Show my CareerDNA results"
          >
            Show my CareerDNA results
          </Button>
        </div>
      )}

      {/* LAST QUESTION: circular loader instead of bar */}
      {isLast && finishing && (
        <div className="summary-loader">
          <div className="circular-loader">
            <svg className="progress-ring" width="100" height="100">
              <circle
                className="progress-ring__circle"
                stroke="#2f80ed"
                strokeWidth="8"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                style={{
                  strokeDasharray: 251,
                  strokeDashoffset: 251 - (finishProgress / 100) * 251,
                  transition: 'stroke-dashoffset .25s ease',
                }}
              />
            </svg>
            <div className="progress-text">
              {Math.floor(finishProgress)}%
            </div>
          </div>
          <p className="summary-text">
            Preparing your CareerDNA summary…
          </p>
        </div>
      )}
    </div>
  );
}
