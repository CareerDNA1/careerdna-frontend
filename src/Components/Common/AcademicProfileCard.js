import React, { useEffect, useState } from 'react';
import { GraduationCap, Plus, X } from 'phosphor-react';
import {
  getMyAcademicProfile,
  saveMyAcademicProfile,
  emptyAcademicProfile,
  hasAcademicData,
  ALEVEL_GRADES,
  GCSE_GRADES,
  ALEVEL_SUBJECTS,
  GCSE_SUBJECTS,
} from '../../utils/academicProfile';
import './AcademicProfileCard.css';

// Self-entered academic profile on the Profile page: GCSEs + predicted A-levels.
// Optional; sharpens university matches (reach / match / safe) when present.
export default function AcademicProfileCard({ openSignal = 0, onSaved, initialProfile }) {
  // When the parent preloads the profile (initialProfile), use it directly so the
  // grades card appears with the rest of the page rather than fetching again.
  const preloaded = initialProfile !== undefined;
  const [ap, setAp] = useState(preloaded ? initialProfile : null);
  const [draft, setDraft] = useState(null);    // working copy (edit mode)
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(!preloaded);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // Parent supplies the profile: use it, don't fetch again.
    if (initialProfile !== undefined) { setAp(initialProfile); setLoading(false); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyAcademicProfile();
        if (!cancelled) setAp(data || null);
      } catch (_) {
        // Column missing or transient: treat as "no data yet", never block the page.
        if (!cancelled) setAp(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initialProfile]);

  // Lock page scroll + close on Escape while the editor popup is open.
  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !saving) { setEditing(false); setDraft(null); } };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [editing, saving]);

  const startEdit = () => {
    const base = ap ? JSON.parse(JSON.stringify(ap)) : emptyAcademicProfile();
    if (!Array.isArray(base.predicted_alevels) || !base.predicted_alevels.length) {
      base.predicted_alevels = [{ subject: '', grade: '' }, { subject: '', grade: '' }, { subject: '', grade: '' }];
    }
    if (!Array.isArray(base.gcses) || !base.gcses.length) {
      base.gcses = [{ subject: 'Maths', grade: '' }, { subject: 'English Language', grade: '' }];
    }
    setDraft(base);
    setNotice('');
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => { if (!saving) { setEditing(false); setDraft(null); } };

  // Open the editor when the parent bumps openSignal (e.g. the roadmap's
  // "Enter your grades" step). Ignores the initial 0.
  useEffect(() => {
    if (openSignal) startEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);

  const setRow = (key, i, field, value) => {
    setDraft((d) => {
      const next = { ...d, [key]: [...d[key]] };
      next[key][i] = { ...next[key][i], [field]: value };
      return next;
    });
  };
  const addRow = (key) => setDraft((d) => ({ ...d, [key]: [...d[key], { subject: '', grade: '' }] }));
  const removeRow = (key, i) => setDraft((d) => ({ ...d, [key]: d[key].filter((_, j) => j !== i) }));

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const saved = await saveMyAcademicProfile(draft);
      setAp(saved);
      setEditing(false);
      setDraft(null);
      setNotice('Your grades were saved.');
      if (onSaved) onSaved(saved);
    } catch (err) {
      const msg = String(err?.message || '');
      if (/column .*academic_profile.* does not exist/i.test(msg) || /academic_profile/.test(msg)) {
        setError('Could not save yet: the academic_profile column has not been added to the database.');
      } else {
        setError(msg || 'Could not save your grades.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const filled = hasAcademicData(ap);

  return (
    <>
    <section className="acad-card">
      <div className="acad-head">
        <span className="acad-title">
          <GraduationCap size={18} weight="bold" aria-hidden="true" />
          Your grades
        </span>
      </div>

      {notice ? <p className="acad-notice">{notice}</p> : null}

      {filled ? (
        <div className="acad-view">
          <div className="acad-view-row">
            <span className="acad-view-key">Predicted A-levels</span>
            <span className="acad-chips">
              {(ap.predicted_alevels || []).filter((r) => r.subject).map((r, i) => (
                <span className="acad-chip" key={i}>{r.subject}{r.grade ? ` ${r.grade}` : ''}</span>
              ))}
            </span>
          </div>
          <div className="acad-view-row">
            <span className="acad-view-key">GCSEs</span>
            <span className="acad-chips">
              {(ap.gcses || []).filter((r) => r.subject).map((r, i) => (
                <span className="acad-chip acad-chip--gcse" key={i}>{r.subject}{r.grade ? ` ${r.grade}` : ''}</span>
              ))}
            </span>
          </div>
          <p className="acad-foot">Your grades unlock personalised university matches, showing which are a safe bet, a match, or a stretch for you. Private to you, always.</p>
        </div>
      ) : (
        <div className="acad-empty">
          <p>Add your GCSEs and predicted A-levels to unlock personalised university matches on the rankings and course cards.</p>
        </div>
      )}
      <div className="acad-cardfoot">
        <button type="button" className="acad-btn acad-btn--primary" onClick={startEdit}>
          {filled ? 'Edit grades' : 'Add grades'}
        </button>
      </div>
      </section>

      {editing && draft ? (
        <div
          className="acad-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Your grades"
          onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}
        >
          <div className="acad-modal">
            <button type="button" className="acad-modal-close" onClick={cancelEdit} aria-label="Close">×</button>
            <div className="acad-modal-title">Your grades</div>
            <div className="acad-modal-sub">Add your GCSEs and predicted A-levels to personalise your university matches.</div>
            {error ? <p className="acad-error">{error}</p> : null}
            <div className="acad-edit">
              <div className="acad-section">
            <div className="acad-section-label">Predicted A-levels</div>
            {draft.predicted_alevels.map((row, i) => (
              <div className="acad-row" key={`al-${i}`}>
                <input
                  className="acad-input"
                  list="acad-alevels"
                  placeholder="Subject"
                  value={row.subject}
                  onChange={(e) => setRow('predicted_alevels', i, 'subject', e.target.value)}
                />
                <select
                  className="acad-select"
                  value={row.grade}
                  onChange={(e) => setRow('predicted_alevels', i, 'grade', e.target.value)}
                >
                  <option value="">Grade</option>
                  {ALEVEL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <button type="button" className="acad-row-remove" aria-label="Remove" onClick={() => removeRow('predicted_alevels', i)}>
                  <X size={14} weight="bold" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button type="button" className="acad-add" onClick={() => addRow('predicted_alevels')}>
              <Plus size={13} weight="bold" aria-hidden="true" /> Add an A-level
            </button>
          </div>

          <div className="acad-section">
            <div className="acad-section-label">GCSEs</div>
            {draft.gcses.map((row, i) => (
              <div className="acad-row" key={`gc-${i}`}>
                <input
                  className="acad-input"
                  list="acad-gcses"
                  placeholder="Subject"
                  value={row.subject}
                  onChange={(e) => setRow('gcses', i, 'subject', e.target.value)}
                />
                <select
                  className="acad-select"
                  value={row.grade}
                  onChange={(e) => setRow('gcses', i, 'grade', e.target.value)}
                >
                  <option value="">Grade</option>
                  {GCSE_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <button type="button" className="acad-row-remove" aria-label="Remove" onClick={() => removeRow('gcses', i)}>
                  <X size={14} weight="bold" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button type="button" className="acad-add" onClick={() => addRow('gcses')}>
              <Plus size={13} weight="bold" aria-hidden="true" /> Add a GCSE
            </button>
          </div>

          <datalist id="acad-alevels">
            {ALEVEL_SUBJECTS.map((s) => <option key={s} value={s} />)}
          </datalist>
          <datalist id="acad-gcses">
            {GCSE_SUBJECTS.map((s) => <option key={s} value={s} />)}
          </datalist>

          <p className="acad-foot">These are your own predicted grades. Only you can see them, and you can edit or clear them any time.</p>

          <div className="acad-actions">
            <button type="button" className="acad-btn acad-btn--ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button type="button" className="acad-btn acad-btn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save grades'}
            </button>
          </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
