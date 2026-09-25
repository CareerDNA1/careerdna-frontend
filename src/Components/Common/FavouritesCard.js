import React, { useEffect, useRef, useState } from 'react';
import { Heart, X, Briefcase, Compass, GraduationCap, BookOpen, FileText, Signpost, Sparkle, MapPin, CaretRight, ArrowSquareOut, ArrowLeft, CalendarBlank, CurrencyGbp, IdentificationBadge } from 'phosphor-react';
import { getCareerWorldIcon, getPathwayIcon, getSubjectIcon, getStrengthIcon, getEnvironmentIcon } from '../../utils/iconMap';
import { getFavouritesByCategory, removeFavourite } from '../../utils/favourites';
import { findChildFavourites, deleteFavouriteRows } from '../../utils/favouriteCascade';
import { supabase } from '../../utils/supabaseClient';
import CascadeRemoveModal from './CascadeRemoveModal';
import { loadSubjectRanking } from '../../utils/rankings';
import { assembleFavouriteWorld, assembleFavouriteRole, assembleFavouriteDegree, assembleFavouriteTraining } from '../../utils/favouriteReportCard';
import { WorldCard } from '../Survey/CareerWorldsAccordion';
import { RoleAccordionItem, PathwayReactionRow } from '../Survey/SelectionInsightExplorer';
import { RouteItem } from '../Survey/FurtherStudyPanel';
import { PathwayCard as NonUniPathwayCard } from '../Survey/NonUniversityPanel';
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
const favTypeMeta = (item) => (isApprenticeshipAd(item) ? FAV_TYPE.apprenticeship_advert : FAV_TYPE[item?.type]) || { Icon: Heart, label: '' };

