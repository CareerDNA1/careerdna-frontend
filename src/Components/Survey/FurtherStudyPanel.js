import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FurtherStudyPanel.css';
import { Info, BookOpen, Compass, UsersThree, GraduationCap, BookmarkSimple, TrendUp, TrendDown } from 'phosphor-react';
import { fetchFurtherStudy, peekFurtherStudyCache } from '../../utils/fetchFurtherStudy';
import { OptionDropdown, showSelectionTooltip, hideSelectionTooltip, SignalBadge, PathwayReactionRow, SelectionTitle } from './SelectionInsightExplorer';
import { getSubjectIcon } from '../../utils/iconMap';
import ResultsFilterBar, { applyResultsFilter, emptyFilter, bandRank } from './ResultsFilter';
import { loadRankingSubjectIndex } from '../../utils/rankings';

// Format the structured GCSE minimums object into a short readable string,
// e.g. { maths: 7, english: 5, science: 6 } -> "Maths 7, English 5, Science 6".
const GCSE_LABEL = { maths: 'Maths', english: 'English', science: 'Science' };
const GCSE_ORDER = ['maths', 'english', 'science'];
function formatGcse(g, gmin) {
  if (!g || typeof g !== 'object') return '';
  const keys = [
    ...GCSE_ORDER.filter((k) => g[k] != null),
    ...Object.keys(g).filter((k) => !GCSE_ORDER.includes(k) && g[k] != null),
  ];
  return keys
    .map((k) => {
      const label = GCSE_LABEL[k] || (k.charAt(0).toUpperCase() + k.slice(1));
      const min = gmin && gmin[k];
      return (min != null && min !== g[k]) ? `${label} ${g[k]} (min ${min})` : `${label} ${g[k]}`;
    })
    .join(', ');
}

// Structured "Typical A-levels & GCSEs" block, driven by subject_requirements
// (attached to each route by the backend). Replaces the old prose paragraph.
// Turn the broad-area demand trend into a compact chip (short) plus a full
// sentence (long, used as the hover title).
function demandLine(demand) {
  if (!demand || typeof demand.pct !== 'number') return null;
  const years = Math.max(1, (Number(demand.toYear) || 0) - (Number(demand.fromYear) || 0));
  const pct = demand.pct;
  const area = demand.area ? ` in ${demand.area}` : '';
  const dir = pct >= 3 ? 'up' : pct <= -3 ? 'down' : 'flat';
  const short = dir === 'up' ? `+${pct}%` : dir === 'down' ? `${pct}%` : 'steady';
  const phrase = dir === 'up'
    ? `up ${pct}%`
    : dir === 'down'
      ? `down ${Math.abs(pct)}%`
      : 'broadly steady';
  const long = `Applications${area} are ${phrase} over the last ${years} years (UCAS).`;
  return { dir, short, long };
}

function RequirementsSection({ reqs }) {
  if (!reqs) return null;
  const req = Array.isArray(reqs.required_alevels) ? reqs.required_alevels : [];
  const pref = Array.isArray(reqs.preferred_alevels) ? reqs.preferred_alevels : [];
  const gcse = formatGcse(reqs.gcse, reqs.gcse_min);
  const tests = Array.isArray(reqs.admissions_test) ? reqs.admissions_test : [];
  return (
    <div className="fs-degree-section fs-reqs" key="fs-reqs">
      <span className="fs-degree-section__label">
        <GraduationCap size={14} weight="bold" aria-hidden="true" />
        Typical entry
      </span>
      <div className="fs-reqs-rows">
        {req.length ? (
          <div className="fs-req-row">
            <span className="fs-req-key">Required</span>
            <span className="fs-req-chips">
              {req.map((a, i) => <span className="fs-req-chip fs-req-chip--req" key={`r${i}`}>{a}</span>)}
            </span>
          </div>
        ) : null}
        {pref.length ? (
          <div className="fs-req-row">
            <span className="fs-req-key">Preferred</span>
            <span className="fs-req-chips">
              {pref.map((a, i) => <span className="fs-req-chip" key={`p${i}`}>{a}</span>)}
            </span>
          </div>
        ) : null}
        {gcse ? (
          <div className="fs-req-row"><span className="fs-req-key">GCSEs</span><span className="fs-req-val">{gcse}</span></div>
        ) : null}
        {tests.length ? (
          <div className="fs-req-row"><span className="fs-req-key">Admissions test</span><span className="fs-req-val">{tests.join(', ')}</span></div>
        ) : null}
        {reqs.portfolio_or_audition ? (
          <div className="fs-req-row"><span className="fs-req-key">Also</span><span className="fs-req-val">{reqs.portfolio_or_audition}</span></div>
        ) : null}
        {reqs.typical_offer_range ? (
          <div className="fs-req-row"><span className="fs-req-key">Typical offer</span><span className="fs-req-val">{reqs.typical_offer_range}</span></div>
        ) : null}
      </div>
      <p className="fs-req-note">
        {reqs.notes ? `${reqs.notes} ` : ''}Requirements vary by university, so check each course.
      </p>
    </div>
  );
}

