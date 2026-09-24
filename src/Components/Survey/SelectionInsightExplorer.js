import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SelectionInsightExplorer.css';
import ResultsFilterBar, { applyResultsFilter, emptyFilter, bandRank } from './ResultsFilter';
import { CAREER_WORLD_DEFINITIONS, PATHWAY_DEFINITIONS } from '../../utils/selectionDefinitions';
import { ARCHETYPE_DEFINITIONS, getArchetypeDefinition } from '../../utils/archetypeDefinitions';
import SUBDIMENSION_DEFINITIONS from '../../utils/subdimensionDefinitions';
import DIMENSIONS from '../../utils/Dimensions';
import { getCareerWorldIcon, getPathwayIcon } from '../../utils/iconMap';
import { fetchNonUniRoutes, peekNonUniRoutes } from '../../utils/fetchNonUniRoutes';
import { fetchGradJobs } from '../../utils/fetchGradJobs';
import { entryRouteForCard } from '../../utils/entryRouteModes';
import { ThumbsUp, ThumbsDown, Smiley, SmileyMeh, BookmarkSimple, Heart, Info, Briefcase, Signpost, UsersThree, TrendUp, MapPin, GraduationCap, CalendarBlank, CurrencyGbp, Rocket } from 'phosphor-react';
import { getSavedIds, setItemReaction } from '../../utils/savedItems';
import {
  FaBrain,
  FaBullseye,
  FaCompass,
  FaLightbulb,
  FaTasks,
  FaPalette,
  FaUsers,
  FaStar,
  FaBriefcase,
  FaHandPaper,
  FaSearchPlus,
  FaUser,
  FaShieldAlt,
  FaRegComment,
  FaThLarge,
  FaRegStar,
  FaBullhorn,
  FaRocket,
  FaHandsHelping,
  FaChartLine,
  FaHome,
  FaCrosshairs,
  FaDice,
  FaHeart,
  FaMedal,
  FaQuestionCircle,
  FaTachometerAlt,
  FaUserFriends,
  FaMoon,
  FaComments,
  FaClipboardCheck,
  FaProjectDiagram,
  FaSeedling,
  FaBalanceScale,
  FaGlobe,
  FaBolt,
  FaPuzzlePiece,
  FaHandshake,
  FaBookOpen,
  FaClock,
  FaFeatherAlt,
} from 'react-icons/fa';

// Stable id for a saved job advert (prefer the apply URL; fall back to title+employer).
function jobKey(job) {
  return `job:${job.url || `${job.title || ''}|${job.employer || ''}`}`;
}

// Normalise a pathway title for joining across the scored pathways (from the
// report) and the non-university route list (from the register).
const normPathwayTitle = (s) => String(s || '').trim().toLowerCase();

const ARCHETYPE_ICON_MAP = {
  creator: FaPalette,
  thinker: FaQuestionCircle,
  achiever: FaBullseye,
  visionary: FaLightbulb,
  explorer: FaCompass,
  organizer: FaTasks,
  connector: FaUsers,
};

const TRAIT_ICON_MAP = {
  handsonengagement: FaHandPaper,
  investigativecuriosity: FaSearchPlus,
  independentworkingapproach: FaUser,
  reliabilityandfocus: FaShieldAlt,
  reliabilityfocus: FaShieldAlt,
  curiosityandopenness: FaRegComment,
  curiosityopenness: FaRegComment,
  clarityandstructurepreference: FaThLarge,
  claritystructurepreference: FaThLarge,
  noveltyandvarietyseeking: FaRegStar,
  noveltyvarietyseeking: FaRegStar,
  creativeexpression: FaPalette,
  recognitionandvisibility: FaBullhorn,
  recognitionvisibility: FaBullhorn,
  entrepreneurialdrive: FaRocket,
  helpingandserviceorientation: FaHandsHelping,
  helpingserviceorientation: FaHandsHelping,
  socialimpactandpurpose: FaHeart,
  socialimpactpurpose: FaHeart,
  stabilityandpredictability: FaHome,
  stabilitypredictability: FaHome,
  financialambition: FaChartLine,
  risktolerance: FaDice,
  attentiontodetail: FaCrosshairs,
  organisationandsystemsorientation: FaTasks,
  perseverance: FaMedal,
};

const TRAIT_FALLBACK_ICONS = [
  FaTachometerAlt,
  FaUserFriends,
  FaMoon,
  FaComments,
  FaClipboardCheck,
  FaProjectDiagram,
  FaSeedling,
  FaBalanceScale,
  FaGlobe,
  FaBolt,
  FaPuzzlePiece,
  FaHandshake,
  FaBookOpen,
  FaClock,
  FaFeatherAlt,
  FaHeart,
  FaChartLine,
  FaBullhorn,
  FaRocket,
  FaDice,
];

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function compactKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}


function definitionLookupKey(value) {
  return compactKey(value);
}

function buildSubdimensionLabelToKeyMap(dimensions = []) {
  const map = Object.create(null);
  const list = Array.isArray(dimensions) ? dimensions : Object.values(dimensions || {});

  list.forEach((dimension) => {
    (dimension?.subdimensions || []).forEach((subdimension) => {
      const label = String(subdimension?.label || '').trim();
      const key = String(subdimension?.key || '').trim();
      if (!label || !key) return;
      map[definitionLookupKey(label)] = key;
      map[definitionLookupKey(key)] = key;
    });
  });

  return map;
}

const SUBDIMENSION_LABEL_TO_KEY = {
  ...buildSubdimensionLabelToKeyMap(DIMENSIONS),

  // Backward-compatible aliases used by career world/pathway data.
  reliabilityandfocus: 'conscientiousness',
  perseverance: 'gritPersistence',
  helpingandserviceorientation: 'helpingOrientation',
  socialimpactandpurpose: 'purposeImpact',
  independenceandautonomy: 'autonomyControl',
  independentworkingapproach: 'guidanceVsSelfDirection',
  stabilityandpredictability: 'securityPredictability',
  teamcollaboration: 'soloVsCollaborativeWorking',
  orderandstructure: 'orderSystemsOrientation',
  organisationandsystemsorientation: 'orderSystemsOrientation',
  clarityandstructurepreference: 'structureClarityPreference',
  attentiontodetail: 'taskFocusDetail',
};

function cleanSubdimensionDefinitionForSelectionInsights(text = '') {
  let out = String(text || '').trim();
  if (!out) return '';

  // Discover More tooltips should define the trait only. The full Dimensions
  // Carousel can keep the archetype-linking sentences.
  out = out
    .replace(/,?\s*(typical of|traits of|hallmarks of|central to|common in|consistent with|associated with|aligning with|aligned with|linked to|reflecting the mindset of)\s+[^.]+\./gi, '.')
    .replace(/\s*Higher scores (indicate|show|mean|reflect)\s+[^.]*?(typical of|traits of|hallmarks of|central to|common in|consistent with|associated with|aligning with|aligned with|linked to|reflecting the mindset of)\s+[^.]+\./gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.\./g, '.')
    .trim();

  return out;
}

// SUBDIMENSION_DEFINITIONS is keyed by the human label ("Analytical Curiosity"),
// but chip names may arrive as labels OR camelCase keys. Index the definitions by
// their compact key so either form resolves.
const SUBDIMENSION_DEFINITION_BY_COMPACT = Object.create(null);
Object.keys(SUBDIMENSION_DEFINITIONS).forEach((defKey) => {
  SUBDIMENSION_DEFINITION_BY_COMPACT[definitionLookupKey(defKey)] = SUBDIMENSION_DEFINITIONS[defKey];
});

function getSubdimensionDefinition(label = '') {
  const lookup = definitionLookupKey(label);
  // 1) direct match against a definition's own (compacted) label
  let raw = SUBDIMENSION_DEFINITION_BY_COMPACT[lookup];
  // 2) resolve aliases / keys to the canonical key, then match that
  if (!raw) {
    const key = SUBDIMENSION_LABEL_TO_KEY[lookup] || lookup;
    raw = SUBDIMENSION_DEFINITIONS[key] || SUBDIMENSION_DEFINITION_BY_COMPACT[definitionLookupKey(key)] || '';
  }
  return cleanSubdimensionDefinitionForSelectionInsights(raw || '');
}

function getDefinitionForChip(label = '', kind = 'archetype') {
  if (kind === 'archetype') return getArchetypeDefinition(label) || ARCHETYPE_DEFINITIONS[label] || '';
  return getSubdimensionDefinition(label);
}

function getSelectionDefinition(item = {}) {
  const id = String(item?.sourceId || item?.id || '').trim();
  const titleKey = definitionLookupKey(item?.title || '');
  const source = item?.isCareerWorld || item?.type === 'career_world'
    ? CAREER_WORLD_DEFINITIONS
    : item?.isPathway || item?.type === 'pathway' || item?.type === 'role'
      ? PATHWAY_DEFINITIONS
      : null;

  if (!source) return null;
  if (id && source[id]) return source[id];

  return Object.values(source).find((entry) => definitionLookupKey(entry?.title || '') === titleKey) || null;
}

function getTraitIcon(key) {
  const normalized = compactKey(key);
  if (TRAIT_ICON_MAP[normalized]) return TRAIT_ICON_MAP[normalized];
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) >>> 0;
  }
  return TRAIT_FALLBACK_ICONS[hash % TRAIT_FALLBACK_ICONS.length] || FaRegStar;
}

