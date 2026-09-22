import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { saveSatisfactionPulse } from '../../utils/satisfaction';
import './SatisfactionCard.css';

// Small SVG line-faces drawn in the same stroke style as the app's other icons,
// so the satisfaction prompt sits inside the design rather than shouting emoji.
function FaceIcon({ tone }) {
  const mouth = tone === 'sad'
    ? <path d="M8.5 15.5c1-1.4 2.1-2 3.5-2s2.5 0.6 3.5 2" />
    : tone === 'ok'
      ? <path d="M8.7 14.8h6.6" />
      : <path d="M8.5 14c1 1.4 2.1 2 3.5 2s2.5-0.6 3.5-2" />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h0.01" />
      <path d="M15 10h0.01" />
      {mouth}
    </svg>
  );
}

// Displayed left → right, best first: Loved it · It was OK · Not really.
const FACES = [
  { rating: 3, tone: 'good', label: 'Love it' },
  { rating: 2, tone: 'ok', label: 'It is OK' },
  { rating: 1, tone: 'sad', label: 'Not really' },
];

// `wave` turns on recurring mode: the parent has decided a prompt is due for
// this visit number, so we skip the "already rated" lookup and store each answer
// as its own timestamped pulse (a time series) instead of overwriting one row.
export default function SatisfactionCard({ userId, assessmentRunId, asModal = false, onClose, wave = null, onSubmitted }) {
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [rowId, setRowId] = useState('');
  // True if the user had already given feedback before this visit — in that case
  // we hide the card entirely (no lingering "Thanks" every time they return).
  const [wasRatedOnLoad, setWasRatedOnLoad] = useState(false);
  // True only after they submit in THIS session — shows a brief thank-you.
  const [submitted, setSubmitted] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId || !assessmentRunId) { setLoading(false); return; }
      // Recurring mode: the parent already decided this wave is due, so don't
      // re-check for a prior rating (each wave is answered at most once, keyed
      // by visit number in the pulse row).
      if (wave != null) { setLoading(false); return; }
      try {
        const { data, error: readError } = await supabase
          .from('result_feedback')
          .select('id, rating, comment')
          .eq('user_id', userId)
          .eq('assessment_run_id', assessmentRunId)
          .eq('feedback_scope', 'overall_usefulness')
          .maybeSingle();
        if (readError) throw readError;
        if (cancelled) return;
        if (data?.id) {
          setRowId(data.id);
          // Already rated on a previous visit → don't show the card again.
          if (Number(data.rating || 0) > 0) setWasRatedOnLoad(true);
        }
      } catch (_) {
        // If the read fails we still let the user rate.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, assessmentRunId, wave]);

  // Modal mode: lock page scroll + close on Escape while the popup is visible.
  const willShow = asModal && !!userId && !!assessmentRunId && !loading && !wasRatedOnLoad;
  useEffect(() => {
    if (!willShow) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [willShow, onClose]);

  // Auto-dismiss the popup shortly after the thank-you.
  useEffect(() => {
    if (asModal && submitted && onClose) {
      const t = setTimeout(onClose, 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [asModal, submitted, onClose]);

  const persist = async ({ nextRating, nextComment }) => {
    // Recurring mode: store a timestamped pulse (keeps history) and mirror the
    // latest rating into the overall_usefulness row.
    if (wave != null) {
      await saveSatisfactionPulse(userId, assessmentRunId, {
        visit: wave,
        rating: nextRating,
        comment: nextComment || '',
      });
      return `pulse:${wave}`;
    }
    const row = {
      user_id: userId,
      assessment_run_id: assessmentRunId,
      feedback_scope: 'overall_usefulness',
      item_type: null,
      item_id: null,
      item_title: null,
      reaction: null,
      rating: nextRating,
      comment: nextComment || null,
      updated_at: new Date().toISOString(),
    };
    if (rowId) {
      const { error: upErr } = await supabase.from('result_feedback').update(row).eq('id', rowId);
      if (upErr) throw upErr;
      return rowId;
    }
    const { data, error: insErr } = await supabase
      .from('result_feedback')
      .insert(row)
      .select('id')
      .maybeSingle();
    if (insErr) throw insErr;
    return data?.id || '';
  };

  const handlePick = async (value) => {
    setError('');
    setRating(value);
    try {
      const id = await persist({ nextRating: value, nextComment: comment });
      if (id) setRowId(id);
    } catch (_) {
      setError('Could not save your rating. Please try again.');
    }
  };

  const handleSaveComment = async () => {
    if (!rating || savingComment) return;
    try {
      setSavingComment(true);
      setError('');
      const id = await persist({ nextRating: rating, nextComment: comment.trim() });
      if (id) setRowId(id);
      setSubmitted(true);
      if (typeof onSubmitted === 'function') onSubmitted(wave);
    } catch (_) {
      setError('Could not save your comment. Please try again.');
    } finally {
      setSavingComment(false);
    }
  };

  // Hide entirely if we can't render, still loading, or they already gave
  // feedback on a previous visit.
  if (!userId || !assessmentRunId || loading || wasRatedOnLoad) return null;

  const wrap = (node) => (asModal ? (
    <div
      className="satisfaction-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}
    >
      <div className="satisfaction-modal">
        {onClose ? (
          <button type="button" className="satisfaction-modal-close" onClick={onClose} aria-label="Close">×</button>
        ) : null}
        {node}
      </div>
    </div>
  ) : node);

  if (submitted) {
    return wrap(
      <section className="satisfaction-card satisfaction-card--done" aria-label="Feedback received">
        <span className="satisfaction-done-icon" aria-hidden="true">✓</span>
        <span className="satisfaction-done-text">Thanks for your feedback</span>
      </section>
    );
  }

  return wrap(
    <section className="satisfaction-card" aria-label="How useful is CareerDNA so far?">
      <span className="satisfaction-title">How useful is CareerDNA so far?</span>

      <div className="satisfaction-faces" role="radiogroup" aria-label="Usefulness rating">
        {FACES.map((face) => (
          <button
            key={face.rating}
            type="button"
            className={`satisfaction-face satisfaction-face--${face.tone} ${rating === face.rating ? 'is-active' : ''}`}
            onClick={() => handlePick(face.rating)}
            role="radio"
            aria-checked={rating === face.rating}
            aria-label={face.label}
            title={face.label}
          >
            <FaceIcon tone={face.tone} />
            <span className="satisfaction-face-label">{face.label}</span>
          </button>
        ))}
      </div>

      {rating > 0 ? (
        <div className="satisfaction-comment-wrap">
          <textarea
            className="satisfaction-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Would love to hear what we can improve"
            rows={2}
            maxLength={1000}
          />
          <button
            type="button"
            className="satisfaction-done-btn"
            onClick={handleSaveComment}
            disabled={savingComment}
          >
            {savingComment ? 'Saving…' : 'Done'}
          </button>
        </div>
      ) : null}

      {error ? <div className="satisfaction-error">{error}</div> : null}
    </section>
  );
}