// A single study route rendered as an accordion item, mirroring the Pathway
// Explorer item layout: leading icon, title, and (when open) the like/dislike
// buttons on the same header line, next to the chevron.
export function RouteItem({ route, open = false, onToggle, reaction = '', onReact, hasRankings = false, rankCount = 0 }) {
  const Icon = getSubjectIcon(route.title || '');
  const demand = demandLine(route?.requirements?.demand);
  return (
    <div className={`pathway-role-item ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="pathway-role-item__toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="pathway-role-item__topline pathway-role-item__topline--split">
          <div className="pathway-role-item__title-wrap">
            {Icon ? <span className="pathway-role-item__icon" aria-hidden="true">{Icon}</span> : null}
            <span className="fs-title-col">
              <span className="fs-title-line">
                <span className="pathway-role-item__title">{route.title}</span>
                {open && demand ? (
                  <span
                    className={`fs-demand-chip fs-demand-chip--${demand.dir}`}
                    role="button"
                    tabIndex={0}
                    data-selection-tooltip="true"
                    data-tooltip-title="Demand"
                    data-tooltip-body={demand.long}
                    onMouseEnter={(e) => showSelectionTooltip(e.currentTarget)}
                    onMouseLeave={hideSelectionTooltip}
                    onFocus={(e) => showSelectionTooltip(e.currentTarget)}
                    onBlur={hideSelectionTooltip}
                    onClick={(e) => { e.stopPropagation(); showSelectionTooltip(e.currentTarget, { pinned: true }); }}
                  >
                    {demand.dir === 'down'
                      ? <TrendDown size={12} weight="bold" aria-hidden="true" />
                      : demand.dir === 'up'
                        ? <TrendUp size={12} weight="bold" aria-hidden="true" />
                        : null}
                    Demand {demand.short}
                  </span>
                ) : null}
              </span>
              {Array.isArray(route.leadsTo) && route.leadsTo.length ? (
                <span className="fs-leadsto">Leads to: {route.leadsTo.join(' \u00b7 ')}</span>
              ) : null}
            </span>
          </div>
          <div className="pathway-role-item__right">
            {!open && reaction === 'like' ? (
              <span className="cdna-saved-mark" aria-label="Saved to favourites" title="Saved to favourites"><BookmarkSimple size={18} weight="fill" aria-hidden="true" /></span>
            ) : null}
            <span className="pathway-role-item__chevron">
              <svg
                className={`selection-chevron ${open ? 'is-open' : ''}`}
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </button>

      {open ? (
        <div className="pathway-role-item__body">
          {(() => {
            const reqs = route.requirements || null;
            const paras = String(route.description || '')
              .split(/\n\s*\n/)
              .map((p) => p.trim())
              .filter(Boolean);
            // Degree definitions follow a four-paragraph structure. When a
            // structured requirements record is present we render only those four
            // paragraphs and show requirements as a structured block; otherwise we
            // fall back to labelling an optional fifth prose paragraph.
            const labels = ['What it is', "What you'll study", 'Where it leads', 'Who it suits', 'Typical A-levels & GCSEs'];
            const icons = [Info, BookOpen, Compass, UsersThree, GraduationCap];
            const proseCount = reqs ? Math.min(paras.length, 4) : paras.length;
            // The rankings entry is the final grid cell — a live, clickable button
            // that sits alongside the description sections (left/right/left/right...).
            const rankingsCell = !hasRankings ? null : (
              <button
                type="button"
                className="fs-degree-section fs-rank-cell"
                data-rankings-subject={route.id || ''}
                data-rankings-title={route.title || ''}
                data-premium-feature="rankings"
                key="fs-rank-cell"
              >
                <span className="fs-degree-section__label fs-rank-cell__label">
                  <GraduationCap size={14} weight="bold" aria-hidden="true" />
                  Explore courses &amp; rankings
                  <span className="fs-premium-badge">Premium</span>
                </span>
                <p className="pathway-role-item__summary">
                  Our 2026 CareerDNA composite ranking of UK universities for {route.title}, built from official
                  Office for Students data. Browse the subject-specific ranking and open links to each university&rsquo;s courses.
                </p>
                <div className="fs-rank-cell__foot">
                  {rankCount > 0 ? (
                    <span className="fs-rank-cell__live">
                      <span className="fs-rank-cell__dot" aria-hidden="true" />
                      {rankCount} live {rankCount === 1 ? 'course' : 'courses'} ranked
                    </span>
                  ) : <span />}
                  <span className="fs-rank-cell__go">Explore courses and rankings&nbsp;<span aria-hidden="true">→</span></span>
                </div>
              </button>
            );
            if (proseCount === 4 || proseCount === 5) {
              return (
                <div className="fs-degree-grid">
                  {paras.slice(0, proseCount).map((p, i) => {
                    const SectionIcon = icons[i];
                    return (
                      <div className={`fs-degree-section${i === 4 ? ' fs-span2' : ''}`} key={`fs-sec-${i}`}>
                        <span className="fs-degree-section__label">
                          <SectionIcon size={14} weight="bold" aria-hidden="true" />
                          {labels[i]}
                        </span>
                        <p className="pathway-role-item__summary">{p}</p>
                      </div>
                    );
                  })}
                  {reqs ? <RequirementsSection reqs={reqs} /> : null}
                  {rankingsCell}
                </div>
              );
            }
            return (
              <>
                {paras.map((p, i) => (
                  <p className="pathway-role-item__summary" key={`fs-desc-${i}`}>{p}</p>
                ))}
                {(reqs || rankingsCell) ? (
                  <div className="fs-degree-grid">
                    {reqs ? <RequirementsSection reqs={reqs} /> : null}
                    {rankingsCell}
                  </div>
                ) : null}
              </>
            );
          })()}

          <PathwayReactionRow
            reaction={reaction}
            onReact={(next) => { if (onReact) onReact(next); }}
            label="Degree feedback"
          />
        </div>
      ) : null}
    </div>
  );
}

export default function FurtherStudyPanel({ likedWorlds = [], likedPathwayTitles = [], archetypes = {}, subdimensions = [], savedReactions = {}, onItemReaction }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Seed from the session cache so re-opening the tab shows instantly (no spinner).
  const [groups, setGroups] = useState(() => {
    const cached = peekFurtherStudyCache(likedWorlds, likedPathwayTitles);
    return cached && Array.isArray(cached.groups) ? cached.groups : null;
  });
  const [activeKey, setActiveKey] = useState('');
  const [rankIndex, setRankIndex] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadRankingSubjectIndex().then((idx) => { if (!cancelled) setRankIndex(idx); });
    return () => { cancelled = true; };
  }, []);
  const subjectHasRankings = (r) => {
    if (!rankIndex || !r) return false;
    const nt = String(r.title || '').trim().toLowerCase();
    return !!((r.id && rankIndex.ids.has(r.id)) || (nt && rankIndex.titles.has(nt)));
  };
  const subjectRankCount = (r) => {
    if (!rankIndex || !r) return 0;
    const nt = String(r.title || '').trim().toLowerCase();
    return (r.id && rankIndex.countById.get(r.id)) || rankIndex.countByTitle.get(nt) || 0;
  };
  const mainRef = useRef(null);
  const rootRef = useRef(null);

  const handleRouteReact = (route, next, pathwayTitle = '') => {
    const id = route?.id || route?.title;
    if (!id || typeof onItemReaction !== 'function') return;
    const current = savedReactions[id] || '';
    onItemReaction({
      itemType: 'subject',
      itemId: id,
      itemTitle: route.title,
      reaction: next,
      remove: current === next,
      itemMeta: pathwayTitle ? { pathwayTitle } : null,
    });
  };

  // Delegated white floating tooltips for the like/dislike buttons, matching the
  // Career Worlds and Pathway Explorer behaviour (hover, focus, tap-then-close).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const getTarget = (event) => (
      event.target instanceof Element ? event.target.closest('[data-selection-tooltip="true"]') : null
    );
    let suppressUntil = 0;
    let autoHideTimer = null;
    const onOver = (event) => {
      if (Date.now() < suppressUntil) return;
      const t = getTarget(event);
      if (t instanceof HTMLElement) showSelectionTooltip(t);
    };
    const onOut = (event) => { const t = getTarget(event); if (t instanceof HTMLElement) hideSelectionTooltip(); };
    const onClick = (event) => {
      const t = getTarget(event);
      if (t instanceof HTMLElement) showSelectionTooltip(t, { pinned: true });
    };
    root.addEventListener('pointerover', onOver);
    root.addEventListener('pointerout', onOut);
    root.addEventListener('focusin', onOver);
    root.addEventListener('focusout', onOut);
    root.addEventListener('click', onClick);
    window.addEventListener('scroll', hideSelectionTooltip, { passive: true });
    window.addEventListener('resize', hideSelectionTooltip);
    return () => {
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerout', onOut);
      root.removeEventListener('focusin', onOver);
      root.removeEventListener('focusout', onOut);
      root.removeEventListener('click', onClick);
      window.removeEventListener('scroll', hideSelectionTooltip);
      window.removeEventListener('resize', hideSelectionTooltip);
      if (autoHideTimer) clearTimeout(autoHideTimer);
      hideSelectionTooltip();
    };
  }, []);
  const hasSelectedRef = useRef(false);
  // One degree open at a time across both the relevant and other lists.
  const [openRouteKey, setOpenRouteKey] = useState('');
  const [studyFilter, setStudyFilter] = useState(emptyFilter());
  const isDegreeLiked = (r) => savedReactions[r?.id || r?.title] === 'like';

  const likedKey = useMemo(
    () => [
      ...likedWorlds.map((p) => p.careerWorldId || p.id || p.title),
      '::',
      ...[...likedPathwayTitles].sort(),
    ].join('|'),
    [likedWorlds, likedPathwayTitles]
  );

  // Bring the detail into view when the selected world changes (tab/dropdown),
  // and close any open degree so each world starts collapsed.
  useEffect(() => {
    // Collapse open degrees on switch, but do NOT auto-scroll the page (the
    // selection can change as data settles, which was scrolling on arrival).
    setOpenRouteKey('');
    hasSelectedRef.current = true;
  }, [activeKey]);

  // Auto-load whenever the set of liked career worlds changes. Each liked world
  // returns a consolidated range of degrees.
  useEffect(() => {
    if (!likedWorlds.length) {
      setGroups(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      // Only show the spinner when there's nothing cached to show yet.
      const hasCache = !!peekFurtherStudyCache(likedWorlds, likedPathwayTitles);
      if (!hasCache) setLoading(true);
      setError('');
      try {
        const data = await fetchFurtherStudy({
          archetypes,
          subdimensions,
          likedItems: likedWorlds.map((w) => ({
            id: w.id,
            title: w.title,
            type: 'career_world',
            careerWorldId: w.careerWorldId || '',
          })),
          likedPathwayTitles,
        });
        if (cancelled) return;
        const g = Array.isArray(data?.groups) ? data.groups : [];
        setGroups(g);
        setActiveKey((prev) => {
          const keys = g.map((x) => x.pathwayId || x.pathwayTitle);
          return keys.includes(prev) ? prev : keys[0] || '';
        });
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Could not load your study routes right now.');
          setGroups([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likedKey]);

  if (!likedWorlds.length) {
    return (
      <section className="selection-explorer selection-explorer--empty">
        <div className="selection-explorer__intro selection-explorer__intro--empty">
          <h2>Your university routes</h2>
          <p className="selection-explorer__empty-message">
            Like the career worlds you&rsquo;re drawn to in the Career Worlds tab, then come back here to
            see the university degrees that lead into them.
          </p>
        </div>
      </section>
    );
  }

  const active =
    (groups || []).find((g) => (g.pathwayId || g.pathwayTitle) === activeKey) || (groups || [])[0];
  // Selected world pills ordered by match strength (Standout first).
  const orderedGroups = (groups || []).slice().sort((a, b) => bandRank(b?.signalLabel) - bandRank(a?.signalLabel));

  return (
    <section className="selection-explorer" ref={rootRef}>
      <div className="selection-explorer__intro selection-explorer__intro--active">
        <h2>Your university routes</h2>
        <p className="selection-explorer__intro-text">
          The university degrees that lead into the career worlds you liked. Pick a career world to see
          its range of degrees and how well each one fits you. Prefer to earn while you learn? The
          Training &amp; Work tab shows the apprenticeship and work routes instead.
        </p>
      </div>

      {loading ? (
        <p className="fs-none">Finding your study routes&hellip;</p>
      ) : error ? (
        <p className="fs-error">{error}</p>
      ) : (
        <div className="selection-explorer__layout selection-explorer__layout--stacked">
          {/* Desktop / iPad: dropdown selector (the pill tabs below are hidden on
              larger screens by the shared CSS, so this is what lets you switch). */}
          <div className="selection-explorer__selector-select-wrap">
            <OptionDropdown
              options={orderedGroups.map((g) => ({ key: g.pathwayId || g.pathwayTitle, title: g.pathwayTitle }))}
              activeKey={active?.pathwayId || active?.pathwayTitle || ''}
              onSelect={setActiveKey}
            />
          </div>

          <div className="selection-explorer__selector-tabs" role="tablist" aria-label="Liked pathways">
            {orderedGroups.map((g) => {
              const key = g.pathwayId || g.pathwayTitle;
              const isActive = key === (active?.pathwayId || active?.pathwayTitle);
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  className={`selection-list-button ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveKey(key)}
                >
                  <span className="selection-list-button__title">{g.pathwayTitle}</span>
                </button>
              );
            })}
          </div>

          <div ref={mainRef} className="selection-explorer__main selection-explorer__main--full">
            {active ? (() => {
              const relevantAll = Array.isArray(active.relevantRoutes) ? active.relevantRoutes : [];
              const otherAll = Array.isArray(active.otherRoutes)
                ? active.otherRoutes
                : (Array.isArray(active.routes) ? active.routes : []);
              const relevant = applyResultsFilter(relevantAll, studyFilter, { isLiked: isDegreeLiked });
              const other = applyResultsFilter(otherAll, studyFilter, { isLiked: isDegreeLiked });
              const hasRelevant = relevant.length > 0;
              const hasAny = relevant.length + other.length > 0;
              const hasAnyUnfiltered = relevantAll.length + otherAll.length > 0;
              const bandWord = active.signalLabel
                || ((likedWorlds || []).find((w) => String(w?.title || '') === String(active.pathwayTitle || ''))?.signalLabel)
                || '';
              const headerLabel = bandWord
                ? (/match$/i.test(bandWord) ? bandWord : `${bandWord} match`)
                : '';
              return (
                <article className="selection-detail-card">
                  <div className="selection-definition-card__header">
                    <SelectionTitle item={{ title: active.pathwayTitle, type: 'career_world' }} />
                    {headerLabel ? (
                      <div className="selection-detail-card__signal-wrap"><SignalBadge label={headerLabel} /></div>
                    ) : null}
                  </div>
                  {hasAnyUnfiltered ? (
                    <div className="selection-explorer__toolbar">
                      <ResultsFilterBar filter={studyFilter} onChange={setStudyFilter} groups={['favourites']} />
                    </div>
                  ) : null}

                  {(() => {
                    const clustersRaw = Array.isArray(active.pathwayGroups) ? active.pathwayGroups : [];
                    const renderList = (list) => (
                      <div className="pathway-role-list">
                        {list.map((r) => {
                          const rk = String(r.id || r.title);
                          return (
                            <RouteItem
                              key={rk}
                              route={r}
                              open={openRouteKey === rk}
                              onToggle={() => setOpenRouteKey((prev) => (prev === rk ? '' : rk))}
                              reaction={savedReactions[r.id || r.title] || ''}
                              onReact={(next) => handleRouteReact(r, next, g.pathwayTitle)}
                              hasRankings={subjectHasRankings(r)}
                              rankCount={subjectRankCount(r)}
                            />
                          );
                        })}
                      </div>
                    );
                    if (!hasAnyUnfiltered) {
                      return <p className="fs-none">No degrees mapped for this world yet.</p>;
                    }
                    if (clustersRaw.length) {
                      // De-duplicate into a single list; tag each degree with the
                      // liked pathway(s) it leads to. Keeps the list short even when
                      // many pathways are liked (a shared degree appears once).
                      const byKey = new Map();
                      clustersRaw.forEach((g) => {
                        [...(g.primary || []), ...(g.adjacent || [])].forEach((r) => {
                          const k = String(r.id || r.title);
                          if (!byKey.has(k)) byKey.set(k, { ...r, leadsTo: [] });
                          const entry = byKey.get(k);
                          if (!entry.leadsTo.includes(g.pathwayTitle)) entry.leadsTo.push(g.pathwayTitle);
                        });
                      });
                      let relevantDeduped = applyResultsFilter(Array.from(byKey.values()), studyFilter, { isLiked: isDegreeLiked });
                      relevantDeduped.sort((a, b) => (b.leadsTo.length - a.leadsTo.length) || (Number(b.signalPct || 0) - Number(a.signalPct || 0)));
                      const inRel = new Set(relevantDeduped.map((r) => String(r.id || r.title)));
                      const otherOnly = other.filter((r) => !inRel.has(String(r.id || r.title)));
                      if (!relevantDeduped.length && !otherOnly.length) {
                        return <p className="results-filter-empty">None of your favourites are in this list. Try clearing the filter.</p>;
                      }
                      return (
                        <>
                          {relevantDeduped.length ? (
                            <>
                              <div className="fs-detail-heading">Degrees for the pathways you liked</div>
                              {renderList(relevantDeduped)}
                            </>
                          ) : null}
                          {otherOnly.length ? (
                            <>
                              <div className="fs-detail-heading" style={{ marginTop: 28 }}>Other degrees in this career world</div>
                              {renderList(otherOnly)}
                            </>
                          ) : null}
                        </>
                      );
                    }
                    // Fallback (backend not yet sending pathwayGroups): show the
                    // liked-pathway degrees first, then the rest of the world.
                    if (!hasAny) {
                      return <p className="results-filter-empty">None of your favourites are in this list. Try clearing the filter.</p>;
                    }
                    return (
                      <>
                        {relevant.length ? (
                          <>
                            <div className="fs-detail-heading">Most relevant to the pathways you liked</div>
                            {renderList(relevant)}
                            {other.length ? (
                              <div className="fs-detail-heading" style={{ marginTop: 28 }}>Other degrees in this career world</div>
                            ) : null}
                          </>
                        ) : (
                          <div className="fs-detail-heading">Degrees you could study for this career world</div>
                        )}
                        {other.length ? renderList(other) : null}
                      </>
                    );
                  })()}
                </article>
              );
            })() : null}
          </div>
        </div>
      )}
    </section>
  );
}