function sortSubdimensions(list = []) {
  const tierRank = { core: 0, signature: 0, fallback: 1, secondary: 2, modifier: 3 };
  return [...list].sort((a, b) => {
    const stateRank = { full: 0, mid: 1, grey: 2 };
    const stateDiff = (stateRank[a?.state] ?? 9) - (stateRank[b?.state] ?? 9);
    if (stateDiff !== 0) return stateDiff;
    const tierDiff = (tierRank[a?.tier] ?? 9) - (tierRank[b?.tier] ?? 9);
    if (tierDiff !== 0) return tierDiff;
    const scoreDiff = Number(b?.userScore || 0) - Number(a?.userScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });
}

function sortArchetypes(list = []) {
  const stateRank = { full: 0, mid: 1, grey: 2 };
  return [...list].sort((a, b) => {
    const stateDiff = (stateRank[a?.state] ?? 9) - (stateRank[b?.state] ?? 9);
    if (stateDiff !== 0) return stateDiff;
    const scoreDiff = Number(b?.userScore || 0) - Number(a?.userScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });
}

function getArchetypeBand(score = 0) {
  if (score >= 80) return 'Standout';
  if (score >= 66) return 'Strong';
  if (score >= 54) return 'Good';
  return 'Lower';
}

function getSubdimensionBand(score = 0) {
  if (score >= 70) return 'Standout';
  if (score >= 60) return 'Strong';
  if (score >= 50) return 'Good';
  return 'Lower';
}

// Friendly, tier-aware label (used in tooltips).
function bandDisplayLabel(band = '') {
  switch (band) {
    case 'Standout': return 'Standout match';
    case 'Strong': return 'Strong match';
    case 'Good': return 'Good match';
    default: return 'Lower';
  }
}

// Short tier word shown inside each pill (no "match").
function bandTierWord(band = '') {
  switch (band) {
    case 'Standout': return 'STANDOUT';
    case 'Strong': return 'STRONG';
    case 'Good': return 'GOOD';
    default: return 'LOWER';
  }
}

// CSS tier key for pill colouring (Palette 2: green / teal / blue / grey).
function bandTierKey(band = '') {
  switch (band) {
    case 'Standout': return 'top';
    case 'Strong': return 'strong';
    case 'Good': return 'good';
    default: return 'lower';
  }
}

function bandToVisualState(band = '') {
  if (band === 'Standout' || band === 'Strong') return 'full';
  if (band === 'Good') return 'mid';
  return 'grey';
}

function getAlignedTraitCount(values = []) {
  return values.filter((x) => getSubdimensionBand(Number(x?.userScore || 0)) !== 'Lower').length;
}

function getAlignedArchetypeCount(values = []) {
  return values.filter((x) => getArchetypeBand(Number(x?.userScore || 0)) !== 'Lower').length;
}

function isPrimaryTrait(token = {}) {
  const tier = String(token?.tier || '').trim().toLowerCase();
  return !tier || tier === 'core' || tier === 'signature' || tier === 'primary';
}

function TraitChipGroup({ title, traits = [], itemId = '' }) {
  if (!traits.length) return null;

  return (
    <div className="selection-trait-group">
      <div className="selection-trait-group__label">{title}</div>
      <div className="selection-chip-grid selection-chip-grid--traits">
        {traits.map((token) => {
          const IconComponent = getTraitIcon(token?.name);
          return (
            <SelectionChip
              key={`t-${itemId}-${title}-${token?.name}`}
              label={token?.name}
              score={token?.userScore}
              icon={IconComponent}
              kind="trait"
            />
          );
        })}
      </div>
    </div>
  );
}

function normaliseMatchLabel(raw = '') {
  const value = String(raw || '').trim();
  if (!value) return '';
  return /match$/i.test(value) ? value : `${value} match`;
}

function bandFromPct(pct = 0) {
  const score = Number(pct) || 0;
  if (score >= 80) return 'Standout';
  if (score >= 66) return 'Strong';
  if (score >= 54) return 'Good';
  return 'Lower';
}

function bandKey(label = '') {
  const k = String(label || '').toLowerCase();
  if (k.includes('standout')) return 'standout';
  if (k.includes('strong')) return 'strong';
  if (k.includes('good')) return 'good';
  if (k.includes('lower')) return 'lower';
  return '';
}

function blocksFromBand(band = '') {
  const key = String(band || '').toLowerCase();
  if (key === 'standout') return 4;
  if (key === 'strong') return 3;
  if (key === 'good') return 2;
  if (key === 'lower') return 1;
  return 0;
}

function buildMatchSignal(item = {}, fallbackPct = 0) {
  const rawLabel = String(item?.signalLabel || '').trim();
  const explicitBlocks = Number(item?.signalBlocks || 0);

  if (rawLabel) {
    return {
      label: normaliseMatchLabel(rawLabel),
      blocks: explicitBlocks || blocksFromBand(rawLabel),
    };
  }

  const pctCandidates = [item?.signalPct, item?.fitPct, item?.coveragePct, fallbackPct]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!pctCandidates.length) return { label: '', blocks: 0 };

  const band = bandFromPct(pctCandidates[0]);
  return {
    label: normaliseMatchLabel(band),
    blocks: explicitBlocks || blocksFromBand(band),
  };
}

export function getMatchTooltipBody(label = '') {
  const key = String(label || '').toLowerCase().replace(/\s+match$/, '').trim();

  if (key === 'standout') {
    return 'Very high alignment between your CareerDNA profile and this option.';
  }

  if (key === 'strong') {
    return 'Clear alignment between your CareerDNA profile and this option.';
  }

  if (key === 'good') {
    return 'Some meaningful alignment, but not across every part of your profile.';
  }

  if (key === 'lower') {
    return 'Less overlap with your strongest CareerDNA patterns.';
  }

  return 'Shows how closely this option fits your CareerDNA profile.';
}


function escapeTooltipHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getOrCreateSelectionTooltip() {
  let el = document.querySelector('.selection-floating-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.className = 'selection-floating-tooltip';
    document.body.appendChild(el);
  }
  return el;
}

// Pin state: when a tooltip is opened by CLICK it becomes "pinned" — it stays
// open (ignoring hover-out / scroll) until the user presses ×, clicks outside,
// or hits Escape, matching the click-to-open definition boxes elsewhere.
let _tipPinned = false;
let _tipCleanup = null;
function _teardownPin() {
  if (_tipCleanup) { _tipCleanup(); _tipCleanup = null; }
  _tipPinned = false;
}

export function hideSelectionTooltip(opts) {
  const force = !!(opts && opts.force === true);
  if (_tipPinned && !force) return; // a pinned tooltip ignores hover-out / scroll
  const el = document.querySelector('.selection-floating-tooltip');
  if (el) { el.style.opacity = '0'; el.classList.remove('is-pinned'); }
  _teardownPin();
}

export function showSelectionTooltip(target, opts) {
  if (!(target instanceof HTMLElement)) return;
  const pin = !!(opts && opts.pinned === true);
  // While a tooltip is pinned open, ignore hover-driven shows so it stays put.
  if (_tipPinned && !pin) return;

  const title = target.getAttribute('data-tooltip-title') || '';
  const body = target.getAttribute('data-tooltip-body') || target.getAttribute('data-tooltip') || '';
  if (!title && !body) return;

  // Any previous pin is replaced by this show.
  _teardownPin();

  const el = getOrCreateSelectionTooltip();
  el.classList.remove('is-pinned');
  el.innerHTML =
    `${pin ? '<button type="button" class="selection-floating-tooltip__close" aria-label="Close">×</button>' : ''}` +
    `${title ? `<span class="selection-floating-tooltip__headline">${escapeTooltipHtml(title)}</span>` : ''}` +
    `${body ? `<span class="selection-floating-tooltip__body">${escapeTooltipHtml(body)}</span>` : ''}`;

  const rect = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const padding = 12;
  const gap = 10;

  el.style.opacity = '0';
  el.style.left = '0px';
  el.style.top = '0px';

  const tooltipWidth = el.offsetWidth || 240;
  const tooltipHeight = el.offsetHeight || 80;

  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));

  let top = rect.top - tooltipHeight - gap;
  if (top < padding) top = rect.bottom + gap;
  if (top + tooltipHeight > viewportHeight - padding) {
    top = Math.max(padding, viewportHeight - tooltipHeight - padding);
  }

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.opacity = '1';

  if (pin) {
    _tipPinned = true;
    el.classList.add('is-pinned');
    const onDocDown = (e) => {
      if (el.contains(e.target)) return; // clicks inside the tooltip
      // another trigger's own click handler will re-pin it, so don't fight it
      if (e.target instanceof Element && e.target.closest('[data-selection-tooltip="true"]')) return;
      hideSelectionTooltip({ force: true });
    };
    const onKey = (e) => { if (e.key === 'Escape') hideSelectionTooltip({ force: true }); };
    const closeBtn = el.querySelector('.selection-floating-tooltip__close');
    const onClose = (e) => { e.preventDefault(); e.stopPropagation(); hideSelectionTooltip({ force: true }); };
    if (closeBtn) closeBtn.addEventListener('click', onClose);
    // Defer the outside-click listener so the opening click doesn't close it.
    const arm = setTimeout(() => document.addEventListener('mousedown', onDocDown, true), 0);
    document.addEventListener('keydown', onKey);
    _tipCleanup = () => {
      clearTimeout(arm);
      document.removeEventListener('mousedown', onDocDown, true);
      document.removeEventListener('keydown', onKey);
      if (closeBtn) closeBtn.removeEventListener('click', onClose);
    };
  }
}

// Fixed band steps: Standout = full, Strong = three quarters, Good = half,
// Lower = one quarter.
function fillFromBlocks(blocks = 0) {
  return { 4: 100, 3: 75, 2: 50, 1: 25 }[Number(blocks) || 0] || 0;
}

export function SignalBadge({ label }) {
  if (!label) return null;
  const tooltipBody = getMatchTooltipBody(label);

  // The world/detail header signal now uses the new tier pill (Palette A),
  // matching the pill labelling used throughout — not the old fill bar.
  return (
    <span
      className={`cdna-band-pill cdna-band-pill--${bandKey(label)} cdna-band-pill--header selection-detail-card__signal--has-tooltip`}
      tabIndex={0}
      aria-label={`${label}: ${tooltipBody}`}
      data-selection-tooltip="true"
      data-tooltip-title={label}
      data-tooltip-body={tooltipBody}
    >
      {label}
    </span>
  );
}

function MetricStat({ aligned = 0, total = 0, noun = '' }) {
  const safeTotal = Math.max(1, Number(total) || 0);
  const safeAligned = Math.max(0, Math.min(safeTotal, Number(aligned) || 0));
  return (
    <div className="selection-metric">
      <span className="selection-metric__ratio">{safeAligned}/{safeTotal}</span>
      <span className="selection-metric__label">{noun} match</span>
    </div>
  );
}

function SelectionChip({ label, score, icon: Icon, kind = 'archetype' }) {
  const rounded = Math.round(Number(score || 0));
  const band = kind === 'archetype' ? getArchetypeBand(rounded) : getSubdimensionBand(rounded);
  const visual = bandToVisualState(band);
  const definition = getDefinitionForChip(label, kind);
  const bandLabel = bandDisplayLabel(band);
  const tierKey = bandTierKey(band);
  const tierWord = bandTierWord(band);
  const tooltip = definition ? `${label} - ${bandLabel}: ${definition}` : `${label} - ${bandLabel}`;

  return (
    <div
      className={`selection-chip selection-chip--${visual} selection-chip--tier-${tierKey} selection-chip--${kind} selection-chip--has-tooltip`}
      tabIndex={0}
      aria-label={tooltip}
      data-selection-tooltip="true"
      data-tooltip-title={`${label} - ${bandLabel}`}
      data-tooltip-body={definition || ''}
    >
      <span className="selection-chip__icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="selection-chip__body">
        <div className="selection-chip__topline">
          <span className="selection-chip__label">{label}</span>
          <span className="selection-chip__band">{tierWord}</span>
        </div>
      </div>

    </div>
  );
}

