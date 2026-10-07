import React from 'react';

// Offered when a student comes back to an unfinished survey. Styled to match
// the exit confirmation in SurveyComponent.
export default function ResumeSurveyModal({ answered = 0, total = 0, complete = false, onContinue, onRestart }) {
  const left = Math.max(0, total - answered);
  return (
    <div
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
        aria-labelledby="resumeSurveyTitle"
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
          id="resumeSurveyTitle"
          style={{ margin: '0 0 10px', color: '#172033', fontSize: 20, lineHeight: 1.25, fontWeight: 750, letterSpacing: '-0.02em' }}
        >
          Welcome back
        </h3>

        <p style={{ margin: '0 0 22px', color: '#52667f', fontSize: 14, lineHeight: 1.6 }}>
          {complete
            ? 'You have answered every question. Your answers are saved, so you can go straight to your results, or start a fresh assessment instead.'
            : `You have answered ${answered} of ${total} questions, so there are ${left} to go. Pick up where you left off, or start again from the beginning.`}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onRestart}
            style={{
              minHeight: 36, padding: '8px 16px', borderRadius: 999, border: '1px solid #dbe6f7',
              background: '#ffffff', color: '#54657b', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Start again
          </button>
          <button
            type="button"
            onClick={onContinue}
            style={{
              minHeight: 36, padding: '8px 16px', borderRadius: 999, border: 0,
              background: '#2f6fed', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {complete ? 'Go to my results' : 'Continue'}
          </button>
        </div>
      </section>
    </div>
  );
}
