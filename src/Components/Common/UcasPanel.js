import React, { useState } from 'react';
import { PaperPlaneTilt, WarningCircle, CalendarBlank, Check, CaretRight, Info } from 'phosphor-react';
import {
  UCAS_MAX_CHOICES, UCAS_LABEL, UCAS_TONE, UCAS_PHASE_TEXT, UCAS_PHASE_TONE,
  ucasOf, ucasLive, ucasPhase, ucasSentAt, ucasAllDecided, ucasOffers, ucasRuleWarnings, ucasDecidedCount,
  ucasLastDecisionAt, ucasReplyBy, ucasClearingOf, ucasCycleFor, isEarlyDeadlineChoice,
  ucasMarkSent, ucasUnsend, ucasReply, ucasPlace, ucasUnreply, sortUcasChoices, formatDate, pluralDays,
} from '../../utils/applications';
import ChancesPill, { chancesFor, chancesForConditions } from './ChancesPill';
import DatePicker from './DatePicker';
import Celebration from './Celebration';
import './CascadeRemoveModal.css';
import './UcasPanel.css';

// One UCAS application, shown inside the applications popup for school
// students. Five slots, one lifecycle:
//   shortlisting -> sent -> replied (firm + insurance) -> placed
// Decisions on individual choices are recorded inside each choice's card; this
// panel handles the steps that belong to the application as a whole.
//
// Props:
//   choices        the student's course applications (UCAS choices), in order
//   onChange(rows) updated rows to merge back
//   onOpen(id)     open a choice
//   predicted      predicted A-levels [{ subject, grade }] for the offer comparison
//   schoolYear     'year12' | 'year13' from the intro answers (decides the cycle)
//   onEnterGrades  opens the grades card (shown when no predicted grades exist)
export default function UcasPanel({ choices: rawChoices = [], onChange, onOpen, predicted = [], schoolYear = '', onEnterGrades }) {
  const choices = sortUcasChoices(rawChoices);
  const live = ucasLive(choices);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'send' | 'unsend' | 'reply' | 'place' | 'unplace'
  const [sentDraft, setSentDraft] = useState(new Date().toISOString().slice(0, 10));
  const [firmId, setFirmId] = useState('');
  const [insuranceId, setInsuranceId] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [clearingDraft, setClearingDraft] = useState({ organisation: '', title: '' });
  const [tip, setTip] = useState('');
  const [party, setParty] = useState(0);

  const phase = ucasPhase(choices);
  const sentAt = ucasSentAt(choices);
  const cycle = ucasCycleFor(schoolYear);
  const hasGrades = (predicted || []).some((p) => p && p.subject && p.grade);
  const warnings = ucasRuleWarnings(choices);
  // Balance check on the grades bands. Advisers usually suggest a list that is
  // mostly Match, with one or two Stretch or Ambitious choices and at least one
  // Safe choice as a fallback (it also makes a realistic insurance choice).
  // Only while the choices are still being built.
  if (phase === 'shortlisting' && live.length >= 2) {
    const bands = live.map((c) => chancesFor(predicted, c.item_meta?.stats?.typicalGrades)).filter(Boolean);
    if (bands.length >= 2) {
      const above = bands.filter((b) => b.key === 'reach' || b.key === 'longshot').length;
      const safe = bands.filter((b) => b.key === 'safe').length;
      if (above > bands.length / 2) {
        warnings.push(`${above} of your ${bands.length} choices are above your predicted grades. A balanced list is mostly Match choices with one or two Stretch or Ambitious ones${safe ? '.' : ', plus one Safe choice as a fallback.'}`);
      } else if (!safe) {
        warnings.push('None of your choices is Safe. Advisers usually suggest one choice comfortably below your predicted grades, so you have a fallback and a realistic insurance choice if results fall short.');
      }
    }
  }
  const offers = ucasOffers(choices);
  const decidedAny = choices.some((c) => !['chosen', 'awaiting'].includes(ucasOf(c)));
  const predictedText = (predicted || []).filter((p) => p && p.subject).map((p) => `${p.subject} ${p.grade || ''}`.trim()).join(', ');
  const early = live.some(isEarlyDeadlineChoice);
  const deadline = early ? cycle.early : cycle.main;
  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  const replyBy = ucasAllDecided(choices) ? ucasReplyBy(cycle, ucasLastDecisionAt(choices)) : null;
  const clearing = ucasClearingOf(choices);
  const placedChoice = choices.find((c) => c.item_meta?.ucasPlaced);
  const over = live.length - UCAS_MAX_CHOICES;

  const run = async (fn, { celebrate = false } = {}) => {
    if (busy) return;
    try { setBusy(true); setError(''); const rows = await fn(); onChange(rows); setModal(null); if (celebrate) setParty((n) => n + 1); }
    catch (e) { setError(e?.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  const slotLabel = (c) => {
    const v = ucasOf(c);
    if (c.item_meta?.ucasPlaced) return 'Placed';
    if (phase === 'shortlisting') return 'Chosen';
    return UCAS_LABEL[v] || v;
  };

  const headerNote = () => {
    if (phase === 'shortlisting') {
      if (daysLeft >= 0) {
        return <><CalendarBlank size={13} weight="bold" aria-hidden="true" /> Deadline {formatDate(deadline)}{early ? ' (Oxford, Cambridge, medicine, dentistry or vet)' : ''}, {pluralDays(daysLeft)} away, for {cycle.year} entry. One application, all choices sent together.</>;
      }
      return early
        ? <><CalendarBlank size={13} weight="bold" aria-hidden="true" /> The 15 October deadline for Oxford, Cambridge, medicine, dentistry and vet has passed for {cycle.year} entry. Other courses can still be added until {formatDate(cycle.main)}.</>
        : <><CalendarBlank size={13} weight="bold" aria-hidden="true" /> The {formatDate(deadline)} deadline has passed. Late applications are still considered until {formatDate(cycle.final)}, but not guaranteed equal consideration.</>;
    }
    if (phase === 'sent') {
      return replyBy
        ? <><CalendarBlank size={13} weight="bold" aria-hidden="true" /> All decisions are in. Reply to UCAS by {formatDate(replyBy)}: choose your firm and insurance below.</>
        : 'Universities reply one by one. Open each choice to record its decision; once every reply is in, choose your firm and insurance.';
    }
    if (phase === 'replied') return 'Firm and insurance chosen. On results day, record where you were placed.';
    if (clearing) return `Placed through Clearing${clearing.title ? `: ${clearing.title}` : ''}${clearing.organisation ? ` at ${clearing.organisation}` : ''}.`;
    return `Placed at ${placedChoice ? placedChoice.organisation : 'your choice'}. Well done.`;
  };

  return (
    <div className="ucas">
      <Celebration key={party} show={party > 0} onDone={() => setParty(0)} />
      <div className="ucas-head">
        <div>
          <div className="ucas-title">UCAS application <span className={`apps-pill apps-pill--${UCAS_PHASE_TONE[phase]}`}>{phase === 'placed' && clearing ? 'Placed through Clearing' : UCAS_PHASE_TEXT[phase]}</span>{phase === 'sent' && sentAt ? <span className="ucas-sent">sent {formatDate(sentAt)}</span> : null}</div>
          <div className="ucas-sub">{headerNote()}</div>
        </div>
        <span className="ucas-count">{Math.min(live.length, UCAS_MAX_CHOICES)} of {UCAS_MAX_CHOICES}</span>
      </div>

      {warnings.map((w, i) => <p className="ucas-warn" key={i}><WarningCircle size={14} weight="fill" aria-hidden="true" /> {w}</p>)}
      {phase === 'shortlisting' && live.length && !hasGrades ? (
        <p className="ucas-note"><Info size={14} weight="fill" aria-hidden="true" /> {onEnterGrades
          ? <>Enter your predicted grades to see how each choice compares with its typical offer. <button type="button" className="ucas-link ucas-link--inline" onClick={onEnterGrades}>Enter your grades</button></>
          : 'Enter your predicted grades in Your grades to see how each choice compares with its typical offer.'}</p>
      ) : null}
      {error ? <p className="fav-error">{error}</p> : null}

      <ol className="ucas-slots">
        {Array.from({ length: Math.max(UCAS_MAX_CHOICES, choices.length) }).map((_, i) => {
          const c = choices[i];
          if (!c) return <li className="ucas-slot ucas-slot--empty" key={`e${i}`}><span className="ucas-n">{i + 1}</span>Free choice</li>;
          const v = ucasOf(c);
          const cond = c.item_meta?.ucasConditions;
          const withdrawn = v === 'withdrawn';
          return (
            <li className={`ucas-slot${c.item_meta?.ucasPlaced ? ' is-placed' : ''}${withdrawn ? ' is-withdrawn' : ''}`} key={c.id}
              onClick={() => { if (onOpen) onOpen(c.id); }} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined}
              onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(c.id); } }}>
              <span className="ucas-n">{i + 1}</span>
              <span className="ucas-slot-main">
                <span className="ucas-slot-title">{c.title}</span>
                <span className="ucas-slot-sub">{c.organisation}{cond ? ` · needs ${cond}` : ''}</span>
              </span>
              {phase === 'shortlisting' && c.item_meta?.stats?.typicalGrades
                ? <ChancesPill predicted={predicted} typicalGrades={c.item_meta.stats.typicalGrades} onTap={(t) => setTip((cur) => (cur === t ? '' : t))} />
                : null}
              {phase === 'shortlisting' ? null : (
                <span className={`apps-pill apps-pill--${UCAS_TONE[v] || 'grey'}`}>{slotLabel(c)}</span>
              )}
              {onOpen ? <CaretRight size={15} weight="bold" className="ucas-slot-chev" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>
      {tip ? <p className="ucas-note ucas-note--tip">{tip}</p> : null}

      <div className="ucas-actions">
        {phase === 'shortlisting' && live.length ? (
          <>
            <button type="button" className="fav-btn fav-btn--primary" disabled={busy || over > 0} onClick={() => setModal('send')}>
              <PaperPlaneTilt size={14} weight="bold" aria-hidden="true" /> I have sent my UCAS application
            </button>
            {over > 0
              ? <span className="ucas-hint">UCAS only accepts five choices. Remove {over === 1 ? 'one choice' : `${over} choices`} first.</span>
              : <span className="ucas-hint">Before you send you need a personal statement, a reference from your school or college, and the application fee.</span>}
          </>
        ) : null}
        {phase === 'sent' ? (
          <>
            {ucasAllDecided(choices) && offers.length ? (
              <button type="button" className="fav-btn fav-btn--primary" disabled={busy} onClick={() => { setFirmId(offers[0]?.id || ''); setInsuranceId(''); setModal('reply'); }}>Choose firm and insurance</button>
            ) : (
              <span className="ucas-hint">{ucasAllDecided(choices)
                ? `No offers this time. UCAS Extra opens ${formatDate(cycle.extraFrom)} and lets you add one more choice at a time; Clearing opens on results day.`
                : `${ucasDecidedCount(choices)} of ${live.length} decisions in. Open a choice to record its reply. Once every university has replied you choose your firm and insurance.`}</span>
            )}
            <button type="button" className="ucas-link" disabled={busy} onClick={() => setModal('unsend')}>Not sent yet, undo</button>
          </>
        ) : null}
        {phase === 'replied' ? (
          <>
            <button type="button" className="fav-btn fav-btn--primary" disabled={busy} onClick={() => { setPlaceId(''); setClearingDraft({ organisation: '', title: '' }); setModal('place'); }}>Results day: where were you placed?</button>
            <button type="button" className="ucas-link" disabled={busy} onClick={() => run(() => ucasUnreply(choices))}>Change firm or insurance</button>
          </>
        ) : null}
        {phase === 'placed' ? (
          <button type="button" className="ucas-link" disabled={busy} onClick={() => setModal('unplace')}>Not placed here, change</button>
        ) : null}
      </div>

      {modal ? (
        <div className="cascade-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget && !busy) setModal(null); }}>
          <div className="cascade-box">
            {modal === 'unsend' ? (
              <>
                <div className="cascade-title">Mark as not sent?</div>
                <p className="cascade-text">Your application goes back to building your choices{decidedAny ? ', and the decisions you have recorded will be cleared' : ''}. Use this only if you marked it as sent by mistake.</p>
                <div className="cascade-actions">
                  <button type="button" className="cascade-btn cascade-btn--primary" disabled={busy} onClick={() => run(() => ucasUnsend(choices))}>{busy ? 'Saving…' : 'Yes, not sent yet'}</button>
                  <button type="button" className="cascade-btn" disabled={busy} onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            ) : modal === 'unplace' ? (
              <>
                <div className="cascade-title">Change where you were placed?</div>
                <p className="cascade-text">This clears the placement so you can record it again.</p>
                <div className="cascade-actions">
                  <button type="button" className="cascade-btn cascade-btn--primary" disabled={busy} onClick={() => run(() => ucasPlace(choices, null, null))}>{busy ? 'Saving…' : 'Yes, change it'}</button>
                  <button type="button" className="cascade-btn" disabled={busy} onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            ) : modal === 'send' ? (
              <>
                <div className="cascade-title">Sent your UCAS application?</div>
                <p className="cascade-text">All {live.length} {live.length === 1 ? 'choice goes' : 'choices go'} together. Once sent, you can only swap a choice within 14 days, so make sure the list above is final.</p>
                <div className="ucas-field"><span>Date sent</span><DatePicker value={sentDraft} onChange={setSentDraft} max={new Date().toISOString().slice(0, 10)} /></div>
                <div className="cascade-actions">
                  <button type="button" className="cascade-btn cascade-btn--primary" disabled={busy || !sentDraft} onClick={() => run(() => ucasMarkSent(choices, sentDraft))}>{busy ? 'Saving…' : 'Yes, it is sent'}</button>
                  <button type="button" className="cascade-btn" disabled={busy} onClick={() => setModal(null)}>Not yet</button>
                </div>
              </>
            ) : modal === 'reply' ? (
              <>
                <div className="cascade-title">Choose your firm and insurance</div>
                <p className="cascade-text">Your firm is your first choice. Your insurance is a backup, usually with lower conditions. Every other offer will be declined.</p>
                {predictedText ? <p className="cascade-text"><strong>Your predicted grades:</strong> {predictedText}</p> : null}
                <div className="ucas-choose">
                  {offers.map((c) => {
                    const cond = c.item_meta?.ucasConditions;
                    const band = cond ? chancesForConditions(predicted, cond) : null;
                    return (
                      <div className="ucas-choose-row" key={c.id}>
                        <span className="ucas-choose-title">{c.title}<span>{c.organisation}{cond ? ` · needs ${cond}` : ' · unconditional'}{band ? <ChancesPill band={band} typicalGrades={cond} what="Offer conditions" predicted={predicted} /> : null}</span></span>
                        <span className="ucas-choose-btns">
                          <button type="button" className={`ucas-choose-btn${firmId === c.id ? ' is-on' : ''}`} onClick={() => { setFirmId(c.id); if (insuranceId === c.id) setInsuranceId(''); }}>{firmId === c.id ? <Check size={12} weight="bold" /> : null} Firm</button>
                          <button type="button" className={`ucas-choose-btn${insuranceId === c.id ? ' is-on' : ''}`} disabled={firmId === c.id} onClick={() => setInsuranceId(insuranceId === c.id ? '' : c.id)}>{insuranceId === c.id ? <Check size={12} weight="bold" /> : null} Insurance</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
                {hasGrades && offers.some((c) => c.item_meta?.ucasConditions) ? <p className="cascade-text ucas-small">Safe, Match, Stretch and Ambitious compare each offer's conditions with your predicted grades. A Safe or Match insurance gives you a realistic fallback.</p> : null}
                <div className="cascade-actions">
                  <button type="button" className="cascade-btn cascade-btn--primary" disabled={busy || !firmId} onClick={() => run(() => ucasReply(choices, firmId, insuranceId || null), { celebrate: true })}>{busy ? 'Saving…' : 'Confirm'}</button>
                  <button type="button" className="cascade-btn" disabled={busy} onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            ) : modal === 'place' ? (
              <>
                <div className="cascade-title">Where were you placed?</div>
                <p className="cascade-text">If your firm's conditions were met you go there; otherwise your insurance; otherwise Clearing.</p>
                <div className="ucas-choose">
                  {choices.filter((c) => ['firm', 'insurance'].includes(ucasOf(c))).map((c) => (
                    <button type="button" key={c.id} className={`ucas-choose-row ucas-choose-row--btn${placeId === c.id ? ' is-on' : ''}`} onClick={() => setPlaceId(c.id)}>
                      <span className="ucas-choose-title">{c.title}<span>{c.organisation} · {UCAS_LABEL[ucasOf(c)]}</span></span>
                      {placeId === c.id ? <Check size={16} weight="bold" /> : null}
                    </button>
                  ))}
                  <button type="button" className={`ucas-choose-row ucas-choose-row--btn${placeId === 'clearing' ? ' is-on' : ''}`} onClick={() => setPlaceId('clearing')}>
                    <span className="ucas-choose-title">Clearing<span>Placed somewhere else through Clearing</span></span>
                    {placeId === 'clearing' ? <Check size={16} weight="bold" /> : null}
                  </button>
                </div>
                {placeId === 'clearing' ? (
                  <div className="ucas-clearing">
                    <label className="ucas-field"><span>University or college</span><input type="text" value={clearingDraft.organisation} maxLength={120} placeholder="e.g. University of Hull" onChange={(e) => setClearingDraft({ ...clearingDraft, organisation: e.target.value })} autoFocus /></label>
                    <label className="ucas-field"><span>Course</span><input type="text" value={clearingDraft.title} maxLength={160} placeholder="e.g. BSc Computer Science" onChange={(e) => setClearingDraft({ ...clearingDraft, title: e.target.value })} /></label>
                  </div>
                ) : null}
                <div className="cascade-actions">
                  <button type="button" className="cascade-btn cascade-btn--primary" disabled={busy || !placeId || (placeId === 'clearing' && !clearingDraft.organisation.trim())}
                    onClick={() => run(() => (placeId === 'clearing'
                      ? ucasPlace(choices, null, { organisation: clearingDraft.organisation.trim(), title: clearingDraft.title.trim() })
                      : ucasPlace(choices, placeId, null)), { celebrate: true })}>{busy ? 'Saving…' : 'Save'}</button>
                  <button type="button" className="cascade-btn" disabled={busy} onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
