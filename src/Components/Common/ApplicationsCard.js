import React, { useEffect, useRef, useState } from 'react';
import { PaperPlaneTilt, X, Plus, ArrowLeft, CaretRight, Briefcase, GraduationCap, CalendarBlank, WarningCircle, MapPin, Clock, NotePencil, CalendarPlus } from 'phosphor-react';
import {
  APPLICATION_STATUSES, APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE, APPLICATION_KINDS, APPLICATION_KIND_LABEL, MANUAL_KINDS_FOR_STAGE,
  OPEN_STATUSES, addManualApplication, updateApplicationStatus, updateApplicationNote, updateApplicationEvent, removeApplication,
  isStale, formatDate, formatDateTime, calendarLinks, applicationKindForFavourite, applicationRowCount,
  UCAS_LABEL, UCAS_TONE, UCAS_MAX_CHOICES, UCAS_DECISION_OPTIONS, UCAS_PHASE_TEXT, UCAS_PHASE_TONE,
  isUcasChoice, ucasOf, ucasLive, ucasPhase, ucasClearingOf, sortUcasChoices, ucasSetDecision, ucasWithdraw, ucasUnwithdraw,
} from '../../utils/applications';
import './FavouritesCard.css';
import UcasPanel from './UcasPanel';
import ChancesPill, { chancesExplanation, chancesFor } from './ChancesPill';
import DatePicker from './DatePicker';
import Celebration from './Celebration';
import PickMenu from './PickMenu';
import './CascadeRemoveModal.css';
import InlineError from './InlineError';
import { friendlyError } from '../../utils/friendlyError';
import './ApplicationsCard.css';

// "Your applications" card on the profile page. Same shape as the favourites
// card: a compact preview of the first few, a "View all" popup listing every
// application, and tapping one opens it so the student can update its status,
// add a note, open the link or remove it. Everything is acted on from inside.
//
// Props: apps (from listApplications), onChange(nextApps), runId, stage,
// isUniversity, candidates, onApplyFavourite, predictedGrades, schoolYear,
// onEnterGrades.
const STATUS_TONE = APPLICATION_STATUS_TONE;
const KIND_STYLE = {
  job: { Icon: Briefcase, tint: '#e6f1fb', fg: '#185fa5' },
  internship: { Icon: Briefcase, tint: '#e6f1fb', fg: '#185fa5' },
  scheme: { Icon: Briefcase, tint: '#e6f1fb', fg: '#185fa5' },
  apprenticeship: { Icon: Briefcase, tint: '#faeeda', fg: '#854f0b' },
  college: { Icon: GraduationCap, tint: '#faeeda', fg: '#854f0b' },
  course: { Icon: GraduationCap, tint: '#e1f5ee', fg: '#0f6e56' },
  other: { Icon: PaperPlaneTilt, tint: '#eef4ff', fg: '#2f6fed' },
};