function SegmentWheel({ filled = 0, total = 1 }) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const safeFilled = Math.max(0, Math.min(safeTotal, Number(filled) || 0));
  const cx = 22;
  const cy = 22;
  const outer = 18;
  const inner = 9;
  const gap = safeTotal > 1 ? 1.6 : 0;

  const point = (radius, angleDeg) => {
    const angle = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  };

  const wedgePath = (index) => {
    const start = (360 / safeTotal) * index + gap / 2;
    const end = (360 / safeTotal) * (index + 1) - gap / 2;
    const large = end - start > 180 ? 1 : 0;
    const [x1, y1] = point(outer, start);
    const [x2, y2] = point(outer, end);
    const [x3, y3] = point(inner, end);
    const [x4, y4] = point(inner, start);
    return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
  };

  return (
    <svg className="selection-segment-wheel" viewBox="0 0 44 44" aria-hidden="true">
      {Array.from({ length: safeTotal }, (_, idx) => (
        <path
          key={idx}
          d={wedgePath(idx)}
          className={`selection-segment-wheel__slice ${idx < safeFilled ? 'is-filled' : ''}`}
        />
      ))}
    </svg>
  );
}

function MetricTitle({ aligned = 0, total = 0, label = '' }) {
  return (
    <span className="selection-inline-metric-title selection-inline-metric-title--designed">
      <SegmentWheel filled={aligned} total={total} />
      <span className="selection-inline-metric-title__copy">
        <span className="selection-inline-metric-title__label">
          <span className="selection-inline-metric-title__ratio">{aligned} of {total}</span>{' '}
          {label ? label.charAt(0).toLowerCase() + label.slice(1) : ''}
        </span>
      </span>
    </span>
  );
}

function getDefinitionIntroText(paragraph = '', title = '', item = {}) {
  const raw = String(paragraph || '').trim();
  const cleanTitle = String(title || '').trim();
  if (!raw || !cleanTitle || !raw.toLowerCase().startsWith(cleanTitle.toLowerCase())) return raw;

  const rest = raw.slice(cleanTitle.length).trimStart();
  const isCareerWorld = Boolean(item?.isCareerWorld || item?.type === 'career_world');
  const isPathway = Boolean(item?.isPathway || item?.type === 'pathway' || item?.type === 'role');

  if (/^is\b/i.test(rest)) return `This ${rest}`;
  if (/^focuses\b/i.test(rest)) return `${isCareerWorld ? 'This career world' : isPathway ? 'This pathway' : 'This option'} ${rest}`;
  if (/^(involves|includes|brings|combines|centres|centers|covers|explores|supports|uses|helps|connects)\b/i.test(rest)) {
    return `${isCareerWorld ? 'This career world' : isPathway ? 'This pathway' : 'This option'} ${rest}`;
  }

  return rest || raw;
}

