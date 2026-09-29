import React, { useEffect, useRef, useState } from 'react';
import { GraduationCap, LockSimple, Plus, X } from 'phosphor-react';
import {
  getMyAcademicProfile,
  saveMyAcademicProfile,
  emptyAcademicProfile,
  hasAcademicData,
  ALEVEL_GRADES,
  GCSE_GRADES,
  ALEVEL_SUBJECTS,
  GCSE_SUBJECTS,
  GCSE_COMPULSORY,
  MAX_ALEVELS,
  MAX_GCSES,
} from '../../utils/academicProfile';
import PickMenu from './PickMenu';
import './AcademicProfileCard.css';

const gradeOptions = (grades) => [{ value: '', label: 'Not sure yet' }, ...grades.map((g) => ({ value: g, label: String(g) }))];
const sameSubject = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const isCompulsoryGcse = (subject) => GCSE_COMPULSORY.some((c) => sameSubject(c, subject));

// Subject options for one row: everything in the list except subjects already
// chosen on other rows of the same section, so the same subject cannot be
// entered twice. A stored subject that is not in the list still shows.
function subjectOptions(all, rows, i) {
  const taken = rows.filter((_, j) => j !== i).map((r) => String(r.subject || '').toLowerCase()).filter(Boolean);
  const own = String(rows[i]?.subject || '');
  const list = all.filter((sub) => !taken.includes(sub.toLowerCase()));
  if (own && !list.some((sub) => sameSubject(sub, own))) list.unshift(own);
  return list.map((sub) => ({ value: sub, label: sub }));
}

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
  const baseRef = useRef('');   // draft as opened, to know whether anything changed

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
    // GCSEs: the compulsory subjects always lead, then whatever else is stored.
    const stored = Array.isArray(base.gcses) ? base.gcses.filter((r) => r && r.subject) : [];
    base.gcses = [
      ...GCSE_COMPULSORY.map((c) => stored.find((r) => sameSubject(r.subject, c)) || { subject: c, grade: '' }),
      ...stored.filter((r) => !isCompulsoryGcse(r.subject)),
    ];
    baseRef.current = JSON.stringify(base);
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
  // One empty row at a time: the add button waits until the last row has a subject.
  const canAdd = (key, max) => draft && draft[key].length < max && draft[key].every((r) => r.subject);
  const dirty = !!draft && JSON.stringify(draft) !== baseRef.current;

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
        <button type="button" className="acad-btn acad-btn--primary acad-btn--head" onClick={startEdit}>
          {filled ? 'Edit grades' : 'Add grades'}
        </button>
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
          <p className="acad-foot">Your grades unlock personalised university matches. Open a degree in the University section of your report and choose Explore courses and rankings to see which universities are a safe bet, a match, or a stretch for you.</p>
        </div>
      ) : (
        <div className="acad-empty">
          <p>Add your GCSEs and predicted A-levels to unlock personalised university matches on the rankings and course cards.</p>
        </div>
      )}
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
                <PickMenu options={subjectOptions(ALEVEL_SUBJECTS, draft.predicted_alevels, i)} value={row.subject}
                  ariaLabel="A-level subject" title="A-level subject" searchable searchPlaceholder="Search subjects" placeholder="Subject"
                  triggerClass={`acad-select acad-select--subject${row.subject ? '' : ' is-empty'}`}
                  onSelect={(v) => setRow('predicted_alevels', i, 'subject', v)} />
                <PickMenu options={gradeOptions(ALEVEL_GRADES)} value={row.grade} ariaLabel="Predicted grade" title="Predicted grade" placeholder="Grade"
                  triggerClass={`acad-select${row.grade ? '' : ' is-empty'}`} onSelect={(v) => setRow('predicted_alevels', i, 'grade', v)} />
                <button type="button" className="acad-row-remove" aria-label="Remove this A-level" onClick={() => removeRow('predicted_alevels', i)}>
                  <X size={14} weight="bold" aria-hidden="true" />
                </button>
              </div>
            ))}
            {canAdd('predicted_alevels', MAX_ALEVELS) ? (
              <button type="button" className="acad-add" onClick={() => addRow('predicted_alevels')}>
                <Plus size={13} weight="bold" aria-hidden="true" /> Add an A-level
              </button>
            ) : null}
          </div>

          <div className="acad-section">
            <div className="acad-section-label">GCSEs</div>
            {draft.gcses.map((row, i) => (
              <div className="acad-row" key={`gc-${i}`}>
                {isCompulsoryGcse(row.subject) ? (
                  <span className="acad-select acad-select--subject acad-select--fixed">
                    <span className="apps-pick-label">{row.subject}</span>
                    <LockSimple size={12} weight="bold" aria-hidden="true" />
                  </span>
                ) : (
                  <PickMenu options={subjectOptions(GCSE_SUBJECTS.filter((g) => !isCompulsoryGcse(g)), draft.gcses, i)} value={row.subject}
                    ariaLabel="GCSE subject" title="GCSE subject" searchable searchPlaceholder="Search subjects" placeholder="Subject"
                    triggerClass={`acad-select acad-select--subject${row.subject ? '' : ' is-empty'}`}
                    onSelect={(v) => setRow('gcses', i, 'subject', v)} />
                )}
                <PickMenu options={gradeOptions(GCSE_GRADES)} value={row.grade} ariaLabel="GCSE grade" title="GCSE grade" placeholder="Grade"
                  triggerClass={`acad-select${row.grade ? '' : ' is-empty'}`} onSelect={(v) => setRow('gcses', i, 'grade', v)} />
                {isCompulsoryGcse(row.subject) ? (
                  <span className="acad-row-remove acad-row-remove--blank" aria-hidden="true" />
                ) : (
                  <button type="button" className="acad-row-remove" aria-label="Remove this GCSE" onClick={() => removeRow('gcses', i)}>
                    <X size={14} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {canAdd('gcses', MAX_GCSES) ? (
              <button type="button" className="acad-add" onClick={() => addRow('gcses')}>
                <Plus size={13} weight="bold" aria-hidden="true" /> Add a GCSE
              </button>
            ) : null}
            <p className="acad-section-note">Maths and English Language are compulsory GCSEs, so they are always listed. Leave the grade blank if you do not have it yet.</p>
          </div>

          <p className="acad-foot">These are your own predicted grades. Only you can see them, and you can edit or clear them any time.</p>

          <div className="acad-actions">
            <button type="button" className="acad-btn acad-btn--ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button type="button" className="acad-btn acad-btn--primary" onClick={save} disabled={saving || !dirty}>
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
