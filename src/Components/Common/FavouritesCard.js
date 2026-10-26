import React, { useEffect, useRef, useState } from 'react';
import { Heart, X, CheckCircle, PaperPlaneTilt, ArrowRight, Briefcase, Compass, GraduationCap, BookOpen, FileText, Signpost, Sparkle, MapPin, CaretRight, ArrowSquareOut, ArrowLeft, CalendarBlank, CurrencyGbp, IdentificationBadge } from 'phosphor-react';
import { getCareerWorldIcon, getPathwayIcon, getSubjectIcon, getStrengthIcon, getEnvironmentIcon } from '../../utils/iconMap';
import { getFavouritesByCategory, removeFavourite, clearAllFavourites } from '../../utils/favourites';
import { canApplyFor, favouriteAppKey, isUcasChoice, APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from '../../utils/applications';
import { findChildFavourites, deleteFavouriteRows } from '../../utils/favouriteCascade';
import { supabase } from '../../utils/supabaseClient';
import CascadeRemoveModal from './CascadeRemoveModal';
import ChancesPill from './ChancesPill';
import { entryComparisonNote } from '../../utils/applications';
import { loadSubjectRanking } from '../../utils/rankings';
import { assembleFavouriteWorld, assembleFavouriteRole, assembleFavouriteDegree, assembleFavouriteTraining } from '../../utils/favouriteReportCard';
import { WorldCard } from '../Survey/CareerWorldsAccordion';
import { RoleAccordionItem, PathwayReactionRow, showSelectionTooltip, hideSelectionTooltip } from '../Survey/SelectionInsightExplorer';
import { RouteItem } from '../Survey/FurtherStudyPanel';
import { PathwayCard as NonUniPathwayCard } from '../Survey/NonUniversityPanel';
import InlineError from './InlineError';
import { friendlyError } from '../../utils/friendlyError';
import './FavouritesCard.css';
import '../Rankings/RankingsModal.css'; // reuse the exact course-card styles (rk-course-*)

// Types that open as the exact report card, in place, inside the profile popup.
const INPLACE_TYPES = new Set(['career_world', 'pathway', 'role', 'subject', 'nonuni_pathway', 'apprenticeship']);
// Saved live items (a specific university course, a job advert). They open a small
// in-modal card with the title, the university/employer and a link out.
const LINK_TYPES = new Set(['course', 'job']);

// Row icon rule: things that have their own icon elsewhere in the report
// (worlds, pathways, degrees, training routes, strengths, environments) show
// that icon, tinted by type. Things with no individual icon (roles, job
// adverts, courses) share one fixed icon per type. The type label on the right
// of the row carries the category either way.
function favRowIcon(item, size = 16) {
  const t = item?.type;
  const title = item?.title || '';
  const fixed = (Comp) => <Comp size={size} weight="bold" aria-hidden="true" />;
  switch (t) {
    case 'career_world': return getCareerWorldIcon(title);
    case 'pathway': return getPathwayIcon(title);
    case 'subject': return getSubjectIcon(title);
    case 'nonuni_pathway':
    case 'apprenticeship': return getPathwayIcon(item?.meta?.linkedPathway || item?.subtitle || title);
    case 'strength': return getStrengthIcon(title);
    case 'environment': return getEnvironmentIcon(title);
    case 'role': return fixed(IdentificationBadge);
    case 'job': return fixed(Briefcase);
    case 'course': return fixed(GraduationCap);
    default: return fixed(Heart);
  }
}

// Icon + short label per favourite type, for the preview + list rows.
const isApprenticeshipAd = (item) => item?.type === 'job' && (item?.meta?.kind === 'apprenticeship' || /apprentice/i.test(String(item?.meta?.source || '')));
const favTypeMeta = (item) => {
  if (isApprenticeshipAd(item)) return FAV_TYPE.apprenticeship_advert;
  if (item?.type === 'job' && item?.meta?.kind === 'internship') return FAV_TYPE.internship_advert;
  if (item?.type === 'job' && item?.meta?.kind === 'scheme') return FAV_TYPE.scheme_advert;
  return FAV_TYPE[item?.type] || { Icon: Heart, label: '' };
};

const FAV_TYPE = {
  career_world: { Icon: Briefcase, label: 'Career world', tint: '#e6f1fb', fg: '#185fa5' },
  pathway: { Icon: Compass, label: 'Pathway', tint: '#eeedfe', fg: '#3c3489' },
  subject: { Icon: GraduationCap, label: 'Degree', tint: '#e1f5ee', fg: '#0f6e56' },
  role: { Icon: Briefcase, label: 'Role', tint: '#faece7', fg: '#993c1d' },
  apprenticeship: { Icon: FileText, label: 'Apprenticeship', tint: '#faeeda', fg: '#854f0b' },
  nonuni_pathway: { Icon: Signpost, label: 'Training route', tint: '#faeeda', fg: '#854f0b' },
  course: { Icon: BookOpen, label: 'Course', tint: '#e1f5ee', fg: '#0f6e56' },
  job: { Icon: Briefcase, label: 'Job ad', tint: '#e6f1fb', fg: '#185fa5' },
  internship_advert: { Icon: Briefcase, label: 'Internship ad', tint: '#e6f1fb', fg: '#185fa5' },
  scheme_advert: { Icon: Briefcase, label: 'Graduate scheme ad', tint: '#e6f1fb', fg: '#185fa5' },
  apprenticeship_advert: { Icon: Briefcase, label: 'Apprenticeship ad', tint: '#faeeda', fg: '#854f0b' },
  strength: { Icon: Sparkle, label: 'Strength', tint: '#fbeaf0', fg: '#993556' },
  environment: { Icon: MapPin, label: 'Environment', tint: '#e1f5ee', fg: '#0f6e56' },
};

// Types the report can open in a tab (everything except externally-linked
// jobs/courses, which open their own advert/course link).
const REPORT_TYPES = new Set(['career_world', 'pathway', 'subject', 'role', 'apprenticeship', 'nonuni_pathway', 'strength', 'environment']);

// Left-hand card on the profile page: a summary of the items the student liked on
// their most recent run, opening a popup that lists them by category. Tapping a
// favourite takes them straight to that item in their report (the genuine card),
// or opens its external link for saved jobs/courses.
// appliedKeys: Set of `${type}|${id}` already in the applications tracker;
// onApply(item): mark a favourite ad/course as applied (owned by the profile page).
export default function FavouritesCard({ runId, onExplore, onOpenReport, initialGroups, insightCtx, appliedKeys, onApply, onOpenApplications, stage = 'university', predictedGrades = [] }) {
  // Grades band for a saved course (Safe / Match / Stretch / Ambitious), same as the rankings table.
  const [chancesTip, setChancesTip] = useState('');
  const chances = (item, size = 'sm') => (item && item.type === 'course' && item.stats?.typicalGrades && !entryComparisonNote(item.title, item.subtitle))
    ? <ChancesPill predicted={predictedGrades} typicalGrades={item.stats.typicalGrades} size={size} onTap={(t) => setChancesTip((cur) => (cur === t ? '' : t))} />
    : null;
  // When the parent preloads the favourites (initialGroups), use them directly so
  // the card renders together with the rest of the profile instead of fetching
  // again and popping in a few seconds later.
  const preloaded = initialGroups !== undefined && initialGroups !== null;
  const [groups, setGroups] = useState(preloaded ? initialGroups : null);
  const [loading, setLoading] = useState(!preloaded);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);      // favourite shown as an in-place card
  const [cardData, setCardData] = useState(null);  // assembled world object for WorldCard
  const [cardLoading, setCardLoading] = useState(false);
  const [linkStats, setLinkStats] = useState(null); // stats fetched live for a saved course
  const [removingId, setRemovingId] = useState('');
  // Row whose inline "Remove X from your favourites?" confirm is showing.
  const [confirmId, setConfirmId] = useState('');
  // Opened ad/course that has an application: "Not for me" asks first.
  const [detailConfirm, setDetailConfirm] = useState(false);
  // Removing a world/pathway that still has favourites under it: { parent, children }.
  const [cascadePrompt, setCascadePrompt] = useState(null);
  const [cascadeBusy, setCascadeBusy] = useState(false);
  const [clearAsk, setClearAsk] = useState(false);   // "Clear all" confirm showing
  const [clearBusy, setClearBusy] = useState(false);
  const [error, setError] = useState('');
  // What "Try again" should do for the current error (null: no retry offered).
  const [errorRetry, setErrorRetry] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const fail = (err, context, retry = null) => {
    setError(friendlyError(err, context).message);
    setErrorRetry(retry ? () => retry : null);
  };
  const [applyingId, setApplyingId] = useState('');
  // Tapping an already-logged application explains where it can be changed.
  const appliedHint = (item) => (isUcas(item)
    ? 'This course is one of your UCAS choices. To take it off your favourites, first remove it from your applications.'
    : 'This is in your applications. To take it off your favourites, first remove it from your applications.');
  const isApplied = (item) => Boolean(appliedKeys && appliedKeys.has(favouriteAppKey(item)));
  // An item that is in the applications tracker cannot be unliked from here:
  // explain why in the app's usual white tooltip, next to the button that was
  // pressed. It closes by itself after a few seconds, or on a click outside.
  const hintTimer = useRef(null);
  const showAppliedHint = (item, event) => {
    const target = event && event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    if (!target) return;
    target.setAttribute('data-tooltip-body', appliedHint(item));
    // The reaction buttons hide any tooltip as they finish their own click,
    // so open this one just after.
    window.requestAnimationFrame(() => {
      showSelectionTooltip(target, {
        pinned: true,
        action: typeof onOpenApplications === 'function' ? {
          label: 'Open your applications',
          onClick: () => { setOpen(false); onOpenApplications({ ucas: isUcas(item), itemType: item.type, itemId: String(item.id || '') }); },
        } : null,
      });
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => hideSelectionTooltip({ force: true }), 8000);
    });
  };
  const askRemoveDetail = (item, event) => { if (isApplied(item)) showAppliedHint(item, event); else setDetailConfirm(true); };
  // A school student's course goes onto their UCAS choices rather than being "applied for".
  const isUcas = (item) => isUcasChoice({ kind: item?.type === 'course' ? 'course' : '', item_type: item?.type }, stage);
  const applyLabel = (item) => (isUcas(item) ? 'Add to UCAS choices' : 'Mark as applied');
  // The application's real outcome, kept in step with Your applications.
  const appliedStatus = (item) => (appliedKeys && typeof appliedKeys.get === 'function' ? appliedKeys.get(favouriteAppKey(item)) : null) || 'applied';
  const appliedLabel = (item) => (isUcas(item) ? 'UCAS choice' : (APPLICATION_STATUS_LABEL[appliedStatus(item)] || 'Applied'));
  const appliedTone = (item) => (isUcas(item) ? 'green' : (APPLICATION_STATUS_TONE[appliedStatus(item)] || 'green'));
  const handleApply = async (item) => {
    if (typeof onApply !== 'function' || isApplied(item)) return;
    try { setApplyingId(item.id); setError(''); await onApply(item); }
    catch (e) { fail(e, 'save this application', () => handleApply(item)); }
    finally { setApplyingId(''); }
  };
  // "Applied" control for an ad or course: a small action when not yet logged,
  // a quiet green tick once it is.
  const renderApplied = (item, size = 'sm') => {
    if (!canApplyFor(item) || typeof onApply !== 'function') return null;
    if (size === 'react') {
      if (isApplied(item)) {
        return <button type="button" className="cdna-react-btn cdna-react-btn--applied is-active" aria-pressed="true" onClick={(e) => showAppliedHint(item, e)}><CheckCircle size={18} weight="fill" aria-hidden="true" /> {appliedLabel(item)}</button>;
      }
      return (
        <button type="button" className="cdna-react-btn cdna-react-btn--applied" disabled={applyingId === item.id} onClick={() => handleApply(item)} aria-pressed="false">
          <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" /> {applyingId === item.id ? 'Saving…' : applyLabel(item)}
        </button>
      );
    }
    // List rows: a quiet green tick once the item is in the tracker (rows never
    // offer the action itself; that happens inside the opened card).
    if (isApplied(item)) return <span className={`fav-applied fav-applied--sm fav-applied--${appliedTone(item)}`}><CheckCircle size={13} weight="fill" aria-hidden="true" />{appliedLabel(item)}</span>;
    return null;
  };

  useEffect(() => {
    // Parent supplies the data: mirror it, don't fetch.
    if (initialGroups !== undefined) { setGroups(initialGroups || []); setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    setError('');
    getFavouritesByCategory(runId)
      .then((g) => { if (!cancelled) setGroups(g); })
      .catch((err) => {
        if (cancelled) return;
        setGroups([]);
        fail(err, 'load your favourites', () => setReloadTick((t) => t + 1));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, initialGroups, reloadTick]);

  // Escape closes the innermost thing: inline confirm, then opened card, then popup.
  const escRef = useRef(() => {});
  escRef.current = () => { if (detailConfirm) setDetailConfirm(false); else if (confirmId) setConfirmId(''); else if (detail) { setDetail(null); } else setOpen(false); };
  useEffect(() => { setDetailConfirm(false); }, [detail]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') escRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [open]);

  // Assemble the exact report card when a world/pathway/role favourite is opened.
  // insightCtx is a fresh object on every parent render, so it is read through a
  // ref: the card is built once per opened favourite, not once per render.
  const insightCtxRef = useRef(insightCtx);
  insightCtxRef.current = insightCtx;
  useEffect(() => {
    if (!detail || !INPLACE_TYPES.has(detail.type)) { setCardData(null); setCardLoading(false); return undefined; }
    let cancelled = false;
    const ctx = insightCtxRef.current || {};
    setCardData(null);
    setCardLoading(true);
    const p = detail.type === 'role'
      ? assembleFavouriteRole(detail, ctx).then((r) => (r ? { kind: 'role', ...r } : null))
      : detail.type === 'subject'
        ? assembleFavouriteDegree(detail, ctx).then((d) => (d ? { kind: 'degree', ...d } : null))
        : (detail.type === 'nonuni_pathway' || detail.type === 'apprenticeship')
          ? assembleFavouriteTraining(detail, ctx).then((t) => (t ? { kind: 'training', ...t } : null))
          : assembleFavouriteWorld(detail, ctx).then((w) => (w ? { kind: 'world', ...w } : null));
    p.then((d) => { if (!cancelled) setCardData(d); })
      .catch((err) => { console.warn('Favourite card could not load:', err?.message || err); if (!cancelled) setCardData(null); })
      .finally(() => { if (!cancelled) setCardLoading(false); });
    return () => { cancelled = true; };
  }, [detail]);

  // Saved courses keep a stats snapshot in their meta, but older saves (and any
  // saved before we captured stats) won't have one. When a course opens without
  // stats, look it up live from the rankings data so the card always shows the
  // same rich stat strip as the rankings modal.
  useEffect(() => {
    hideSelectionTooltip({ force: true });
    setChancesTip('');
    setLinkStats(null);
    if (!detail || detail.type !== 'course' || detail.stats) return undefined;
    if (!detail.subject && !detail.title) return undefined;
    let cancelled = false;
    const norm = (s) => String(s || '').trim().toLowerCase();
    loadSubjectRanking({ subjectTitle: detail.subject || detail.title })
      .then((rk) => {
        if (cancelled || !rk) return;
        const rows = Array.isArray(rk.universities) ? rk.universities : (Array.isArray(rk.rows) ? rk.rows : []);
        const want = norm(detail.subtitle);
        const u = rows.find((r) => norm(r.institution) === want)
          || rows.find((r) => want && norm(r.institution).includes(want));
        if (!u) return;
        setLinkStats({
          score: u.score, ranked: u.ranked, graduateJobs: u.graduateJobs, medianSalary: u.medianSalary, employment: u.employment,
          meaningfulWork: u.meaningfulWork, satisfaction: u.satisfaction,
          continuation: u.continuation, typicalGrades: u.typicalGrades,
          offerRate: u.offerRate, tef: u.tef,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [detail]);

  const total = (groups || []).reduce((n, g) => n + g.items.length, 0);
  // Favourites that are in the student's applications stay: they are what links
  // the application back to the report. Everything else goes.
  const keptOnClear = (groups || []).reduce((n, g) => n + g.items.filter((it) => isApplied(it)).length, 0);
  const runClearAll = async () => {
    setClearBusy(true);
    setError(''); setErrorRetry(null);
    try {
      const keep = new Set();
      (groups || []).forEach((g) => g.items.forEach((it) => { if (isApplied(it)) keep.add(favouriteAppKey(it)); }));
      await clearAllFavourites(runId, { keep });
      setGroups((prev) => (prev || [])
        .map((g) => ({ ...g, items: g.items.filter((it) => isApplied(it)) }))
        .filter((g) => g.items.length > 0));
      setClearAsk(false);
    } catch (e) {
      fail(e, 'clear your favourites', runClearAll);
    } finally {
      setClearBusy(false);
    }
  };

  // Preview a MIX of categories (one from each in turn) rather than four of the
  // same type, so the card shows the variety of what the student has saved.
  const previewItems = (() => {
    const lists = (groups || []).map((g) => g.items.slice());
    const out = [];
    let picked = true;
    while (out.length < 4 && picked) {
      picked = false;
      for (const list of lists) {
        if (out.length >= 4) break;
        if (list.length) { out.push(list.shift()); picked = true; }
      }
    }
    return out;
  })();

  // Tapping a favourite: worlds/pathways open the exact report card in place;
  // jobs/courses open their external link; other report types (roles, degrees,
  // training, strengths, environments) jump to that item in the report for now.
  const openItem = (item) => {
    if (INPLACE_TYPES.has(item.type)) { setDetail(item); return; }
    if (LINK_TYPES.has(item.type)) { setDetail(item); return; }
    if (item.url) { window.open(item.url, '_blank', 'noopener,noreferrer'); return; }
    if (onExplore && REPORT_TYPES.has(item.type)) { onExplore(item.type, item.title); setOpen(false); }
  };

  const handleRemove = async (item) => {
    try {
      setRemovingId(item.id);
      setError('');
      await removeFavourite(runId, item.id, item.type, item.storedType);
      setGroups((prev) => (prev || [])
        .map((g) => (g.type === item.type ? { ...g, items: g.items.filter((it) => it.id !== item.id) } : g))
        .filter((g) => g.items.length > 0));
      setDetail((d) => (d && d.id === item.id && d.type === item.type ? null : d));
      // Offer to clear the degrees/roles/routes saved under a removed world or pathway.
      if (['career_world', 'pathway', 'subject'].includes(item.type)) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const children = user ? await findChildFavourites({ userId: user.id, runId, parent: { type: item.type, id: item.id, title: item.title } }) : [];
          if (children.length) setCascadePrompt({ parent: item, children });
        } catch (_) { /* the removal itself succeeded */ }
      }
    } catch (err) {
      fail(err, 'remove that favourite', () => handleRemove(item));
    } finally {
      setRemovingId('');
    }
  };

  const runCascadeRemove = async () => {
    if (!cascadePrompt) return;
    setCascadeBusy(true);
    try {
      const { data: { user: me } } = await supabase.auth.getUser();
      await deleteFavouriteRows(cascadePrompt.children.map((c) => c.id), { userId: me?.id || null, runId, items: cascadePrompt.children });
      const goneTitles = new Set(cascadePrompt.children.map((c) => `${c.item_type}|${c.item_title}`));
      setGroups((prev) => (prev || [])
        .map((g) => ({ ...g, items: g.items.filter((it) => !goneTitles.has(`${it.type}|${it.title}`)) }))
        .filter((g) => g.items.length > 0));
    } catch (err) {
      fail(err, 'remove those favourites', runCascadeRemove);
    } finally {
      setCascadeBusy(false);
      setCascadePrompt(null);
    }
  };

  if (loading) return null;

  // Discreet link at the top right of an opened favourite: jump to the matching
  // section of the report (the same tabs the journey uses).
  const reportSectionLabel = (item) => {
    const uni = stage === 'university';
    switch (item?.type) {
      case 'career_world': return 'Career worlds';
      case 'pathway': return uni ? 'Pathways' : 'Career pathways';
      case 'role': return uni ? 'Roles' : 'Career pathways';
      case 'subject': return 'University';
      case 'course': return 'University';
      case 'nonuni_pathway': return 'Training & work';
      case 'apprenticeship': return 'Training & work';
      case 'job': {
        const kind = item?.meta?.kind;
        if (kind === 'apprenticeship' || /apprentice/i.test(String(item?.meta?.source || ''))) return 'Training & work';
        return uni ? 'Roles' : 'Career pathways';
      }
      case 'strength': return 'Strengths';
      case 'environment': return 'Work styles';
      default: return '';
    }
  };
  const reportLinkType = (item) => {
    if (item?.type === 'job') {
      const kind = item?.meta?.kind;
      if (kind === 'apprenticeship' || /apprentice/i.test(String(item?.meta?.source || ''))) return 'apprenticeship';
      return 'role';
    }
    return item?.type;
  };
  const renderTopBar = (item) => (
    <div className="fav-topbar">
      <button type="button" className="fav-back" onClick={() => setDetail(null)}>
        <ArrowLeft size={15} weight="bold" aria-hidden="true" /> All favourites
      </button>
      {onExplore && reportSectionLabel(item) ? (
        <button type="button" className="fav-back fav-back--report" onClick={() => { onExplore(reportLinkType(item), item.type === 'job' ? '' : item.title); setOpen(false); }}>
          {reportSectionLabel(item)} in your report <ArrowRight size={15} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );

  // The whole card opens the popup (not just "View all"); clicks inside the
  // popup itself or on buttons/links are left alone.
  const openFromCard = (e) => {
    if (e.target.closest('.fav-overlay, button, a, input, select, textarea')) return;
    setOpen(true);
  };

  return (
    <section className="fav-card fav-card--clickable" onClick={openFromCard}>
      {cascadePrompt ? (
        <CascadeRemoveModal
          parent={cascadePrompt.parent}
          items={cascadePrompt.children}
          busy={cascadeBusy}
          onRemove={runCascadeRemove}
          onKeep={() => setCascadePrompt(null)}
        />
      ) : null}
      <div className="fav-head">
        <span className="fav-title">
          <Heart size={18} weight="fill" aria-hidden="true" />
          Your favourites
        </span>
        {total > 0 ? (
          <button type="button" className="fav-btn fav-btn--primary fav-btn--head" onClick={() => setOpen(true)}>
            View all {total}
          </button>
        ) : null}
      </div>

      {total > 0 ? (
        <div className="fav-preview">
          {previewItems.map((item) => {
            const meta = favTypeMeta(item);
            return (
              <div className="fav-prev" key={`${item.type}-${item.id}`}>
                <span className="fav-prev-ic" style={{ background: meta.tint || '#eaf1fe', color: meta.fg || '#2f6fed' }} aria-hidden="true">{favRowIcon(item, 16)}</span>
                <span className="fav-prev-main">
                  <span className="fav-prev-title">{item.title}</span>
                  {item.subtitle ? <span className="fav-prev-sub">{item.subtitle}</span> : null}
                  {item.note ? <span className="fav-prev-sub fav-note">{item.note}</span> : null}
                </span>
                <span className="fav-item-chances-side">{chances(item)}</span>
                {item.expired ? <span className="fav-prev-closed">Closed</span> : <span className="fav-prev-type">{meta.label}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="fav-empty">
          Like a career world, pathway, degree or role in{' '}
          {onOpenReport ? <button type="button" className="fav-inline-link" onClick={onOpenReport}>your report</button> : 'your report'}
          {' '}and it saves here.
        </p>
      )}
      {total > 0 ? <p className="fav-foot fav-foot--card">Like worlds, pathways, degrees, courses and routes in your report to add more.</p> : null}

      {open ? (
        <div className="fav-overlay" role="dialog" aria-modal="true" aria-label="Your favourites"
          onClick={(e) => { if (e.target === e.currentTarget) { if (detail) setDetail(null); else setOpen(false); } }}>
          <div className={`fav-modal${detail && INPLACE_TYPES.has(detail.type) ? ' fav-modal--wide' : ''}${detail && detail.type === 'course' ? ' fav-modal--course' : ''}`}>
            <button type="button" className="fav-close" onClick={() => { if (detail) setDetail(null); else setOpen(false); }} aria-label="Close">
              <X size={18} weight="bold" aria-hidden="true" />
            </button>

            {detail && INPLACE_TYPES.has(detail.type) ? (
              /* ---- IN-PLACE CARD (exact report card) ---- */
              <div className="fav-cardview">
                {renderTopBar(detail)}
                <InlineError compact message={error} onRetry={errorRetry || undefined} />
                {cardLoading ? (
                  <div className="fav-detail-loading"><span className="fav-detail-spinner" aria-hidden="true" /> Loading card&hellip;</div>
                ) : cardData && cardData.kind === 'role' ? (
                  <RoleAccordionItem
                    item={cardData.role}
                    isOpen
                    onToggle={() => {}}
                    pathwayTitle={cardData.pathwayTitle}
                    showGradJobs
                    savedReactions={{ [cardData.role?.id]: 'like' }}
                    onItemReaction={({ reaction, remove }) => { if (remove || reaction !== 'like') setDetailConfirm(true); }}
                  />
                ) : cardData && cardData.kind === 'degree' ? (
                  <RouteItem
                    route={cardData.route}
                    open
                    onToggle={() => {}}
                    reaction="like"
                    onReact={(next) => { if (next !== 'like') setDetailConfirm(true); }}
                    hasRankings={cardData.hasRankings}
                    rankCount={cardData.rankCount}
                  />
                ) : cardData && cardData.kind === 'training' ? (
                  <NonUniPathwayCard
                    pathway={cardData.pathway}
                    routes={cardData.routes}
                    open
                    onToggle={() => {}}
                    reaction={detail.type === 'nonuni_pathway' ? 'like' : ''}
                    onReact={(next) => { if (detail.type === 'nonuni_pathway' && next !== 'like') setDetailConfirm(true); }}
                    liveVacancies
                    savedReactions={{ [detail.id]: 'like' }}
                    onStandardReact={() => {}}
                  />
                ) : cardData && cardData.kind === 'world' ? (
                  <WorldCard
                    world={cardData.world}
                    open
                    onToggle={() => {}}
                    reaction="like"
                    onReact={(next) => { if (next !== 'like') setDetailConfirm(true); }}
                    itemType={cardData.itemType}
                    pilotDefinition={cardData.pilotDefinition}
                  />
                ) : (
                  <div className="fav-empty">
                    <p style={{ margin: '0 0 12px' }}>We could not load this card right now. You can open it in your report instead.</p>
                    {onExplore && REPORT_TYPES.has(detail.type) ? (
                      <button type="button" className="fav-btn fav-btn--primary" onClick={() => { onExplore(detail.type, detail.title); setOpen(false); }}>
                        Open in your report
                      </button>
                    ) : null}
                  </div>
                )}
                {detailConfirm ? (
                  <div className="fav-item fav-item--confirm" role="group" style={{ marginTop: 12 }}>
                    <span className="fav-item-title">Remove <strong>{detail.title}</strong> from your favourites?{isApplied(detail) ? (isUcas(detail) ? ' It stays on your UCAS application.' : ' Your application will stay in Your applications.') : ''}</span>
                    <span className="fav-confirm-actions">
                      <button type="button" className="fav-btn fav-btn--danger" onClick={() => { setDetailConfirm(false); handleRemove(detail); }}>Remove</button>
                      <button type="button" className="fav-btn fav-btn--ghost" onClick={() => setDetailConfirm(false)}>Cancel</button>
                    </span>
                  </div>
                ) : null}
              </div>
            ) : detail && detail.type === 'job' ? (
              /* ---- SAVED JOB: same layout as the job card in the report ---- */
              (() => {
                const m = detail.meta || {};
                const pills = [
                  m.location ? { Icon: MapPin, text: m.location } : null,
                  m.deadline ? { Icon: CalendarBlank, text: `Closes ${m.deadline}` } : { Icon: CalendarBlank, text: 'No closing date listed, check the link' },
                  m.noExperience ? null : { Icon: Briefcase, text: m.experience || 'Graduate / entry-level' },
                  m.salary ? { Icon: CurrencyGbp, text: m.salary } : null,
                ].filter(Boolean);
                return (
                  <div className="fav-cardview">
                    {renderTopBar(detail)}
                    <InlineError compact message={error} onRetry={errorRetry || undefined} />
                    <div className="job-detail-title">{detail.title}</div>
                    {detail.subtitle || m.source ? (
                      <div className="job-detail-sub">{detail.subtitle || 'Live job'}{m.source ? ` · via ${m.source}` : ''}</div>
                    ) : null}
                    <div className="fav-job-body">
                      {detail.expired ? <div className="job-detail-closed">This ad has closed, so it may no longer be accepting applications.</div> : null}
                      {pills.length ? (
                        <div className="role-jobcard__facts job-detail-facts">
                          {pills.map(({ Icon, text }, i) => (
                            <span className="role-jobcard__fact" key={i}><Icon size={13} weight="bold" aria-hidden="true" />{text}</span>
                          ))}
                        </div>
                      ) : null}
                      {detail.url ? (
                        <a className="job-detail-link" href={detail.url} target="_blank" rel="noopener noreferrer">
                          Apply on {m.source || 'the job board'} <span aria-hidden="true">↗</span>
                        </a>
                      ) : null}
                      <div className="job-detail-react">
                        <PathwayReactionRow
                          reaction="like"
                          onReact={(_next, e) => askRemoveDetail(detail, e)}
                          label="Job feedback"
                          extra={renderApplied(detail, 'react')}
                        />
                      </div>
                      {detailConfirm ? (
                        <div className="fav-item fav-item--confirm" role="group" style={{ marginTop: 10 }}>
                          <span className="fav-item-title">Remove <strong>{detail.title}</strong> from your favourites?{isApplied(detail) ? (isUcas(detail) ? ' It stays on your UCAS application.' : ' Your application will stay in Your applications.') : ''}</span>
                          <span className="fav-confirm-actions">
                            <button type="button" className="fav-btn fav-btn--danger" onClick={() => { setDetailConfirm(false); handleRemove(detail); }}>Remove</button>
                            <button type="button" className="fav-btn fav-btn--ghost" onClick={() => setDetailConfirm(false)}>Cancel</button>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()
            ) : detail && LINK_TYPES.has(detail.type) ? (
              /* ---- SAVED LINK CARD (a specific university course or job advert) ---- */
              <div className="fav-cardview">
                {renderTopBar(detail)}
                <InlineError compact message={error} onRetry={errorRetry || undefined} />
                {/* Identical to the rankings course-save card (same classes). */}
                <div className="fav-course-card">
                  <div className="rk-course-modal__title">{detail.title}</div>
                  {detail.subtitle ? <div className="rk-course-modal__uni">{detail.subtitle}</div> : null}
                  {detail.type === 'course' && (detail.stats || linkStats) ? (() => {
                    const s = detail.stats || linkStats;
                    return (
                      <div className="rk-course-stats">
                        {s.score != null && s.ranked !== false ? <span className="rk-course-stat"><b>{Math.round(s.score)}</b> CareerDNA Ranking score</span> : null}
                        {s.medianSalary ? <span className="rk-course-stat"><b>£{Math.round(s.medianSalary / 1000)}k</b> median salary</span> : null}
                        {s.graduateJobs != null ? <span className="rk-course-stat"><b>{s.graduateJobs}%</b> graduate jobs</span> : null}
                        {s.employment != null ? <span className="rk-course-stat"><b>{s.employment}%</b> in work or study</span> : null}
                        {s.satisfaction != null ? <span className="rk-course-stat"><b>{s.satisfaction}%</b> satisfaction</span> : null}
                        {s.typicalGrades && !entryComparisonNote(detail.title, detail.subtitle) ? <span className="rk-course-stat"><b>{s.typicalGrades}</b> typical entry grades</span> : null}
                        {s.offerRate != null ? <span className="rk-course-stat"><b>{Math.round(s.offerRate * 100)}%</b> offer rate</span> : null}
                        {s.tef ? <span className="rk-course-stat"><b>{s.tef}</b> TEF</span> : null}
                        {s.typicalGrades && chances({ type: 'course', stats: s, title: detail.title, subtitle: detail.subtitle }) ? <span className="rk-course-stat rk-course-stat--band">Your chances: {chances({ type: 'course', stats: s, title: detail.title, subtitle: detail.subtitle })}</span> : null}
                        {entryComparisonNote(detail.title, detail.subtitle) ? <span className="rk-course-stats__note">{entryComparisonNote(detail.title, detail.subtitle)}</span> : null}
                        <span className="rk-course-stats__note">For this subject area at {detail.subtitle}. Source: Office for Students, UCAS.</span>
                        {chancesTip ? <span className="rk-course-stats__note fav-chances-tip">{chancesTip}</span> : null}
                      </div>
                    );
                  })() : null}
                  {detail.url ? (
                    <a className="rk-course-modal__link" href={detail.url} target="_blank" rel="noopener noreferrer">
                      {detail.type === 'job' ? 'View ad' : 'View course'} <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                  <div className="rk-course-react">
                    <PathwayReactionRow
                      reaction="like"
                      onReact={(_next, e) => askRemoveDetail(detail, e)}
                      label={detail.type === 'job' ? 'Job feedback' : 'Course feedback'}
                      extra={renderApplied(detail, 'react')}
                    />
                    {detailConfirm ? (
                        <div className="fav-item fav-item--confirm" role="group" style={{ marginTop: 10 }}>
                          <span className="fav-item-title">Remove <strong>{detail.title}</strong> from your favourites?{isApplied(detail) ? (isUcas(detail) ? ' It stays on your UCAS application.' : ' Your application will stay in Your applications.') : ''}</span>
                          <span className="fav-confirm-actions">
                            <button type="button" className="fav-btn fav-btn--danger" onClick={() => { setDetailConfirm(false); handleRemove(detail); }}>Remove</button>
                            <button type="button" className="fav-btn fav-btn--ghost" onClick={() => setDetailConfirm(false)}>Cancel</button>
                          </span>
                        </div>
                      ) : null}
                  </div>
                </div>
              </div>
            ) : (
            <>
            <div className="fav-modal-titlerow">
              <div className="fav-modal-title">Your favourites</div>
              {total > keptOnClear && !clearAsk ? (
                <button type="button" className="fav-clear-all" data-no-autofocus onClick={() => setClearAsk(true)}>Clear all</button>
              ) : null}
            </div>
            {clearAsk ? (
              <div className="fav-item fav-item--confirm fav-clear-confirm" role="group" aria-label="Clear all favourites?">
                <span className="fav-item-main">
                  <span className="fav-item-title">
                    Remove all {total - keptOnClear} favourites?{keptOnClear > 0 ? ` The ${keptOnClear} in your applications will stay. Remove those applications first if you want them gone too.` : ''} This cannot be undone.
                  </span>
                </span>
                <span className="fav-confirm-actions">
                  <button type="button" className="fav-btn fav-btn--danger" disabled={clearBusy} onClick={runClearAll}>
                    {clearBusy ? 'Clearing…' : 'Clear all'}
                  </button>
                  <button type="button" className="fav-btn fav-btn--ghost" disabled={clearBusy} onClick={() => setClearAsk(false)}>Cancel</button>
                </span>
              </div>
            ) : null}
            <div className="fav-modal-sub">
              {total > 0
                ? `Your favourites from your ${stage === 'school' ? 'school' : 'university'} reports. Tap one to open it, or remove any you no longer want.`
                : 'Nothing saved yet. Like a career world, pathway, degree or role in your report and it will appear here.'}
            </div>
            <InlineError compact message={error} onRetry={errorRetry || undefined} />
            {chancesTip ? <p className="fav-applied-hint">{chancesTip}</p> : null}

            <div className="fav-groups">
              {(groups || []).map((g) => (
                <div className="fav-group" key={g.key || g.type}>
                  <div className="fav-group-head">
                    <span className="fav-group-label">{g.label}</span>
                    <span className="fav-group-count">{g.items.length}</span>
                  </div>
                  <div className="fav-items">
                    {g.items.map((item) => {
                      const meta = favTypeMeta(item);
                      const isExternal = Boolean(item.url);
                      const opensInModal = INPLACE_TYPES.has(item.type) || LINK_TYPES.has(item.type);
                      const canOpen = isExternal || opensInModal || REPORT_TYPES.has(item.type);
                      if (confirmId === item.id) {
                        return (
                          <div className="fav-item fav-item--confirm" key={item.id} role="group" aria-label={`Remove ${item.title} from your favourites?`}>
                            <span className="fav-item-main">
                              <span className="fav-item-title">Remove <strong>{item.title}</strong> from your favourites?{isApplied(item) ? (isUcas(item) ? ' It stays on your UCAS application.' : ' Your application will stay in Your applications.') : ''}</span>
                            </span>
                            <span className="fav-confirm-actions">
                              <button type="button" className="fav-btn fav-btn--danger" disabled={removingId === item.id}
                                onClick={() => { setConfirmId(''); handleRemove(item); }}>
                                {removingId === item.id ? 'Removing…' : 'Remove'}
                              </button>
                              <button type="button" className="fav-btn fav-btn--ghost" onClick={() => setConfirmId('')}>Cancel</button>
                            </span>
                          </div>
                        );
                      }
                      return (
                        <React.Fragment key={item.id}>
                        <div
                          className={`fav-item${canOpen ? ' fav-item--tappable' : ''}${removingId === item.id ? ' is-removing' : ''}${item.expired ? ' is-expired' : ''}`}
                          {...(canOpen ? {
                            role: 'button',
                            tabIndex: 0,
                            onClick: () => openItem(item),
                            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openItem(item); } },
                          } : {})}
                        >
                          <span className="fav-item-ic" style={{ background: meta.tint || '#eaf1fe', color: meta.fg || '#2f6fed' }} aria-hidden="true">
                            {favRowIcon(item, 17)}
                          </span>
                          <span className="fav-item-main">
                            <span className="fav-item-title">{item.title}</span>
                            {item.subtitle ? <span className="fav-item-sub">{item.subtitle}</span> : null}
                            {item.note ? <span className="fav-item-sub fav-note">{item.note}</span> : null}
                          </span>
                          <span className="fav-item-chances-side">{chances(item)}</span>
                          {isApplied(item) ? renderApplied(item) : null}
                          {item.expired ? <span className="fav-item-expired">Closed</span> : null}
                          {canOpen ? (
                            (isExternal && !opensInModal)
                              ? <ArrowSquareOut size={15} weight="bold" className="fav-item-chev" aria-hidden="true" />
                              : <CaretRight size={16} weight="bold" className="fav-item-chev" aria-hidden="true" />
                          ) : null}
                          <button
                            type="button"
                            className="fav-item-x"
                            aria-label={`Remove ${item.title} from favourites`}
                            data-tip="Remove from favourites"
                            onClick={(e) => { e.stopPropagation(); if (isApplied(item)) showAppliedHint(item, e); else setConfirmId(item.id); }}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <X size={13} weight="bold" aria-hidden="true" />
                          </button>
                        </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
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