const FAV_TYPE = {
  career_world: { Icon: Briefcase, label: 'Career world', tint: '#e6f1fb', fg: '#185fa5' },
  pathway: { Icon: Compass, label: 'Pathway', tint: '#eeedfe', fg: '#3c3489' },
  subject: { Icon: GraduationCap, label: 'Degree', tint: '#e1f5ee', fg: '#0f6e56' },
  role: { Icon: Briefcase, label: 'Role', tint: '#faece7', fg: '#993c1d' },
  apprenticeship: { Icon: FileText, label: 'Apprenticeship', tint: '#faeeda', fg: '#854f0b' },
  nonuni_pathway: { Icon: Signpost, label: 'Training route', tint: '#faeeda', fg: '#854f0b' },
  course: { Icon: BookOpen, label: 'Course', tint: '#e1f5ee', fg: '#0f6e56' },
  job: { Icon: Briefcase, label: 'Job', tint: '#e6f1fb', fg: '#185fa5' },
  apprenticeship_advert: { Icon: Briefcase, label: 'Apprenticeship advert', tint: '#faeeda', fg: '#854f0b' },
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
export default function FavouritesCard({ runId, onExplore, initialGroups, insightCtx }) {
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
  // Removing a world/pathway that still has favourites under it: { parent, children }.
  const [cascadePrompt, setCascadePrompt] = useState(null);
  const [cascadeBusy, setCascadeBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Parent supplies the data: mirror it, don't fetch.
    if (initialGroups !== undefined) { setGroups(initialGroups || []); setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    getFavouritesByCategory(runId)
      .then((g) => { if (!cancelled) setGroups(g); })
      .catch(() => { if (!cancelled) setGroups([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [runId, initialGroups]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { if (detail) setDetail(null); else setOpen(false); } };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
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
          score: u.score, medianSalary: u.medianSalary, employment: u.employment,
          meaningfulWork: u.meaningfulWork, satisfaction: u.satisfaction,
          continuation: u.continuation, typicalGrades: u.typicalGrades,
          offerRate: u.offerRate, tef: u.tef,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [detail]);

  const total = (groups || []).reduce((n, g) => n + g.items.length, 0);

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
      setError(err?.message || 'Could not remove that favourite.');
    } finally {
      setRemovingId('');
    }
  };

  const runCascadeRemove = async () => {
    if (!cascadePrompt) return;
    setCascadeBusy(true);
    try {
      await deleteFavouriteRows(cascadePrompt.children.map((c) => c.id));
      const goneTitles = new Set(cascadePrompt.children.map((c) => `${c.item_type}|${c.item_title}`));
      setGroups((prev) => (prev || [])
        .map((g) => ({ ...g, items: g.items.filter((it) => !goneTitles.has(`${it.type}|${it.title}`)) }))
        .filter((g) => g.items.length > 0));
    } catch (err) {
      setError(err?.message || 'Could not remove those favourites.');
    } finally {
      setCascadeBusy(false);
      setCascadePrompt(null);
    }
  };

  if (loading) return null;

  return (
    <section className="fav-card">
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
                {item.expired ? <span className="fav-prev-closed">Closed</span> : <span className="fav-prev-type">{meta.label}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="fav-empty">Like a career world, pathway, degree or role in your results and it saves here.</p>
      )}
      {total > 0 ? (
        <div className="fav-cardfoot">
          <button type="button" className="fav-btn fav-btn--primary" onClick={() => setOpen(true)}>
            View all {total}
          </button>
        </div>
      ) : null}

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
                <button type="button" className="fav-back" onClick={() => setDetail(null)}>
                  <ArrowLeft size={15} weight="bold" aria-hidden="true" /> All favourites
                </button>
                {error ? <p className="fav-error">{error}</p> : null}
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
                    onItemReaction={({ reaction, remove }) => { if (remove || reaction !== 'like') handleRemove(detail); }}
                  />
                ) : cardData && cardData.kind === 'degree' ? (
                  <RouteItem
                    route={cardData.route}
                    open
                    onToggle={() => {}}
                    reaction="like"
                    onReact={(next) => { if (next !== 'like') handleRemove(detail); }}
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
                    onReact={(next) => { if (detail.type === 'nonuni_pathway' && next !== 'like') handleRemove(detail); }}
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
                    onReact={(next) => { if (next !== 'like') handleRemove(detail); }}
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
              </div>
            ) : detail && detail.type === 'job' ? (
              /* ---- SAVED JOB: the same card the job opens as in the report ---- */
              (() => {
                const m = detail.meta || {};
                const pills = [
                  m.location ? { Icon: MapPin, text: m.location } : null,
                  m.deadline ? { Icon: CalendarBlank, text: `Closes ${m.deadline}` } : null,
                  m.noExperience ? null : { Icon: Briefcase, text: m.experience || 'Graduate / entry-level' },
                  m.salary ? { Icon: CurrencyGbp, text: m.salary } : null,
                ].filter(Boolean);
                return (
                  <div className="fav-cardview">
                    <button type="button" className="fav-back" onClick={() => setDetail(null)}>
                      <ArrowLeft size={15} weight="bold" aria-hidden="true" /> All favourites
                    </button>
                    {error ? <p className="fav-error">{error}</p> : null}
                    <div className="fav-detail-head">
                      <span className="fav-detail-ic" aria-hidden="true"><Briefcase size={22} weight="bold" /></span>
                      <div className="fav-detail-headtext">
                        <div className="fav-detail-title">{detail.title}</div>
                        {detail.subtitle || m.source ? (
                          <div className="fav-prev-sub" style={{ whiteSpace: 'normal' }}>{detail.subtitle || 'Live job'}{m.source ? ` · via ${m.source}` : ''}</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="fav-job-body">
                      {detail.expired ? <div className="job-detail-closed">This advert has closed, so it may no longer be accepting applications.</div> : null}
                      {pills.length ? (
                        <div className="role-jobcard__facts job-detail-facts">
                          {pills.map(({ Icon, text }, i) => (
                            <span className="role-jobcard__fact" key={i}><Icon size={13} weight="bold" aria-hidden="true" />{text}</span>
                          ))}
                        </div>
                      ) : null}
                      <PathwayReactionRow
                        reaction="like"
                        onReact={(next) => { if (next !== 'like') handleRemove(detail); }}
                        label="Job feedback"
                      />
                      {detail.url ? (
                        <div className="job-detail-actions">
                          <a className="cw-readmore job-detail-apply" href={detail.url} target="_blank" rel="noopener noreferrer">
                            Apply on {m.source || 'the job board'} <span aria-hidden="true">↗</span>
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()
            ) : detail && LINK_TYPES.has(detail.type) ? (
              /* ---- SAVED LINK CARD (a specific university course or job advert) ---- */
              <div className="fav-cardview">
                <button type="button" className="fav-back" onClick={() => setDetail(null)}>
                  <ArrowLeft size={15} weight="bold" aria-hidden="true" /> All favourites
                </button>
                {error ? <p className="fav-error">{error}</p> : null}
                {/* Identical to the rankings course-save card (same classes). */}
                <div className="fav-course-card">
                  <div className="rk-course-modal__title">{detail.title}</div>
                  {detail.subtitle ? <div className="rk-course-modal__uni">{detail.subtitle}</div> : null}
                  {detail.type === 'course' && (detail.stats || linkStats) ? (() => {
                    const s = detail.stats || linkStats;
                    return (
                      <div className="rk-course-stats">
                        {s.score != null ? <span className="rk-course-stat"><b>{Math.round(s.score)}</b> CareerDNA rank</span> : null}
                        {s.medianSalary ? <span className="rk-course-stat"><b>£{Math.round(s.medianSalary / 1000)}k</b> median salary</span> : null}
                        {s.employment != null ? <span className="rk-course-stat"><b>{s.employment}%</b> employed</span> : null}
                        {s.satisfaction != null ? <span className="rk-course-stat"><b>{s.satisfaction}%</b> satisfaction</span> : null}
                        {s.typicalGrades ? <span className="rk-course-stat"><b>{s.typicalGrades}</b> typical offer</span> : null}
                        {s.offerRate != null ? <span className="rk-course-stat"><b>{Math.round(s.offerRate * 100)}%</b> offer rate</span> : null}
                        {s.tef ? <span className="rk-course-stat"><b>{s.tef}</b> TEF</span> : null}
                        <span className="rk-course-stats__note">For this subject area at {detail.subtitle}. Source: Office for Students, UCAS.</span>
                      </div>
                    );
                  })() : null}
                  {detail.url ? (
                    <a className="rk-course-modal__link" href={detail.url} target="_blank" rel="noopener noreferrer">
                      {detail.type === 'job' ? 'View advert' : 'View course'} <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                  <div className="rk-course-react">
                    <PathwayReactionRow
                      reaction="like"
                      onReact={(next) => { if (next !== 'like') handleRemove(detail); }}
                      label={detail.type === 'job' ? 'Job feedback' : 'Course feedback'}
                    />
                  </div>
                </div>
              </div>
            ) : (
            <>
            <div className="fav-modal-title">Your favourites</div>
            <div className="fav-modal-sub">Saved from your latest run. Tap one to open it, or remove any you no longer want.</div>
            {error ? <p className="fav-error">{error}</p> : null}

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
                      return (
                        <div
                          className={`fav-item${canOpen ? ' fav-item--tappable' : ''}${removingId === item.id ? ' is-removing' : ''}${item.expired ? ' is-expired' : ''}`}
                          key={item.id}
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
                          {item.expired ? <span className="fav-item-expired">Closed</span> : null}
                          {canOpen ? (
                            (isExternal && !opensInModal)
                              ? <ArrowSquareOut size={15} weight="bold" className="fav-item-chev" aria-hidden="true" />
                              : <CaretRight size={16} weight="bold" className="fav-item-chev" aria-hidden="true" />
                          ) : null}
                        </div>
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
