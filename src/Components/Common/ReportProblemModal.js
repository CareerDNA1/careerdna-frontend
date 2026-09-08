import { useEffect, useRef, useState } from 'react';
import { reportProblem } from '../../utils/reportProblem';
import './ReportProblemModal.css';

// A small popup shown when the footer "Report a problem" link is clicked. Lets
// the user describe an issue in free text; the report is stored in the database
// (with the current page + run id attached) and surfaced in the admin panel.
export default function ReportProblemModal({ onClose, assessmentRunId = '' }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const text = message.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      setError('');
      await reportProblem({ message: text, assessmentRunId });
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Could not submit your report. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="report-problem-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-problem-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="report-problem-modal">
        <button type="button" className="report-problem-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {sent ? (
          <div className="report-problem-done">
            <div className="report-problem-done-icon" aria-hidden="true">✓</div>
            <h2 id="report-problem-title">Thanks — we've got it</h2>
            <p>Your report has been sent to our team. We'll look into it.</p>
            <button type="button" className="report-problem-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 id="report-problem-title" className="report-problem-title">Report a problem</h2>
            <p className="report-problem-intro">
              Found something that isn't working, or looks wrong? Tell us what happened and we'll
              take a look.
            </p>

            <textarea
              ref={textareaRef}
              className="report-problem-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the problem…"
              rows={5}
              maxLength={2000}
              disabled={sending}
            />

            {error ? <div className="report-problem-error">{error}</div> : null}

            <div className="report-problem-actions">
              <button type="button" className="report-problem-secondary" onClick={onClose} disabled={sending}>
                Cancel
              </button>
              <button
                type="button"
                className="report-problem-primary"
                onClick={handleSubmit}
                disabled={sending || !message.trim()}
              >
                {sending ? 'Sending…' : 'Send report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
