import React, { useEffect, useRef, useState } from 'react';
import './SurveyComponent.css';
import Button from '../Common/Button';
import { CaretLeft } from 'phosphor-react';
import dnaWhiteLogo from '../../Assets/images/logo-dna-white.png';

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
  onExitSurvey,
}) {
  const wrapperRef = useRef(null);
  const [showTip, setShowTip] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Survey card styling applied inline (immune to CSS hot-reload/caching issues):
  //  - push the whole card down from the top (big drop on tall tablet, small on
  //    phone, none on laptop/desktop)
  //  - lighter drop-shadow on phone (the default one looked too heavy there)
  // Position + shadow the survey card, MEASURED against the real card height and
  // viewport so it works in every orientation (portrait, landscape phone, and
  // landscape iPad) instead of guessing from width alone. Inline => immune to
  // CSS hot-reload/caching issues.
  const [cardStyle, setCardStyle] = useState({});

  useEffect(() => {
    const shadowPhone = '0 6px 16px rgba(15, 23, 42, 0.05)';
    const shadowLarge = '0 14px 38px rgba(15, 23, 42, 0.075)';
    const recompute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight || 800;
      const shadow = w <= 600 ? shadowPhone : shadowLarge;
      const cardH = wrapperRef.current ? wrapperRef.current.offsetHeight : 0;
      const headerApprox = w <= 720 ? 64 : 96;
      const free = h - headerApprox - cardH; // spare vertical room around the card
      let marginTop;
      if (free <= 48) {
        // Not enough room (landscape / short screens): sit near the top so the
        // most content is visible.
        marginTop = 10;
      } else {
        // Comfortable room: drop the card down a bit (but kept fairly high), capped.
        marginTop = Math.min(Math.round(free * 0.34), 130);
      }
      setCardStyle({ marginTop, boxShadow: shadow });
    };
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    };
  }, [currentIndex]);

  useEffect(() => {
    setShowTip(false);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (isLast && readyToFinish && !finishing) {
      setShowCompletionScreen(true);
    }
  }, [isLast, readyToFinish, finishing, currentQuestion?.id]);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.focus();
    } else if (document.activeElement) {
      document.activeElement.blur();
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (typeof currentIndex === 'number' && currentIndex > 0) {
        window.history.go(1);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex > 0) {
      try {
        const url = new URL(window.location.href);
        window.history.pushState({ cdnaSentinel: true }, '', url);
      } catch {}
    }
  }, [currentIndex]);

  const selectedVal = answers?.[currentQuestion?.id]?.value;

  const handleAnswer = (value) => {
    // Drop focus from the tapped button so its :focus/:active styling doesn't
    // carry over onto the same-position button of the next question.
    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onAnswer(value);
    if (isLast) {
      window.setTimeout(() => setShowCompletionScreen(true), 0);
    }
  };

  const handleCompletionBack = () => {
    setShowCompletionScreen(false);
  };

  const handleOpenExitConfirm = () => {
    setShowExitConfirm(true);
  };

  const handleCloseExitConfirm = () => {
    setShowExitConfirm(false);
  };

  const handleConfirmExitSurvey = () => {
    setShowExitConfirm(false);
    if (typeof onExitSurvey === 'function') {
      onExitSurvey();
    }
  };

  const progressPct = Math.max(0, Math.min(100, Math.round(Number(progressPercentage) || 0)));

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
      <div className="forced-choice-buttons forced-choice-buttons--premium" key={currentQuestion?.id}>
        <button
          className={`forced-choice-button forced-choice-button--premium ${selectedVal === 'A' ? 'selected' : ''}`}
          onClick={() => handleAnswer('A')}
        >
          <span className="forced-choice-text">{a}</span>
        </button>

        <button
          className={`forced-choice-button forced-choice-button--premium ${selectedVal === 'B' ? 'selected' : ''}`}
          onClick={() => handleAnswer('B')}
        >
          <span className="forced-choice-text">{b}</span>
        </button>
      </div>
    );
  };

  const renderLikertButtons = () => (
    <div className="likert-scale-row likert-scale-row--premium">
      <div className="scale-side scale-side-left">
        <span>Strongly</span>
        <span>Disagree</span>
      </div>

      <div className="likert-buttons likert-buttons--premium" key={currentQuestion?.id}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleAnswer(n)}
            className={`likert-option likert-option--${n} ${selectedVal === n ? 'selected' : ''}`}
            aria-label={`${n} out of 5`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="scale-side scale-side-right">
        <span>Strongly</span>
        <span>Agree</span>
      </div>
    </div>
  );


  const renderCompletionScreen = () => (
    <>
      <div className="survey-complete-hero" aria-live="polite">
        <div className="survey-complete-confetti" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="survey-complete-badge" aria-hidden="true">🎉</div>

        <h3 className="survey-complete-title">Congratulations, you’ve completed the survey.</h3>
        <p className="survey-complete-text">
          Your answers are ready. Next, CareerDNA will turn your responses into your personalised profile and analysis.
        </p>
      </div>

      <div className="survey-bottom-divider survey-bottom-divider--complete" />

      <div className="survey-bottom-actions survey-bottom-actions--complete">
        <div className="survey-bottom-left">
          {currentIndex > 0 && (
            <button onClick={handleCompletionBack} className="secondary-button">
              <CaretLeft size={15} weight="regular" />
              <span>Back</span>
            </button>
          )}
        </div>
      </div>

      <div className="finish-cta finish-cta--complete">
        <Button
          type="primary"
          size="xl"
          onClick={onShowResults}
          ariaLabel="Show my CareerDNA results"
        >
          <img src={dnaWhiteLogo} alt="" aria-hidden="true" className="survey-finish-button-icon" />
          Show my CareerDNA results
        </Button>
      </div>
    </>
  );

  const renderFinishingScreen = () => (
    <div className="survey-analysis-loader analysis-loader--staged">
      <div className="staged-loader-orb" aria-hidden="true">
        <span className="staged-loader-orb__ring" />
        <span className="staged-loader-orb__dot">
          <span className="staged-loader-orb__logo-wrap" aria-hidden="true">
            <img src={dnaWhiteLogo} alt="" className="staged-loader-orb__logo" />
            <span className="staged-loader-orb__logo-sheen" />
          </span>
        </span>
      </div>

      <div className="staged-loader-content" aria-live="polite">
        <h3 className="staged-loader-title">Creating your CareerDNA results</h3>
        <p className="staged-loader-eyebrow">Building your personalised profile</p>
        <div className="staged-loader-progress-dots" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={`staged-loader-progress-dot ${finishProgress >= dot * 20 ? 'is-active' : ''}`}
            />
          ))}
        </div>
        <p className="staged-loader-text">
          CareerDNA is bringing your answers together. Your results will appear in a moment.
        </p>
      </div>
    </div>
  );

  const isForced = currentQuestion?.type?.toLowerCase() === 'forced';
  const forcedParts = isForced ? parseForcedParts(currentQuestion?.text) : null;

  return (
    <div className="survey-wrapper" ref={wrapperRef} tabIndex={-1} style={cardStyle}>
      <h2 className="section-title">CareerDNA Survey</h2>

      {isLast && finishing ? renderFinishingScreen() : isLast && readyToFinish && showCompletionScreen ? renderCompletionScreen() : (
        <>
      <div className="progress-wrapper">
        <div className="progress-meta" aria-label={`Approximately ${timeLeftLabel}`}>
          <span className="time-pill">{timeLeftLabel}</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="progress-detail-row">
          <p className="progress-label">
            Question {Math.min(currentIndex + 1, total || 0)} of {total || 0}
          </p>
          <p className="progress-percent-visible">{progressPct}% complete</p>
        </div>
      </div>

      <p className="survey-question-text">
        {isForced ? forcedParts?.prompt : currentQuestion.text}
      </p>

      <div className="survey-question">
        {isForced ? renderForcedButtons() : renderLikertButtons()}
      </div>

      <div className="survey-bottom-divider" />

      <div className="survey-bottom-actions">
        <div className="survey-bottom-left" style={{ gap: 16 }}>
          {currentIndex > 0 && (
            <button onClick={onBack} className="secondary-button">
              <CaretLeft size={15} weight="regular" />
              <span>Back</span>
            </button>
          )}

          {typeof onExitSurvey === 'function' && (
            <button
              type="button"
              onClick={handleOpenExitConfirm}
              style={{
                border: 0,
                background: 'transparent',
                color: '#8a95a6',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Exit survey
            </button>
          )}
        </div>

        <div className="survey-bottom-right">
          {currentQuestion?.tip && (
            <div className="survey-tip">
              <button
                type="button"
                className="survey-tip__toggle"
                onClick={() => setShowTip((prev) => !prev)}
                aria-expanded={showTip}
              >
                <span>{showTip ? 'Hide guidance' : 'Not sure?'}</span>
                {!showTip && <small>Get some guidance</small>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Guidance now flows in below the footer (pushes the card taller) instead
          of floating over the answer scale, so it never covers the 4/5 buttons. */}
      {currentQuestion?.tip && showTip && (
        <div className="survey-tip__box" role="note">
          {currentQuestion.tip}
        </div>
      )}

        </>
      )}

      {showExitConfirm && (
        <div
          role="presentation"
          onClick={handleCloseExitConfirm}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(15, 23, 42, 0.34)',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="exitSurveyTitle"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(100%, 430px)',
              borderRadius: 20,
              background: '#ffffff',
              boxShadow: '0 22px 60px rgba(15, 23, 42, 0.22)',
              padding: '26px 28px 24px',
              color: '#172033',
              textAlign: 'left',
            }}
          >
            <h3
              id="exitSurveyTitle"
              style={{
                margin: '0 0 10px',
                color: '#172033',
                fontSize: 20,
                lineHeight: 1.25,
                fontWeight: 750,
                letterSpacing: '-0.02em',
              }}
            >
              Exit survey?
            </h3>

            <p
              style={{
                margin: '0 0 12px',
                color: '#52667f',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              If you exit now, your current survey progress will be lost.
            </p>

            <p
              style={{
                margin: '0 0 22px',
                color: '#52667f',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Alternatively, you can keep this browser tab open and complete the survey later.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={handleCloseExitConfirm}
                style={{
                  minHeight: 36,
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: '1px solid #dbe6f7',
                  background: '#ffffff',
                  color: '#54657b',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Keep going
              </button>

              <button
                type="button"
                onClick={handleConfirmExitSurvey}
                style={{
                  minHeight: 36,
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: 0,
                  background: '#2f6fed',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Exit to profile
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