function InsightDefinitionCard({ item, definition, matchSignal }) {
  if (!definition?.paragraph) return null;

  const title = String(definition?.title || item?.title || '').trim();
  const paragraphs = String(definition?.paragraph || '')
    .split(/\n\s*\n/)
    .map((part, index) => (index === 0 ? getDefinitionIntroText(part, title, item) : part.trim()))
    .filter(Boolean);

  return (
    <div className="selection-definition-card">
      <div className="selection-definition-card__header">
        <SelectionTitle item={item} definition={definition} />
        <div className="selection-detail-card__signal-wrap">
          <SignalBadge label={matchSignal?.label} blocks={matchSignal?.blocks} pct={item?.signalPct || item?.fitPct} />
        </div>
      </div>

      <div className="selection-definition-card__body">
        {paragraphs.map((paragraph, index) => (
          <p className="selection-definition-card__text" key={`definition-paragraph-${index}`}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

export function SelectionTitle({ item, definition }) {
  const isCareerWorld = Boolean(item?.isCareerWorld || item?.type === 'career_world');
  const isPathway = Boolean(item?.isPathway || item?.type === 'pathway' || item?.type === 'role');
  const iconRenderer = isCareerWorld ? getCareerWorldIcon : isPathway ? getPathwayIcon : null;
  const IconNode = iconRenderer ? iconRenderer(definitionLookupKey(item?.title || definition?.title || '')) : null;

  return (
    <div className="selection-detail-card__title-row">
      {IconNode ? (
        <span className="selection-detail-card__title-icon" aria-hidden="true">
          {IconNode}
        </span>
      ) : null}
      <h3>{item?.title || 'Selected option'}</h3>
    </div>
  );
}


function SelectionListButton({ item, active, onClick }) {
  return (
    <button
      type="button"
      className={`selection-list-button ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <span className="selection-list-button__title">{item?.title}</span>
    </button>
  );
}

function Chevron({ open = false }) {
  return (
    <svg
      className={`selection-chevron ${open ? 'is-open' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function OptionDropdown({ options = [], activeKey = '', onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeOption = options.find((opt) => opt.key === activeKey) || options[0] || null;

  useEffect(() => {
    if (!open) return undefined;
    const handleDocClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={`selection-dropdown ${open ? 'is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="selection-dropdown__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="selection-dropdown__value">{activeOption?.title || 'Select an option'}</span>
        <span className="selection-dropdown__chevron"><Chevron open={open} /></span>
      </button>

      {open ? (
        <ul className="selection-dropdown__menu" role="listbox">
          {options.map((opt) => (
            <li key={opt.key} role="option" aria-selected={opt.key === activeKey}>
              <button
                type="button"
                className={`selection-dropdown__option ${opt.key === activeKey ? 'is-active' : ''}`}
                onClick={() => {
                  if (typeof onSelect === 'function') onSelect(opt.key);
                  setOpen(false);
                }}
              >
                {opt.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SectionAccordion({ title, children, defaultOpen = true, dividerTop = true, open: openProp, onToggle }) {
  const isControlled = typeof openProp === 'boolean';
  const [openState, setOpenState] = useState(defaultOpen);
  const open = isControlled ? openProp : openState;
  const sectionRef = useRef(null);
  const mountedRef = useRef(false);
  // When a signature accordion is opened, bring its header to the top of the view.
  useEffect(() => {
    if (open && mountedRef.current && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [open]);
  useEffect(() => {
    mountedRef.current = true;
  }, []);
  const handleToggle = () => {
    if (isControlled) {
      if (onToggle) onToggle();
    } else {
      setOpenState((prev) => !prev);
    }
  };
  return (
    <section ref={sectionRef} className={`selection-section-block ${dividerTop ? 'selection-section-block--divided' : ''}`}>
      <button
        type="button"
        className="selection-section-block__toggle"
        onClick={handleToggle}
        aria-expanded={open}
      >
        <span className="selection-section-block__toggle-title">{title}</span>
        <span className="selection-section-block__toggle-icon"><Chevron open={open} /></span>
      </button>
      {open ? <div className="selection-section-block__content">{children}</div> : null}
    </section>
  );
}

function SubjectAccordionItem({ item }) {
  const [open, setOpen] = useState(false);
  const [reaction, setReaction] = useState('');
  const summary = item?.fullSummary || item?.summary || item?.fallbackSummary || '';

  const handleReaction = (event, nextReaction) => {
    event.stopPropagation();
    setReaction((prev) => (prev === nextReaction ? '' : nextReaction));
  };

  return (
    <div className={`linked-subject-item ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="linked-subject-item__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="linked-subject-item__top">
          <div className="linked-subject-item__title-block">
            <div className="linked-subject-item__title">{item?.title}</div>

          </div>

          <div className="linked-subject-item__right">
            {open ? (
              <div className="linked-subject-item__actions" aria-label="Subject feedback">
                <button
                  type="button"
                  className={`cdna-item-action cdna-item-action--like ${reaction === 'like' ? 'is-active' : ''}`}
                  onClick={(event) => handleReaction(event, 'like')}
                  aria-pressed={reaction === 'like'}
                  aria-label="Sounds interesting"
                  data-selection-tooltip="true"
                  data-tooltip-body={reaction === 'like' ? 'Added to favourites' : 'Sounds interesting'}
                >
                  <span className="cdna-item-action-icon" aria-hidden="true">
                    <ThumbsUp size={18} weight="duotone" />
                  </span>
                </button>

                <button
                  type="button"
                  className={`cdna-item-action cdna-item-action--dislike ${reaction === 'dislike' ? 'is-active' : ''}`}
                  onClick={(event) => handleReaction(event, 'dislike')}
                  aria-pressed={reaction === 'dislike'}
                  aria-label="Not for me"
                  data-selection-tooltip="true"
                  data-tooltip-body="Not for me"
                >
                  <span className="cdna-item-action-icon" aria-hidden="true">
                    <ThumbsDown size={18} weight="duotone" />
                  </span>
                </button>
              </div>
            ) : null}

            <span className="linked-subject-item__chevron"><Chevron open={open} /></span>
          </div>
        </div>
      </button>

      {open && summary ? <p className="linked-subject-item__summary">{summary}</p> : null}
    </div>
  );
}

// Big "Love this / Not for me" buttons at the bottom of an expanded pathway/role
// row. Tooltip shows only "Added to favourites", once, when Love this is switched
// on — no hover tooltips (matches the career-world card behaviour).
export function PathwayReactionRow({ reaction = '', onReact, label = 'Feedback' }) {
  return (
    <div className="cdna-react-row" aria-label={label}>
      <button
        type="button"
        className={`cdna-react-btn cdna-react-btn--like ${reaction === 'like' ? 'is-active' : ''}`}
        onClick={(e) => {
          const activating = reaction !== 'like';
          const btn = e.currentTarget;
          onReact('like', e);
          if (activating) {
            btn.setAttribute('data-tooltip-body', 'Added to favourites');
            window.requestAnimationFrame(() => {
              showSelectionTooltip(btn);
              window.setTimeout(() => { hideSelectionTooltip(); if (btn.blur) btn.blur(); }, 1200);
            });
          } else {
            hideSelectionTooltip();
          }
        }}
        aria-pressed={reaction === 'like'}
      >
        <Smiley size={18} weight="bold" aria-hidden="true" /> Like this
      </button>
      <button
        type="button"
        className={`cdna-react-btn cdna-react-btn--dislike ${reaction === 'dislike' ? 'is-active' : ''}`}
        onClick={(e) => { onReact('dislike', e); hideSelectionTooltip(); }}
        aria-pressed={reaction === 'dislike'}
      >
        <SmileyMeh size={18} weight="regular" aria-hidden="true" /> Not for me
      </button>
    </div>
  );
}

// A single live job listing card inside the pop-up.
// Strip the recruiter marketing tail from a job title. Postings routinely append
// a sales pitch after a spaced dash, pipe or colon
// ("Veterinary Surgeon — Grow Clinically In A Supportive Team",
//  "Locum General Surgeon - Lead, Teach & 24/7 Cover"). We keep the role, drop
// the tail. Only spaced separators are cut, so "Part-Time", "24/7" and
// "In-house" survive.
function cleanJobTitle(raw) {
  let t = String(raw || '').trim();
  // Drop a trailing bracketed aside e.g. "(Remote)" or "(Band 6)", and a trailing
  // ", <Location>" that boards append.
  t = t.replace(/\s*[([][^)\]]*[)\]]\s*$/, '').trim();
  t = t.replace(/,\s+[A-Z][A-Za-z .'&-]*$/, '').trim();
  const cut = t.search(/\s+[—–|:]\s+|\s+-\s+/);
  if (cut > 2) {
    const head = t.slice(0, cut).trim();
    // If the head is only a generic label ("Summer Intern", "Graduate", "2027
    // Trainee"...), the real role sits AFTER the dash, so keep the fuller title.
    // Otherwise the head IS the role and the tail is recruiter marketing — drop it.
    const genericHead = /^(20\d{2}\s+)?((summer|winter|spring|autumn|fall)\s+)?(graduate|grad|trainee|intern(ship)?|placement|apprentice|entry[- ]level|student)s?\b/i.test(head);
    if (!genericHead) t = head;
  }
  return t || String(raw || '').trim();
}

export function JobCard({ job, saved = false, onToggleSave, onOpen }) {
  const meta = job.employer || '';
  // Pills with icons, matching the apprenticeship advert cards: location ·
  // closing date · experience (only when stated) · salary.
  const pills = [
    job.location ? { Icon: MapPin, text: job.location } : null,
    job.deadline ? { Icon: CalendarBlank, text: `Closes ${job.deadline}` } : null,
    job.noExperience ? null : { Icon: Briefcase, text: job.experience || 'Experience not stated' },
    job.salary ? { Icon: CurrencyGbp, text: job.salary } : null,
  ].filter(Boolean);
  const content = (
    <>
      <div className="role-jobcard__top">
        <span className="role-jobcard__title">{cleanJobTitle(job.title)}</span>
        {job.source ? <span className="role-jobcard__src">via {job.source}</span> : null}
      </div>
      {meta ? <div className="role-jobcard__meta">{meta}</div> : null}
      {pills.length ? (
        <div className="role-jobcard__facts">
          {pills.map(({ Icon, text }, i) => (
            <span className="role-jobcard__fact" key={i}><Icon size={13} weight="bold" aria-hidden="true" />{text}</span>
          ))}
        </div>
      ) : null}
    </>
  );
  // Card is a container so the save heart can sit as a sibling of the apply link
  // (a button can't be nested inside an anchor).
  return (
    <div className={`role-jobcard${onToggleSave ? ' role-jobcard--saveable' : ''}`}>
      {onToggleSave ? (
        <button
          type="button"
          className={`role-jobcard__save${saved ? ' is-saved' : ''}`}
          aria-pressed={saved}
          aria-label={saved ? 'Saved to favourites' : 'Save to favourites'}
          title={saved ? 'Saved' : 'Save to favourites'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(job); }}
        >
          <Heart size={16} weight={saved ? 'fill' : 'bold'} aria-hidden="true" />
        </button>
      ) : null}
      {onOpen ? (
        <button
          type="button"
          className="role-jobcard__link-area role-jobcard__link-area--btn"
          onClick={() => onOpen(job)}
        >
          {content}
        </button>
      ) : job.url ? (
        <a className="role-jobcard__link-area" href={job.url} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        <div className="role-jobcard__link-area">{content}</div>
      )}
    </div>
  );
}

// In-app detail card for a single live job: opens when a job row is tapped, so
// the student sees the full advert summary (and whether it has closed) with
// like/dislike and the apply link, instead of being sent straight out.
export function JobDetailModal({ job, reaction = '', onReact, onClose }) {
  useEffect(() => {
    if (!job) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [job, onClose]);
  if (!job) return null;
  let closed = false;
  if (job.closingDate) { const d = new Date(job.closingDate); const t = new Date(); t.setHours(0, 0, 0, 0); if (!Number.isNaN(d.getTime()) && d < t) closed = true; }
  const pills = [
    job.location ? { Icon: MapPin, text: job.location } : null,
    job.deadline ? { Icon: CalendarBlank, text: `Closes ${job.deadline}` } : null,
    job.noExperience ? null : { Icon: Briefcase, text: job.experience || 'Graduate / entry-level' },
    job.salary ? { Icon: CurrencyGbp, text: job.salary } : null,
  ].filter(Boolean);
  return (
    <div className="cw-def-modal cw-def-modal--jobs" role="dialog" aria-modal="true" aria-label={cleanJobTitle(job.title)}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cw-def-modal__box job-detail-box">
        <div className="cw-def-modal__head cw-wayin-head">
          <span className="cw-wayin-head__icon" aria-hidden="true"><Briefcase size={22} weight="bold" /></span>
          <div className="cw-wayin-head__titles">
            <span className="cw-def-modal__title">{cleanJobTitle(job.title)}</span>
            <span className="cw-wayin-head__sub">{job.employer || 'Live job'}{job.source ? ` · via ${job.source}` : ''}</span>
          </div>
          <button type="button" className="cw-def-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="cw-def-modal__body">
          {closed ? <div className="job-detail-closed">This advert has closed, so it may no longer be accepting applications.</div> : null}
          {pills.length ? (
            <div className="role-jobcard__facts job-detail-facts">
              {pills.map(({ Icon, text }, i) => (
                <span className="role-jobcard__fact" key={i}><Icon size={13} weight="bold" aria-hidden="true" />{text}</span>
              ))}
            </div>
          ) : null}
          <PathwayReactionRow reaction={reaction} onReact={onReact} label="Save this job" />
          {job.url ? (
            <div className="job-detail-actions">
              <a className="cw-readmore job-detail-apply" href={job.url} target="_blank" rel="noopener noreferrer">
                Apply on {job.source || 'the job board'} <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// A reusable pop-up listing live jobs/internships/schemes/apprenticeships.
export function JobsModal({ open, onClose, title, heading, lead, data, kindNoun, fieldMode = false }) {
  const [showAll, setShowAll] = useState(false);
  const [savedJobs, setSavedJobs] = useState(() => new Set());
  const [dislikedJobs, setDislikedJobs] = useState(() => new Set());
  const [detailJob, setDetailJob] = useState(null);
  const INITIAL_SHOWN = 15;
  useEffect(() => { if (open) { setShowAll(false); setDetailJob(null); } }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    getSavedIds('job').then((s) => { if (!cancelled) setSavedJobs(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [open]);
  const reactionFor = (id) => (savedJobs.has(id) ? 'like' : dislikedJobs.has(id) ? 'dislike' : '');
  const persistJobReaction = async (job, reaction, remove) => {
    await setItemReaction({
      itemType: 'job',
      itemId: jobKey(job),
      itemTitle: job.title || 'Job',
      itemMeta: {
        employer: job.employer || '',
        location: job.location || '',
        url: job.url || '',
        deadline: job.deadline || '',
        closingDate: job.closingDate || null,
        source: job.source || '',
      },
      reaction,
      remove,
    });
  };
  const handleToggleSave = async (job) => {
    const id = jobKey(job);
    const isSaved = savedJobs.has(id);
    setSavedJobs((prev) => { const n = new Set(prev); if (isSaved) n.delete(id); else n.add(id); return n; });
    if (!isSaved) setDislikedJobs((prev) => { const n = new Set(prev); n.delete(id); return n; });
    await persistJobReaction(job, 'like', isSaved);
  };
  // Like/dislike from the job detail card. Like also drives the heart (favourite).
  const handleJobReact = async (job, next) => {
    const id = jobKey(job);
    const current = reactionFor(id);
    const remove = current === next;
    setSavedJobs((prev) => { const n = new Set(prev); if (!remove && next === 'like') n.add(id); else n.delete(id); return n; });
    setDislikedJobs((prev) => { const n = new Set(prev); if (!remove && next === 'dislike') n.add(id); else n.delete(id); return n; });
    await persistJobReaction(job, next, remove);
  };
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;

  const count = data && typeof data.count === 'number' ? data.count : null;
  const countText = count != null ? count.toLocaleString('en-GB') : '';
  const jobs = (data && Array.isArray(data.jobs)) ? data.jobs : [];
  const provider = data && data.provider;
  const nounPlural = fieldMode ? 'roles' : kindNoun === 'internship' ? 'internships' : kindNoun === 'scheme' ? 'graduate schemes' : kindNoun === 'apprenticeship' ? 'apprenticeships' : 'graduate jobs';
  const nounSingular = fieldMode ? 'role' : kindNoun === 'internship' ? 'internship' : kindNoun === 'scheme' ? 'graduate scheme' : kindNoun === 'apprenticeship' ? 'apprenticeship' : 'graduate job';
  const countSuffix = fieldMode ? 'in this field' : 'in the UK';

  return (
    <div
      className="cw-def-modal cw-def-modal--jobs"
      role="dialog"
      aria-modal="true"
      aria-label={`${heading}: ${title}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cw-def-modal__box">
        <div className="cw-def-modal__head cw-wayin-head">
          <span className="cw-wayin-head__icon" aria-hidden="true"><Briefcase size={22} weight="bold" /></span>
          <div className="cw-wayin-head__titles">
            <span className="cw-def-modal__title">{title}</span>
            <span className="cw-wayin-head__sub">{heading}</span>
          </div>
          <button type="button" className="cw-def-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="cw-def-modal__body role-jobs-modal">
          {count ? (
            <div className="role-jobs-modal__count">
              <span className="role-jobs__dot" aria-hidden="true" />
              <strong>{countText} live {count === 1 ? nounSingular : nounPlural}</strong> {countSuffix}
            </div>
          ) : null}
          <p className="role-jobs-modal__lead">{lead}</p>
          {jobs.length ? (
            <>
              <div className="role-jobs-list">
                {(showAll ? jobs : jobs.slice(0, INITIAL_SHOWN)).map((job, i) => (
                  <JobCard
                    key={`${job.title}-${i}`}
                    job={job}
                    saved={savedJobs.has(jobKey(job))}
                    onToggleSave={handleToggleSave}
                    onOpen={setDetailJob}
                  />
                ))}
              </div>
              {!showAll && jobs.length > INITIAL_SHOWN ? (
                <button type="button" className="role-jobs-showall" onClick={() => setShowAll(true)}>
                  Show all {jobs.length} {nounPlural}
                </button>
              ) : null}
            </>
          ) : (
            <p className="role-jobs-modal__lead">No live {nounPlural} found right now. Try the links below.</p>
          )}
          {/* Optional single provider link (e.g. apprenticeships → Find an
              Apprenticeship), shown only when the caller supplies one. Jobs,
              schemes and internships show the live roles directly, no link. */}
          {provider && provider.url ? (
            <div className="role-jobs-modal__foot">
              <a className="role-jobs__link" href={provider.url} target="_blank" rel="noopener noreferrer">See all on {provider.name} <span aria-hidden="true">→</span></a>
            </div>
          ) : null}
        </div>
      </div>
      {detailJob ? (
        <JobDetailModal
          job={detailJob}
          reaction={reactionFor(jobKey(detailJob))}
          onReact={(next) => handleJobReact(detailJob, next)}
          onClose={() => setDetailJob(null)}
        />
      ) : null}
    </div>
  );
}

// Live graduate-JOBS block for a ROLE (university flow). Individual live
// vacancies for this exact role, searched by the role title. Internships and
// graduate schemes are handled at the PATHWAY level (see PathwayJobsLine).
// Hides entirely if the feature is off (no API key) or the lookup fails.
function GradJobsLine({ title, advisory = null }) {
  const [state, setState] = useState({ loading: true, data: null });
  const [modalOpen, setModalOpen] = useState(false);

  // Some routes are not entered by applying to advertised jobs, so we don't run a
  // live search at all — just show the guidance:
  //   • venture  → you start it (founders)
  //   • postgrad → further study (postdoc, lecturer, research scientist)
  const noSearchAdvisory = !!advisory && (advisory.mode === 'venture' || advisory.mode === 'postgrad');

  useEffect(() => {
    let cancelled = false;
    if (!title || noSearchAdvisory) { setState({ loading: false, data: null }); return undefined; }
    (async () => {
      const gradData = await fetchGradJobs(title, 'grad');
      if (!cancelled) setState({ loading: false, data: gradData });
    })();
    return () => { cancelled = true; };
  }, [title, noSearchAdvisory]);

  const { loading, data } = state;
  // Only hide when the whole feature is switched off (no API keys on the server).
  // For an empty result, a failed lookup or a missing keyword we still render the
  // box with a graceful "no live roles" state + a search link, so a role card
  // never silently loses its jobs box.
  if (!loading && data && data.error === 'NO_API_KEY') return null;

  const count = data && typeof data.count === 'number' ? data.count : null;
  const countText = count != null ? count.toLocaleString('en-GB') : '';
  const jobs = (data && Array.isArray(data.jobs)) ? data.jobs : [];
  const gradUrl = data && data.gradSearchUrl;
  const hasList = jobs.length > 0;

  // Advisory mode (regulated / academic routes): same live jobs, but framed as
  // "roles in the field" with the route explained, since these are not entered
  // as graduate jobs.
  const isAdvisory = !!advisory && advisory.mode !== 'jobs';
  const isPostgrad = isAdvisory && advisory.mode === 'postgrad';
  const EyebrowIcon = isPostgrad ? GraduationCap : isAdvisory ? Signpost : Briefcase;
  const eyebrowText = isPostgrad ? 'Further study' : isAdvisory ? 'How you get in' : 'Live graduate jobs';
  const blurb = isAdvisory
    ? `${advisory.route} The live roles below are there so you can see what the field looks like, but you get in through the route above rather than by applying as a graduate.`
    : 'Real graduate roles being advertised right now for this job. We gather the most relevant openings from LinkedIn, Indeed, Reed, Adzuna, Glassdoor and other UK job boards, and refresh them daily.';
  const noun = isAdvisory ? 'in this field' : 'in the UK';
  const gradWord = isAdvisory ? '' : 'graduate ';
  // Premium gate: only the Premium-badged (non-advisory) box is gated.
  const premiumGateAttr = isAdvisory ? {} : { 'data-premium-feature': 'jobs' };
  // Always have a working search link, even when the backend returned no URL
  // (empty result / failed lookup), so the empty state is never a dead end.
  const searchUrl = gradUrl || (title
    ? `https://www.reed.co.uk/jobs?keywords=${encodeURIComponent(title)}${isAdvisory ? '' : '&graduate=true'}`
    : null);

  // No-search routes: no live-jobs box at all — just the guidance note.
  //   venture  → "How founders start"; postgrad → "Further study".
  if (noSearchAdvisory) {
    const isVenture = advisory.mode === 'venture';
    const NoteIcon = isVenture ? Rocket : GraduationCap;
    return (
      <div className="role-jobs role-jobs--advisory role-jobs--venture">
        <div className="role-jobs__eyebrow">
          <NoteIcon size={15} weight="bold" aria-hidden="true" /> {isVenture ? 'How founders start' : 'Further study'}
        </div>
        <p className="role-jobs__blurb">{advisory.route}</p>
      </div>
    );
  }

  return (
    <div className={`role-jobs${isAdvisory ? ' role-jobs--advisory' : ''}`}>
      {loading ? (
        <p className="role-jobs__line role-jobs__line--muted role-jobs__loading">
          <span className="role-jobs__spinner" aria-hidden="true" />
          <span>{isAdvisory ? 'Checking live roles…' : 'Checking live graduate jobs…'}</span>
        </p>
      ) : (
        <>
          <div className="role-jobs__eyebrow">
            <EyebrowIcon size={15} weight="bold" aria-hidden="true" /> {eyebrowText}
            {isAdvisory ? null : <span className="fs-premium-badge">Premium</span>}
          </div>
          <p className="role-jobs__blurb">{blurb}</p>
          <div className="role-jobs__foot">
            {count && count > 0 ? (
              <div className="role-jobs__foot-row">
                <span className="role-jobs__stat">
                  <span className="role-jobs__dot" aria-hidden="true" />
                  {countText} live {gradWord}{count === 1 ? 'job' : 'jobs'} {noun}
                </span>
                {hasList ? (
                  <button type="button" className="role-jobs__go" {...premiumGateAttr} onClick={() => setModalOpen(true)}>See live roles <span aria-hidden="true">→</span></button>
                ) : searchUrl ? (
                  <a className="role-jobs__go" {...premiumGateAttr} href={searchUrl} target="_blank" rel="noopener noreferrer">See jobs <span aria-hidden="true">→</span></a>
                ) : null}
              </div>
            ) : (
              <div className="role-jobs__foot-row">
                <span className="role-jobs__stat role-jobs__stat--muted">{isAdvisory ? 'No live roles advertised right now.' : 'No graduate jobs advertised right now.'}</span>
                {searchUrl ? (
                  <a className="role-jobs__go" {...premiumGateAttr} href={searchUrl} target="_blank" rel="noopener noreferrer">Check jobs <span aria-hidden="true">→</span></a>
                ) : null}
              </div>
            )}
          </div>

          <JobsModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title={title}
            heading={isAdvisory ? 'Live roles in this field' : 'Live graduate jobs'}
            kindNoun="grad"
            fieldMode={isAdvisory}
            data={data}
            lead={
              isAdvisory
                ? 'Live roles currently advertised in this field, gathered from LinkedIn, Indeed, Reed, Adzuna, ' +
                  'Glassdoor and other UK job boards, so you can see the market. Remember you get in through the route above, ' +
                  'not by applying to these as a graduate.'
                : 'The most relevant roles currently advertised for this job, gathered from LinkedIn, Indeed, ' +
                  'Reed, Adzuna, Glassdoor and other UK job boards, sorted newest first. Tap any role to open it on the job board and apply.'
            }
          />
        </>
      )}
    </div>
  );
}

// Right-hand box on a role card: role-anchored INTERNSHIPS (live) plus GRADUATE
// SCHEMES as curated links. Schemes are no longer scraped from job boards — those
// results are dominated by recruitment-agency spam; the real UK graduate schemes
// live on dedicated sites, so we link out to them instead.
const SCHEME_SITES = (title) => {
  const kw = encodeURIComponent(String(title || '').trim());
  return [
    { name: 'Prospects', url: `https://www.prospects.ac.uk/graduate-jobs?keywords=${kw}` },
    { name: 'Bright Network', url: 'https://www.brightnetwork.co.uk/graduate-jobs/' },
    { name: 'TargetJobs', url: 'https://targetjobs.co.uk/' },
  ];
};

export function PathwayJobsLine({ title, pathwayTitle = '' }) {
  const [loading, setLoading] = useState(true);
  const [internData, setInternData] = useState(null);
  const [schemeData, setSchemeData] = useState(null);
  const [internOpen, setInternOpen] = useState(false);
  const [schemeOpen, setSchemeOpen] = useState(false);
  // Internships are role-specific; graduate SCHEMES are recruited by discipline,
  // so they search the PATHWAY (e.g. "Animation & Motion Design"), not the role.
  const schemeKey = (pathwayTitle && pathwayTitle.trim()) || title;

  useEffect(() => {
    let cancelled = false;
    if (!title) { setLoading(false); return undefined; }
    setLoading(true);
    (async () => {
      const [intern, scheme] = await Promise.all([
        fetchGradJobs(title, 'internship'),
        fetchGradJobs(schemeKey, 'scheme'),
      ]);
      if (!cancelled) { setInternData(intern); setSchemeData(scheme); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [title, schemeKey]);

  const iCount = internData && typeof internData.count === 'number' ? internData.count : null;
  const iCountText = iCount != null ? iCount.toLocaleString('en-GB') : '';
  const iJobs = (internData && Array.isArray(internData.jobs)) ? internData.jobs : [];
  // Live graduate schemes/programmes actually advertised right now (titles that
  // say "graduate scheme / programme / program"), shown above the curated links.
  const sCount = schemeData && typeof schemeData.count === 'number' ? schemeData.count : null;
  const sJobs = (schemeData && Array.isArray(schemeData.jobs)) ? schemeData.jobs : [];
  const hasLiveSchemes = sCount != null && sCount > 0;
  const schemeSites = SCHEME_SITES(title);

  return (
    <div className="role-jobs">
      <div className="role-jobs__eyebrow">
        <Briefcase size={15} weight="bold" aria-hidden="true" /> Internships &amp; graduate schemes
        <span className="fs-premium-badge">Premium</span>
      </div>
      <p className="role-jobs__blurb">
        Live internships for this role, plus the main UK sites where graduate schemes and programmes are advertised.
      </p>

      <div className="role-jobs__foot">
        {loading ? (
          <div className="role-jobs__foot-row">
            <span className="role-jobs__stat role-jobs__stat--muted">
              <span className="role-jobs__spinner" aria-hidden="true" /> Checking live internships&hellip;
            </span>
          </div>
        ) : iCount && iCount > 0 ? (
          <div className="role-jobs__foot-row">
            <span className="role-jobs__stat">
              <span className="role-jobs__dot" aria-hidden="true" />
              {iCountText} live {iCount === 1 ? 'internship' : 'internships'} in the UK
            </span>
            {iJobs.length ? (
              <button type="button" className="role-jobs__go" data-premium-feature="jobs" onClick={() => setInternOpen(true)}>See internships <span aria-hidden="true">→</span></button>
            ) : null}
          </div>
        ) : (
          <div className="role-jobs__foot-row">
            <span className="role-jobs__stat role-jobs__stat--muted">No internships advertised right now.</span>
          </div>
        )}
      </div>

      <div className="role-jobs__schemes">
        <span className="role-jobs__schemes-label">Graduate schemes &amp; programmes</span>
        {hasLiveSchemes && sJobs.length ? (
          <div className="role-jobs__foot-row">
            <span className="role-jobs__stat">
              <span className="role-jobs__dot" aria-hidden="true" />
              {sCount.toLocaleString('en-GB')} live now
            </span>
            <button type="button" className="role-jobs__go" data-premium-feature="jobs" onClick={() => setSchemeOpen(true)}>See schemes <span aria-hidden="true">→</span></button>
          </div>
        ) : null}
        <p className="role-jobs__schemes-note">
          {hasLiveSchemes ? 'Or browse the main UK scheme sites:' : 'The big UK graduate schemes recruit on their own sites:'}
        </p>
        <div className="role-jobs__links">
          {schemeSites.map((l) => (
            <a key={l.name} className="role-jobs__schemelink" href={l.url} target="_blank" rel="noopener noreferrer">{l.name} <span aria-hidden="true">→</span></a>
          ))}
        </div>
      </div>

      <JobsModal
        open={internOpen}
        onClose={() => setInternOpen(false)}
        title={title}
        heading="Live internships & placements"
        kindNoun="internship"
        data={internData}
        lead={
          'Internships and placements currently advertised for this role, gathered from LinkedIn, Indeed, Reed, ' +
          'Adzuna and other UK job boards. Tap any to open it and apply.'
        }
      />

      <JobsModal
        open={schemeOpen}
        onClose={() => setSchemeOpen(false)}
        title={schemeKey}
        heading="Live graduate schemes & programmes"
        kindNoun="scheme"
        data={schemeData}
        lead={
          'Graduate schemes and programmes currently advertised in this field, gathered from LinkedIn, Indeed, Reed, ' +
          'Adzuna and other UK job boards. Tap any to open it and apply.'
        }
      />
    </div>
  );
}

export function RoleAccordionItem({ item, onItemReaction, savedReactions = {}, showGradJobs = false, pathwayTitle = '', isOpen, onToggle }) {
  // Controlled mode: when the parent passes isOpen/onToggle, it owns the open
  // state so only one role can be open at a time. Otherwise fall back to
  // self-managed state (multiple can be open).
  const controlled = typeof isOpen === 'boolean' && typeof onToggle === 'function';
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? isOpen : internalOpen;
  const toggle = () => { if (controlled) onToggle(); else setInternalOpen((prev) => !prev); };
  const rowRef = useRef(null);
  const savedReaction = (item?.id && savedReactions[item.id]) || '';
  const [reaction, setReaction] = useState(savedReaction);
  const summary = item?.fullSummary || item?.summary || item?.fallbackSummary || '';
  const band = item?.signalLabel || '';
  // Whether live graduate jobs even make sense for this role/pathway, or whether
  // the honest guidance is a postgrad or regulated qualifying route instead.
  const entryRoute = entryRouteForCard(item?.title, pathwayTitle);
  // Six-field role definition (What it is / What you'd do / How you get in /
  // Who it suits / How it's changing / The practical side). Split on blank lines;
  // render the labelled grid only when exactly six paragraphs are present.
  const roleParas = String(item?.description || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const ROLE_FIELD_LABELS = ['What it is', "What you'd do", 'How you get in', 'Who it suits', "How it's changing", 'The practical side'];
  const ROLE_FIELD_ICONS = [Info, Briefcase, Signpost, UsersThree, TrendUp, MapPin];

  useEffect(() => {
    setReaction((item?.id && savedReactions[item.id]) || '');
  }, [savedReactions, item?.id]);

  const handleReaction = (event, nextReaction) => {
    event.stopPropagation();
    const isSame = reaction === nextReaction;
    const applied = isSame ? '' : nextReaction;
    setReaction(applied);
    if (typeof onItemReaction === 'function' && item?.id) {
      onItemReaction({
        itemType: 'role',
        itemId: item.id,
        itemTitle: item.title,
        reaction: nextReaction,
        remove: isSame,
      });
    }
  };

  return (
    <div ref={rowRef} data-fav-key={String(item?.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} className={`pathway-role-item ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="pathway-role-item__toggle"
        onClick={toggle}
        aria-expanded={open}
      >
        <div className="pathway-role-item__topline pathway-role-item__topline--split">
          <div className="pathway-role-item__title-wrap">
            <span className="pathway-role-item__title">{item?.title}</span>
          </div>

          {!open && reaction === 'like' ? (
            <span className="cdna-saved-mark" aria-label="Saved to favourites" title="Saved to favourites"><BookmarkSimple size={18} weight="fill" aria-hidden="true" /></span>
          ) : null}
          {band ? (
            <span className={`cdna-band-pill cdna-band-pill--${bandKey(band)} pathway-role-item__badge`}>{band}</span>
          ) : null}
          <div className="pathway-role-item__right">
            <span className="pathway-role-item__chevron"><Chevron open={open} /></span>
          </div>
        </div>
      </button>
      {open ? (
        <div className="pathway-role-item__body">
          {roleParas.length === 6 ? (
            <div className="fs-degree-grid">
              {roleParas.map((p, i) => {
                const SectionIcon = ROLE_FIELD_ICONS[i];
                return (
                  <div className="fs-degree-section" key={`role-sec-${i}`}>
                    <span className="fs-degree-section__label">
                      <SectionIcon size={14} weight="bold" aria-hidden="true" />
                      {ROLE_FIELD_LABELS[i]}
                    </span>
                    <p className="pathway-role-item__summary">{p}</p>
                  </div>
                );
              })}
            </div>
          ) : roleParas.length ? (
            roleParas.map((p, i) => (
              <p className="pathway-role-item__summary" key={`role-desc-${i}`}>{p}</p>
            ))
          ) : summary ? (
            <p className="pathway-role-item__summary">{summary}</p>
          ) : null}
          {showGradJobs ? (
            entryRoute.mode !== 'jobs' ? (
              // Regulated / academic routes: keep live jobs open so students can
              // see the field, but drop the graduate schemes & internships box
              // (they do not apply) and make the description explain the route.
              <div className="role-jobs-cols role-jobs-cols--single">
                <GradJobsLine title={item?.title} advisory={entryRoute} />
              </div>
            ) : (
              <div className="role-jobs-cols">
                <GradJobsLine title={item?.title} />
                <PathwayJobsLine title={item?.title} pathwayTitle={pathwayTitle} />
              </div>
            )
          ) : null}
          <PathwayReactionRow
            reaction={reaction}
            onReact={(next, event) => handleReaction(event, next)}
            label="Role feedback"
          />
        </div>
      ) : null}
    </div>
  );
}

// Renders a career pathway inside a career world as an accordion: click the
// title to expand its definition. Definition is carried on item.definition.
const ROUTE_CHIP_COLOURS = { University: '#2F6FED', Apprenticeship: '#12A150', College: '#7C3AED', Work: '#EA7317' };
const ROUTE_CHIP_LABELS = { University: 'University', Apprenticeship: 'Apprenticeship', College: 'College', Work: 'On the job' };
const ROUTE_CHIP_DEFS = {
  University: 'A degree course at university, usually three or four years, where you study a subject in depth before starting work.',
  Apprenticeship: 'A paid job where you learn while you work and train towards a real qualification, earning a wage from day one.',
  College: 'A course at a college after school, such as a T Level or diploma, that builds job skills or leads on to further training.',
  Work: 'Starting straight in a job and learning as you go, through direct entry, a trainee scheme, or by setting up on your own.',
};
function RouteChipsRow({ chips }) {
  if (!Array.isArray(chips) || !chips.length) return null;
  return (
    <div className="cw-route-chips--body">
      <span className="cw-route-chips__label">Ways in</span>
      <span className="cw-route-chips">
        {chips.map((c) => (
          <span
            key={c}
            className="cw-route-chip"
            tabIndex={0}
            role="button"
            aria-label={`${ROUTE_CHIP_LABELS[c] || c}. ${ROUTE_CHIP_DEFS[c] || ''}`}
            data-selection-tooltip="true"
            data-tooltip-title={ROUTE_CHIP_LABELS[c] || c}
            data-tooltip-body={ROUTE_CHIP_DEFS[c] || ''}
          >
            <span className="cw-route-chip__dot" style={{ background: ROUTE_CHIP_COLOURS[c] || '#5F5E5A' }} aria-hidden="true" />
            {ROUTE_CHIP_LABELS[c] || c}
          </span>
        ))}
      </span>
    </div>
  );
}

function PathwayDefinitionItem({ item, open = false, onToggle, onItemReaction, savedReactions = {}, nonUniRoutes = [] }) {
  const savedReaction = (item?.id && savedReactions[item.id]) || '';
  const [reaction, setReaction] = useState(savedReaction);
  const def = item?.definition || item?.summary || '';
  const band = item?.signalLabel || '';
  const PathwayIcon = getPathwayIcon(compactKey(item?.title || ''));
  const rowRef = useRef(null);
  const hasMountedRef = useRef(false);

  // Reflect the saved reaction once it loads / when switching worlds, so the
  // like/dislike ticks persist instead of resetting on return.
  useEffect(() => {
    setReaction((item?.id && savedReactions[item.id]) || '');
  }, [savedReactions, item?.id]);

  // When opened, scroll the pathway into view so it centres in the panel.
  useEffect(() => {
    if (open && hasMountedRef.current && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [open]);
  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  const handleReaction = (event, nextReaction) => {
    event.stopPropagation();
    const isSame = reaction === nextReaction;
    const applied = isSame ? '' : nextReaction;
    setReaction(applied);
    if (typeof onItemReaction === 'function' && item?.id) {
      onItemReaction({
        itemType: 'pathway',
        itemId: item.id,
        itemTitle: item.title,
        reaction: nextReaction,
        remove: isSame,
      });
    }
  };

  return (
    <div ref={rowRef} data-fav-key={String(item?.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} className={`pathway-role-item ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="pathway-role-item__toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="pathway-role-item__topline pathway-role-item__topline--split">
          <div className="pathway-role-item__title-wrap">
            {PathwayIcon ? <span className="pathway-role-item__icon" aria-hidden="true">{PathwayIcon}</span> : null}
            <span className="pathway-role-item__title">{item?.title}</span>
          </div>

          {!open && reaction === 'like' ? (
            <span className="cdna-saved-mark" aria-label="Saved to favourites" title="Saved to favourites"><BookmarkSimple size={18} weight="fill" aria-hidden="true" /></span>
          ) : null}
          {band ? (
            <span className={`cdna-band-pill cdna-band-pill--${bandKey(band)} pathway-role-item__badge`}>{band}</span>
          ) : null}
          <div className="pathway-role-item__right">
            <span className="pathway-role-item__chevron"><Chevron open={open} /></span>
          </div>
        </div>
      </button>
      {open ? (
        <div className="pathway-role-item__body">
          {/* Ways in: the route chips at the top, like the world cards. Degree
              subjects live in Uni Study; the apprenticeship detail in Training & Work. */}
          <RouteChipsRow chips={item?.routeChips} />

          {def
            ? String(def)
                .split(/\n\s*\n/)
                .map((para) => para.trim())
                .filter(Boolean)
                .map((para, idx) => (
                  <p className="pathway-role-item__summary" key={`pdef-${item?.id}-${idx}`}>{para}</p>
                ))
            : null}

          <ItemPills item={item} />
          <PathwayReactionRow
            reaction={reaction}
            onReact={(next, event) => handleReaction(event, next)}
            label="Pathway feedback"
          />
        </div>
      ) : null}
    </div>
  );
}

// Reusable pills block: the two "Signature profiles" (archetypes) and
// "Signature traits" (subdimensions) accordions, driven by an item that carries
// `archetypes` and `subdimensions`. Used by the Career Worlds accordion, the
// pathway detail, and each pathway inside the Pathway Explorer.
// Below-pills narrative that stays collapsed to a couple of lines with a
// "Read more" toggle, so the student can expand it only if they want to.
// Bold + green every profile (archetype) and trait (subdimension) name wherever
// it appears in a match narrative, so the personalised copy visually ties back to
// the pills above it.
const NARRATIVE_HIGHLIGHT_LABELS = (() => {
  const out = [];
  DIMENSIONS.forEach((d) => (d.subdimensions || []).forEach((sd) => { if (sd.label) out.push(sd.label); }));
  Object.keys(ARCHETYPE_DEFINITIONS).forEach((k) => out.push(k));
  return out;
})();

const normHighlight = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();

const NARRATIVE_HIGHLIGHT_SET = new Set(NARRATIVE_HIGHLIGHT_LABELS.map(normHighlight));

const NARRATIVE_HIGHLIGHT_RE = (() => {
  const variants = new Set();
  NARRATIVE_HIGHLIGHT_LABELS.forEach((l) => {
    variants.add(l);
    if (l.includes('&')) variants.add(l.replace(/&/g, 'and'));
  });
  const alt = Array.from(variants)
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ +/g, '\\s+'));
  return new RegExp(`\\b(${alt.join('|')})\\b`, 'gi');
})();

function highlightNarrativeTraits(text) {
  const s = String(text || '');
  if (!s) return s;
  return s.split(NARRATIVE_HIGHLIGHT_RE).map((part, i) => (
    part && NARRATIVE_HIGHLIGHT_SET.has(normHighlight(part))
      ? <strong key={i} className="cdna-narrative-trait">{part}</strong>
      : part
  ));
}

function ExpandableNarrative({ text = '' }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div className="selection-narrative-expand">
      <p className={`selection-accordion-narrative selection-accordion-narrative--below ${open ? 'is-open' : 'is-clamped'}`}>{highlightNarrativeTraits(text)}</p>
      <button type="button" className="selection-narrative-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Show less' : 'Read more about how these fit'}
      </button>
    </div>
  );
}

export function ItemPills({ item, defaultOpen = false, narrativeLead = '', narrativeRest = '', collapsibleNarrative = false }) {
  const archetypes = useMemo(
    () => sortArchetypes(Array.isArray(item?.archetypes) ? item.archetypes : []),
    [item]
  );
  const subdimensions = useMemo(() => sortSubdimensions(item?.subdimensions || []), [item]);
  const primarySubdimensions = useMemo(
    () => subdimensions.filter((token) => isPrimaryTrait(token)),
    [subdimensions]
  );
  const secondarySubdimensions = useMemo(
    () => subdimensions.filter((token) => !isPrimaryTrait(token)),
    [subdimensions]
  );

  // Only one signature section open at a time: opening traits closes profiles.
  const [openSection, setOpenSection] = useState(defaultOpen ? 'profiles' : '');

  if (!archetypes.length && !subdimensions.length) return null;

  const alignedTraitCount = getAlignedTraitCount(subdimensions);
  const totalTraitCount = Number(item?.totalSubdimensionCount || subdimensions.length || 0);
  const alignedArchetypeCount = getAlignedArchetypeCount(archetypes);
  const totalArchetypeCount = archetypes.length;

  return (
    <>
      {!!archetypes.length && (
        <SectionAccordion
          title={
            <div className="selection-accordion-title-stack">
              <MetricTitle aligned={alignedArchetypeCount} total={totalArchetypeCount} label="Signature profiles match" />
              <div className="selection-accordion-helper">Which of your profiles align with this option?</div>
            </div>
          }
          open={openSection === 'profiles'}
          onToggle={() => setOpenSection((s) => (s === 'profiles' ? '' : 'profiles'))}
          dividerTop={true}
        >
          <div className="selection-chip-grid selection-chip-grid--archetypes">
            {archetypes.map((token) => {
              const IconComponent = ARCHETYPE_ICON_MAP[normalizeKey(token?.name)] || FaStar;
              return (
                <SelectionChip
                  key={`a-${item?.id}-${token?.name}`}
                  label={token?.name}
                  score={token?.userScore}
                  icon={IconComponent}
                  kind="archetype"
                />
              );
            })}
          </div>
          {narrativeLead ? <p className="selection-accordion-narrative selection-accordion-narrative--below">{highlightNarrativeTraits(narrativeLead)}</p> : null}
        </SectionAccordion>
      )}

      {!!subdimensions.length && (
        <SectionAccordion
          title={
            <div className="selection-accordion-title-stack">
              <MetricTitle aligned={alignedTraitCount} total={totalTraitCount} label="Signature traits match" />
              <div className="selection-accordion-helper">Which of your traits align with this option?</div>
            </div>
          }
          open={openSection === 'traits'}
          onToggle={() => setOpenSection((s) => (s === 'traits' ? '' : 'traits'))}
          dividerTop={true}
        >
          <div className="selection-trait-groups">
            <TraitChipGroup title="Primary traits" traits={primarySubdimensions} itemId={item?.id} />
            <TraitChipGroup title="Secondary traits" traits={secondarySubdimensions} itemId={item?.id} />
          </div>
          {narrativeRest ? (
            collapsibleNarrative
              ? <ExpandableNarrative text={narrativeRest} />
              : <p className="selection-accordion-narrative selection-accordion-narrative--below">{highlightNarrativeTraits(narrativeRest)}</p>
          ) : null}
        </SectionAccordion>
      )}
    </>
  );
}

function DetailPanel({ item, onItemReaction, savedReactions = {}, nonUniByTitle = new Map() }) {
  const isPathway = Boolean(item?.isPathway || (Array.isArray(item?.roles) && item.roles.length));
  const isCareerWorld = Boolean(item?.isCareerWorld || item?.type === 'career_world');
  // One pathway open at a time within this world.
  const [openPathwayKey, setOpenPathwayKey] = useState('');
  // One role open at a time within a pathway's role list.
  const [openRoleKey, setOpenRoleKey] = useState('');
  // Filter the pathway list by route chips, match band, and favourites.
  const [pathwayFilter, setPathwayFilter] = useState(emptyFilter());
  const [showOtherPw, setShowOtherPw] = useState(false);

  // Pathways within this career world. Prefer the backend-scored pathways (they
  // carry signalLabel / signalPct so each shows its band), keeping the definition
  // prose from the static file. Fall back to the static list (no band) only if the
  // backend didn't send scores.
  const worldPathways = useMemo(() => {
    if (!isCareerWorld) return [];
    const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

    const defByTitle = new Map();
    Object.values(PATHWAY_DEFINITIONS).forEach((p) => {
      if (p?.title) defByTitle.set(norm(p.title), p.long || p.paragraph || '');
    });

    const scored = Array.isArray(item?.pathways) ? item.pathways : [];
    if (scored.length) {
      return scored.map((p) => ({
        id: p?.id || p?.title,
        title: p?.title,
        definition: p?.definition || p?.long || defByTitle.get(norm(p?.title)) || '',
        signalLabel: p?.signalLabel || '',
        signalPct: p?.signalPct,
        archetypes: Array.isArray(p?.archetypes) ? p.archetypes : [],
        subdimensions: Array.isArray(p?.subdimensions) ? p.subdimensions : [],
        totalSubdimensionCount: p?.totalSubdimensionCount,
        // Unified route fields from the backend (see attachPathwayRoutes).
        entryTag: p?.entryTag || '',
        uniSubjects: Array.isArray(p?.uniSubjects) ? p.uniSubjects : [],
        hasNonUni: !!p?.hasNonUni,
        isPrimary: p?.isPrimary !== false,
        routeChips: Array.isArray(p?.routeChips) ? p.routeChips : [],
      }));
    }

    const wt = norm(item?.title);
    return Object.values(PATHWAY_DEFINITIONS)
      .filter((p) => norm(p?.careerWorldTitle) === wt)
      .map((p) => ({ id: p?.title, title: p?.title, definition: p?.long || p?.paragraph || '' }));
  }, [isCareerWorld, item]);
  const selectionDefinition = getSelectionDefinition(item);

  const canonicalSignal = item?.canonicalSignal || item?.signal || {};
  const canonicalLabel = item?.signalLabel || canonicalSignal?.signalLabel || '';
  const canonicalBlocks = Number(item?.signalBlocks || canonicalSignal?.signalBlocks || 0);
  const labelFromBlocks = canonicalBlocks === 4
    ? 'Standout'
    : canonicalBlocks === 3
    ? 'Strong'
    : canonicalBlocks === 2
    ? 'Good'
    : canonicalBlocks === 1
    ? 'Lower'
    : '';
  const finalLabel = canonicalLabel || labelFromBlocks;
  const matchSignal = {
    label: finalLabel ? normaliseMatchLabel(finalLabel) : '',
    blocks: canonicalBlocks || blocksFromBand(finalLabel),
  };

  // Pathway Explorer view of a liked career world: show ONLY the pathways in
  // that world (each with its long definition, band and pills). The world's own
  // definition and pills now live in the Career Worlds accordion tab.
  if (isCareerWorld) {
    return (
      <article className="selection-detail-card">
        <div className="selection-definition-card__header">
          <SelectionTitle item={item} definition={selectionDefinition} />
          <div className="selection-detail-card__signal-wrap">
            <SignalBadge label={matchSignal.label} blocks={matchSignal.blocks} pct={item?.signalPct || item?.fitPct} />
          </div>
        </div>
        {worldPathways.length > 0 ? (
          <div className="selection-explorer__toolbar">
            <ResultsFilterBar
              filter={pathwayFilter}
              onChange={setPathwayFilter}
              groups={['route', 'band', 'favourites']}
            />
          </div>
        ) : null}
        {worldPathways.length > 0 ? (() => {
          const renderPathway = (pathway) => {
            const pk = String(pathway?.id || pathway?.title);
            return (
              <PathwayDefinitionItem
                key={`${item?.id}-${pk}`}
                item={pathway}
                open={openPathwayKey === pk}
                onToggle={() => setOpenPathwayKey((prev) => (prev === pk ? '' : pk))}
                onItemReaction={onItemReaction}
                savedReactions={savedReactions}
                nonUniRoutes={nonUniByTitle.get(normPathwayTitle(pathway?.title)) || []}
              />
            );
          };
          // One flat list, best match first. Route is shown by the chips on each
          // pathway, not by group headings.
          const visible = applyResultsFilter(
            worldPathways.slice().sort((a, b) => Number(b?.signalPct || 0) - Number(a?.signalPct || 0)),
            pathwayFilter,
            { isLiked: (p) => savedReactions[p?.id] === 'like' }
          );
          if (!visible.length) {
            return <p className="results-filter-empty">Nothing matches this filter. Try clearing a filter.</p>;
          }
          const strong = visible.filter((p) => bandRank(p?.signalLabel) !== 1);
          const lower = visible.filter((p) => bandRank(p?.signalLabel) === 1);
          const main = strong.length ? strong : lower;
          const extra = strong.length ? lower : [];
          return (
            <>
              <div className="pathway-role-list">{main.map(renderPathway)}</div>
              {extra.length ? (
                <>
                  <button
                    type="button"
                    className="nu-show-other"
                    onClick={() => setShowOtherPw((v) => !v)}
                    aria-expanded={showOtherPw}
                  >
                    {showOtherPw ? 'Hide' : 'Show'} other pathways in this career world ({extra.length})
                  </button>
                  {showOtherPw ? (
                    <div className="pathway-role-list">{extra.map(renderPathway)}</div>
                  ) : null}
                </>
              ) : null}
            </>
          );
        })() : (
          <p className="selection-explorer__empty-message">No pathways mapped for this world yet.</p>
        )}
      </article>
    );
  }

  return (
    <article className="selection-detail-card">
      <InsightDefinitionCard item={item} definition={selectionDefinition} matchSignal={matchSignal} />

      <ItemPills item={item} />

      {isPathway && Array.isArray(item?.roles) && item.roles.length > 0 && (
        <SectionAccordion title="Matching career roles within this pathway" defaultOpen={true} dividerTop={true}>
          <div className="pathway-role-list">
            {item.roles.map((role) => {
              const roleKey = `${item?.id}-${role?.id || role?.title}`;
              return (
                <RoleAccordionItem
                  key={roleKey}
                  item={role}
                  onItemReaction={onItemReaction}
                  savedReactions={savedReactions}
                  isOpen={openRoleKey === roleKey}
                  onToggle={() => setOpenRoleKey((prev) => (prev === roleKey ? '' : roleKey))}
                />
              );
            })}
          </div>
        </SectionAccordion>
      )}
    </article>
  );
}

export default function SelectionInsightExplorer({ insights, loading, error, onItemReaction, savedReactions = {} }) {
  const explorerRef = React.useRef(null);
  const validInsights = Array.isArray(insights) ? insights : [];
  const [activeId, setActiveId] = useState(validInsights[0]?.id || validInsights[0]?.title || '');

  // Load non-university routes so each pathway can show its ways in without a
  // degree alongside its degree routes (the unified pathway model).
  const [nonUniData, setNonUniData] = useState(() => peekNonUniRoutes());
  useEffect(() => {
    let cancelled = false;
    if (peekNonUniRoutes()) { setNonUniData(peekNonUniRoutes()); return undefined; }
    (async () => {
      try { const d = await fetchNonUniRoutes(); if (!cancelled) setNonUniData(d); } catch (e) { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, []);
  const nonUniByTitle = useMemo(() => {
    const map = new Map();
    const routes = (nonUniData && Array.isArray(nonUniData.routes)) ? nonUniData.routes : [];
    for (const r of routes) {
      if (r.entryStage === 'progression') continue;
      const k = normPathwayTitle(r.pathway);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    // Show lowest level first within each pathway.
    const rank = { L2: 2, L3: 3, L4: 4, L5: 5, L6: 6, L7: 7 };
    for (const arr of map.values()) {
      arr.sort((a, b) => (rank[String(a.standardLevel || '').toUpperCase()] || 99) - (rank[String(b.standardLevel || '').toUpperCase()] || 99));
    }
    return map;
  }, [nonUniData]);

  useEffect(() => {
    const root = explorerRef.current;
    if (!root) return undefined;

    const getTarget = (event) => (
      event.target instanceof Element
        ? event.target.closest('[data-selection-tooltip="true"]')
        : null
    );

    const handlePointerOver = (event) => {
      const target = getTarget(event);
      if (target instanceof HTMLElement) showSelectionTooltip(target);
    };

    const handlePointerOut = (event) => {
      const target = getTarget(event);
      if (target instanceof HTMLElement) hideSelectionTooltip();
    };

    const handleFocusIn = (event) => {
      const target = getTarget(event);
      if (target instanceof HTMLElement) showSelectionTooltip(target);
    };

    const handleFocusOut = (event) => {
      const target = getTarget(event);
      if (target instanceof HTMLElement) hideSelectionTooltip();
    };

    // Click PINS the tooltip open (stays until ×, outside click, or Escape).
    const handleClick = (event) => {
      const target = getTarget(event);
      if (!(target instanceof HTMLElement)) return;
      showSelectionTooltip(target, { pinned: true });
    };

    root.addEventListener('pointerover', handlePointerOver);
    root.addEventListener('pointerout', handlePointerOut);
    root.addEventListener('focusin', handleFocusIn);
    root.addEventListener('focusout', handleFocusOut);
    root.addEventListener('click', handleClick);
    window.addEventListener('scroll', hideSelectionTooltip, { passive: true });
    window.addEventListener('resize', hideSelectionTooltip);

    return () => {
      root.removeEventListener('pointerover', handlePointerOver);
      root.removeEventListener('pointerout', handlePointerOut);
      root.removeEventListener('focusin', handleFocusIn);
      root.removeEventListener('focusout', handleFocusOut);
      root.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', hideSelectionTooltip);
      window.removeEventListener('resize', hideSelectionTooltip);
      hideSelectionTooltip();
    };
  }, [loading, error, validInsights.length]);

  useEffect(() => {
    const nextDefault = validInsights[0]?.id || validInsights[0]?.title || '';
    if (!validInsights.length) {
      setActiveId('');
      return;
    }
    const stillExists = validInsights.some((candidate) => (candidate?.id || candidate?.title) === activeId);
    if (!stillExists) setActiveId(nextDefault);
  }, [validInsights, activeId]);

  // No auto-scroll on selection change — the active item can change on its own
  // as data settles, which was scrolling the page on arrival.
  const mainRef = useRef(null);

  if (loading) {
    return (
      <section className="selection-explorer selection-explorer--loading">
        <div className="selection-explorer__intro">
          <h2>Your career pathways</h2>
          <p>Loading the deeper signature fit for the options you liked...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="selection-explorer">
        <div className="selection-explorer__intro">
          <h2>Your career pathways</h2>
          <p className="selection-explorer__error">{error}</p>
        </div>
      </section>
    );
  }

  if (!validInsights.length) {
    return (
      <section className="selection-explorer selection-explorer--empty">
        <div className="selection-explorer__intro selection-explorer__intro--empty">
          <h2>Your career pathways</h2>
          <p className="selection-explorer__empty-message">
            Like the career worlds you&rsquo;re drawn to in the Career Worlds tab, then come back here to explore the career pathways inside each one.
          </p>
        </div>
      </section>
    );
  }

  const activeItem = validInsights.find((candidate) => (candidate?.id || candidate?.title) === activeId) || validInsights[0];
  const firstItem = validInsights[0] || {};
  const isPathwayMode = Boolean(firstItem?.isPathway) || firstItem?.type === 'pathway' || firstItem?.type === 'role';

  return (
    <section ref={explorerRef} className="selection-explorer">
      <div className="selection-explorer__intro selection-explorer__intro--active">
        <h2>Explore career pathways</h2>
        {isPathwayMode ? (
          <p className="selection-explorer__intro-text">
            The career pathways and graduate roles most aligned with the options you liked. Pick a tab to see each pathway, how well it fits your CareerDNA, and the ways you can get in.
          </p>
        ) : (
          <>
            <p className="selection-explorer__intro-text">
              A career pathway is a more specific direction within a career world, a family of related jobs that share similar skills and training. Pick one of the career worlds you liked to see its pathways, then open any pathway to read what the work involves, how strongly it matches your profile, and the ways you can get in.
            </p>
            <p className="selection-explorer__intro-text">
              Every pathway shows both kinds of route where they exist: the university degrees that lead to it, and the apprenticeships and other ways in that do not need a degree, so you can explore it whether or not you have decided on university.
            </p>
          </>
        )}
      </div>

      {(() => {
      // Split the liked worlds into standard (degree-optional) worlds and the
      // vocational "no degree needed" worlds, so the picker groups them the same
      // way everywhere. Vocational worlds carry a voc_ id.
      const isVoc = (c) => String(c?.careerWorldId || c?.id || '').startsWith('voc_');
      // Selected world pills ordered by match strength (Standout first).
      const byStrength = (a, b) => bandRank(b?.signalLabel) - bandRank(a?.signalLabel);
      const academicInsights = validInsights.filter((c) => !isVoc(c)).sort(byStrength);
      const vocInsights = validInsights.filter((c) => isVoc(c)).sort(byStrength);
      const orderedInsights = [...academicInsights, ...vocInsights];
      const activeKey = activeItem?.id || activeItem?.title;
      const renderChip = (candidate) => {
        const key = candidate?.id || candidate?.title;
        return (
          <SelectionListButton
            key={key}
            item={candidate}
            active={key === activeKey}
            onClick={() => setActiveId(key)}
          />
        );
      };
      return (
      <div className="selection-explorer__layout selection-explorer__layout--stacked">
        {/* Desktop / iPad: a modern custom dropdown (shown via CSS on larger screens). */}
        <div className="selection-explorer__selector-select-wrap">
          <OptionDropdown
            options={orderedInsights.map((candidate) => ({
              key: candidate?.id || candidate?.title,
              title: candidate?.title,
            }))}
            activeKey={activeKey || ''}
            onSelect={setActiveId}
          />
        </div>

        {/* Desktop / tablet: equal-width pills in a tidy grid. */}
        <div className="selection-explorer__selector-tabs" role="tablist" aria-label="Selected options">
          {academicInsights.map(renderChip)}
          {vocInsights.length ? (
            <div className="nu-voc-label">No degree needed</div>
          ) : null}
          {vocInsights.map(renderChip)}
        </div>

        <div ref={mainRef} className="selection-explorer__main selection-explorer__main--full">
          <DetailPanel item={activeItem} onItemReaction={onItemReaction} savedReactions={savedReactions} nonUniByTitle={nonUniByTitle} />
        </div>
      </div>
      );
      })()}
    </section>
  );
}
