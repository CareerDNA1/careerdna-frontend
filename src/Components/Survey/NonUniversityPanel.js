import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FurtherStudyPanel.css';
import './NonUniversityPanel.css';
import { Info, Compass, Briefcase, BookmarkSimple, GraduationCap, BookOpen, UsersThree, CaretDown, CaretRight, Signpost } from 'phosphor-react';
import { fetchNonUniRoutes, peekNonUniRoutes, fetchRouteVacancies } from '../../utils/fetchNonUniRoutes';
import { PATHWAY_DEFINITIONS } from '../../utils/selectionDefinitions';
import { OptionDropdown, showSelectionTooltip, hideSelectionTooltip, PathwayReactionRow, SignalBadge, SelectionTitle, JobCard, JobDetailModal } from './SelectionInsightExplorer';
import { getReactions, setItemReaction } from '../../utils/savedItems';
import { getSubjectIcon, getPathwayIcon } from '../../utils/iconMap';
import ResultsFilterBar, { applyResultsFilter, emptyFilter, bandRank } from './ResultsFilter';

// Strip the option in parentheses and the word 'apprenticeship'/level tag from a
// standard name so the Find an Apprenticeship search matches the parent standard
// (an option-specific term often returns 0 even when the standard has adverts).
function cleanVacancyKeyword(name) {
  return String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bapprenticeship\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Format an ISO closing date as "5 Aug 2026" (JobCard prefixes it with "Closes ").
const VAC_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatClosingDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${VAC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Title-case an ALL-CAPS employer name (e.g. "TRINITY MULTI ACADEMY TRUST" ->
// "Trinity Multi Academy Trust"); leave already-mixed-case names untouched.
function tidyEmployer(name) {
  if (!name) return null;
  const s = String(name).trim();
  const letters = s.replace(/[^A-Za-z]/g, '');
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  if (!allCaps) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

// Tidy a vacancy title: drop a leading reference tag ("(App840) …"), then drop
// trailing dash-separated segments that are salary / hours / postcode noise some
// employers append (e.g. "… – London, WC1H 9BT - £27,586p/a – 37.5 hrs/w").
function cleanVacTitle(t) {
  let s = String(t || '').replace(/^\(\s*(app|vac)[^)]*\)\s*/i, '').trim();
  const parts = s.split(/\s+[–—-]\s+/);
  if (parts.length > 1) {
    const junk = (p) => /£|\bp\s*\/?\s*a\b|per annum|per year|\bhrs?\b|hours|\/\s*w\b|\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(p);
    const keep = [parts[0]];
    for (let i = 1; i < parts.length; i += 1) { if (junk(parts[i])) break; keep.push(parts[i]); }
    s = keep.join(' – ');
  }
  return s.replace(/\s+/g, ' ').trim();
}

// Tidy a vacancy location down to the town/city: strip the UK postcode, keep the
// first segment, and drop country words ("England", "United Kingdom", …).
function cleanVacLocation(loc) {
  if (!loc) return null;
  if (/multiple/i.test(loc)) return 'Multiple locations';
  let s = String(loc).replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, ' ');
  s = s.split(',')[0]
    .replace(/\b(england|scotland|wales|northern ireland|united kingdom|uk)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s || null;
}

// Drop a leading "Employer –" prefix from a title when it just repeats the
// employer shown on the line below (e.g. "The Royal Navy – Warfare Specialist…"
// with employer "Royal Navy" -> "Warfare Specialist…").
function stripEmployerPrefix(title, employer) {
  if (!title || !employer) return title;
  const norm = (s) => String(s).toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/\b(ltd|limited|plc|llp)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
  const parts = title.split(/\s+[–—-]\s+/);
  if (parts.length > 1 && norm(parts[0]) && norm(parts[0]) === norm(employer)) {
    return parts.slice(1).join(' – ').trim();
  }
  return title;
}

// Normalise a live apprenticeship vacancy into a tidy advert object.
function apprenticeshipToJob(v) {
  const employer = tidyEmployer(v.employer);
  const wage = v.wage ? (v.wage.wageAdditionalInformation || v.wage.wageType || null) : null;
  return {
    title: stripEmployerPrefix(cleanVacTitle(v.title), employer) || null,
    employer,
    location: cleanVacLocation(v.location),
    salary: wage,
    deadline: formatClosingDate(v.closingDate),
    closingDate: v.closingDate || null,
    url: v.url || null,
    // Shared job card fields: apprenticeship adverts have no experience line.
    noExperience: true,
    source: 'Find an Apprenticeship',
    kind: 'apprenticeship',
  };
}
// Same id scheme as saved job adverts (see SelectionInsightExplorer jobKey), so
// a saved apprenticeship advert sits in the profile's Saved jobs with the rest.
function advertKey(job) {
  return `job:${job.url || `${job.title || ''}|${job.employer || ''}`}`;
}

// College / T Level / course routes rarely map to a single provider link, so we
// point students at the government's National Careers Service course finder,
// pre-filled with a sensible subject keyword. Prefer an explicit courseSearchTerm
// from the data; otherwise derive one from the pathway (drop the "& ..." tail and
// any parenthetical so "Music Performance & Production" searches as "Music
// Performance", "Dance & Choreography" as "Dance", etc.).
function courseSearchTerm(route) {
  const raw = route.courseSearchTerm || route.pathway || route.occupation || '';
  return String(raw).split('&')[0].replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}
function findACourseUrl(route) {
  return `https://nationalcareers.service.gov.uk/find-a-course/page?searchTerm=${encodeURIComponent(courseSearchTerm(route))}`;
}

// title -> short pathway definition (for the "What it is" blurb)
const PATHWAY_SHORT_BY_TITLE = Object.fromEntries(
  Object.values(PATHWAY_DEFINITIONS || {}).map((v) => [v.title, v.short])
);
// title -> long pathway definition, split into paragraphs. Used to fill the
// "What you'd do" and "Who it suits" cells of the card.
const PATHWAY_LONG_PARAS_BY_TITLE = Object.fromEntries(
  Object.values(PATHWAY_DEFINITIONS || {}).map((v) => [
    v.title,
    String(v.long || v.paragraph || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
  ])
);

// The 7 vocational career worlds — careers entered through work rather than a
// degree. They aren't in the academic Career Worlds tab, so they're always shown
// as a separate group here.
const VOCATIONAL_WORLDS = [
  'Skilled Trades & Construction',
  'Making, Craft & Repair',
  'Land, Animals & the Outdoors',
  'Protective & Emergency Services',
  'Transport, Aviation & Maritime',
  'Hospitality, Food & Events',
  'Care & Community Support',
];

// The register's "qualifying body" field is often a full sentence or a long
// semicolon list. Reduce it to a short, chip-friendly label (first clean body
// name, "+N" if there are more), or drop it if it's just prose.
function cleanBody(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const isSentence = (p) =>
    p.length > 42 ||
    /^(this|achievement|successful|on |completion|the standard|apprentices|registration|meets|designed|recognised)/i.test(p);
  const parts = s.split(/\s*;\s*/).map((p) => p.trim()).filter(Boolean);
  const clean = parts.filter((p) => !isSentence(p));
  if (clean.length) {
    const extra = clean.length - 1;
    return extra > 0 ? `${clean[0]} +${extra}` : clean[0];
  }
  // No clean body name — try to pull an acronym like (BCS) from the prose.
  const m = s.match(/\(([A-Z][A-Za-z&]{1,9})\)/);
  return m ? m[1] : null;
}

function durationLabel(months) {
  const n = Number(months);
  if (!n) return null;
  if (n < 12) return `${n} months`;
  const y = Math.round((n / 12) * 10) / 10;
  return `${y % 1 === 0 ? y : y.toFixed(1)} years`;
}

// Live-vacancy lookup for a single apprenticeship standard.
function VacancyBlock({ larsCode, keyword, applyVia, searchFallback }) {
  const [state, setState] = useState({ loading: true, data: null });
  useEffect(() => {
    let cancelled = false;
    if (!larsCode) { setState({ loading: false, data: null }); return undefined; }
    (async () => {
      const data = await fetchRouteVacancies(larsCode, keyword);
      if (!cancelled) setState({ loading: false, data });
    })();
    return () => { cancelled = true; };
  }, [larsCode, keyword]);

  const { loading, data } = state;
  const count = data && typeof data.count === 'number' ? data.count : null;
  const capped = !!(data && data.countCapped);
  const searchUrl = (data && data.searchUrl) || searchFallback;

  // Compact, single-line vacancy status (no inline example adverts) so each way in
  // stays tidy. The full list lives on Find an Apprenticeship behind the link.
  return (
    <div className="nu-vacancies">
      {loading ? (
        <p className="nu-vac-note">Checking for live openings&hellip;</p>
      ) : count && count > 0 ? (
        <p className="nu-vac-line">
          <span className="nu-vac-dot" aria-hidden="true" />
          <span className="nu-vac-count-inline">{count}{capped ? '+' : ''} live apprenticeship {count === 1 ? 'opening' : 'openings'}</span>
          {searchUrl ? (
            <> &middot; <a className="nu-vac-link" href={searchUrl} target="_blank" rel="noopener noreferrer">See openings <span aria-hidden="true">→</span></a></>
          ) : null}
        </p>
      ) : (
        <p className="nu-vac-line">
          <span className="nu-vac-count-inline nu-vac-count-inline--muted">No live apprenticeship openings.</span>
          {searchUrl ? (
            <> <a className="nu-vac-link" href={searchUrl} target="_blank" rel="noopener noreferrer">Check Find an Apprenticeship <span aria-hidden="true">→</span></a></>
          ) : null}
        </p>
      )}
    </div>
  );
}

// Friendly label for a non-apprenticeship route type (no register standard).
// Coloured "ways in" dots, matching the Career Worlds legend.
const WAYIN_DOT = {
  Apprenticeship: { c: '#12A150', label: 'Apprenticeship' },
  College: { c: '#7C3AED', label: 'College' },
  Work: { c: '#EA7317', label: 'On the job' },
};
function waysInChips(routes) {
  const s = new Set();
  for (const r of (routes || [])) {
    const rt = String(r.routeType || '');
    if (rt === 'College' || rt === 'TLevel') s.add('College');
    else if (['Professional', 'BuildYourOwn', 'Direct', 'DirectEntry', 'Cadetship'].includes(rt)) s.add('Work');
    else s.add('Apprenticeship');
  }
  return ['Apprenticeship', 'College', 'Work'].filter((c) => s.has(c));
}

const ROUTE_TYPE_LABEL = {
  DegAppr: 'Degree apprenticeship route',
  NonDegAppr: 'Apprenticeship route',
  BuildYourOwn: 'Start your own / entrepreneurial route',
  Professional: 'Professional qualification route',
  DirectEntry: 'Direct entry',
  Direct: 'Direct entry',
  College: 'College course route',
  TLevel: 'T Level (college course)',
  Cadetship: 'Sponsored cadetship',
};

// A single way in (one apprenticeship standard / entry route) inside a pathway card.
// Short, teen-friendly name for each apprenticeship level (shown on the chip),
// plus a plain-English tooltip that anchors the level to school qualifications a
// 14–17-year-old already knows. Levels are the regulated qualification levels.
const LEVEL_NAME = {
  L2: 'GCSE standard',
  L3: 'A-level standard',
  L4: 'Higher',
  L5: 'Higher',
  L6: 'Degree level',
  L7: "Master's level",
};
const LEVEL_TOOLTIP = {
  L2: 'Level 2, around GCSE grade. A first step into a job; you can start at 16, after Year 11.',
  L3: 'Level 3, around A-level or T-level. The most common apprenticeship; start after your GCSEs or after college / Sixth Form.',
  L4: 'Level 4, a step above A-levels, like the first year of university. Usually started after A-levels, a T-level or a Level 3.',
  L5: 'Level 5, like the first two years of university (a foundation degree). Usually started after A-levels, a T-level or a Level 3.',
  L6: "Level 6, bachelor's-degree level. A green “Degree included” tag means you earn a full degree while you work and get paid, with no tuition fees. Usually started after A-levels or a T-level.",
  L7: "Level 7, master's-degree level. These are long routes; a few (like Solicitor and Doctor) can be started from A-levels with the degree built in.",
};
const LEVEL_ORDER = { L2: 2, L3: 3, L4: 4, L5: 5, L6: 6, L7: 7 };

function levelKey(level) {
  return String(level || '').toUpperCase().replace(/^LEVEL\s*/, 'L').replace(/\s+/g, '');
}
function levelName(level) { return LEVEL_NAME[levelKey(level)] || ''; }
function levelTooltip(level) { return LEVEL_TOOLTIP[levelKey(level)] || ''; }
function levelRank(level) { return LEVEL_ORDER[levelKey(level)] || 99; }

// The honest "what you actually walk away with" line. Derived from the level and
// whether the route awards a full university degree (deliversDegree, computed in
// the data from title + government register). We describe by level band rather
// than guessing a specific award name, since the register doesn't reliably say.
function qualificationLine(level, deliversDegree) {
  const k = levelKey(level);
  if (deliversDegree) {
    if (k === 'L7') return "A full master's degree, plus the professional skills for the job.";
    if (k === 'L6') return "A full bachelor's degree (BA/BSc), plus the professional skills for the job.";
    return 'A full university degree, plus the professional skills for the job.';
  }
  switch (k) {
    case 'L2': return 'A qualification at the same level as GCSEs (Level 2).';
    case 'L3': return 'A qualification at the same level as A-levels (Level 3).';
    case 'L4': return 'A qualification a step above A-levels, like the first year of university (Level 4).';
    case 'L5': return 'A qualification like the first two years of university, e.g. a foundation degree or HND (Level 5).';
    case 'L6': return "A qualification at bachelor's-degree level (Level 6).";
    case 'L7': return "A qualification at master's-degree level (Level 7).";
    default: return '';
  }
}

// Plain-English "what you need to start" line, by level.
function entryLine(level) {
  const k = levelKey(level);
  if (k === 'L2') return 'Usually your GCSEs; you can start one at 16.';
  if (k === 'L3') return 'Usually your GCSEs; some employers ask for specific grades.';
  if (['L4', 'L5', 'L6', 'L7'].includes(k)) return 'Usually A-levels, a T-level, or a Level 3 (like an Advanced apprenticeship).';
  return '';
}

function StandardRow({ route, liveVacancies, showTitle, reaction = '', onReact }) {
  // Some "ways in" aren't a formal apprenticeship standard (no LARS/standard code)
  // — e.g. Armed Forces direct entry, or building your own venture. Render those
  // honestly as their route type rather than as an empty apprenticeship.
  const [modalOpen, setModalOpen] = useState(false);
  const [showAllVac, setShowAllVac] = useState(false);
  const [openingsOpen, setOpeningsOpen] = useState(false);
  // Live adverts: save (bookmark) and like/dislike, exactly like job adverts.
  const [savedAds, setSavedAds] = useState(() => new Set());
  const [dislikedAds, setDislikedAds] = useState(() => new Set());
  const [detailAd, setDetailAd] = useState(null);
  useEffect(() => {
    if (!openingsOpen) return undefined;
    let cancelled = false;
    getReactions('job').then((m) => {
      if (cancelled) return;
      const liked = new Set(); const disliked = new Set();
      m.forEach((r, id) => { if (r === 'like') liked.add(id); else if (r === 'dislike') disliked.add(id); });
      setSavedAds(liked); setDislikedAds(disliked);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [openingsOpen]);
  const persistAdReaction = async (job, reaction, remove) => {
    await setItemReaction({
      itemType: 'job',
      itemId: advertKey(job),
      itemTitle: job.title || 'Apprenticeship',
      itemMeta: {
        employer: job.employer || '',
        location: job.location || '',
        url: job.url || '',
        deadline: job.deadline || '',
        closingDate: job.closingDate || null,
        source: job.source || 'Find an Apprenticeship',
        salary: job.salary || '',
        noExperience: true,
        kind: 'apprenticeship',
        // Parent links, so unliking the pathway or world offers to clear this too.
        pathwayTitle: route.pathway || '',
        careerWorldTitle: route.careerWorld || '',
      },
      reaction,
      remove,
    });
  };
  const adReactionFor = (id) => (savedAds.has(id) ? 'like' : dislikedAds.has(id) ? 'dislike' : '');
  const handleAdToggleSave = async (job) => {
    const id = advertKey(job);
    const isSaved = savedAds.has(id);
    setSavedAds((prev) => { const n = new Set(prev); if (isSaved) n.delete(id); else n.add(id); return n; });
    if (!isSaved) setDislikedAds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    await persistAdReaction(job, 'like', isSaved);
  };
  const handleAdReact = async (job, next) => {
    const id = advertKey(job);
    const current = adReactionFor(id);
    const remove = current === next;
    setSavedAds((prev) => { const n = new Set(prev); if (!remove && next === 'like') n.add(id); else n.delete(id); return n; });
    setDislikedAds((prev) => { const n = new Set(prev); if (!remove && next === 'dislike') n.add(id); else n.delete(id); return n; });
    await persistAdReaction(job, next, remove);
  };
  // T Levels and college diplomas are courses you apply to, not apprenticeship
  // adverts, so they never show "live openings" and link to a provider finder.
  const isCourse = !!route.isCourseRoute;
  const hasStandard = !!(route.standardName || route.standardLarsCode);
  // Live-openings count for the collapsed summary row and the expanded detail.
  const [vac, setVac] = useState({ loading: true, data: null });
  useEffect(() => {
    let cancelled = false;
    const lars = (hasStandard && liveVacancies) ? route.standardLarsCode : '';
    if (!lars) { setVac({ loading: false, data: null }); return undefined; }
    (async () => {
      const d = await fetchRouteVacancies(lars, route.standardName || route.pathway);
      if (!cancelled) setVac({ loading: false, data: d });
    })();
    return () => { cancelled = true; };
  }, [route.standardLarsCode, liveVacancies, hasStandard, route.standardName, route.pathway]);
  const vCount = vac.data && typeof vac.data.count === 'number' ? vac.data.count : null;
  const vCapped = !!(vac.data && vac.data.countCapped);
  if (!hasStandard) {
    const label = ROUTE_TYPE_LABEL[route.routeType] || 'Direct entry';
    // College / T Level / other course routes have no apprenticeship advert, but
    // they are still applied to at a college or provider — give students a real
    // "Find a course" link (National Careers Service) rather than a dead end.
    const courseType = route.isCourseRoute || route.routeType === 'College' || route.routeType === 'TLevel';
    return (
      <div className="nu-standard">
        <div className="nu-standard__name">{route.occupation || route.route || route.pathway}</div>
        <p className="nu-vac-line">
          <span className="nu-vac-count-inline nu-vac-count-inline--muted">{label}{route.note ? `, ${route.note}` : ''}</span>
        </p>
        {courseType ? (
          <a className="nu-wayin-officiallink" href={findACourseUrl(route)} target="_blank" rel="noopener noreferrer">
            Find a course <span className="nu-standard__ext" aria-hidden="true">↗</span>
          </a>
        ) : null}
      </div>
    );
  }
  const dur = durationLabel(route.standardDurationMonths);
  const levelChip = route.standardLevel || '';
  const levelTip = levelTooltip(levelChip);
  const overview = (route.standardOverview || '').trim();
  const recognisedBy = cleanBody(route.qualifyingBody);
  // One tidy title per way in — the standard name; level/duration/body are shown
  // as chips below, so we don't repeat them in a second line.
  const title = route.standardName || route.occupation || route.route;
  const link = route.standardLink || '';
  // Paused standards are approved but not accepting new starts, so they will
  // never have live openings — say so plainly instead of "no openings".
  const paused = /paused/i.test(route.standardStatus || '');
  // Whether this route actually awards a full university degree (bachelor's/
  // master's), pre-computed in the data (title + government register combined,
  // since the register's own field mislabels several school-leaver routes).
  const deliversDegree = !!route.deliversDegree;
  const comesOut = qualificationLine(levelChip, deliversDegree);
  const entryNeed = entryLine(levelChip);
  const levelNum = levelChip ? levelChip.replace(/^L/i, '') : '';
  // Header uses the pathway's own icon, and a one-line "Apprenticeship · Level 3
  // · 2 years" subtitle instead of floating pills.
  const HeaderIcon = getPathwayIcon(route.linkedPathway || route.pathway || route.standardName);
  // Route category for the row icon/colour (matches the Apprenticeship/College
  // legend dots): apprenticeship, college (T Level / college), or work.
  const rtRaw = String(route.routeType || '');
  const rowCat = (rtRaw === 'College' || rtRaw === 'TLevel') ? 'College'
    : (['Professional', 'BuildYourOwn', 'Direct', 'DirectEntry', 'Cadetship'].includes(rtRaw)) ? 'Work'
    : 'Apprenticeship';
  const RowIcon = rowCat === 'College' ? GraduationCap : rowCat === 'Work' ? Compass : Briefcase;
  const rowCatClass = rowCat === 'College' ? 'nu-wayrow__icon--college' : rowCat === 'Work' ? 'nu-wayrow__icon--work' : 'nu-wayrow__icon--appr';
  const headKind = isCourse ? (ROUTE_TYPE_LABEL[route.routeType] || 'Course') : 'Apprenticeship';
  const headSub = [headKind, levelChip ? `Level ${levelNum}` : null, dur, deliversDegree ? 'Degree included' : null]
    .filter(Boolean).join(' · ');
  return (
    <>
      <button type="button" className="nu-wayrow" onClick={() => { setShowAllVac(false); setOpeningsOpen(false); setModalOpen(true); }}>
        <span className={`nu-wayrow__icon ${rowCatClass}`} aria-hidden="true"><RowIcon size={18} weight="bold" /></span>
        <span className="nu-wayrow__main">
          <span className="nu-wayrow__title">{title}</span>
          <span className="nu-wayrow__meta">
            <span className="nu-wayrow__sub">{headKind}{levelChip ? ` · Level ${levelNum}` : ''}{deliversDegree ? ' · Degree' : ''}</span>
            {reaction === 'like' ? (
              <span className="nu-wayrow__saved" aria-label="Saved to favourites" title="Saved to favourites"><BookmarkSimple size={13} weight="fill" aria-hidden="true" /> Saved</span>
            ) : null}
            {vCount != null && vCount > 0 ? (
              <span className="nu-wayrow__live"><span className="nu-vac-dot" aria-hidden="true" />{vCount}{vCapped ? '+' : ''} live</span>
            ) : isCourse ? (
              <span className="nu-wayrow__note">College course</span>
            ) : null}
          </span>
        </span>
        <CaretRight size={16} weight="bold" className="nu-wayrow__chev" aria-hidden="true" />
      </button>
      {modalOpen ? (
        <div
          className="cw-def-modal cw-def-modal--wayin"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — details`}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="cw-def-modal__box">
            <div className="cw-def-modal__head cw-wayin-head">
              {HeaderIcon ? <span className="cw-wayin-head__icon" aria-hidden="true">{HeaderIcon}</span> : null}
              <div className="cw-wayin-head__titles">
                <span className="cw-def-modal__title">{title}</span>
                {headSub ? <span className="cw-wayin-head__sub">{headSub}</span> : null}
              </div>
              <button type="button" className="cw-def-modal__close" aria-label="Close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="cw-def-modal__body nu-wayin-modal">
              {/* PART 1 — about this apprenticeship standard. */}
              <div className="nu-wayin-info">
                {overview ? <p className="nu-wayin-overview">{overview}</p> : null}
                {(comesOut || entryNeed || recognisedBy || isCourse) ? (
                  <div className="nu-factbox">
                    {comesOut ? (
                      <div className="nu-factrow">
                        <GraduationCap size={18} weight="bold" className="nu-factrow__icon" aria-hidden="true" />
                        <div>
                          <div className="nu-factrow__label">You&rsquo;ll come out with</div>
                          <div className="nu-factrow__value">{comesOut}</div>
                        </div>
                      </div>
                    ) : null}
                    {entryNeed ? (
                      <div className="nu-factrow">
                        <Signpost size={18} weight="bold" className="nu-factrow__icon" aria-hidden="true" />
                        <div>
                          <div className="nu-factrow__label">To start, you&rsquo;ll usually need</div>
                          <div className="nu-factrow__value">{entryNeed}</div>
                        </div>
                      </div>
                    ) : null}
                    {recognisedBy ? (
                      <div className="nu-factrow">
                        <BookmarkSimple size={18} weight="bold" className="nu-factrow__icon" aria-hidden="true" />
                        <div>
                          <div className="nu-factrow__label">Recognised by</div>
                          <div className="nu-factrow__value">{recognisedBy} <span className="nu-fact__optional">(optional)</span></div>
                        </div>
                      </div>
                    ) : null}
                    {isCourse ? (
                      <div className="nu-factrow">
                        <Info size={18} weight="bold" className="nu-factrow__icon" aria-hidden="true" />
                        <div>
                          <div className="nu-factrow__value">{route.applyVia || 'Apply through a college or sixth form.'}</div>
                        </div>
                      </div>
                    ) : null}
                    {link ? (
                      <a className="nu-wayin-officiallink" href={link} target="_blank" rel="noopener noreferrer">
                        {isCourse ? 'Find a provider' : 'View the official standard'} <span className="nu-standard__ext" aria-hidden="true">↗</span>
                      </a>
                    ) : isCourse ? (
                      <a className="nu-wayin-officiallink" href={findACourseUrl(route)} target="_blank" rel="noopener noreferrer">
                        Find a course <span className="nu-standard__ext" aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* PART 2 — live openings (apprenticeship standards only), a clearly
                  separated, expandable section listing the real adverts. */}
              {!isCourse ? (
                <div className="nu-openings-section">
                  <div className="nu-openings-eyebrow">
                    <span className="nu-openings-eyebrow__label">Live openings</span>
                    <span className="fs-premium-badge">Premium</span>
                  </div>
                  {paused ? (
                    <p className="nu-vac-count-inline nu-vac-count-inline--muted">Approved, but not taking new starts right now.</p>
                  ) : vCount != null && vCount > 0 && vac.data && Array.isArray(vac.data.vacancies) && vac.data.vacancies.length ? (
                    <>
                      <button
                        type="button"
                        className="nu-openings-toggle"
                        data-premium-feature="apprenticeships"
                        onClick={() => setOpeningsOpen((o) => !o)}
                        aria-expanded={openingsOpen}
                      >
                        <span className="nu-openings-toggle__count">
                          <span className="nu-vac-dot" aria-hidden="true" />
                          {vCount}{vCapped ? '+' : ''} live apprenticeship {vCount === 1 ? 'opening' : 'openings'}
                        </span>
                        <CaretDown size={16} weight="bold" className={`nu-openings-toggle__chev ${openingsOpen ? 'is-open' : ''}`} aria-hidden="true" />
                      </button>
                      {openingsOpen ? (
                        <div className="nu-adverts">
                          {(showAllVac ? vac.data.vacancies : vac.data.vacancies.slice(0, 15)).map((v, i) => {
                            const job = apprenticeshipToJob(v);
                            return (
                              <JobCard
                                key={`${v.reference || v.title}-${i}`}
                                job={job}
                                saved={savedAds.has(advertKey(job))}
                                onToggleSave={handleAdToggleSave}
                                onOpen={setDetailAd}
                              />
                            );
                          })}
                          {detailAd ? (
                            <JobDetailModal
                              job={detailAd}
                              reaction={adReactionFor(advertKey(detailAd))}
                              onReact={(next) => handleAdReact(detailAd, next)}
                              onClose={() => setDetailAd(null)}
                            />
                          ) : null}
                          <div className="nu-adverts__foot">
                            {!showAllVac && vac.data.vacancies.length > 15 ? (
                              <button type="button" className="nu-adverts__showall" onClick={() => setShowAllVac(true)}>
                                Show all {vac.data.vacancies.length}
                              </button>
                            ) : <span />}
                            {(vac.data.searchUrl || route.standardName) ? (
                              <a className="nu-adverts__link" href={vac.data.searchUrl || `https://www.findapprenticeship.service.gov.uk/apprenticeships?searchTerm=${encodeURIComponent(cleanVacancyKeyword(route.standardName))}`} target="_blank" rel="noopener noreferrer">Find an Apprenticeship <span aria-hidden="true">↗</span></a>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="nu-vac-count-inline nu-vac-count-inline--muted">No live apprenticeship openings right now.</p>
                  )}
                </div>
              ) : null}
            </div>
            {(!isCourse && onReact) ? (
              <div className="cw-def-modal__reactfoot">
                <PathwayReactionRow
                  reaction={reaction}
                  onReact={(next) => onReact(next)}
                  label="Save this apprenticeship"
                />
              </div>
            ) : (
              <button type="button" className="cw-def-modal__done" onClick={() => setModalOpen(false)}>Close</button>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

// One card = one PATHWAY (a way into a career without a degree). Inside: what it
// is, the apprenticeship standard(s) that get you in, and where it leads.
export function PathwayCard({ pathway, routes, open, onToggle, reaction, onReact, liveVacancies, band, savedReactions = {}, onStandardReact }) {
  const Icon = getPathwayIcon(pathway || '') || getSubjectIcon(pathway || '');
  const about = PATHWAY_SHORT_BY_TITLE[pathway] || '';
  // De-duplicated roles across every standard in this pathway.
  const roles = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of routes) {
      for (const role of (Array.isArray(r.roles) ? r.roles : [])) {
        const key = String(role).trim().toLowerCase();
        if (key && !seen.has(key)) { seen.add(key); out.push(role); }
      }
    }
    return out;
  }, [routes]);
  const multi = routes.length > 1;
  // "Where it leads" can list dozens of job titles; cap it so the card stays tidy.
  const [showAllRoles, setShowAllRoles] = useState(false);
  const ROLE_LIMIT = 6;
  const shownRoles = showAllRoles ? roles : roles.slice(0, ROLE_LIMIT);
  // Fill the "What you'd do" and "Who it suits" cells from the pathway long def.
  const longParas = PATHWAY_LONG_PARAS_BY_TITLE[pathway] || [];
  const whatYouDo = longParas[0] || '';
  let whoItSuits = longParas.find((p) => /\bit (tends to )?suits?\b/i.test(p))
    || (longParas.length > 1 ? longParas[longParas.length - 1] : '');
  if (whoItSuits === whatYouDo) whoItSuits = '';
  // Order the ways in: apprenticeships first (these carry live openings), then
  // college / T Levels, then on-the-job / direct-entry routes; by level within each.
  const routeGroupRank = (r) => {
    const rt = String(r.routeType || '');
    if (rt === 'College' || rt === 'TLevel') return 1;
    if (['Professional', 'BuildYourOwn', 'Direct', 'DirectEntry', 'Cadetship'].includes(rt)) return 2;
    return 0;
  };
  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => routeGroupRank(a) - routeGroupRank(b) || levelRank(a.standardLevel) - levelRank(b.standardLevel)),
    [routes]
  );
  const standardRoutes = sortedRoutes.filter((r) => r.standardName || r.standardLarsCode);
  const waysCount = routes.length;
  const [waysOpen, setWaysOpen] = useState(false);
  // Total live openings across every apprenticeship way in, for the panel summary.
  const [liveTotal, setLiveTotal] = useState({ loading: true, count: 0, capped: false });
  useEffect(() => {
    let cancelled = false;
    if (!open || !liveVacancies) { setLiveTotal({ loading: false, count: 0, capped: false }); return undefined; }
    const withLars = standardRoutes.filter((r) => r.standardLarsCode);
    if (!withLars.length) { setLiveTotal({ loading: false, count: 0, capped: false }); return undefined; }
    setLiveTotal((st) => ({ ...st, loading: true }));
    (async () => {
      let total = 0; let capped = false;
      for (const r of withLars) {
        const d = await fetchRouteVacancies(r.standardLarsCode, r.standardName || r.pathway);
        if (d && typeof d.count === 'number') { total += d.count; if (d.countCapped) capped = true; }
      }
      if (!cancelled) setLiveTotal({ loading: false, count: total, capped });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, liveVacancies, pathway]);
  // Plain-English "How you get in" summary covering EVERY way in this pathway has
  // (apprenticeship, college / T Level, and on-the-job routes), not just one.
  const entrySummary = useMemo(() => {
    const appr = routes.filter((r) => !r.isCourseRoute && ['Apprenticeship', 'DegAppr', 'NonDegAppr'].includes(String(r.routeType)));
    const college = routes.filter((r) => r.isCourseRoute || r.routeType === 'College' || r.routeType === 'TLevel');
    const work = routes.filter((r) => ['Professional', 'BuildYourOwn', 'Direct', 'DirectEntry', 'Cadetship'].includes(String(r.routeType)));
    const clauses = [];
    if (appr.length) {
      const nums = appr.map((r) => Number(String(r.standardLevel || '').replace(/[^0-9]/g, ''))).filter((n) => n > 0);
      let c = 'an apprenticeship, where you work, earn a wage and train at the same time';
      if (nums.length) {
        const lo = Math.min(...nums); const hi = Math.max(...nums);
        c += lo === hi ? ` (Level ${lo})` : ` (Levels ${lo} to ${hi})`;
      }
      if (appr.some((r) => r.deliversDegree)) c += ', including degree apprenticeships with no tuition fees';
      clauses.push(c);
    }
    if (college.length) clauses.push('a college course such as a T Level or a Level 3 diploma');
    if (work.length) {
      const t = new Set(work.map((r) => r.routeType));
      if (t.has('Professional')) clauses.push('starting in a role and qualifying through a professional body');
      else if (t.has('Cadetship')) clauses.push('a sponsored cadetship');
      else if (t.has('BuildYourOwn')) clauses.push('building your own experience or venture');
      else clauses.push('direct entry into a job, training as you go');
    }
    if (!clauses.length) return 'You get in by applying to an employer or programme and training on the job.';
    const joined = clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, -1).join(', ')} or ${clauses[clauses.length - 1]}`;
    return `You can get in through ${joined}.`;
  }, [routes]);

  return (
    <div className={`pathway-role-item nu-pathway-card ${open ? 'is-open' : ''}`}>
      <button type="button" className="pathway-role-item__toggle" onClick={onToggle} aria-expanded={open}>
        <div className="pathway-role-item__topline pathway-role-item__topline--split">
          <div className="pathway-role-item__title-wrap">
            {Icon ? <span className="pathway-role-item__icon" aria-hidden="true">{Icon}</span> : null}
            <span className="nu-title-col">
              <span className="pathway-role-item__title">{pathway}</span>
            </span>
          </div>
          <div className="pathway-role-item__right">
            {band ? <SignalBadge label={/match$/i.test(band) ? band : `${band} match`} /> : null}
            {!open && reaction === 'like' ? (
              <span className="cdna-saved-mark" aria-label="Saved to favourites" title="Saved to favourites"><BookmarkSimple size={18} weight="fill" aria-hidden="true" /></span>
            ) : null}
            <span className="pathway-role-item__chevron">
              <svg className={`selection-chevron ${open ? 'is-open' : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </div>
        </div>
      </button>

      {open ? (
        <div className="pathway-role-item__body">
          {/* 2x2 grid, mirroring the University degree card. */}
          <div className="nu-grid2">
            <div className="fs-degree-section">
              <span className="fs-degree-section__label"><BookOpen size={14} weight="bold" aria-hidden="true" /> What you&rsquo;d do</span>
              <p className="pathway-role-item__summary">{whatYouDo || about}</p>
            </div>
            <div className="fs-degree-section">
              <span className="fs-degree-section__label"><UsersThree size={14} weight="bold" aria-hidden="true" /> Who it suits</span>
              <p className="pathway-role-item__summary">{whoItSuits || 'People who prefer learning by doing and want to earn while they train.'}</p>
            </div>
            <div className="fs-degree-section nu-span2">
              <span className="fs-degree-section__label"><Compass size={14} weight="bold" aria-hidden="true" /> Where it leads</span>
              <p className="nu-roles-intro">The jobs this pathway typically leads to. These are the titles you would see in real job postings once you are qualified.</p>
              {roles.length ? (
                <div className="nu-roles">
                  {shownRoles.map((r, i) => <span className="nu-role-chip" key={i}>{r}</span>)}
                  {roles.length > ROLE_LIMIT ? (
                    <button type="button" className="nu-roles-more" onClick={() => setShowAllRoles((v) => !v)}>
                      {showAllRoles ? 'Show fewer' : `+${roles.length - ROLE_LIMIT} more`}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="pathway-role-item__summary">A range of skilled roles across this field.</p>
              )}
            </div>
            <div className="fs-degree-section nu-wayin-cell nu-span2">
              <button type="button" className="nu-wayin-box" onClick={() => setWaysOpen(true)}>
                <span className="nu-wayin-box__label"><Briefcase size={14} weight="bold" aria-hidden="true" /> Ways in &amp; live openings</span>
                {(() => {
                  const chips = waysInChips(routes);
                  return chips.length ? (
                    <div className="nu-wayin-dots" aria-label="Ways in">
                      {chips.map((c) => (
                        <span className="nu-wayin-dot" key={c}>
                          <span className="nu-wayin-dot__dot" style={{ background: WAYIN_DOT[c].c }} aria-hidden="true" />
                          {WAYIN_DOT[c].label}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
                <p className="nu-wayin-box__intro">{entrySummary}</p>
                <div className="nu-wayin-box__foot">
                  <div className="nu-wayin-box__stats">
                    <span className="nu-wayin-box__stat">
                      <GraduationCap size={14} weight="bold" aria-hidden="true" /> {waysCount} {waysCount === 1 ? 'way in' : 'ways in'}
                    </span>
                    {liveVacancies ? (
                      liveTotal.loading ? (
                        <span className="nu-wayin-box__stat nu-wayin-box__stat--muted">Checking for live openings&hellip;</span>
                      ) : liveTotal.count > 0 ? (
                        <span className="nu-wayin-box__stat nu-wayin-box__stat--live">
                          <span className="nu-vac-dot" aria-hidden="true" /> {liveTotal.count}{liveTotal.capped ? '+' : ''} live apprenticeship {liveTotal.count === 1 ? 'opening' : 'openings'}
                        </span>
                      ) : (
                        <span className="nu-wayin-box__stat nu-wayin-box__stat--muted">No live apprenticeship openings</span>
                      )
                    ) : null}
                  </div>
                  <span className="nu-wayin-box__go">See the ways in <span aria-hidden="true">→</span></span>
                </div>
              </button>
            </div>
          </div>

          {waysOpen ? (
            <div
              className="cw-def-modal cw-def-modal--wayin"
              role="dialog"
              aria-modal="true"
              aria-label={`Ways in for ${pathway}`}
              onClick={(e) => { if (e.target === e.currentTarget) setWaysOpen(false); }}
            >
              <div className="cw-def-modal__box">
                <div className="cw-def-modal__head">
                  <span className="cw-def-modal__title">Ways in</span>
                  <button type="button" className="cw-def-modal__close" aria-label="Close" onClick={() => setWaysOpen(false)}>×</button>
                </div>
                <div className="cw-def-modal__body nu-wayin-list-modal">
                  <p className="nu-wayin-list-intro">Select one to see the level, what you come out with and how to apply.{liveVacancies ? ' Live apprenticeship openings come from the government\u2019s Find an Apprenticeship service and refresh regularly.' : ''}</p>
                  <div className="nu-standards">
                    {sortedRoutes.map((r, i) => {
                      const sid = `apprenticeship:${r.standardLarsCode || r.standardName || r.occupation || ''}`;
                      return (
                        <StandardRow
                          key={r.standardCode || r.occupation || i}
                          route={r}
                          liveVacancies={liveVacancies}
                          showTitle={true}
                          reaction={savedReactions[sid] || ''}
                          onReact={onStandardReact ? (next) => onStandardReact(r, next) : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
                <button type="button" className="cw-def-modal__done" onClick={() => setWaysOpen(false)}>Close</button>
              </div>
            </div>
          ) : null}



          <PathwayReactionRow
            reaction={reaction}
            onReact={(next) => { if (onReact) onReact(next); }}
            label="Pathway feedback"
          />
        </div>
      ) : null}
    </div>
  );
}

// Group an array of routes into [{ pathway, routes }] preserving first-seen order.
function groupByPathway(routes) {
  const map = new Map();
  for (const r of routes) {
    const key = r.pathway || 'Other routes';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return Array.from(map.entries()).map(([pathway, group]) => ({ pathway, routes: group }));
}

export default function NonUniversityPanel({ likedWorlds = [], likedPathwayTitles = [], savedReactions = {}, onItemReaction, pathwayBands = {} }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(() => peekNonUniRoutes());
  const [activeKey, setActiveKey] = useState('');
  const [openKey, setOpenKey] = useState('');
  const [workFilter, setWorkFilter] = useState(emptyFilter());
  const [showOther, setShowOther] = useState(false);
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const hasSelectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (peekNonUniRoutes()) { setData(peekNonUniRoutes()); return; }
      setLoading(true); setError('');
      try {
        const d = await fetchNonUniRoutes();
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load non-university routes right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Delegated white floating tooltips for the like/dislike buttons (matches other tabs).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const getTarget = (e) => (e.target instanceof Element ? e.target.closest('[data-selection-tooltip="true"]') : null);
    let suppressUntil = 0; let autoHide = null;
    const onOver = (e) => { if (Date.now() < suppressUntil) return; const t = getTarget(e); if (t instanceof HTMLElement) showSelectionTooltip(t); };
    const onOut = (e) => { const t = getTarget(e); if (t instanceof HTMLElement) hideSelectionTooltip(); };
    const onClick = (e) => {
      const t = getTarget(e); if (t instanceof HTMLElement) showSelectionTooltip(t, { pinned: true });
    };
    root.addEventListener('pointerover', onOver); root.addEventListener('pointerout', onOut);
    root.addEventListener('focusin', onOver); root.addEventListener('focusout', onOut); root.addEventListener('click', onClick);
    window.addEventListener('scroll', hideSelectionTooltip, { passive: true }); window.addEventListener('resize', hideSelectionTooltip);
    return () => {
      root.removeEventListener('pointerover', onOver); root.removeEventListener('pointerout', onOut);
      root.removeEventListener('focusin', onOver); root.removeEventListener('focusout', onOut); root.removeEventListener('click', onClick);
      window.removeEventListener('scroll', hideSelectionTooltip); window.removeEventListener('resize', hideSelectionTooltip);
      if (autoHide) clearTimeout(autoHide); hideSelectionTooltip();
    };
  }, []);

  // Only show routes a school leaver can actually START. Senior / experienced-
  // worker standards (need a degree or years of experience first) are tagged
  // entryStage:'progression' in the data and hidden here; pathways left with no
  // starting route simply don't appear (they're degree-first — see Uni Routes).
  const routes = useMemo(() => {
    const all = (data && Array.isArray(data.routes)) ? data.routes : [];
    return all.filter((r) => r.entryStage !== 'progression');
  }, [data]);
  const liveVacancies = !!(data && data.liveVacancies);

  // Key off the career worlds the student liked (same as Further Study). Within a
  // world, pathways the student also liked are highlighted first.
  const likedPathwaySet = useMemo(() => new Set(likedPathwayTitles), [likedPathwayTitles]);
  const worldTitles = useMemo(
    () => likedWorlds.map((w) => (typeof w === 'string' ? w : w.title)).filter(Boolean),
    [likedWorlds]
  );
  // Academic worlds the student liked that have any non-university route (exclude
  // the vocational worlds, which are shown in their own group below).
  // Order the selected world pills by match strength (Standout first).
  const worldBandRank = (wt) => bandRank((likedWorlds || []).find((w) => String(w?.title || '') === wt)?.signalLabel);
  const academicWorlds = useMemo(
    () => worldTitles
      .filter((wt) => !VOCATIONAL_WORLDS.includes(wt) && routes.some((r) => r.careerWorld === wt))
      .sort((a, b) => worldBandRank(b) - worldBandRank(a)),
    [worldTitles, routes, likedWorlds]
  );
  // Vocational worlds the student liked (in the "Explore other career worlds"
  // list). Only surface the ones they actually liked, so this stays personalised.
  const vocationalWorlds = useMemo(
    () => VOCATIONAL_WORLDS
      .filter((w) => worldTitles.includes(w) && routes.some((r) => r.careerWorld === w))
      .sort((a, b) => worldBandRank(b) - worldBandRank(a)),
    [worldTitles, routes, likedWorlds]
  );
  const allWorlds = useMemo(
    () => [...academicWorlds, ...vocationalWorlds],
    [academicWorlds, vocationalWorlds]
  );

  useEffect(() => {
    // Collapse open items when switching, but do NOT auto-scroll the page — the
    // selected item can change on its own as data settles, which was yanking the
    // page down on arrival.
    setOpenKey('');
    setShowOther(false);
    hasSelectedRef.current = true;
  }, [activeKey]);

  useEffect(() => {
    setActiveKey((prev) => (allWorlds.includes(prev) ? prev : allWorlds[0] || ''));
  }, [allWorlds]);

  const handleReact = (pathway, next) => {
    const id = `nonuni:${pathway}`;
    if (!pathway || typeof onItemReaction !== 'function') return;
    const current = savedReactions[id] || '';
    // Store the pathway (and its world) with the like, so unliking either
    // offers to clear this route too.
    const world = (data?.routes || []).find((r) => r.pathway === pathway)?.careerWorld || '';
    onItemReaction({
      itemType: 'nonuni_pathway', itemId: id, itemTitle: pathway, reaction: next, remove: current === next,
      itemMeta: { pathwayTitle: pathway, ...(world ? { careerWorldTitle: world } : {}) },
    });
  };

  // Save/unsave a single apprenticeship standard (one "way in") to favourites.
  // Stored under item_type 'apprenticeship' so it shows in its own favourites
  // group and can be counted in stats separately from the pathway-level likes.
  const handleStandardReact = (route, next) => {
    if (typeof onItemReaction !== 'function') return;
    const key = route.standardLarsCode || route.standardName || route.occupation || '';
    if (!key) return;
    const id = `apprenticeship:${key}`;
    const title = route.standardName || route.occupation || route.route || route.pathway || 'Apprenticeship';
    const current = savedReactions[id] || '';
    onItemReaction({
      itemType: 'apprenticeship', itemId: id, itemTitle: title, reaction: next, remove: current === next,
      itemMeta: { pathwayTitle: route.pathway || '', ...(route.careerWorld ? { careerWorldTitle: route.careerWorld } : {}) },
    });
  };

  const activeWorld = allWorlds.includes(activeKey) ? activeKey : allWorlds[0] || '';
  const worldRoutes = useMemo(
    () => routes.filter((r) => r.careerWorld === activeWorld),
    [routes, activeWorld]
  );
  // Group into one card per pathway; liked pathways first.
  const groups = useMemo(() => groupByPathway(worldRoutes), [worldRoutes]);
  // Match band for the active world, shown as a pill in the header (like Pathways).
  const activeWorldBand = (likedWorlds || []).find((w) => String(w?.title || '') === activeWorld)?.signalLabel || '';
  const activeWorldBandLabel = activeWorldBand
    ? (/match$/i.test(activeWorldBand) ? activeWorldBand : `${activeWorldBand} match`)
    : '';
  const relevantGroupsAll = groups.filter((g) => likedPathwaySet.has(g.pathway));
  const otherGroupsAll = groups.filter((g) => !likedPathwaySet.has(g.pathway));
  // Favourites filter: only the training/work pathways the student has liked here.
  const isNonUniLiked = (g) => savedReactions[`nonuni:${g.pathway}`] === 'like';
  const relevantGroups = applyResultsFilter(relevantGroupsAll, workFilter, { isLiked: isNonUniLiked });
  const otherGroups = applyResultsFilter(otherGroupsAll, workFilter, { isLiked: isNonUniLiked });
  const pbRank = (g) => bandRank(pathwayBands[g.pathway]);
  relevantGroups.sort((a, b) => pbRank(b) - pbRank(a));
  otherGroups.sort((a, b) => pbRank(b) - pbRank(a));

  const renderCard = (group) => {
    const id = `nonuni:${group.pathway}`;
    return (
      <PathwayCard
        key={group.pathway}
        pathway={group.pathway}
        routes={group.routes}
        open={openKey === group.pathway}
        onToggle={() => setOpenKey((prev) => (prev === group.pathway ? '' : group.pathway))}
        reaction={savedReactions[id] || ''}
        onReact={(next) => handleReact(group.pathway, next)}
        liveVacancies={liveVacancies}
        band={pathwayBands[group.pathway] || ''}
        savedReactions={savedReactions}
        onStandardReact={handleStandardReact}
      />
    );
  };

  return (
    <section className="selection-explorer" ref={rootRef}>
      <div className="selection-explorer__intro selection-explorer__intro--active">
        <h2>Your training &amp; work routes</h2>
        <p className="selection-explorer__intro-text">
          Ways into a career that do not need a university degree. With an apprenticeship you have a real job, get paid,
          and train at the same time, so you earn while you learn instead of paying tuition fees. Some even include a
          full, funded university degree. Pick a career world you liked to see the ways in, what you would do, and where
          each one leads. Each one shows how advanced it is, the qualification you come out with, and what you need to start.
        </p>
      </div>

      {loading ? (
        <p className="fs-none">Finding your non-university routes&hellip;</p>
      ) : error ? (
        <p className="fs-error">{error}</p>
      ) : allWorlds.length ? (
        <div className="selection-explorer__layout selection-explorer__layout--stacked">
          <div className="selection-explorer__selector-select-wrap">
            <OptionDropdown
              options={allWorlds.map((w) => ({ key: w, title: w }))}
              activeKey={activeWorld}
              onSelect={setActiveKey}
            />
          </div>
          <div className="selection-explorer__selector-tabs" role="tablist" aria-label="Career worlds and vocational routes">
            {academicWorlds.map((w) => (
              <button
                key={w}
                type="button"
                role="tab"
                className={`selection-list-button ${w === activeWorld ? 'is-active' : ''}`}
                onClick={() => setActiveKey(w)}
              >
                <span className="selection-list-button__title">{w}</span>
              </button>
            ))}
            {vocationalWorlds.length ? (
              <div className="nu-voc-label">No degree needed</div>
            ) : null}
            {vocationalWorlds.map((w) => (
              <button
                key={w}
                type="button"
                role="tab"
                className={`selection-list-button ${w === activeWorld ? 'is-active' : ''}`}
                onClick={() => setActiveKey(w)}
              >
                <span className="selection-list-button__title">{w}</span>
              </button>
            ))}
          </div>

          <div ref={mainRef} className="selection-explorer__main selection-explorer__main--full">
            {activeWorld ? (
              <article className="selection-detail-card">
                <div className="selection-definition-card__header">
                  <SelectionTitle item={{ title: activeWorld, type: 'career_world' }} />
                  {activeWorldBandLabel ? (
                    <div className="selection-detail-card__signal-wrap"><SignalBadge label={activeWorldBandLabel} /></div>
                  ) : null}
                </div>
                {groups.length ? (
                  <div className="selection-explorer__toolbar">
                    <ResultsFilterBar filter={workFilter} onChange={setWorkFilter} groups={['favourites']} />
                  </div>
                ) : null}
                {!groups.length ? (
                  <p className="fs-none">No non-university routes mapped for this world yet.</p>
                ) : (!relevantGroups.length && !otherGroups.length) ? (
                  <p className="results-filter-empty">None of your favourites are in this world. Try clearing the filter.</p>
                ) : relevantGroups.length ? (
                  <>
                    <div className="fs-detail-heading">Ways in for the pathways you liked</div>
                    <div className="pathway-role-list">{relevantGroups.map(renderCard)}</div>
                    {otherGroups.length ? (
                      <>
                        <button
                          type="button"
                          className="nu-show-other"
                          onClick={() => setShowOther((v) => !v)}
                          aria-expanded={showOther}
                        >
                          {showOther ? 'Hide' : 'Show'} other pathways in this career world ({otherGroups.length})
                        </button>
                        {showOther ? (
                          <div className="pathway-role-list">{otherGroups.map(renderCard)}</div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="fs-detail-heading">Ways into this career world</div>
                    <div className="pathway-role-list">{otherGroups.map(renderCard)}</div>
                  </>
                )}
              </article>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="nu-empty-hint">
          Like the career worlds you&rsquo;re drawn to in the Career Worlds tab, including the vocational ones
          under &ldquo;Explore other career worlds&rdquo;, to see their non-university routes.
        </p>
      )}
    </section>
  );
}