// candidates: favourite ads/courses not yet applied for ({ type, id, title, subtitle, meta });
// onApplyFavourite(item): mark one as applied (owned by the profile page).
export default function ApplicationsCard({ apps, onChange, runId, stage = 'university', isUniversity = false, candidates = [], onApplyFavourite, predictedGrades = [], schoolYear = '', onEnterGrades, openSignal = 0 }) {
  const list = Array.isArray(apps) ? apps : [];
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState('');
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false); // choosing from favourites
  const [ucasOpen, setUcasOpen] = useState(false); // the UCAS application page
  const [applyingKey, setApplyingKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteEditing, setNoteEditing] = useState(false);
  // Asking when the interview / assessment is (after choosing that status, or on tap).
  const [eventEditing, setEventEditing] = useState(false);
  const [eventDraft, setEventDraft] = useState('');
  const [calPrompt, setCalPrompt] = useState(false); // "Add it to your calendar?" after saving a date
  const [error, setError] = useState('');
  // What "Try again" should do for the current error (null: no retry offered).
  const [errorRetry, setErrorRetry] = useState(null);
  const fail = (err, context, retry = null) => {
    setError(friendlyError(err, context).message);
    setErrorRetry(retry ? () => retry : null);
  };
  const [form, setForm] = useState({ kind: isUniversity ? 'job' : 'apprenticeship', title: '', organisation: '', url: '', closingDate: '', appliedAt: '' });
  const titleRef = useRef(null);
  // A university's reply on a UCAS choice, recorded from inside the choice card.
  // A conditional offer asks for the conditions before saving.
  const [condEditing, setCondEditing] = useState(false);
  const [condDraft, setCondDraft] = useState('');
  const [chancesTip, setChancesTip] = useState('');
  // Confetti for good news; bumping the counter restarts the burst.
  const [party, setParty] = useState(0);
  const celebrate = () => setParty((n) => n + 1);
  const manualKinds = (MANUAL_KINDS_FOR_STAGE[stage] || MANUAL_KINDS_FOR_STAGE.university).map((v) => APPLICATION_KINDS.find((k) => k.value === v)).filter(Boolean);

  const detail = detailId ? list.find((a) => a.id === detailId) || null : null;
  const openOnes = list.filter((a) => OPEN_STATUSES.has(a.status));
  const closedOnes = list.filter((a) => !OPEN_STATUSES.has(a.status));
  const staleCount = list.filter(isStale).length;
  // UCAS choices are shown as one row, so leave them out before taking the first few.
  const preview = [...openOnes, ...closedOnes].filter((a) => !isUcasChoice(a, stage)).slice(0, 4);

  useEffect(() => { if (adding && titleRef.current) titleRef.current.focus(); }, [adding]);
  // The profile's journey card can open the list ("Keep your applications up to date").
  useEffect(() => { if (openSignal > 0) setOpen(true); }, [openSignal]);

  // Escape closes the innermost thing; lock page scroll while the popup is open.
  const escRef = useRef(() => {});
  escRef.current = () => {
    if (confirmRemove) setConfirmRemove(false);
    else if (calPrompt) setCalPrompt(false);
    else if (eventEditing) setEventEditing(false);
    else if (condEditing) setCondEditing(false);
    else if (noteEditing) setNoteEditing(false);
    else if (adding) setAdding(false);
    else if (picking) setPicking(false);
    else if (detailId) { setDetailId(''); }
    else if (ucasOpen) setUcasOpen(false);
    else setOpen(false);
  };
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') escRef.current(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  const closeAll = () => { setOpen(false); setDetailId(''); setUcasOpen(false); setAdding(false); setPicking(false); setConfirmRemove(false); setNoteEditing(false); setError(''); };
  const applyCandidate = async (item) => {
    if (typeof onApplyFavourite !== 'function') return;
    const key = `${item.type}|${item.id}`;
    try { setApplyingKey(key); setError(''); await onApplyFavourite(item); }
    catch (e) { fail(e, 'add this application', () => applyCandidate(item)); }
    finally { setApplyingKey(''); }
  };
  const back = () => { if (detail && isUcasChoice(detail, stage)) setUcasOpen(true); setDetailId(''); setConfirmRemove(false); setNoteEditing(false); setCondEditing(false); setChancesTip(''); setEventEditing(false); setCalPrompt(false); setError(''); };
  const replace = (next) => onChange(list.map((a) => (a.id === next.id ? next : a)));
  const setDecision = async (app, value) => {
    if (busy) return;
    if (value === 'offer_conditional') { setCondDraft(app.item_meta?.ucasConditions || ''); setCondEditing(true); return; }
    setCondEditing(false);
    if (value === ucasOf(app)) return;
    try { setBusy(true); setError(''); replace(await ucasSetDecision(app, value)); if (value === 'offer_unconditional') celebrate(); }
    catch (e) { fail(e, 'save this decision', () => setDecision(app, value)); }
    finally { setBusy(false); }
  };
  const saveConditions = async (app) => {
    if (busy) return;
    try { setBusy(true); setError(''); replace(await ucasSetDecision(app, 'offer_conditional', condDraft)); setCondEditing(false); celebrate(); }
    catch (e) { fail(e, 'save this decision', () => saveConditions(app)); }
    finally { setBusy(false); }
  };

  const withdraw = async (app) => {
    if (busy) return;
    try { setBusy(true); setError(''); replace(await ucasWithdraw(app)); }
    catch (e) { fail(e, 'withdraw this choice', () => withdraw(app)); }
    finally { setBusy(false); setConfirmRemove(false); }
  };
  const setStatus = async (app, status) => {
    if (busy || status === app.status) return;
    try {
      setBusy(true); setError('');
      replace(await updateApplicationStatus(app.id, status, app));
      if (status === 'interview' && !app.item_meta?.eventAt) { setEventDraft(''); setEventEditing(true); }
      if (status === 'offer' || status === 'accepted') celebrate();
    }
    catch (e) { fail(e, 'update this application', () => setStatus(app, status)); }
    finally { setBusy(false); }
  };
  const saveEvent = async (app) => {
    if (busy) return;
    try { setBusy(true); setError(''); replace(await updateApplicationEvent(app.id, eventDraft || null, app)); setEventEditing(false); setCalPrompt(Boolean(eventDraft)); }
    catch (e) { fail(e, 'save the date', () => saveEvent(app)); }
    finally { setBusy(false); }
  };
  const saveNote = async (app) => {
    if (busy) return;
    try { setBusy(true); setError(''); await updateApplicationNote(app.id, noteDraft); replace({ ...app, note: noteDraft }); setNoteEditing(false); }
    catch (e) { fail(e, 'save the note', () => saveNote(app)); }
    finally { setBusy(false); }
  };
  const remove = async (app) => {
    if (busy) return;
    try { setBusy(true); setError(''); await removeApplication(app.id); onChange(list.filter((a) => a.id !== app.id)); back(); }
    catch (e) { fail(e, 'remove this application', () => remove(app)); }
    finally { setBusy(false); setConfirmRemove(false); }
  };
  const submitManual = async (e) => {
    e.preventDefault();
    if (busy || !form.title.trim()) return;
    try {
      setBusy(true); setError('');
      const created = await addManualApplication({
        kind: form.kind, title: form.title, organisation: form.organisation, url: form.url,
        closingDate: form.closingDate || null, appliedAt: form.appliedAt || null, runId, stage,
      });
      onChange([created, ...list]);
      setAdding(false);
      setForm({ kind: form.kind, title: '', organisation: '', url: '', closingDate: '', appliedAt: '' });
    } catch (err) { fail(err, 'add this application'); }
    finally { setBusy(false); }
  };

  const kindStyle = (app) => KIND_STYLE[app.kind] || KIND_STYLE.other;
  const ucas = (app) => isUcasChoice(app, stage);
  const ucasChoices = sortUcasChoices(list.filter((a) => ucas(a)));
  const ucasLiveChoices = ucasLive(ucasChoices);
  const ucasPhaseNow = ucasPhase(ucasChoices);
  const ucasPhaseLabel = ucasPhaseNow === 'placed' && ucasClearingOf(ucasChoices) ? 'Placed through Clearing' : UCAS_PHASE_TEXT[ucasPhaseNow];
  const rowCount = applicationRowCount(list, stage);
  const openLink = (app) => (app.item_type === 'manual' ? 'Open the link' : `Open the ${app.kind === 'course' ? 'course' : 'ad'}`);
  const statusPill = (app) => (
    ucas(app)
      ? <span className={`apps-pill apps-pill--${UCAS_TONE[ucasOf(app)] || 'grey'}`}>{ucasPhase(ucasChoices) === 'shortlisting' ? 'UCAS choice' : (UCAS_LABEL[ucasOf(app)] || 'UCAS choice')}</span>
      : <span className={`apps-pill apps-pill--${STATUS_TONE[app.status] || 'grey'}`}>{APPLICATION_STATUS_LABEL[app.status] || app.status}</span>
  );
  // The UCAS panel returns updated choice rows; merge them into the list.
  const mergeRows = (rows) => onChange(list.map((a) => rows.find((r) => r.id === a.id) || a));

  const renderRow = (app) => {
    const { Icon, tint, fg } = kindStyle(app);
    return (
      <div className="fav-prev" key={app.id}>
        <span className="fav-prev-ic" style={{ background: tint, color: fg }} aria-hidden="true"><Icon size={16} weight="bold" /></span>
        <span className="fav-prev-main">
          <span className="fav-prev-title">{app.title}</span>
          <span className="fav-prev-sub">{[app.organisation, APPLICATION_KIND_LABEL[app.kind]].filter(Boolean).join(' · ')}</span>
        </span>
        {statusPill(app)}
      </div>
    );
  };

  const renderListItem = (app) => {
    const { Icon, tint, fg } = kindStyle(app);
    return (
      <div className="fav-item fav-item--tappable" key={app.id} role="button" tabIndex={0}
        onClick={() => setDetailId(app.id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailId(app.id); } }}>
        <span className="fav-item-ic" style={{ background: tint, color: fg }} aria-hidden="true"><Icon size={17} weight="bold" /></span>
        <span className="fav-item-main">
          <span className="fav-item-title">{app.title}</span>
          <span className="fav-item-sub">{[app.organisation, `Applied ${formatDate(app.applied_at)}`].filter(Boolean).join(' · ')}</span>
          {isStale(app) ? <span className="fav-item-sub fav-note">Closed {formatDate(app.closing_date)}, no update yet</span> : null}
        </span>
        {statusPill(app)}
        <CaretRight size={16} weight="bold" className="fav-item-chev" aria-hidden="true" />
      </div>
    );
  };

  const nonUcasOpen = openOnes.filter((a) => !ucas(a));
  const nonUcasClosed = closedOnes.filter((a) => !ucas(a));
  const groups = [
    { key: 'open', label: 'In progress', items: nonUcasOpen },
    { key: 'closed', label: 'Finished', items: nonUcasClosed },
  ].filter((g) => g.items.length);

  // The whole card opens the popup; clicks inside the popup or on controls are left alone.
  const openFromCard = (e) => {
    if (e.target.closest('.fav-overlay, button, a, input, select, textarea')) return;
    setOpen(true);
  };

  return (
    <section className="fav-card apps-card fav-card--clickable" aria-label="Your applications" onClick={openFromCard}>
      <Celebration key={party} show={party > 0} onDone={() => setParty(0)} />
      <div className="fav-head">
        <span className="fav-title apps-title">
          <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />
          Your applications
        </span>
        {list.length ? (
          <button type="button" className="fav-btn fav-btn--primary fav-btn--head" onClick={() => setOpen(true)}>
            View all {rowCount}
          </button>
        ) : (
          <button type="button" className="fav-btn fav-btn--primary fav-btn--head" onClick={() => setOpen(true)}>
            Add
          </button>
        )}
      </div>

      {list.length ? (
        <>
          <div className="fav-preview">
            {ucasChoices.length ? (
              <div className="fav-prev" key="ucas">
                <span className="fav-prev-ic" style={{ background: '#e1f5ee', color: '#0f6e56' }} aria-hidden="true"><GraduationCap size={16} weight="bold" /></span>
                <span className="fav-prev-main">
                  <span className="fav-prev-title">UCAS application</span>
                  <span className="fav-prev-sub">{Math.min(ucasLiveChoices.length, UCAS_MAX_CHOICES)} of {UCAS_MAX_CHOICES} choices</span>
                </span>
                <span className={`apps-pill apps-pill--${UCAS_PHASE_TONE[ucasPhaseNow]}`}>{ucasPhaseLabel}</span>
              </div>
            ) : null}
            {preview.slice(0, ucasChoices.length ? 3 : 4).map((app) => renderRow(app))}
          </div>
        </>
      ) : (
        <div className="apps-empty">
          <p className="apps-empty-text">{stage === 'school'
            ? <>Tap <strong>Add to UCAS choices</strong> on a saved course, or <strong>Mark as applied</strong> on an apprenticeship ad, and follow it here.</>
            : <>Tap <strong>Mark as applied</strong> on a favourite once you have applied, and follow it here.</>}</p>
        </div>
      )}
      {rowCount > 0 ? <p className="fav-foot fav-foot--card">Record what you have applied to and track closing dates, interviews and outcomes here.</p> : null}
      {staleCount ? (
        <p className="apps-nudge"><WarningCircle size={15} weight="fill" aria-hidden="true" />
          {staleCount === 1 ? 'One application closed over two weeks ago with no update. Heard anything?' : `${staleCount} applications closed over two weeks ago with no update. Heard anything?`}
        </p>
      ) : null}

      {open ? (
        <div className="fav-overlay" role="dialog" aria-modal="true" aria-label="Your applications"
          onClick={(e) => { if (e.target === e.currentTarget) escRef.current(); }}>
          <div className="fav-modal">
            <button type="button" className="fav-close" onClick={() => escRef.current()} aria-label="Close">
              <X size={18} weight="bold" aria-hidden="true" />
            </button>

            {ucasOpen && !detail ? (
              /* ---- UCAS APPLICATION PAGE ---- */
              <div className="fav-cardview">
                <button type="button" className="fav-back" onClick={() => setUcasOpen(false)}>
                  <ArrowLeft size={15} weight="bold" aria-hidden="true" /> All applications
                </button>
                <InlineError compact message={error} onRetry={errorRetry || undefined} />
                <UcasPanel choices={ucasChoices} onChange={mergeRows} onOpen={(id) => setDetailId(id)} predicted={predictedGrades} schoolYear={schoolYear} onEnterGrades={onEnterGrades ? () => { closeAll(); onEnterGrades(); } : undefined} />
              </div>
            ) : detail ? (
              /* ---- ONE APPLICATION: status, note, link, remove ---- */
              <div className="fav-cardview">
                <button type="button" className="fav-back" onClick={back}>
                  <ArrowLeft size={15} weight="bold" aria-hidden="true" /> {ucas(detail) ? 'UCAS application' : 'All applications'}
                </button>
                <InlineError compact message={error} onRetry={errorRetry || undefined} />
                {(() => {
                  const m = (detail.item_meta && typeof detail.item_meta === 'object') ? detail.item_meta : {};
                  const { Icon } = kindStyle(detail);
                  const pills = [
                    m.location ? { Icon: MapPin, text: m.location } : null,
                    { Icon: CalendarBlank, text: `${ucas(detail) ? (ucasPhaseNow === 'shortlisting' ? 'Added' : 'Sent') : 'Applied'} ${formatDate(detail.applied_at)}` },
                    detail.closing_date ? { Icon: CalendarBlank, text: `${String(detail.closing_date).slice(0, 10) >= new Date().toISOString().slice(0, 10) ? 'Closes' : 'Closed'} ${formatDate(detail.closing_date)}`, warn: isStale(detail) } : null,
                    m.eventAt
                      ? { Icon: Clock, text: `Interview ${formatDateTime(m.eventAt)}`, onClick: () => { setEventDraft(String(m.eventAt).slice(0, 16)); setEventEditing(true); } }
                      : (detail.status === 'interview' ? { Icon: CalendarPlus, text: 'Add interview date', onClick: () => { setEventDraft(''); setEventEditing(true); } } : null),
                  ].filter(Boolean);
                  const cal = calendarLinks(detail);
                  return (
                    <>
                      <div className="fav-detail-head">
                        <span className="fav-detail-ic" aria-hidden="true"><Icon size={22} weight="bold" /></span>
                        <div className="fav-detail-headtext">
                          <span className="fav-detail-eyebrow">{ucas(detail) ? 'UCAS choice' : (APPLICATION_KIND_LABEL[detail.kind] || 'Application')}</span>
                          <div className="fav-detail-title">{detail.title}</div>
                          {detail.organisation || m.source ? (
                            <div className="fav-prev-sub" style={{ whiteSpace: 'normal' }}>{detail.organisation}{m.source ? ` · via ${m.source}` : ''}</div>
                          ) : null}
                          {ucas(detail) && m.stats?.typicalGrades ? (
                            <div className="fav-prev-sub apps-detail-chances">
                              <span>Typical offer <b>{m.stats.typicalGrades}</b></span>
                              <ChancesPill predicted={predictedGrades} typicalGrades={m.stats.typicalGrades}
                                onTap={() => setChancesTip((cur) => (cur ? '' : chancesExplanation(chancesFor(predictedGrades, m.stats.typicalGrades)?.key, m.stats.typicalGrades)))} />
                            </div>
                          ) : null}
                          {chancesTip ? <div className="fav-applied-hint">{chancesTip}</div> : null}
                        </div>
                      </div>
                      <div className="role-jobcard__facts job-detail-facts">
                        {pills.map(({ Icon: PI, text, warn, onClick }, i) => (
                          onClick
                            ? <button type="button" className="role-jobcard__fact apps-fact-btn" key={i} onClick={onClick}><PI size={13} weight="bold" aria-hidden="true" />{text}</button>
                            : <span className={`role-jobcard__fact${warn ? ' apps-fact--warn' : ''}`} key={i}><PI size={13} weight="bold" aria-hidden="true" />{text}</span>
                        ))}
                      </div>
                      {(eventEditing || calPrompt) ? (
                        <div className="cascade-overlay" role="dialog" aria-modal="true" aria-label="Interview or assessment"
                          onClick={(e) => { if (e.target === e.currentTarget && !busy) { setEventEditing(false); setCalPrompt(false); } }}>
                          <div className="cascade-box">
                            {calPrompt && cal ? (
                              <>
                                <div className="cascade-title">Add it to your calendar?</div>
                                <p className="cascade-text">Interview {formatDateTime(m.eventAt)}. Pick your calendar and the event is filled in for you.</p>
                                <div className="cascade-actions">
                                  <a className="cascade-btn cascade-btn--primary" href={cal.google} target="_blank" rel="noopener noreferrer" onClick={() => setCalPrompt(false)}>Google Calendar</a>
                                  <a className="cascade-btn cascade-btn--primary" href={cal.icsHref} download={cal.icsName} onClick={() => setCalPrompt(false)}>Apple / Outlook</a>
                                  <button type="button" className="cascade-btn" onClick={() => setCalPrompt(false)}>Not now</button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="cascade-title">{m.eventAt ? 'Interview or assessment' : 'When is the interview or assessment?'}</div>
                                <p className="cascade-text">{m.eventAt ? 'Change the date and time, or remove it if it has been cancelled.' : 'Add the date and time so you can keep track of it and put it in your calendar.'}</p>
                                <div className="apps-event-input"><DatePicker value={eventDraft} onChange={setEventDraft} withTime placeholder="Choose the date" autoFocus /></div>
                                <div className="cascade-actions">
                                  <button type="button" className="cascade-btn cascade-btn--primary" disabled={busy || !eventDraft} onClick={() => saveEvent(detail)}>{busy ? 'Saving…' : 'Save'}</button>
                                  {m.eventAt ? (
                                    <button type="button" className="cascade-btn cascade-btn--danger" disabled={busy}
                                      onClick={async () => { setEventDraft(''); try { setBusy(true); replace(await updateApplicationEvent(detail.id, null, detail)); setEventEditing(false); } catch (e2) { fail(e2, 'remove the date'); } finally { setBusy(false); } }}>
                                      Remove date
                                    </button>
                                  ) : null}
                                  <button type="button" className="cascade-btn" disabled={busy} onClick={() => setEventEditing(false)}>{m.eventAt ? 'Cancel' : 'Not yet known'}</button>
                                </div>
                                {m.eventAt && cal ? (
                                  <div className="apps-cal-links">Add to calendar: <a href={cal.google} target="_blank" rel="noopener noreferrer">Google</a> · <a href={cal.icsHref} download={cal.icsName}>Apple / Outlook</a></div>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {ucas(detail) ? (
                        <p className="apps-ucas-line">Choice {ucasChoices.findIndex((c) => c.id === detail.id) + 1} of {Math.max(ucasChoices.length, 1)} on your UCAS application · {ucasOf(detail) === 'withdrawn'
                          ? <span className="apps-pill apps-pill--grey">Withdrawn</span>
                          : ucasPhaseNow === 'shortlisting' ? <span>not sent yet</span>
                            : ucasPhaseNow === 'sent' ? <span>sent, record the university's reply below</span>
                              : <span className={`apps-pill apps-pill--${UCAS_TONE[ucasOf(detail)] || 'grey'}`}>{detail.item_meta?.ucasPlaced ? 'Placed' : (UCAS_LABEL[ucasOf(detail)] || '')}</span>}</p>
                      ) : null}

                      {/* Same big two-button row as the favourite card: status + note */}
                      <div className={`cdna-react-row apps-detail-row${ucas(detail) && !(ucasPhaseNow === 'sent' && ucasOf(detail) !== 'withdrawn') ? ' apps-detail-row--single' : ''}`}>
                        {ucas(detail) ? (
                          ucasPhaseNow === 'sent' && ucasOf(detail) !== 'withdrawn' ? (
                            <PickMenu options={UCAS_DECISION_OPTIONS} value={ucasOf(detail)} ariaLabel="University decision"
                              triggerClass={`cdna-react-btn apps-status-big apps-status-big--${UCAS_TONE[ucasOf(detail)] || 'grey'}`} disabled={busy} onSelect={(v) => setDecision(detail, v)} />
                          ) : null
                        ) : (
                          <PickMenu options={APPLICATION_STATUSES} value={detail.status} ariaLabel="Application status"
                            triggerClass={`cdna-react-btn apps-status-big apps-status-big--${STATUS_TONE[detail.status] || 'grey'}`} disabled={busy} onSelect={(v) => setStatus(detail, v)} />
                        )}
                        <button type="button" className={`cdna-react-btn apps-note-big${detail.note ? ' has-note' : ''}`} disabled={busy} onClick={() => { setNoteDraft(detail.note || ''); setNoteEditing(true); }}>
                          <NotePencil size={18} weight="bold" aria-hidden="true" />
                          <span className="apps-pick-label">{detail.note ? detail.note : 'Add a note'}</span>
                        </button>
                      </div>
                      {condEditing && ucas(detail) ? (
                        <div className="apps-note-edit">
                          <input type="text" value={condDraft} maxLength={40} placeholder="Conditions, e.g. ABB or 120 UCAS points" onChange={(e) => setCondDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveConditions(detail); } if (e.key === 'Escape') { e.stopPropagation(); setCondEditing(false); } }} autoFocus />
                          <button type="button" className="fav-btn fav-btn--primary" disabled={busy} onClick={() => saveConditions(detail)}>Save</button>
                          <button type="button" className="fav-btn fav-btn--ghost" onClick={() => setCondEditing(false)}>Cancel</button>
                        </div>
                      ) : null}
                      {noteEditing ? (
                        <div className="apps-note-edit">
                          <input type="text" value={noteDraft} maxLength={240} placeholder={ucas(detail) ? 'e.g. open day 11 Oct, ask about placement year' : 'e.g. interview on 3 Oct at 10am'} onChange={(e) => setNoteDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNote(detail); } if (e.key === 'Escape') { e.stopPropagation(); setNoteEditing(false); } }} autoFocus />
                          <button type="button" className="fav-btn fav-btn--primary" disabled={busy} onClick={() => saveNote(detail)}>Save</button>
                          <button type="button" className="fav-btn fav-btn--ghost" onClick={() => setNoteEditing(false)}>Cancel</button>
                        </div>
                      ) : null}

                      <div className="apps-detail-foot">
                        {detail.url ? (
                          <a className="cw-readmore job-detail-apply" href={detail.url} target="_blank" rel="noopener noreferrer">
                            {openLink(detail)} <span aria-hidden="true">↗</span>
                          </a>
                        ) : <span />}
                        {(() => {
                          // A choice can be removed while the list is being built. Once the
                          // application is sent, UCAS keeps the choice on record, so the student
                          // withdraws from it instead and the row stays.
                          const isChoice = ucas(detail);
                          const afterSend = isChoice && ucasPhaseNow !== 'shortlisting';
                          if (afterSend && ucasOf(detail) === 'withdrawn') {
                            return <button type="button" className="apps-remove-link" disabled={busy} onClick={async () => { if (busy) return; try { setBusy(true); setError(''); replace(await ucasUnwithdraw(detail)); } catch (e) { fail(e, 'restore this choice'); } finally { setBusy(false); } }}>Withdrawn by mistake, put it back</button>;
                          }
                          const label = afterSend ? 'Withdraw this choice' : (isChoice ? 'Remove from choices' : 'Remove');
                          const question = afterSend
                            ? 'Withdraw from this choice? It stays on your UCAS record but is no longer in play.'
                            : (isChoice ? 'Remove this choice from your UCAS application?' : 'Remove this application?');
                          return confirmRemove ? (
                            <span className="apps-remove-confirm">
                              {question}
                              <button type="button" className="fav-btn fav-btn--danger" disabled={busy} onClick={() => (afterSend ? withdraw(detail) : remove(detail))}>{busy ? 'Saving…' : (afterSend ? 'Withdraw' : 'Remove')}</button>
                              <button type="button" className="fav-btn fav-btn--ghost" disabled={busy} onClick={() => setConfirmRemove(false)}>Cancel</button>
                            </span>
                          ) : (
                            <button type="button" className="apps-remove-link" disabled={busy} onClick={() => setConfirmRemove(true)}>{label}</button>
                          );
                        })()}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              /* ---- ALL APPLICATIONS ---- */
              <>
                {picking || adding ? (
                  <button type="button" className="fav-back" onClick={() => { setPicking(false); setAdding(false); setError(''); }}>
                    <ArrowLeft size={15} weight="bold" aria-hidden="true" /> All applications
                  </button>
                ) : (
                  <>
                    <div className="fav-modal-title">Your applications</div>
                    <div className="fav-modal-sub">
                      {list.length
                        ? 'Tap one to update its status. Keeping this current helps you stay on top of deadlines and replies.'
                        : 'Nothing tracked yet. Add one from your favourites, or an external application you made outside CareerDNA.'}
                    </div>
                  </>
                )}
                <InlineError compact message={error} onRetry={errorRetry || undefined} />

                {picking ? (
                  <div className="apps-pick">
                    <div className="fav-modal-title">Add from favourites</div>
                    <div className="fav-modal-sub">Saved ads and courses you have not applied for yet. Mark the ones you have applied for.</div>
                    <div className="fav-group-head">
                      <span className="fav-group-label">From your favourites</span>
                      <span className="fav-group-count">{candidates.length}</span>
                    </div>
                    {candidates.length ? (
                      <div className="fav-items">
                        {candidates.map((c) => {
                          const key = `${c.type}|${c.id}`;
                          const kind = applicationKindForFavourite(c);
                          const { Icon, tint, fg } = KIND_STYLE[kind] || KIND_STYLE.other;
                          return (
                            <div className="fav-item" key={key}>
                              <span className="fav-item-ic" style={{ background: tint, color: fg }} aria-hidden="true"><Icon size={17} weight="bold" /></span>
                              <span className="fav-item-main">
                                <span className="fav-item-title">{c.title}</span>
                                {c.subtitle ? <span className="fav-item-sub">{c.subtitle}</span> : null}
                              </span>
                              <button type="button" className="fav-apply fav-apply--sm" disabled={applyingKey === key} onClick={() => applyCandidate(c)}>
                                {applyingKey === key ? 'Saving…' : (stage === 'school' && c.type === 'course' ? 'Add to UCAS choices' : 'Mark as applied')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="fav-empty">Nothing waiting here. Every ad or course in your favourites is already tracked, or you have not saved any yet. Save some in your report and they will show here.</p>
                    )}
                  </div>
                ) : adding ? (
                  <form className="apps-form apps-form--page" onSubmit={submitManual}>
                    <div className="fav-modal-title">Add an external application</div>
                    <p className="apps-form-lead">An external application is one you made outside CareerDNA, for example {isUniversity ? 'a job or course you found yourself' : 'a college course, T Level or apprenticeship you found yourself'}. Add it here so you can monitor everything in one place and get advice on it.</p>
                    <div className="apps-form-grid">
                      <div className="apps-field">
                        <span>Type</span>
                        <PickMenu options={manualKinds} value={form.kind} ariaLabel="Application type" triggerClass="apps-field-pick" onSelect={(v) => setForm({ ...form, kind: v })} />
                      </div>
                      <label className="apps-field">
                        <span>Employer, university or college</span>
                        <input type="text" value={form.organisation} maxLength={120} placeholder="Optional" onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
                      </label>
                      <label className="apps-field apps-field--title">
                        <span>{isUniversity ? 'What role or course did you apply for?' : 'What did you apply for?'}</span>
                        <input ref={titleRef} type="text" value={form.title} maxLength={140}
                          placeholder={isUniversity ? 'e.g. Marketing Assistant, MSc Psychology' : 'e.g. Business Administration apprenticeship, BSc Psychology, T Level in Health'}
                          onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                      </label>
                      <label className="apps-field apps-field--title">
                        <span>Link <em className="apps-field-hint">optional, so you can get back to the ad or course in one tap</em></span>
                        <input type="url" value={form.url} placeholder="https://…" onChange={(e) => setForm({ ...form, url: e.target.value })} />
                      </label>
                      <div className="apps-field">
                        <span>Date applied</span>
                        <DatePicker value={form.appliedAt} onChange={(v) => setForm({ ...form, appliedAt: v })} placeholder="Today" max={new Date().toISOString().slice(0, 10)} />
                      </div>
                      <div className="apps-field">
                        <span>Closing date <em className="apps-field-hint">optional, so we can nudge you if you hear nothing</em></span>
                        <DatePicker value={form.closingDate} onChange={(v) => setForm({ ...form, closingDate: v })} placeholder="No closing date" />
                      </div>
                    </div>
                    <div className="apps-form-actions">
                      <button type="submit" className="fav-btn fav-btn--primary" disabled={busy || !form.title.trim()}>{busy ? 'Saving…' : 'Add application'}</button>
                      <button type="button" className="fav-btn fav-btn--ghost" disabled={busy} onClick={() => setAdding(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="apps-add-row">
                    <button type="button" className="apps-add" onClick={() => setPicking(true)}>
                      <Plus size={13} weight="bold" aria-hidden="true" /> Add from favourites
                    </button>
                    <button type="button" className="apps-add" onClick={() => setAdding(true)}>
                      <Plus size={13} weight="bold" aria-hidden="true" /> Add an external application
                    </button>
                  </div>
                )}

                <div className="fav-groups" style={picking || adding ? { display: 'none' } : undefined}>
                  {ucasChoices.length ? (
                    <div className="fav-group" key="ucas">
                      <div className="fav-group-head"><span className="fav-group-label">University</span></div>
                      <div className="fav-items">
                        <div className="fav-item fav-item--tappable" role="button" tabIndex={0} onClick={() => setUcasOpen(true)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setUcasOpen(true); } }}>
                          <span className="fav-item-ic" style={{ background: '#e1f5ee', color: '#0f6e56' }} aria-hidden="true"><GraduationCap size={17} weight="bold" /></span>
                          <span className="fav-item-main">
                            <span className="fav-item-title">UCAS application</span>
                            <span className="fav-item-sub">{Math.min(ucasLiveChoices.length, UCAS_MAX_CHOICES)} of {UCAS_MAX_CHOICES} choices</span>
                          </span>
                          <span className={`apps-pill apps-pill--${UCAS_PHASE_TONE[ucasPhaseNow]}`}>{ucasPhaseLabel}</span>
                          <CaretRight size={16} weight="bold" className="fav-item-chev" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {groups.map((g) => (
                    <div className="fav-group" key={g.key}>
                      <div className="fav-group-head">
                        <span className="fav-group-label">{g.label}</span>
                        <span className="fav-group-count">{g.items.length}</span>
                      </div>
                      <div className="fav-items">{g.items.map(renderListItem)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
