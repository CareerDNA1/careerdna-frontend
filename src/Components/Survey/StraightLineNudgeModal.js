import React from 'react';

// Shown once the student has chosen the same option for several questions in
// a row (SurveyQuestions decides when). Styled to match ResumeSurveyModal and
// the exit confirmation in SurveyComponent. It is a gentle check, not a block:
// the same answer in a row can be true, and the student may simply carry on.
export default function StraightLineNudgeModal({ run = 8, onCarryOn, onLookBack }) {
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
        aria-labelledby="straightLineNudgeTitle"
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
          id="straightLineNudgeTitle"
          style={{ margin: '0 0 10px', color: '#172033', fontSize: 20, lineHeight: 1.25, fontWeight: 750, letterSpacing: '-0.02em' }}
        >
          Quick check
        </h3>

        <p style={{ margin: '0 0 22px', color: '#52667f', fontSize: 14, lineHeight: 1.6 }}>
          You have chosen the same answer for the last {run} questions. That is fine if it is true for you.
          If you have been moving quickly, it is worth slowing down a little: your matches are only as good as
          your answers, and the same option many times in a row usually means some questions were not read.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onLookBack}
            style={{
              minHeight: 36, padding: '8px 16px', borderRadius: 999, border: '1px solid #dbe6f7',
              background: '#ffffff', color: '#54657b', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Look back at them
          </button>
          <button
            type="button"
            onClick={onCarryOn}
            style={{
              minHeight: 36, padding: '8px 16px', borderRadius: 999, border: 0,
              background: '#2f6fed', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Carry on
          </button>
        </div>
      </section>
    </div>
  );
}
