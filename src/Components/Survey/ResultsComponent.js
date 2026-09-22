// src/Components/Survey/ResultsComponent.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './ResultsComponent.css';
import ReportLimitModal from '../Common/ReportLimitModal';
import BarChart from './BarChart';
import { renderSafeMarkdown } from '../../utils/renderSafeMarkdown';
import Button from '../Common/Button';
import dnaWhiteLogo from '../../Assets/images/logo-dna-white.png';

import DimensionsCarousel from './DimensionsCarousel';
import SwipeDeck from './SwipeDeck';
import DIMENSIONS from '../../utils/Dimensions';
import ClarityChart from './ClarityChart';
import SelectionInsightExplorer from './SelectionInsightExplorer';
import CareerAdvisorChat from '../Advisor/CareerAdvisorChat';
import SectionAdvisor from '../Advisor/SectionAdvisor';
import { fetchSelectionInsights } from '../../utils/fetchSelectionInsights';
import CareerWorldsAccordion from './CareerWorldsAccordion';
import ResultsFilterBar, { emptyFilter as emptyResultsFilter } from './ResultsFilter';
import { CAREER_WORLD_SHORT_DEFINITIONS, CAREER_WORLD_LONG_DEFINITIONS, CAREER_WORLD_DEFINITIONS, PATHWAY_DEFINITIONS, PATHWAY_UNI_LONG_DEFINITIONS } from '../../utils/selectionDefinitions';
import FurtherStudyPanel from './FurtherStudyPanel';
import NonUniversityPanel from './NonUniversityPanel';
import RoleExplorerPanel from './RoleExplorerPanel';
import { getMyProfile } from '../../utils/profile';
import { supabase } from '../../utils/supabaseClient';
import { applyCouponCode } from '../../utils/applyCoupon';
import { getStrengthIcon, getEnvironmentIcon, getCareerWorldIcon, getPathwayIcon } from '../../utils/iconMap';
import { ThumbsUp, ThumbsDown } from 'phosphor-react';
import { getProfileQualityGateMessage } from '../../utils/profileQualityGate';

// Per-section contextual advisor config: which analysis tabs get an inline
// "ask the advisor" panel, the section tag used to store/filter its own thread,
// and the tailored starter questions shown there.
const SECTION_ADVISOR_CONFIG = {
  strengths: {
    section: 'strengths',
    title: 'your strengths',
    questions: [
      'Why do my strengths matter for my career?',
      'Which careers make the most of my top strengths?',
      'How can I develop my strengths further?',
      'Which of my strengths are most in demand?',
    ],
  },
  environments: {
    section: 'environments',
    title: 'your ideal environments',
    questions: [
      'Which careers match the environments I prefer?',
      'What work settings would suit me best?',
      'How do I find roles that offer these conditions?',
      'Which environments should I prioritise?',
    ],
  },
  careerworlds: {
    section: 'careerworlds',
    title: 'your career worlds',
    questions: [
      'Why do these career worlds fit me?',
      'How do I get into my top career world?',
      'Which of these worlds has the best prospects?',
      'Compare my top two career worlds for me.',
    ],
  },
  pathways: {
    section: 'pathways',
    title: 'your career pathways',
    questions: [
      'What is the difference between a career pathway and the roles within it?',
      'What roles does each pathway lead to?',
      'What do I need to do to prepare for my top pathways?',
      'How do I know which pathway fits me best?',
    ],
  },
  roleexplorer: {
    section: 'roles',
    title: 'these roles',
    questions: [
      'What is a typical day in these roles?',
      'How do I get into these roles?',
      'Which of these roles is most in demand?',
      'What skills do I need for these roles?',
    ],
  },
  discovermore: {
    section: 'discovermore',
    title: 'your career pathways',
    questions: [
      'What is the difference between a career world and a career pathway?',
      'What types of roles does each pathway lead to?',
      'How do I know which pathway fits me best?',
    ],
  },
  furtherstudy: {
    section: 'furtherstudy',
    title: 'these study routes',
    questions: [
      'Which of these degrees fits me best?',
      'What A-levels do I need for these degrees?',
      'What careers do these degrees lead to?',
      'How do I choose between these degrees?',
    ],
  },
  nonuni: {
    section: 'nonuni',
    title: 'training and work routes',
    questions: [
      'Which of these apprenticeships suits me best?',
      'How do apprenticeships compare to university for me?',
      'How do I find and apply for these apprenticeships?',
      'Which of these routes has the best prospects?',
    ],
  },
};

/* ---------- helpers ---------- */
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

const makeNameToKeyMap = (dimensionsArray) => {
  const map = Object.create(null);
  (Array.isArray(dimensionsArray) ? dimensionsArray : []).forEach((dim) => {
    (dim.subdimensions || []).forEach((sd) => {
      map[norm(sd.label)] = sd.key;
    });
  });
  return map;
};

const buildScoresForChartFromRows = (rows, dimensionsArray) => {
  const nameToKey = makeNameToKeyMap(dimensionsArray);
  const out = Object.create(null);
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    const key = nameToKey[norm(r.name)];
    if (key) out[key] = Number(r.score_pct ?? r.score ?? 0);
  });
  return out;
};



const ANALYSIS_LOADER_STAGES = [
  'Reading your results',
  'Building your CareerDNA profile',
  'Matching your profile to future options',
  'Writing your personalised analysis',
  'Preparing your selection insights',
  'Finalising your report',
];

const ANALYSIS_LOADER_STAGE_DELAYS = [15000, 15000, 15000, 15000, 15000];

function LoadingSpinnerWithProgress() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (activeStage >= ANALYSIS_LOADER_STAGES.length - 1) return undefined;

    const delay = ANALYSIS_LOADER_STAGE_DELAYS[activeStage] || 15000;
    const t = setTimeout(() => {
      setActiveStage((prev) => Math.min(prev + 1, ANALYSIS_LOADER_STAGES.length - 1));
    }, delay);

    return () => clearTimeout(t);
  }, [activeStage]);

  return (
    <div className="analysis-loader analysis-loader--staged">
      <div className="staged-loader-orb" aria-hidden="true">
        <span className="staged-loader-orb__ring" />
        <span className="staged-loader-orb__dot">
          <span className="staged-loader-orb__logo-wrap" aria-hidden="true">
            <img src={dnaWhiteLogo} alt="" className="staged-loader-orb__logo" />
            <span className="staged-loader-orb__logo-sheen" />
          </span>
        </span>
      </div>

      <div className="staged-loader-content" aria-live="polite">
        <h3 className="staged-loader-title">
          Creating your analysis
        </h3>

        <p key={ANALYSIS_LOADER_STAGES[activeStage]} className="staged-loader-eyebrow">
          {ANALYSIS_LOADER_STAGES[activeStage]}
        </p>

        <div className="staged-loader-progress-dots" aria-hidden="true">
          {ANALYSIS_LOADER_STAGES.map((stage, index) => (
            <span
              key={stage}
              className={`staged-loader-progress-dot ${index <= activeStage ? 'is-active' : ''}`}
            />
          ))}
        </div>

        <p className="staged-loader-text">
          This may take up to a minute or two. Please don’t leave or refresh this page. Your report will appear here as soon as it’s ready.
        </p>
      </div>
    </div>
  );
}

function normaliseName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '');
  return trimmed
    .split(' ')
    .map((t) => t.split('-').map(cap).join('-'))
    .join(' ');
}

function getFirstName(raw) {
  const normalized = normaliseName(raw);
  if (!normalized) return '';
  const first = normalized.split(' ')[0]?.trim() || '';
  return first.length >= 2 ? first : '';
}

function normalizeHeading(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function normalizeSignalTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}


function escapeHtmlAttr(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const SECTION_SIGNAL_KEYS = {
  strengths: ['strengths'],
  idealenvironments: ['environments'],
  environments: ['environments'],
  workenvironments: ['environments'],
  workstyles: ['environments'],
  careerworlds: ['careerWorlds'],
  careerworldsmostalignedwithyourinterestarea: ['careerWorldsAligned', 'career_worlds_aligned', 'careerWorlds'],
  othercareerworldstoexplore: ['careerWorldsOther', 'career_worlds_other', 'careerWorlds'],
  universitysubjectsbestfit: ['subjectsBestFit', 'subjects_best_fit', 'broad_subjects', 'subjects'],
  otherstrongoptionstoexplore: ['subjectsOther', 'subjects_other', 'subjects'],
  moreadjacentoptionstoexplore: ['subjectsOther', 'subjects_other', 'subjects'],
  universitysubjectsmostalignedwithyourinterestarea: ['subjectsAligned', 'subjects_aligned', 'broad_subjects', 'subjects'],
  otheruniversitysubjectsworthexploring: ['subjectsExploratory', 'subjects_exploratory', 'subjects'],
  otherspecialistoptionstoexplore: ['specialistSubjects', 'specialist_subjects', 'subjects'],
  careerpathways: ['pathways', 'roles'],
  careerpathwaysmostalignedwithyoursubjectarea: ['pathwaysAligned', 'pathways_aligned', 'rolesAligned', 'roles_aligned', 'pathways', 'roles'],
  adjacentcareerpathwaystoexplore: ['pathwaysAdjacent', 'pathways_adjacent', 'rolesAdjacent', 'roles_adjacent', 'pathways', 'roles'],
};



const SECTION_DEFINITIONS = {
  strengths:
    'Your strengths are the natural advantages you are most likely to bring into learning, work and life. They come from your underlying traits and patterns, including how you think, solve problems, work with others and stay motivated. These are areas where you can build confidence over time, especially when you keep developing them deliberately.',
  idealenvironments:
    'Your work styles show the kinds of settings and ways of working where you are most likely to feel comfortable and perform at your best. They are shaped by your whole profile, including your traits, what motivates you and how you prefer to work.',
  environments:
    'Your work styles show the kinds of settings and ways of working where you are most likely to feel comfortable and perform at your best. They are shaped by your whole profile, including your traits, what motivates you and how you prefer to work.',
  workenvironments:
    'Your work styles show the kinds of settings and ways of working where you are most likely to feel comfortable and perform at your best. They are shaped by your whole profile, including your traits, what motivates you and how you prefer to work.',
  workstyles:
    'Your work styles show the kinds of settings and ways of working where you are most likely to feel comfortable and perform at your best. They are shaped by your whole profile, including your traits, what motivates you and how you prefer to work.',
  careerworlds:
    'Career worlds are broad areas of work that may suit how you naturally think, learn and engage with tasks. For school students, they help connect your profile to future possibilities and can guide which subjects or study areas may be worth exploring further.',
  careerpathways:
    'Career pathways are more specific areas of work within broader career worlds. For university students, they help connect your profile and current study direction to suitable graduate opportunities.',
};

const SELECTABLE_SECTION_CONFIG = {
  strengths: { keys: ['strengths'], type: 'strength', insightEnabled: false },
  idealenvironments: { keys: ['environments'], type: 'environment', insightEnabled: false },
  environments: { keys: ['environments'], type: 'environment', insightEnabled: false },
  workenvironments: { keys: ['environments'], type: 'environment', insightEnabled: false },
  workstyles: { keys: ['environments'], type: 'environment', insightEnabled: false },
  careerworlds: { keys: ['careerWorlds'], type: 'career_world' },
  careerworldsmostalignedwithyourinterestarea: { keys: ['careerWorldsAligned', 'career_worlds_aligned', 'careerWorlds'], type: 'career_world' },
  othercareerworldstoexplore: { keys: ['careerWorldsOther', 'career_worlds_other', 'careerWorlds'], type: 'career_world' },
  othercareerworldslowermatch: { keys: ['careerWorldsLower', 'career_worlds_lower'], type: 'career_world' },
  universitysubjectsbestfit: { keys: ['subjectsBestFit', 'subjects_best_fit', 'broad_subjects', 'subjects'], type: 'subject' },
  otherstrongoptionstoexplore: { keys: ['subjectsOther', 'subjects_other', 'subjects'], type: 'subject' },
  moreadjacentoptionstoexplore: { keys: ['subjectsOther', 'subjects_other', 'subjects'], type: 'subject' },
  universitysubjectsmostalignedwithyourinterestarea: { keys: ['subjectsAligned', 'subjects_aligned', 'broad_subjects', 'subjects'], type: 'subject' },
  otheruniversitysubjectsworthexploring: { keys: ['subjectsExploratory', 'subjects_exploratory', 'subjects'], type: 'subject' },
  otherspecialistoptionstoexplore: { keys: ['specialistSubjects', 'specialist_subjects', 'subjects'], type: 'subject' },
  careerpathways: { keys: ['pathways', 'roles'], type: 'pathway' },
  careerpathwaysmostalignedwithyoursubjectarea: { keys: ['pathwaysAligned', 'pathways_aligned', 'rolesAligned', 'roles_aligned', 'pathways', 'roles'], type: 'pathway' },
  adjacentcareerpathwaystoexplore: { keys: ['pathwaysAdjacent', 'pathways_adjacent', 'rolesAdjacent', 'roles_adjacent'], type: 'pathway' },
};

function extractSignalTitleFromListItem(li) {
  if (!li) return '';
  const strong = li.querySelector('strong');
  if (strong) return normalizeSignalTitle(strong.textContent.replace(/:\s*$/, ''));
  const raw = (li.textContent || '').split(':')[0] || '';
  return normalizeSignalTitle(raw);
}

function buildSignalMaps(analysisMeta) {
  const sections = analysisMeta?.sections || {};
  const out = {};
  Object.entries(sections).forEach(([key, rows]) => {
    out[key] = new Map(
      (Array.isArray(rows) ? rows : []).map((row) => [normalizeSignalTitle(row?.title), row])
    );
  });
  return out;
}

function makeSelectableItemId(sectionKey, title) {
  return `${sectionKey}::${normalizeSignalTitle(title)}`;
}


function normaliseMatchLabel(raw = '') {
  const value = String(raw || '').trim();
  if (!value) return '';
  return /match$/i.test(value) ? value : `${value} match`;
}

function getMatchTooltipBody(label = '') {
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

  return 'Shows how closely this option aligns with your CareerDNA profile.';
}

function getReactionCopy(normalizedHeading = '', itemTitle = '') {
  const titleSuffix = itemTitle ? `: ${itemTitle}` : '';
  const discoverMoreHeadings = new Set([
    'careerworlds',
    'careerworldsmostalignedwithyourinterestarea',
    'othercareerworldstoexplore',
    'careerpathways',
    'careerpathwaysmostalignedwithyoursubjectarea',
    'adjacentcareerpathwaystoexplore',
  ]);

  if (normalizedHeading === 'strengths' || normalizedHeading === 'idealenvironments' || normalizedHeading === 'environments' || normalizedHeading === 'workenvironments' || normalizedHeading === 'workstyles') {
    return {
      like: 'Sounds like me',
      dislike: 'Not me',
      likeActive: 'Sounds like me',
      dislikeActive: 'Not me',
      likeAria: `Sounds like me${titleSuffix}`,
      dislikeAria: `Not me${titleSuffix}`,
    };
  }

  if (discoverMoreHeadings.has(normalizedHeading)) {
    return {
      like: 'Sounds interesting',
      dislike: 'Not for me',
      likeActive: 'Added to favourites',
      dislikeActive: 'Not for me',
      likeAria: `Sounds interesting${titleSuffix}`,
      dislikeAria: `Not for me${titleSuffix}`,
    };
  }

  return {
    like: 'Sounds interesting',
    dislike: 'Not for me',
    likeActive: 'Sounds interesting',
    dislikeActive: 'Not for me',
    likeAria: `Sounds interesting${titleSuffix}`,
    dislikeAria: `Not for me${titleSuffix}`,
  };
}

function makeReactionsStorageKey(analysisMeta = {}) {
  const reportId = analysisMeta?.reportId || analysisMeta?.assessmentRunId || analysisMeta?.runId || analysisMeta?.id || 'latest';
  return `careerdna:itemReactions:${reportId}`;
}


function makeOverallFeedbackStorageKey(analysisMeta = {}) {
  const reportId = analysisMeta?.reportId || analysisMeta?.assessmentRunId || analysisMeta?.runId || analysisMeta?.id || 'latest';
  return `careerdna:overallFeedback:${reportId}`;
}

async function saveResultFeedbackRow(payload = {}) {
  const {
    userId,
    assessmentRunId,
    feedbackScope,
    itemType = null,
    itemId = null,
    itemTitle = null,
    reaction = null,
    rating = null,
    comment = null,
    remove = false,
  } = payload;

  if (!userId || !assessmentRunId || !feedbackScope) return { skipped: true };

  const baseQuery = () => {
    let query = supabase
      .from('result_feedback')
      .select('id')
      .eq('user_id', userId)
      .eq('assessment_run_id', assessmentRunId)
      .eq('feedback_scope', feedbackScope);

    if (feedbackScope === 'item_reaction') {
      query = query.eq('item_type', itemType).eq('item_id', itemId);
    }

    return query.maybeSingle();
  };

  if (remove && feedbackScope === 'item_reaction') {
    const existing = await baseQuery();
    if (existing.error) throw existing.error;
    if (!existing.data?.id) return { removed: false };

    const { error } = await supabase
      .from('result_feedback')
      .delete()
      .eq('id', existing.data.id);

    if (error) throw error;
    return { removed: true };
  }

  const row = {
    user_id: userId,
    assessment_run_id: assessmentRunId,
    feedback_scope: feedbackScope,
    item_type: itemType,
    item_id: itemId,
    item_title: itemTitle,
    reaction,
    rating,
    comment,
    updated_at: new Date().toISOString(),
  };

  const existing = await baseQuery();
  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const { error } = await supabase
      .from('result_feedback')
      .update(row)
      .eq('id', existing.data.id);
    if (error) throw error;
    return { updated: true };
  }

  const { error } = await supabase
    .from('result_feedback')
    .insert(row);

  if (error) throw error;
  return { inserted: true };
}

function extractCanonicalSignalFromItem(item = {}) {
  const signal = item?.canonicalSignal || item?.signal || {};
  return {
    signalLabel: item?.signalLabel || signal?.signalLabel || '',
    signalBlocks: Number(item?.signalBlocks || signal?.signalBlocks || 0),
    signalPct: Number(item?.signalPct || signal?.signalPct || 0),
    fitPct: Number(item?.fitPct || signal?.fitPct || 0),
    coveragePct: Number(item?.coveragePct || signal?.coveragePct || 0),
    coreCoverageRatio: Number(item?.coreCoverageRatio || signal?.coreCoverageRatio || 0),
  };
}

function mergeInsightWithSourceSignal(insight = {}, sourceItem = {}) {
  const sourceSignal = extractCanonicalSignalFromItem(sourceItem);
  const insightSignal = extractCanonicalSignalFromItem(insight);

  const signalLabel = insightSignal.signalLabel || sourceSignal.signalLabel || '';
  const signalBlocks = Number(insightSignal.signalBlocks || sourceSignal.signalBlocks || 0);
  const signalPct = Number(insightSignal.signalPct || sourceSignal.signalPct || 0);
  const fitPct = Number(insightSignal.fitPct || sourceSignal.fitPct || 0);
  const coveragePct = Number(insightSignal.coveragePct || sourceSignal.coveragePct || 0);
  const coreCoverageRatio = Number(insightSignal.coreCoverageRatio || sourceSignal.coreCoverageRatio || 0);

  return {
    ...insight,
    signalLabel,
    signalBlocks,
    signalPct,
    fitPct,
    coveragePct,
    coreCoverageRatio,
    canonicalSignal: {
      signalLabel,
      signalBlocks,
      signalPct,
      fitPct,
      coveragePct,
      coreCoverageRatio,
    },
  };
}

function extractSelectableItems(analysisMeta) {
  const sections = analysisMeta?.sections || {};
  const out = [];

  Object.entries(SELECTABLE_SECTION_CONFIG).forEach(([sectionKey, config]) => {
    const rows =
      config.keys
        .map((key) => sections[key])
        .find((candidate) => Array.isArray(candidate) && candidate.length) || [];

    rows.forEach((row) => {
      const title = String(row?.title || '').trim();
      if (!title) return;

      const canonicalSignal = extractCanonicalSignalFromItem(row);

      out.push({
        id: row?.id || makeSelectableItemId(sectionKey, title),
        title,
        // Prefer the section config type — for undergraduates the backend labels
        // pathway cards as 'role', but here they must be 'pathway' (roles are the
        // deeper level shown inside Discover More).
        type: config.type || row?.type,
        sourceSection: sectionKey,
        signalLabel: canonicalSignal.signalLabel,
        signalBlocks: canonicalSignal.signalBlocks,
        signalPct: canonicalSignal.signalPct,
        fitPct: canonicalSignal.fitPct,
        coveragePct: canonicalSignal.coveragePct,
        coreCoverageRatio: canonicalSignal.coreCoverageRatio,
        canonicalSignal,
        careerWorldId: row?.careerWorldId || '',
        careerWorldTitle: row?.careerWorldTitle || '',
        familyTitle: row?.familyTitle || '',
        insightEnabled: config.insightEnabled !== false,
      });
    });
  });

  return out;
}

function buildSelectableMaps(analysisMeta) {
  const items = extractSelectableItems(analysisMeta);
  const bySection = {};
  const byId = new Map();

  items.forEach((item) => {
    const sectionMap = bySection[item.sourceSection] || new Map();
    sectionMap.set(normalizeSignalTitle(item.title), item);
    bySection[item.sourceSection] = sectionMap;
    byId.set(item.id, item);
  });

  return { items, bySection, byId };
}




function getIconRendererForHeading(normalizedHeading = '') {
  if (normalizedHeading === 'strengths') return getStrengthIcon;
  if (normalizedHeading === 'idealenvironments' || normalizedHeading === 'environments' || normalizedHeading === 'workenvironments' || normalizedHeading === 'workstyles') return getEnvironmentIcon;
  if (
    normalizedHeading === 'careerworlds' ||
    normalizedHeading === 'careerworldsmostalignedwithyourinterestarea' ||
    normalizedHeading === 'othercareerworldstoexplore'
  ) {
    return getCareerWorldIcon;
  }
  if (
    normalizedHeading === 'careerpathways' ||
    normalizedHeading === 'careerpathwaysmostalignedwithyoursubjectarea' ||
    normalizedHeading === 'adjacentcareerpathwaystoexplore' ||
    normalizedHeading === 'universitysubjectsbestfit' ||
    normalizedHeading === 'otherstrongoptionstoexplore' ||
    normalizedHeading === 'moreadjacentoptionstoexplore' ||
    normalizedHeading === 'universitysubjectsmostalignedwithyourinterestarea' ||
    normalizedHeading === 'otheruniversitysubjectsworthexploring' ||
    normalizedHeading === 'otherspecialistoptionstoexplore'
  ) {
    return getPathwayIcon;
  }
  return null;
}


function getOrCreateFeedbackTooltip() {
  let el = document.querySelector('.cdna-feedback-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.className = 'cdna-feedback-tooltip';
    document.body.appendChild(el);
  }
  return el;
}

function hideFeedbackTooltip() {
  const el = document.querySelector('.cdna-feedback-tooltip');
  if (el) el.style.opacity = '0';
}

function showFloatingTooltipForElement(target) {
  if (!(target instanceof HTMLElement)) return;
  const text = target.getAttribute('data-tooltip');
  if (!text) return;

  const title = target.getAttribute('data-tooltip-title') || '';
  const el = getOrCreateFeedbackTooltip();

  if (title) {
    el.innerHTML = `
      <span class="cdna-feedback-tooltip__headline">${escapeHtmlAttr(title)}</span>
      <span class="cdna-feedback-tooltip__body">${escapeHtmlAttr(text)}</span>
    `;
  } else {
    el.textContent = text;
  }

  const rect = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

  el.style.opacity = '0';
  el.style.left = '0px';
  el.style.top = '0px';

  const tooltipWidth = el.offsetWidth || 180;
  const tooltipHeight = el.offsetHeight || 40;
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - tooltipWidth / 2, 12),
    Math.max(viewportWidth - tooltipWidth - 12, 12)
  );

  const preferredTop = rect.top - tooltipHeight - 10;
  const fallbackTop = rect.bottom + 10;
  const top = preferredTop >= 8
    ? preferredTop
    : Math.min(Math.max(fallbackTop, 8), Math.max(viewportHeight - tooltipHeight - 8, 8));

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.opacity = '1';
}

function showFeedbackTooltipForButton(button) {
  showFloatingTooltipForElement(button);
}

// Map a 0-100 subdimension score to a tier key (matches the pill bands elsewhere).
function strengthTraitTier(score) {
  const s = Number(score) || 0;
  if (s >= 70) return 'standout';
  if (s >= 60) return 'strong';
  if (s >= 50) return 'good';
  return 'lower';
}

// Replace inline mentions of subdimension names in a strength's narrative with the
// same coloured trait pills, so "your Data Curiosity" becomes the actual pill.
function pillifyStrengthNarrative(li, subdimScores = {}) {
  // The narrative uses subdimension DISPLAY labels ("Analytical Curiosity"); the
  // score map is keyed by camelCase keys ("analyticalCuriosity"). Match labels,
  // then look up the score via the label->key map.
  const dims = Array.isArray(DIMENSIONS) ? DIMENSIONS : [];
  const nameToKey = makeNameToKeyMap(dims);
  const labels = [];
  dims.forEach((d) => (d.subdimensions || []).forEach((s) => { if (s?.label) labels.push(s.label); }));
  if (!labels.length) return;
  const scoreFor = (label) => {
    const key = nameToKey[norm(label)];
    return key ? subdimScores[key] : undefined;
  };
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ordered = [...new Set(labels)].sort((a, b) => b.length - a.length);
  const re = new RegExp('(' + ordered.map(escapeRe).join('|') + ')', 'g');

  const textNodes = [];
  const collect = (node) => {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3) {
        textNodes.push(child);
      } else if (child.nodeType === 1) {
        const el = child;
        if (el.tagName === 'STRONG') continue; // keep the title untouched
        if (el.classList && (
          el.classList.contains('cdna-strength-traits') ||
          el.classList.contains('cdna-card-icon') ||
          el.classList.contains('cdna-strength-icon') ||
          el.classList.contains('cdna-item-rail') ||
          el.classList.contains('cdna-strength-trait')
        )) continue;
        collect(el);
      }
    }
  };
  collect(li);

  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue;
    re.lastIndex = 0;
    if (!re.test(text)) return;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const name = m[0];
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const span = document.createElement('span');
      span.className = 'cdna-strength-trait-text';
      span.textContent = name;
      frag.appendChild(span);
      last = m.index + name.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
  });
}

// Summary paragraph: bold + green every profile (archetype) name and
// dimension/subdimension name, matching the match-narrative treatment. Profile
// names arrive already bold (from markdown **Creator**), so we just recolour
// those; plain trait names get wrapped.
const SUMMARY_PROFILE_NAMES = ['Achiever', 'Connector', 'Creator', 'Explorer', 'Organizer', 'Thinker', 'Visionary'];

function greenifyProfileAndTraitNames(container) {
  if (!container) return;
  const dims = Array.isArray(DIMENSIONS) ? DIMENSIONS : [];
  const labels = [...SUMMARY_PROFILE_NAMES];
  dims.forEach((d) => (d.subdimensions || []).forEach((s) => { if (s?.label) labels.push(s.label); }));
  if (!labels.length) return;
  const nameSet = new Set(labels.map((l) => l.toLowerCase()));
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ordered = [...new Set(labels)].sort((a, b) => b.length - a.length);
  const re = new RegExp('(' + ordered.map(escapeRe).join('|') + ')', 'g');

  // Existing bold profile/trait names -> recolour green.
  container.querySelectorAll('strong, b').forEach((el) => {
    if (nameSet.has(String(el.textContent || '').trim().toLowerCase())) {
      el.classList.add('cdna-strength-trait-text');
    }
  });

  // Plain-text occurrences -> wrap in a bold-green span.
  const textNodes = [];
  const collect = (node) => {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 3) {
        textNodes.push(child);
      } else if (child.nodeType === 1) {
        const el = child;
        if (el.tagName === 'STRONG' || el.tagName === 'B') continue;
        if (el.classList && el.classList.contains('cdna-strength-trait-text')) continue;
        collect(el);
      }
    }
  };
  collect(container);

  textNodes.forEach((textNode) => {
    const text = textNode.nodeValue;
    re.lastIndex = 0;
    if (!re.test(text)) return;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const name = m[0];
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const span = document.createElement('span');
      span.className = 'cdna-strength-trait-text';
      span.textContent = name;
      frag.appendChild(span);
      last = m.index + name.length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (textNode.parentNode) textNode.parentNode.replaceChild(frag, textNode);
  });
}

function decorateAnalysisSignals(root, analysisMeta, itemReactions = {}, subdimScores = {}) {
  if (!root) return;

  root.querySelectorAll('.cdna-item-rail').forEach((node) => node.remove());
  root.querySelectorAll('.cdna-item-actions--bottom').forEach((node) => node.remove());
  root.querySelectorAll('.cdna-strength-traits').forEach((node) => node.remove());
  // Unwrap any previously-built strength header so re-decoration is idempotent.
  root.querySelectorAll('.cdna-strength-header').forEach((h) => {
    const parent = h.parentNode;
    if (!parent) return;
    while (h.firstChild) parent.insertBefore(h.firstChild, h);
    parent.removeChild(h);
  });
  root.querySelectorAll('.cdna-card-icon, .cdna-strength-icon').forEach((node) => node.remove());
  root.querySelectorAll('.cdna-signal-item').forEach((node) => node.classList.remove('cdna-signal-item'));
  root.querySelectorAll('.cdna-selectable-item').forEach((node) => node.classList.remove('cdna-selectable-item'));
  root.querySelectorAll('.cdna-card-list').forEach((node) => node.classList.remove('cdna-card-list'));
  root.querySelectorAll('.cdna-card-list--with-icons').forEach((node) => node.classList.remove('cdna-card-list--with-icons'));
  root.querySelectorAll('.cdna-card-list--strengths').forEach((node) => node.classList.remove('cdna-card-list--strengths'));
  root.querySelectorAll('.cdna-card-item').forEach((node) => node.classList.remove('cdna-card-item'));
  root.querySelectorAll('.cdna-card-item--with-icon').forEach((node) => node.classList.remove('cdna-card-item--with-icon'));
  root.querySelectorAll('.cdna-card-item--strength').forEach((node) => node.classList.remove('cdna-card-item--strength'));

  if (!analysisMeta?.sections) return;

  const sectionMaps = buildSignalMaps(analysisMeta);
  const selectableMaps = buildSelectableMaps(analysisMeta).bySection;
  const headings = Array.from(root.querySelectorAll('h2, h3'));

  root.querySelectorAll(':scope > ol, :scope > ul').forEach((list) => {
    list.classList.add('cdna-card-list');
    list.setAttribute('data-cards-layout', 'phone-v2');
    Array.from(list.querySelectorAll(':scope > li')).forEach((li) => {
      li.classList.add('cdna-card-item');

      // Keep the generated list number and the content on the same first line.
      // The markdown parser leaves the item text as loose child nodes, so we wrap
      // the original content once and let CSS place it in the second grid column.
      if (!li.querySelector(':scope > .cdna-item-content')) {
        const contentEl = document.createElement('div');
        contentEl.className = 'cdna-item-content';
        while (li.firstChild) {
          contentEl.appendChild(li.firstChild);
        }
        li.appendChild(contentEl);
      }
    });
  });

  headings.forEach((heading) => {
    const normalizedHeading = normalizeHeading(heading.textContent);

    const definitionText = SECTION_DEFINITIONS[normalizedHeading];
    if (definitionText && !heading.nextElementSibling?.classList?.contains('cdna-section-definition')) {
      const definitionEl = document.createElement('p');
      definitionEl.className = 'cdna-section-definition';
      definitionEl.textContent = definitionText;
      heading.insertAdjacentElement('afterend', definitionEl);
    }

    // Summary: bold + green the profile and dimension names in its paragraphs.
    if (normalizedHeading === 'summary') {
      let sib = heading.nextElementSibling;
      while (sib && !/^H[23]$/i.test(sib.tagName)) {
        greenifyProfileAndTraitNames(sib);
        sib = sib.nextElementSibling;
      }
    }

    const sectionCandidates = SECTION_SIGNAL_KEYS[normalizedHeading] || [];
    if (!sectionCandidates.length) return;
    const hideSignalsForSection =
      normalizedHeading === 'strengths' || normalizedHeading === 'idealenvironments' || normalizedHeading === 'environments' || normalizedHeading === 'workenvironments' || normalizedHeading === 'workstyles';

    let next = heading.nextElementSibling;
    while (next && !/^H[23]$/i.test(next.tagName)) {
      if (next.tagName === 'OL' || next.tagName === 'UL') break;
      next = next.nextElementSibling;
    }

    if (!next || (next.tagName !== 'OL' && next.tagName !== 'UL')) return;

    const iconRenderer = getIconRendererForHeading(normalizedHeading);
    if (iconRenderer) {
      next.classList.add('cdna-card-list--with-icons');
      if (normalizedHeading === 'strengths' || normalizedHeading === 'idealenvironments' || normalizedHeading === 'environments' || normalizedHeading === 'workenvironments' || normalizedHeading === 'workstyles') {
        next.classList.add('cdna-card-list--strengths');
      }
    }

    const titleMap = sectionCandidates
      .map((key) => sectionMaps[key])
      .find((map) => map && map.size) || null;

    const selectableMap = selectableMaps[normalizedHeading] || null;
    if (!titleMap && !selectableMap) return;

    Array.from(next.querySelectorAll(':scope > li')).forEach((li) => {
      const itemTitleKey = extractSignalTitleFromListItem(li);

      // Drop the colon the prose puts after the bold item title, whether it is
      // inside the bold ("Title:") or the text node right after it (": ...").
      const titleStrong = li.querySelector('strong');
      if (titleStrong) {
        titleStrong.textContent = titleStrong.textContent.replace(/\s*:\s*$/, '');
        const afterTitle = titleStrong.nextSibling;
        if (afterTitle && afterTitle.nodeType === 3) {
          afterTitle.textContent = afterTitle.textContent.replace(/^\s*:\s*/, ' ');
        }
      }

      if (iconRenderer) {
        li.classList.add('cdna-card-item--with-icon');
        if (hideSignalsForSection) {
          li.classList.add('cdna-card-item--strength');
        }

        const iconEl = document.createElement('span');
        iconEl.className = hideSignalsForSection ? 'cdna-card-icon cdna-strength-icon' : 'cdna-card-icon';
        createRoot(iconEl).render(iconRenderer(itemTitleKey));
        // Icon lives INSIDE the content (before the title) so it can sit to the
        // left of the title and, on phone, below the standout badge.
        const contentForIcon = li.querySelector(':scope > .cdna-item-content') || li;
        contentForIcon.insertBefore(iconEl, contentForIcon.firstChild);
      }

      // Strengths & Environments: put the icon + title on their own header row so
      // the paragraph starts full-width below (not wrapping around the floated icon),
      // then turn the trait names in the narrative into coloured pills.
      if (hideSignalsForSection) {
        const content = li.querySelector(':scope > .cdna-item-content') || li;
        const iconNode = content.querySelector(':scope > .cdna-card-icon');
        if (titleStrong) {
          const header = document.createElement('div');
          header.className = 'cdna-strength-header';
          if (iconNode) header.appendChild(iconNode);
          header.appendChild(titleStrong);
          content.insertBefore(header, content.firstChild);
          // The title's old wrapper is usually left behind empty, adding a big gap.
          // Remove every empty block (<p>/<br>/blank) left in the card body.
          content.querySelectorAll('br').forEach((br) => br.remove());
          content.querySelectorAll('p, div').forEach((el) => {
            if (el === header || el.contains(header)) return;
            if (!el.textContent.trim() && !el.querySelector('img,svg')) el.remove();
          });
        }
        pillifyStrengthNarrative(li, subdimScores);
      }

      const signal = titleMap?.get(itemTitleKey) || null;

      const railEl = document.createElement('div');
      railEl.className = 'cdna-item-rail';

      if (signal && !hideSignalsForSection) {
        const signalEl = document.createElement('div');
        signalEl.className = 'cdna-item-signal cdna-item-signal--has-tooltip';
        signalEl.tabIndex = 0;

        const displayLabel = normaliseMatchLabel(signal.signalLabel || 'Strong');
        const tooltipBody = getMatchTooltipBody(displayLabel);
        signalEl.setAttribute('aria-label', `${displayLabel}: ${tooltipBody}`);
        signalEl.setAttribute('data-tooltip-title', displayLabel);
        signalEl.setAttribute('data-tooltip', tooltipBody);

        signalEl.innerHTML = `
          <span class="cdna-item-signal-label">${escapeHtmlAttr(displayLabel)}</span>
          <span class="cdna-item-signal-blocks" aria-hidden="true">
            ${Array.from({ length: 4 }, (_, idx) => `<span class="cdna-item-signal-block ${idx < Number(signal.signalBlocks || 0) ? 'is-filled' : ''}"></span>`).join('')}
          </span>
        `;
        railEl.appendChild(signalEl);
      }

      // Strengths & Environments: no like/dislike reactions at all.
      const selectableItem = hideSignalsForSection ? null : selectableMap?.get(itemTitleKey);
      if (selectableItem) {
        const reactionCopy = getReactionCopy(normalizedHeading, selectableItem.title);
        li.classList.add('cdna-selectable-item');
        const reaction = itemReactions[selectableItem.id] || '';

        const actionsEl = document.createElement('div');
        actionsEl.className = 'cdna-item-actions';
        actionsEl.innerHTML = `
          <button
            type="button"
            class="cdna-item-action cdna-item-action--like ${reaction === 'like' ? 'is-active' : ''}"
            data-item-id="${selectableItem.id}"
            data-reaction="like"
            aria-pressed="${reaction === 'like' ? 'true' : 'false'}"
            aria-label="${escapeHtmlAttr(reactionCopy.likeAria)}"
            data-tooltip="${escapeHtmlAttr(reaction === 'like' ? reactionCopy.likeActive : reactionCopy.like)}"
          >
            <span class="cdna-item-action-icon" aria-hidden="true"></span>
          </button>
          <button
            type="button"
            class="cdna-item-action cdna-item-action--dislike ${reaction === 'dislike' ? 'is-active' : ''}"
            data-item-id="${selectableItem.id}"
            data-reaction="dislike"
            aria-pressed="${reaction === 'dislike' ? 'true' : 'false'}"
            aria-label="${escapeHtmlAttr(reactionCopy.dislikeAria)}"
            data-tooltip="${escapeHtmlAttr(reaction === 'dislike' ? reactionCopy.dislikeActive : reactionCopy.dislike)}"
          >
            <span class="cdna-item-action-icon" aria-hidden="true"></span>
          </button>
        `;

        const likeIconEl = actionsEl.querySelector('.cdna-item-action--like .cdna-item-action-icon');
        const dislikeIconEl = actionsEl.querySelector('.cdna-item-action--dislike .cdna-item-action-icon');

        if (likeIconEl) {
          createRoot(likeIconEl).render(<ThumbsUp size={20} weight="duotone" />);
        }

        if (dislikeIconEl) {
          createRoot(dislikeIconEl).render(<ThumbsDown size={20} weight="duotone" />);
        }

        // Strengths & Environments: big labelled buttons at the bottom of the card
        // instead of the small icon thumbs in the top rail.
        if (hideSignalsForSection) {
          actionsEl.classList.add('cdna-item-actions--bottom');
          const isStrength = normalizedHeading === 'strengths';
          const likeBtn = actionsEl.querySelector('.cdna-item-action--like');
          const dislikeBtn = actionsEl.querySelector('.cdna-item-action--dislike');
          if (likeBtn) {
            // Labelled button: drop the hover/scroll floating tooltip (redundant).
            likeBtn.removeAttribute('data-tooltip');
            const t = document.createElement('span');
            t.className = 'cdna-item-action-label';
            t.textContent = isStrength ? 'Sounds like me' : 'Suits me';
            likeBtn.appendChild(t);
          }
          if (dislikeBtn) {
            dislikeBtn.removeAttribute('data-tooltip');
            const t = document.createElement('span');
            t.className = 'cdna-item-action-label';
            t.textContent = isStrength ? 'Not me' : 'Not for me';
            dislikeBtn.appendChild(t);
          }
          const contentEl = li.querySelector(':scope > .cdna-item-content') || li;
          contentEl.appendChild(actionsEl);
        } else {
          railEl.appendChild(actionsEl);
        }
      }

      if (railEl.childElementCount > 0) {
        li.classList.add('cdna-signal-item');
        const contentEl = li.querySelector(':scope > .cdna-item-content') || li;
        contentEl.insertBefore(railEl, contentEl.firstChild);
      }
    });
  });
}


function stripSubdimensionSection(md = '') {
  if (!md) return md;
  const marker = '## Subdimension Scores';
  const idx = md.indexOf(marker);
  if (idx === -1) return md;

  const rest = md.slice(idx);
  const nextHeaderIdx = rest.indexOf('## ', marker.length);
  const before = md.slice(0, idx).trim();
  let after = '';
  if (nextHeaderIdx !== -1) {
    after = rest.slice(nextHeaderIdx).trim();
  }
  return [before, after].filter(Boolean).join('\n\n');
}

const ANALYSIS_TAB_BASE_DEFS = [
  { key: 'summary', label: 'Overview' },
  { key: 'strengths', label: 'Strengths' },
  { key: 'environments', label: 'Work Styles' },
  { key: 'careerworlds', label: 'Career Worlds' },
  { key: 'pathways', label: 'University Subjects' },
];

// One line describing what each analysis tab unlocks. Used on the locked tabs so
// someone who hasn't generated their report yet can see what they're missing.
const ANALYSIS_TAB_TEASERS = {
  summary: 'A clear written summary of your CareerDNA that brings your scores together into one story about what drives you.',
  strengths: 'Your standout strengths explained, with where each one shows up in real work.',
  environments: 'The work environments and ways of working where you are most likely to thrive.',
  careerworlds: 'Your best matched career worlds, each with a personalised fit narrative.',
  pathways: 'The university subjects and pathways that fit you, with entry requirements and your chances.',
  discovermore: 'Career pathways matched to you, with the routes into each one.',
  furtherstudy: 'Degrees and universities matched to you, with live rankings and course search.',
  nonuni: 'Apprenticeships, training and work routes matched to you, with live openings.',
  roleexplorer: 'Specific job roles matched to you, with live openings in each one.',
  advisor: 'A personal AI careers advisor that answers your questions using your results.',
};

function normalizeViewerStatus(raw = '') {
  const value = String(raw || '').trim().toLowerCase();
  if (['school', 'gcse', 'a-level', 'alevel', 'sixth form', 'sixth-form'].includes(value)) return 'school';
  if (['undergrad', 'undergraduate', 'ug', 'postgrad', 'postgraduate', 'pg', 'masters', 'master', 'msc', 'mba'].includes(value)) return 'undergraduate';
  return '';
}

function normaliseAnalysisSectionHeading(markdown = '', title = '') {
  const key = normalizeHeading(title);
  let out = String(markdown || '');
  if (key === 'idealenvironments' || key === 'environments') {
    out = out
      .replace(/^##\s+Ideal Environments\s*$/m, '## Work Styles')
      .replace(/^##\s+Environments\s*$/m, '## Work Styles')
      .replace(/^##\s+Work Environments\s*$/m, '## Work Styles');
  }
  if (key === 'summary') {
    // The Summary section is presented under the "Overview" tab, so give it a
    // heading that matches: replace its first heading line whatever it says.
    out = out.replace(/^##\s+.*$/m, '## Overview of your results');
  }
  return out;
}

function sectionBelongsToTab(title = '') {
  const key = normalizeHeading(title);
  if (!key || key === 'summary') return 'summary';
  if (key === 'strengths') return 'strengths';
  if (key === 'idealenvironments' || key === 'environments' || key === 'workenvironments' || key === 'workstyles') return 'environments';
  if (
    key === 'careerworlds' ||
    key === 'careerworldsmostalignedwithyourinterestarea' ||
    key === 'othercareerworldstoexplore'
  ) {
    return 'careerworlds';
  }
  if (
    key === 'careerpathways' ||
    key === 'careerpathwaysmostalignedwithyoursubjectarea' ||
    key === 'adjacentcareerpathwaystoexplore' ||
    key === 'universitysubjectsbestfit' ||
    key === 'otherstrongoptionstoexplore' ||
    key === 'moreadjacentoptionstoexplore' ||
    key === 'universitysubjectsmostalignedwithyourinterestarea' ||
    key === 'otheruniversitysubjectsworthexploring' ||
    key === 'otherspecialistoptionstoexplore'
  ) {
    return 'pathways';
  }
  return 'summary';
}

function splitMarkdownIntoSections(md = '') {
  const source = String(md || '').trim();
  if (!source) return [];

  const sectionRegex = /^##\s+(.+)$/gm;
  const matches = [];
  let match;

  while ((match = sectionRegex.exec(source)) !== null) {
    matches.push({ title: String(match[1] || '').trim(), index: match.index });
  }

  if (!matches.length) {
    return [{ title: 'Summary', markdown: source }];
  }

  // Strip a trailing horizontal-rule separator (---, ***, ___) that the prose
  // places between sections; otherwise it renders as a stray <hr> at the foot
  // of the section, just above the next-step footer border.
  const stripTrailingRule = (s) => String(s || '').replace(/\n\s*(?:-{3,}|\*{3,}|_{3,})\s*$/, '').trim();

  const sections = [];
  if (matches[0].index > 0) {
    const preface = stripTrailingRule(source.slice(0, matches[0].index).trim());
    if (preface) sections.push({ title: 'Summary', markdown: preface });
  }

  matches.forEach((entry, idx) => {
    const nextIndex = idx < matches.length - 1 ? matches[idx + 1].index : source.length;
    const markdown = stripTrailingRule(source.slice(entry.index, nextIndex).trim());
    if (markdown) sections.push({ title: entry.title, markdown });
  });

  return sections;
}

function getFinalTabLabel(md = '', analysisMeta = {}, viewerStatus = '') {
  const normalizedStatus = normalizeViewerStatus(viewerStatus);
  if (normalizedStatus && normalizedStatus !== 'school') return 'Career Pathways';

  const sections = splitMarkdownIntoSections(md);
  const hasCareerPathways = sections.some((section) => [
    'careerpathways',
    'careerpathwaysmostalignedwithyoursubjectarea',
    'adjacentcareerpathwaystoexplore',
  ].includes(normalizeHeading(section?.title)));
  const hasUniversitySubjects = sections.some((section) => [
    'universitysubjectsbestfit',
    'moreadjacentoptionstoexplore',
    'otherstrongoptionstoexplore',
    'universitysubjectsmostalignedwithyourinterestarea',
    'otheruniversitysubjectsworthexploring',
    'otherspecialistoptionstoexplore',
  ].includes(normalizeHeading(section?.title)));

  if (analysisMeta?.viewMode === 'undergraduate' || (hasCareerPathways && !hasUniversitySubjects)) {
    return 'Career Pathways';
  }

  return 'University Subjects';
}

// Start the Summary paragraph with the person's first name, e.g.
// "George, your profile is a rare blend of ..." — using the same name shown in
// the "Hi, George!" greeting. Purely presentational; leaves the source text intact.
function personaliseSummaryMarkdown(markdown = '', firstName = '') {
  const name = String(firstName || '').trim();
  if (!name || !markdown) return markdown;

  const lines = markdown.split('\n');
  let idx = 0;
  while (idx < lines.length && (/^#{1,6}\s/.test(lines[idx].trim()) || lines[idx].trim() === '')) {
    idx += 1;
  }
  if (idx >= lines.length) return markdown;

  const body = lines[idx];
  if (!body.trim() || body.trim().toLowerCase().startsWith(`${name.toLowerCase()},`)) return markdown;

  const first = body.charAt(0);
  const rest = /[A-Z]/.test(first) ? first.toLowerCase() + body.slice(1) : body;
  lines[idx] = `${name}, ${rest}`;
  return lines.join('\n');
}

export function cwCompactKey(v) {
  return String(v || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
}

// Title -> standardized short definition, for matching career worlds by title
// when a careerWorldId is not available.
const CAREER_WORLD_SHORT_BY_TITLE = {};
const CAREER_WORLD_LONG_BY_ID = {};
const CAREER_WORLD_LONG_BY_TITLE = {};
Object.entries(CAREER_WORLD_DEFINITIONS).forEach(([id, entry]) => {
  const t = cwCompactKey(entry?.title);
  const longDef = entry?.long || entry?.paragraph || CAREER_WORLD_SHORT_DEFINITIONS[id] || entry?.short || '';
  CAREER_WORLD_LONG_BY_ID[id] = longDef;
  if (t) {
    CAREER_WORLD_SHORT_BY_TITLE[t] = CAREER_WORLD_SHORT_DEFINITIONS[id] || entry?.short || '';
    CAREER_WORLD_LONG_BY_TITLE[t] = longDef;
  }
});

// The 7 additional vocational worlds — careers most often entered through work,
// training or apprenticeship rather than a degree. Shown as a browse group beneath
// the academic worlds ("Explore other career worlds"). Short + long definitions are
// the single source of truth in selectionDefinitions.js. Not behaviourally scored in
// the main career-world selection yet, so no match band/narrative.
// Worlds that are genuinely non-academic (no university route at all). Shown in
// their own "no degree needed" group on the Career Worlds tab.

const VOCATIONAL_WORLD_ITEMS = [
  { id: 'voc_skilled_trades', title: 'Skilled Trades & Construction' },
  { id: 'voc_making_craft', title: 'Making, Craft & Repair' },
  { id: 'voc_land_animals', title: 'Land, Animals & the Outdoors' },
  { id: 'voc_protective', title: 'Protective & Emergency Services' },
  { id: 'voc_transport', title: 'Transport, Aviation & Maritime' },
  { id: 'voc_hospitality', title: 'Hospitality, Food & Events' },
  { id: 'voc_care_community', title: 'Care & Community Support' },
].map((w) => ({
  ...w,
  careerWorldId: w.id,
  shortDef: CAREER_WORLD_SHORT_DEFINITIONS[w.id] || '',
  longDef: CAREER_WORLD_LONG_DEFINITIONS[w.id] || CAREER_WORLD_SHORT_DEFINITIONS[w.id] || '',
  narrative: '',
  splitNarrative: true,
  insight: null,
}));

// A liked vocational world should behave like any career world in the Pathway
// Explorer (fetch its scored pathways), so expose them keyed by id as
// career_world selectable items.
const VOCATIONAL_WORLD_ITEMS_BY_ID = new Map(
  VOCATIONAL_WORLD_ITEMS.map((w) => [
    w.id,
    { id: w.id, title: w.title, careerWorldId: w.careerWorldId || w.id, type: 'career_world', insightEnabled: true },
  ])
);

// Pathway short definition keyed by compact title, for the university Career
// Pathways accordion (short def leads, LLM narrative follows).
const PATHWAY_SHORT_BY_TITLE = {};
const PATHWAY_LONG_BY_TITLE = {};
Object.values(PATHWAY_DEFINITIONS).forEach((entry) => {
  const t = cwCompactKey(entry?.title);
  if (t) {
    PATHWAY_SHORT_BY_TITLE[t] = entry?.short || '';
    PATHWAY_LONG_BY_TITLE[t] = entry?.long || entry?.paragraph || entry?.short || '';
  }
});
// Deeper, graduate-facing pathway definition (degree-linked pathways only), keyed
// by compact title. Shown to university students in the pathway Read more window.
const PATHWAY_UNI_LONG_BY_TITLE = {};
Object.entries(PATHWAY_UNI_LONG_DEFINITIONS).forEach(([title, text]) => {
  const t = cwCompactKey(title);
  if (t) PATHWAY_UNI_LONG_BY_TITLE[t] = text || '';
});

// Parse the "## Career Worlds" markdown into { compactTitle -> narrative }.
// Prose format is: "N) **World Title**: \n narrative ...".
export function parseCareerWorldNarratives(md = '') {
  const out = new Map();
  const src = String(md || '');
  const re = /(?:^|\n)\s*\d+\)\s*\*\*(.+?)\*\*\s*:?\s*\n?([\s\S]*?)(?=(?:\n\s*\d+\)\s*\*\*)|(?:\n\s*#{1,6}\s)|$)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const title = String(m[1] || '').trim();
    const body = String(m[2] || '').replace(/\s+$/,'').trim();
    if (title) out.set(cwCompactKey(title), body);
  }
  return out;
}

function buildAnalysisTabs(md = '', analysisMeta = {}, viewerStatus = '', firstName = '') {
  const buckets = {
    summary: [],
    strengths: [],
    environments: [],
    careerworlds: [],
    pathways: [],
  };

  splitMarkdownIntoSections(md).forEach((section) => {
    const bucket = sectionBelongsToTab(section?.title);
    buckets[bucket].push(normaliseAnalysisSectionHeading(String(section?.markdown || '').trim(), section?.title));
  });

  const normalizedStatus = normalizeViewerStatus(viewerStatus);
  const defsBase = normalizedStatus === 'school'
    ? ANALYSIS_TAB_BASE_DEFS.filter((tab) => tab.key !== 'pathways')
    : ANALYSIS_TAB_BASE_DEFS;

  const defs = defsBase.map((tab) =>
    tab.key === 'pathways' ? { ...tab, label: getFinalTabLabel(md, analysisMeta, viewerStatus) } : tab
  );

  return defs
    .map((tab) => {
      let markdown = (buckets[tab.key] || []).filter(Boolean).join('\n\n');
      if (tab.key === 'summary') markdown = personaliseSummaryMarkdown(markdown, firstName);
      return { ...tab, markdown };
    })
    .filter((tab) => tab.markdown);
}



function ResultsUsefulnessFeedbackCard({ value, comment, draftComment, onRatingChange, onDraftCommentChange, onSubmitComment }) {
  const [expanded, setExpanded] = useState(Boolean(value || comment || draftComment));

  useEffect(() => {
    if (value || comment || draftComment) setExpanded(true);
  }, [value, comment, draftComment]);

  const labels = ['Not quite', 'Somewhat', 'Useful', 'Very useful'];
  const hasDraftComment = String(draftComment || '').trim().length > 0;
  const commentAlreadySaved = String(draftComment || '').trim() === String(comment || '').trim();

  return (
    <section className="results-feedback-card" aria-label="Results feedback">
      <div className="results-feedback-card__header">
        <div className="results-feedback-card__title-block">
          <h2>Are these results useful?</h2>
        </div>
      </div>

      <div className="results-feedback-rating" role="radiogroup" aria-label="Usefulness rating">
        {[1, 2, 3, 4].map((rating) => (
          <button
            key={rating}
            type="button"
            className={`results-feedback-rating__button ${Number(value) === rating ? 'is-active' : ''}`}
            onClick={() => {
              onRatingChange(rating);
              setExpanded(true);
            }}
            role="radio"
            aria-checked={Number(value) === rating}
            aria-label={`${labels[rating - 1]}`}
          >
            <span className="results-feedback-rating__label">{labels[rating - 1]}</span>
          </button>
        ))}
      </div>

      {Boolean(expanded || value) && (
        <div className="results-feedback-comment-wrap">
          <textarea
            id="results-feedback-comment"
            className="results-feedback-comment"
            value={draftComment}
            onChange={(event) => onDraftCommentChange(event.target.value)}
            placeholder="Add a short comment if you want."
            rows={3}
          />
          <div className="results-feedback-comment-actions">
            <button
              type="button"
              className="results-feedback-comment-done"
              onClick={onSubmitComment}
              disabled={!hasDraftComment || commentAlreadySaved}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function ResultsComponent({
  results,
  initialAiSummary,
  fetchAiSummary,
  loadingSummary,
  chartRef,
  pdfRef,
  introName,
  onRetake,
  onFreshRetake,
  archetypes,
  summary,
  subdimensionRows,
  claritySummary,
  analysisMeta,
  viewerStatus,
  uniNeed,
  planUniversity,
  onItemReactionsChange,
  assessmentRunId,
  profileQualityGate,
  initialSection,
  initialTab,
  initialFocus,
}) {
  // The vocational ("Explore other career worlds") section is only relevant to
  // students who are unsure about university or not planning to go. The intro asks
  // this two ways depending on the student's status: planUniversity (yes/no/unsure)
  // and uniNeed (their next step). Show the section for either signal.
  const showVocationalWorlds =
    ['no', 'unsure'].includes(String(planUniversity || '')) ||
    ['not_sure', 'apprenticeship'].includes(String(uniNeed || ''));
  const analysisRef = useRef(null);
  const initialSectionAppliedRef = useRef(false);
  const initialTabAppliedRef = useRef(false);
  const topSectionRefs = useRef({});
  const analysisTabsListRef = useRef(null);
  const profileTabsListRef = useRef(null);
  const markdownContentRef = useRef(null);
  const [itemReactions, setItemReactions] = useState({});
  // One shared filter for the uni Career Pathways tab (drives both the matched
  // and adjacent pathway groups). Uni students don't get the "Ways in" group.
  const [pathwayTabFilter, setPathwayTabFilter] = useState(emptyResultsFilter());
  // id -> { title, type } for every reacted item, so liked pathways can be
  // resolved (title + world) without depending on any loaded insight.
  const [itemReactionMeta, setItemReactionMeta] = useState({});
  const [selectionInsights, setSelectionInsights] = useState([]);
  const [selectionInsightsLoading, setSelectionInsightsLoading] = useState(false);
  const [selectionInsightsError, setSelectionInsightsError] = useState('');
  // True once we have insights on screen. Liking a pathway/role adds it to the
  // fetch set, but we must NOT show the full-screen "loading deeper signature
  // fit" state for that incremental fetch: it unmounts the open card and throws
  // the user back to the list. So we only show the loading screen on the very
  // first load; later fetches hydrate quietly in the background.
  const insightsReadyRef = useRef(false);
  // Scored insights (band + signature pills) for the worlds that the backend does
  // NOT precompute: the lower-match academic worlds and (when shown) the 7
  // vocational worlds. Fetched from /api/selection-insights, keyed by id and by
  // compact title. No narrative (deterministic scoring only).
  const [extraWorldInsights, setExtraWorldInsights] = useState({});
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('summary');
  const [activeProfileTab, setActiveProfileTab] = useState('profile');
  const [openTopSection, setOpenTopSection] = useState('profile');
  const [profileFirstName, setProfileFirstName] = useState('');
  const [upgradePrompt, setUpgradePrompt] = useState(null);
  const [profileUserId, setProfileUserId] = useState('');
  // Report entitlement for the current viewer, used to differentiate what the
  // pre-analysis (locked) state offers: a free viewer sees an upsell, a
  // subscriber with reports left sees a plain generate button plus a
  // reports-left line, and a subscriber who's used them all sees a "check your
  // plans" prompt. Loaded from the profile alongside the first name.
  const [reportPlan, setReportPlan] = useState('');
  const [reportUnlimited, setReportUnlimited] = useState(false);
  const [reportsRemaining, setReportsRemaining] = useState(null);
  const [reportInfoLoaded, setReportInfoLoaded] = useState(false);
  // Which locked analysis tab the viewer last tapped (drives the teaser copy in
  // the locked placeholder). Empty means show the generic teaser.
  const [lockedPreviewTab, setLockedPreviewTab] = useState('');
  const [overallFeedback, setOverallFeedback] = useState({ rating: 0, comment: '' });
  const [overallFeedbackDraftComment, setOverallFeedbackDraftComment] = useState('');
  const [overallFeedbackSaveState, setOverallFeedbackSaveState] = useState('idle');
  const [analysisQualityMessage, setAnalysisQualityMessage] = useState('');

  const localChartsWrapperRef = useRef(null);
  const skipNextReactionPersistRef = useRef(false);
  const chartsWrapperRef = chartRef || localChartsWrapperRef;

  const computedResults = useMemo(() => {
    const primary =
      results && typeof results === 'object' && Object.keys(results).length > 0 ? results : null;
    const legacy =
      archetypes && typeof archetypes === 'object' && Object.keys(archetypes).length > 0
        ? archetypes
        : null;
    return primary || legacy || {};
  }, [results, archetypes]);

  const rawSummary = useMemo(() => {
    if (typeof initialAiSummary === 'string' && initialAiSummary.trim()) return initialAiSummary;
    if (typeof summary === 'string' && summary.trim()) return summary;
    return '';
  }, [initialAiSummary, summary]);

  const isReportLimitSummary = useMemo(
    () => String(rawSummary || '').trim() === 'REPORT_LIMIT_REACHED',
    [rawSummary]
  );

  const computedSummary = useMemo(() => {
    if (!rawSummary || isReportLimitSummary) return '';
    return stripSubdimensionSection(rawSummary);
  }, [rawSummary, isReportLimitSummary]);

  useEffect(() => {
    if (isReportLimitSummary) {
      setUpgradePrompt({ reason: 'REPORT_LIMIT_REACHED' });
      setOpenTopSection('analysis');
    }
  }, [isReportLimitSummary]);



  const effectiveAssessmentRunId = useMemo(() => {
    const direct = String(assessmentRunId || '').trim();
    if (direct) return direct;

    const metaId = String(
      analysisMeta?.assessmentRunId ||
      analysisMeta?.runId ||
      analysisMeta?.reportId ||
      analysisMeta?.id ||
      ''
    ).trim();
    if (metaId) return metaId;

    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/(?:saved-result|results|assessment-runs?)\/([^/?#]+)/i);
      return match?.[1] || '';
    }

    return '';
  }, [assessmentRunId, analysisMeta]);

  const displayName = useMemo(() => getFirstName(profileFirstName), [profileFirstName]);
  const selectableMaps = useMemo(() => buildSelectableMaps(analysisMeta), [analysisMeta]);
  const reactionsStorageKey = useMemo(() => makeReactionsStorageKey(analysisMeta), [analysisMeta]);
  const overallFeedbackStorageKey = useMemo(() => makeOverallFeedbackStorageKey(analysisMeta), [analysisMeta]);
  const precomputedSelectionInsightMap = useMemo(() => {
    const rows = Array.isArray(analysisMeta?.precomputedSelectionInsights)
      ? analysisMeta.precomputedSelectionInsights
      : [];
    const map = new Map();
    rows.forEach((item) => {
      [item?.id, item?.title, normalizeSignalTitle(item?.title)].filter(Boolean).forEach((key) => {
        map.set(String(key), item);
      });
    });
    return map;
  }, [analysisMeta]);
  const likedInsightItemIds = useMemo(
    () => Object.entries(itemReactions)
      .filter(([, reaction]) => reaction === 'like')
      .map(([id]) => id),
    [itemReactions]
  );

  const selectedInsightItems = useMemo(
    () => likedInsightItemIds
      // Vocational worlds aren't in the main selectable map (they live in a
      // separate "Explore other career worlds" list), so fall back to that map
      // as a career_world item, letting their scored pathways load in the Pathway
      // Explorer just like the academic worlds.
      .map((id) => selectableMaps.byId.get(id) || VOCATIONAL_WORLD_ITEMS_BY_ID.get(id))
      .filter((item) => item?.insightEnabled !== false && (item?.type === 'career_world' || item?.type === 'pathway' || item?.type === 'role')),
    [likedInsightItemIds, selectableMaps]
  );

  const analysisTabs = useMemo(() => buildAnalysisTabs(computedSummary, analysisMeta, viewerStatus, displayName), [computedSummary, analysisMeta, viewerStatus, displayName]);

  // Career Worlds accordion items: each top career world with its standardized
  // short definition, personalised match narrative (parsed from the tab
  // markdown), signal band, and pills (from the precomputed insight).
  // Career-world narratives parsed from the report markdown, keyed by compact
  // title. Shared by the academic accordion and the vocational one (the Good+
  // vocational worlds are narrated in the same report section).
  const careerWorldNarrativeByTitle = useMemo(() => {
    const cwTab = (analysisTabs || []).find((t) => t.key === 'careerworlds');
    return parseCareerWorldNarratives(cwTab?.markdown || '');
  }, [analysisTabs]);

  const careerWorldAccordionItems = useMemo(() => {
    const cwTab = (analysisTabs || []).find((t) => t.key === 'careerworlds');
    const md = cwTab?.markdown || '';
    if (!md) return [];
    const narrativeByTitle = careerWorldNarrativeByTitle;
    const selMap = selectableMaps?.bySection?.careerworlds;
    if (!selMap) return [];
    const items = [];
    for (const item of selMap.values()) {
      // Vocational worlds are narrated in the same report section but shown in
      // their own group below, so keep them out of the academic list.
      if (String(item.careerWorldId || item.id || '').startsWith('voc_')) continue;
      const nt = cwCompactKey(item.title);
      const insight = precomputedSelectionInsightMap.get(item.title)
        || precomputedSelectionInsightMap.get(item.id)
        || precomputedSelectionInsightMap.get(normalizeSignalTitle(item.title))
        || null;
      const cwId = item.careerWorldId || insight?.careerWorldId || '';
      const shortDef = CAREER_WORLD_SHORT_DEFINITIONS[cwId] || CAREER_WORLD_SHORT_BY_TITLE[nt] || '';
      const longDef = CAREER_WORLD_LONG_BY_ID[cwId] || CAREER_WORLD_LONG_BY_TITLE[nt] || shortDef;
      items.push({
        id: item.id,
        title: item.title,
        signalLabel: item.signalLabel,
        signalBlocks: item.signalBlocks,
        careerWorldId: cwId,
        shortDef,
        longDef,
        narrative: narrativeByTitle.get(nt) || '',
        routeChips: Array.isArray(insight?.routeChips) ? insight.routeChips : [],
        // Same redesigned layout as pathways: long definition on top, narrative
        // split into the profiles/traits accordions.
        splitNarrative: true,
        insight,
      });
    }
    return items;
  }, [analysisTabs, selectableMaps, precomputedSelectionInsightMap, careerWorldNarrativeByTitle]);

  // "Other career worlds" — the worlds beyond the top matches (mostly Good/Lower),
  // shown collapsed below the main list. Definition + band only, no LLM narrative.
  const careerWorldLowerAccordionItems = useMemo(() => {
    const selMap = selectableMaps?.bySection?.othercareerworldslowermatch;
    if (!selMap) return [];
    const items = [];
    for (const item of selMap.values()) {
      if (String(item.careerWorldId || item.id || '').startsWith('voc_')) continue;
      const nt = cwCompactKey(item.title);
      // The backend does not precompute lower-match worlds, so their signature
      // pills come from the extraWorldInsights fetch. Keep the narrative off.
      const insight = extraWorldInsights[String(item.id)]
        || extraWorldInsights[`t:${cwCompactKey(item.title)}`]
        || null;
      const cwId = item.careerWorldId || insight?.careerWorldId || '';
      const shortDef = CAREER_WORLD_SHORT_DEFINITIONS[cwId] || CAREER_WORLD_SHORT_BY_TITLE[nt] || '';
      const longDef = CAREER_WORLD_LONG_BY_ID[cwId] || CAREER_WORLD_LONG_BY_TITLE[nt] || shortDef;
      items.push({
        id: item.id,
        title: item.title,
        signalLabel: item.signalLabel,
        signalBlocks: item.signalBlocks,
        careerWorldId: cwId,
        shortDef,
        longDef,
        narrative: '',
        routeChips: Array.isArray(insight?.routeChips) ? insight.routeChips : [],
        splitNarrative: true,
        insight,
      });
    }
    return items;
  }, [selectableMaps, extraWorldInsights]);

  // University "Career Pathways" tab as an accordion (mirrors Career Worlds):
  // each pathway shows its standardized short definition, the personalised match
  // narrative, band and pills. Split into subject-aligned vs adjacent groups.
  const careerPathwayAccordionGroups = useMemo(() => {
    const pwTab = (analysisTabs || []).find((t) => t.key === 'pathways');
    const md = pwTab?.markdown || '';
    if (!md) return [];
    const narrativeByTitle = parseCareerWorldNarratives(md);
    const buildGroup = (sectionKey) => {
      const selMap = selectableMaps?.bySection?.[sectionKey];
      if (!selMap) return [];
      const items = [];
      for (const item of selMap.values()) {
        const nt = cwCompactKey(item.title);
        const insight = precomputedSelectionInsightMap.get(item.title)
          || precomputedSelectionInsightMap.get(item.id)
          || precomputedSelectionInsightMap.get(normalizeSignalTitle(item.title))
          || null;
        items.push({
          id: item.id,
          title: item.title,
          signalLabel: item.signalLabel,
          signalBlocks: item.signalBlocks,
          shortDef: PATHWAY_SHORT_BY_TITLE[nt] || '',
          longDef: PATHWAY_LONG_BY_TITLE[nt] || PATHWAY_SHORT_BY_TITLE[nt] || '',
          // Deeper uni-facing definition: when present, the card shows the short
          // teaser inline and this longer piece opens in the Read more window.
          uniLongDef: PATHWAY_UNI_LONG_BY_TITLE[nt] || '',
          narrative: narrativeByTitle.get(nt) || '',
          // Pathways use the redesigned layout: long definition on top, and the
          // narrative split into the two signature accordions (lead sentence with
          // the profiles, the rest with the traits).
          splitNarrative: true,
          insight,
        });
      }
      return items;
    };
    const groups = [];
    const aligned = buildGroup('careerpathwaysmostalignedwithyoursubjectarea');
    const adjacent = buildGroup('adjacentcareerpathwaystoexplore');
    if (aligned.length) groups.push({ key: 'aligned', heading: 'Career pathways most aligned with your subject area', items: aligned });
    if (adjacent.length) groups.push({ key: 'adjacent', heading: 'Adjacent career pathways to explore', items: adjacent });
    return groups;
  }, [analysisTabs, selectableMaps, precomputedSelectionInsightMap]);

  // Further Study is driven by the career worlds the student liked: each liked
  // world offers a consolidated range of degrees. (Pathway likes are still stored
  // for exploration but do not drive this list.)
  const likedWorldItems = useMemo(
    () => [...(careerWorldAccordionItems || []), ...(careerWorldLowerAccordionItems || [])]
      .filter((w) => itemReactions[w.id] === 'like')
      .map((w) => ({ id: w.id, title: w.title, careerWorldId: w.careerWorldId || '', type: 'career_world', signalLabel: w.signalLabel || '' })),
    [careerWorldAccordionItems, careerWorldLowerAccordionItems, itemReactions]
  );

  // Non-University Routes also covers the 7 vocational worlds, which aren't in the
  // academic Career Worlds accordion. Include the liked ones here (but not in
  // Further Study, which is degree-based and doesn't apply to vocational worlds).
  // (defined after vocationalWorldItems so it can carry the scored world band —
  // see likedWorldItemsWithVocational below.)

  // Titles of the pathways the student liked (kept in the reaction meta). Used to
  // highlight the most relevant degrees within each world in Further Study.
  const likedPathwayTitles = useMemo(
    () => Object.entries(itemReactions)
      .filter(([id, r]) => r === 'like' && itemReactionMeta[id]?.type === 'pathway')
      .map(([id]) => itemReactionMeta[id]?.title)
      .filter(Boolean),
    [itemReactions, itemReactionMeta]
  );

  const analysisTabsWithDiscoverMore = useMemo(() => {
    const tabs = [...analysisTabs];
    const canShowDiscoverMore = Boolean(computedSummary && !loadingSummary);
    const canShowAdvisor = Boolean(effectiveAssessmentRunId && computedSummary && !loadingSummary);
    // Further Study (how to get there) is only for school students — undergraduates
    // are past the further-study stage.
    const isSchoolViewer = normalizeViewerStatus(viewerStatus) === 'school';

    // Pathway Explorer is the school flow's world -> pathways drill-down. For
    // university students the Career Pathways tab already covers pathways, so they
    // go straight from there to the Role Explorer.
    if (canShowDiscoverMore && isSchoolViewer) tabs.push({ key: 'discovermore', label: 'Career Pathways', markdown: '' });
    if (canShowDiscoverMore && isSchoolViewer) tabs.push({ key: 'furtherstudy', label: 'University', markdown: '' });
    if (canShowDiscoverMore && isSchoolViewer) tabs.push({ key: 'nonuni', label: 'Training & Work', markdown: '' });
    if (canShowDiscoverMore && !isSchoolViewer) tabs.push({ key: 'roleexplorer', label: 'Role Explorer', markdown: '' });
    if (canShowAdvisor) tabs.push({ key: 'advisor', label: 'AI Advisor', markdown: '' });
    return tabs;
  }, [analysisTabs, effectiveAssessmentRunId, computedSummary, loadingSummary, viewerStatus]);
  const activeTab = useMemo(
    () => analysisTabsWithDiscoverMore.find((tab) => tab.key === activeAnalysisTab) || analysisTabsWithDiscoverMore[0] || null,
    [analysisTabsWithDiscoverMore, activeAnalysisTab]
  );

  // Before the report is generated the analysis tabs above are empty (they're
  // built from the report text). To keep the menu looking normal, we render a
  // locked mirror of the full tab list the viewer will get once they generate.
  const lockedAnalysisTabs = useMemo(() => {
    const isSchoolViewer = normalizeViewerStatus(viewerStatus) === 'school';
    const base = (isSchoolViewer
      ? ANALYSIS_TAB_BASE_DEFS.filter((tab) => tab.key !== 'pathways')
      : ANALYSIS_TAB_BASE_DEFS
    ).map((tab) => ({ key: tab.key, label: tab.label }));
    const extra = isSchoolViewer
      ? [
          { key: 'discovermore', label: 'Career Pathways' },
          { key: 'furtherstudy', label: 'University' },
          { key: 'nonuni', label: 'Training & Work' },
        ]
      : [{ key: 'roleexplorer', label: 'Role Explorer' }];
    return [...base, ...extra, { key: 'advisor', label: 'AI Advisor' }];
  }, [viewerStatus]);

  // Report entitlement, derived from the loaded profile. `canRunReport` decides
  // whether the plain generate button shows; `isFreeViewer` decides whether an
  // out-of-reports viewer sees the subscribe upsell or the "you've used your
  // reports" prompt.
  const canRunReport = reportUnlimited || !reportInfoLoaded || (reportsRemaining == null ? true : reportsRemaining > 0);
  const isFreeViewer = reportInfoLoaded && ['', 'free'].includes(reportPlan);

  // Phone tab strip: hide the right-edge fade/chevron once there's nothing more
  // to scroll to (reached the end, or the tabs fit without scrolling).
  useEffect(() => {
    const list = analysisTabsListRef.current;
    if (!list) return undefined;
    const sidebar = list.closest('.analysis-tabs-sidebar');
    if (!sidebar) return undefined;

    const update = () => {
      const maxScroll = list.scrollWidth - list.clientWidth;
      const atEnd = maxScroll <= 1 || list.scrollLeft >= maxScroll - 1;
      sidebar.classList.toggle('is-scroll-end', atEnd);
    };

    update();
    list.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      list.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [activeTab]);

  const profileTabs = [
    { key: 'profile', label: 'Your Type' },
    { key: 'traits', label: 'Traits' },
    { key: 'selfawareness', label: 'Self-Awareness' },
  ];

  // Same phone tab-strip fade behaviour as the Analysis tabs.
  useEffect(() => {
    const list = profileTabsListRef.current;
    if (!list) return undefined;
    const sidebar = list.closest('.analysis-tabs-sidebar');
    if (!sidebar) return undefined;

    const update = () => {
      const maxScroll = list.scrollWidth - list.clientWidth;
      const atEnd = maxScroll <= 1 || list.scrollLeft >= maxScroll - 1;
      sidebar.classList.toggle('is-scroll-end', atEnd);
    };

    update();
    list.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      list.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [activeProfileTab, openTopSection]);

  // Keep the active tab centred in the horizontal strip on phone, so the current
  // section is always visible along with what sits on either side of it.
  useEffect(() => {
    const list = profileTabsListRef.current;
    if (!list) return;
    const active = list.querySelector('.analysis-tab-button.is-active');
    if (!active) return;
    const target = active.offsetLeft - (list.clientWidth - active.clientWidth) / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeProfileTab, activeAnalysisTab, openTopSection]);

  const analysisQualityGate = useMemo(() => (
    profileQualityGate && typeof profileQualityGate === 'object'
      ? profileQualityGate
      : { shouldBlockAnalysis: false }
  ), [profileQualityGate]);

  const handleApplyCoupon = async (code) => {
    await applyCouponCode(code);
    setUpgradePrompt(null);
  };

  const handleRunAnalysis = async () => {
    if (typeof fetchAiSummary !== 'function') return;
    setOpenTopSection('analysis');
    scrollAnalysisSectionIntoView({ offset: 18 });

    if (analysisQualityGate.shouldBlockAnalysis) {
      setAnalysisQualityMessage(getProfileQualityGateMessage(analysisQualityGate));
      return;
    }

    await runAnalysisNow();
  };

  // Runs the analysis, skipping the quality gate. Used by the "Generate anyway"
  // button on the retake modal so a low-clarity profile can still produce a report.
  const runAnalysisNow = async ({ bypassQualityGate = false } = {}) => {
    if (typeof fetchAiSummary !== 'function') return;
    setAnalysisQualityMessage('');
    setUpgradePrompt(null);

    try {
      await fetchAiSummary({ force: true, bypassQualityGate });
    } catch (err) {
      if (err?.code === 'REPORT_LIMIT_REACHED') {
        setUpgradePrompt({ reason: 'REPORT_LIMIT_REACHED' });
        return;
      }

      console.error(err);
      throw err;
    }
  };

  const hasResults = Object.keys(computedResults).length > 0;
  const canGenerate = typeof fetchAiSummary === 'function';

  const scoresForChart = useMemo(() => {
    if (
      computedResults &&
      typeof computedResults.subdimensionScores === 'object' &&
      computedResults.subdimensionScores
    ) {
      return computedResults.subdimensionScores;
    }
    const rowCandidates =
      (Array.isArray(subdimensionRows) && subdimensionRows) ||
      (Array.isArray(computedResults?.subdimensions) && computedResults.subdimensions) ||
      (Array.isArray(computedResults?.subdimensionRows) && computedResults.subdimensionRows) ||
      [];
    if (rowCandidates.length > 0) {
      return buildScoresForChartFromRows(rowCandidates, DIMENSIONS);
    }
    return {};
  }, [computedResults, subdimensionRows]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileFirstName() {
      try {
        const profile = await getMyProfile();
        if (!cancelled) {
          setProfileFirstName(profile?.first_name || '');
          setProfileUserId(profile?.id || '');
          const plan = String(profile?.plan || '').toLowerCase();
          const unlimited = ['premium_school', 'premium_university'].includes(plan);
          const limit = Number(profile?.report_limit) || 0;
          const used = Number(profile?.reports_used) || 0;
          setReportPlan(plan);
          setReportUnlimited(unlimited);
          setReportsRemaining(unlimited ? null : Math.max(0, limit - used));
          setReportInfoLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setProfileFirstName('');
          setProfileUserId('');
          setReportPlan('');
          setReportUnlimited(false);
          setReportsRemaining(null);
          setReportInfoLoaded(true);
        }
      }
    }

    loadProfileFirstName();

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    let cancelled = false;
    skipNextReactionPersistRef.current = true;

    async function loadSavedReactions() {
      let fallback = {};
      try {
        const stored = window.localStorage.getItem(reactionsStorageKey);
        fallback = stored ? (JSON.parse(stored) || {}) : {};
      } catch {
        fallback = {};
      }

      if (!profileUserId || !effectiveAssessmentRunId) {
        if (!cancelled) setItemReactions(fallback);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('result_feedback')
          .select('item_id, item_type, item_title, reaction')
          .eq('user_id', profileUserId)
          .eq('assessment_run_id', effectiveAssessmentRunId)
          .eq('feedback_scope', 'item_reaction');

        if (error) throw error;

        const fromDatabase = {};
        const metaFromDatabase = {};
        (Array.isArray(data) ? data : []).forEach((row) => {
          if (row?.item_id && row?.reaction) {
            fromDatabase[row.item_id] = row.reaction;
            metaFromDatabase[row.item_id] = { title: row.item_title || '', type: row.item_type || '' };
          }
        });

        if (!cancelled) {
          // With a real user + run, the database is the source of truth for THIS
          // run. An empty result means no reactions yet, so do not fall back to
          // the localStorage copy (its key degrades to a shared "latest" and
          // would otherwise carry a previous run's likes into a new run).
          setItemReactions(fromDatabase);
          setItemReactionMeta(metaFromDatabase);
        }
      } catch (err) {
        console.warn('Could not load saved item feedback:', err?.message || err);
        if (!cancelled) setItemReactions(fallback);
      }
    }

    loadSavedReactions();

    return () => {
      cancelled = true;
    };
  }, [reactionsStorageKey, profileUserId, effectiveAssessmentRunId]);

  useEffect(() => {
    if (skipNextReactionPersistRef.current) {
      skipNextReactionPersistRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(reactionsStorageKey, JSON.stringify(itemReactions));
    } catch {
      // Ignore storage errors.
    }

    if (typeof onItemReactionsChange === 'function') {
      onItemReactionsChange(itemReactions);
    }
  }, [itemReactions, reactionsStorageKey, onItemReactionsChange]);

  useEffect(() => {
    let cancelled = false;

    async function loadOverallFeedback() {
      let fallback = { rating: 0, comment: '' };
      try {
        const stored = window.localStorage.getItem(overallFeedbackStorageKey);
        if (stored) fallback = { ...fallback, ...(JSON.parse(stored) || {}) };
      } catch {
        fallback = { rating: 0, comment: '' };
      }

      if (!profileUserId || !effectiveAssessmentRunId) {
        if (!cancelled) {
          setOverallFeedback(fallback);
          setOverallFeedbackDraftComment(fallback.comment || '');
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('result_feedback')
          .select('rating, comment')
          .eq('user_id', profileUserId)
          .eq('assessment_run_id', effectiveAssessmentRunId)
          .eq('feedback_scope', 'overall_usefulness')
          .maybeSingle();

        if (error) throw error;

        if (!cancelled) {
          const nextFeedback = data ? { rating: Number(data.rating || 0), comment: data.comment || '' } : fallback;
          setOverallFeedback(nextFeedback);
          setOverallFeedbackDraftComment(nextFeedback.comment || '');
        }
      } catch (err) {
        console.warn('Could not load overall feedback:', err?.message || err);
        if (!cancelled) {
          setOverallFeedback(fallback);
          setOverallFeedbackDraftComment(fallback.comment || '');
        }
      }
    }

    loadOverallFeedback();

    return () => {
      cancelled = true;
    };
  }, [overallFeedbackStorageKey, profileUserId, effectiveAssessmentRunId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(overallFeedbackStorageKey, JSON.stringify(overallFeedback));
    } catch {
      // Ignore storage errors.
    }

    if (!profileUserId || !effectiveAssessmentRunId || !overallFeedback.rating) return undefined;

    const t = window.setTimeout(async () => {
      try {
        await saveResultFeedbackRow({
          userId: profileUserId,
          assessmentRunId: effectiveAssessmentRunId,
          feedbackScope: 'overall_usefulness',
          rating: Number(overallFeedback.rating || 0),
          comment: overallFeedback.comment || null,
        });
        setOverallFeedbackSaveState('idle');
      } catch (err) {
        console.warn('Could not save overall feedback:', err?.message || err);
        setOverallFeedbackSaveState('idle');
      }
    }, 500);

    return () => window.clearTimeout(t);
  }, [overallFeedback.rating, overallFeedback.comment, overallFeedbackStorageKey, profileUserId, effectiveAssessmentRunId]);

  const persistItemReaction = async ({ itemId, reaction, remove = false }) => {
    const item = selectableMaps.byId.get(itemId);
    if (!item || !profileUserId || !effectiveAssessmentRunId) return;

    try {
      await saveResultFeedbackRow({
        userId: profileUserId,
        assessmentRunId: effectiveAssessmentRunId,
        feedbackScope: 'item_reaction',
        itemType: item.type || null,
        itemId: item.id,
        itemTitle: item.title || '',
        reaction: remove ? null : reaction,
        remove,
      });
    } catch (err) {
      console.warn('Could not save item feedback:', err?.message || err);
    }
  };

  // Strengths and Environments have no like/dislike buttons, so the journey
  // timeline can't tick them off from a reaction. Instead, record a lightweight
  // "section visit" the first time the student opens one of those tabs, which the
  // Profile journey timeline reads alongside reactions to mark the step complete.
  const visitedSectionsRef = useRef(new Set());
  const persistSectionVisit = async (itemType) => {
    if (!profileUserId || !effectiveAssessmentRunId || !itemType) return;
    if (visitedSectionsRef.current.has(itemType)) return;
    visitedSectionsRef.current.add(itemType);
    try {
      await saveResultFeedbackRow({
        // Reuse the already-allowed 'item_reaction' scope (with a null reaction) so
        // we don't depend on the DB accepting a new feedback_scope value. The
        // reaction loader ignores null-reaction rows and the admin dashboards only
        // count like/dislike, so this row is invisible everywhere except the
        // journey timeline, which keys off item_type.
        userId: profileUserId,
        assessmentRunId: effectiveAssessmentRunId,
        feedbackScope: 'item_reaction',
        itemType,
        itemId: `visit:${itemType}`,
        itemTitle: '',
        reaction: null,
      });
    } catch (err) {
      visitedSectionsRef.current.delete(itemType);
      console.warn('Could not save section visit:', err?.message || err);
    }
  };

  const handleNestedItemReaction = async ({ itemType, itemId, itemTitle, reaction, remove = false }) => {
    if (!profileUserId || !effectiveAssessmentRunId || !itemType || !itemId) return;

    // Keep local reaction state in sync so nested pills (e.g. Discover More
    // pathways) persist across tab switches, not just after a full reload.
    setItemReactions((prev) => {
      const next = { ...prev };
      if (remove) delete next[itemId];
      else next[itemId] = reaction;
      return next;
    });
    setItemReactionMeta((prev) => {
      const next = { ...prev };
      if (remove) delete next[itemId];
      else next[itemId] = { title: itemTitle || next[itemId]?.title || '', type: itemType || next[itemId]?.type || '' };
      return next;
    });

    try {
      await saveResultFeedbackRow({
        userId: profileUserId,
        assessmentRunId: effectiveAssessmentRunId,
        feedbackScope: 'item_reaction',
        itemType,
        itemId,
        itemTitle,
        reaction: remove ? null : reaction,
        remove
      });
    } catch (err) {
      console.warn('Could not save nested item feedback:', err?.message || err);
    }
  };

  const handleOverallRatingChange = (rating) => {
    setOverallFeedback((prev) => ({ ...prev, rating }));
  };

  const handleOverallDraftCommentChange = (comment) => {
    setOverallFeedbackDraftComment(comment);
  };

  const handleOverallCommentSubmit = () => {
    setOverallFeedback((prev) => ({ ...prev, comment: overallFeedbackDraftComment }));
  };

  useEffect(() => {
    if (!activeTab?.markdown || !markdownContentRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      decorateAnalysisSignals(markdownContentRef.current, analysisMeta, itemReactions, scoresForChart);
  });
    return () => window.cancelAnimationFrame(frame);
  });

  useEffect(() => {
    const root = markdownContentRef.current;
    if (!root) return undefined;

    const getActionButton = (event) => (
      event.target instanceof Element
        ? event.target.closest('.cdna-item-action')
        : null
    );

    const getTooltipTarget = (event) => (
      event.target instanceof Element
        ? event.target.closest('.cdna-item-action[data-tooltip], .cdna-item-signal[data-tooltip]')
        : null
    );

    const handleClick = (event) => {
      const button = getActionButton(event);
      if (!(button instanceof HTMLButtonElement)) return;

      const itemId = button.dataset.itemId;
      const reaction = button.dataset.reaction;
      if (!itemId || !reaction) return;

      const shouldRemove = (itemReactions[itemId] || '') === reaction;
      setItemReactions((prev) => {
        if (shouldRemove) {
          const next = { ...prev };
          delete next[itemId];
          return next;
        }
        return { ...prev, [itemId]: reaction };
      });

      persistItemReaction({ itemId, reaction, remove: shouldRemove });

      window.requestAnimationFrame(() => {
        const refreshedButton = root.querySelector(`.cdna-item-action[data-item-id="${CSS.escape(itemId)}"][data-reaction="${CSS.escape(reaction)}"]`);
        if (refreshedButton instanceof HTMLButtonElement) showFeedbackTooltipForButton(refreshedButton);
      });
    };

    const handlePointerOver = (event) => {
      const target = getTooltipTarget(event);
      if (target instanceof HTMLElement) showFloatingTooltipForElement(target);
    };

    const handlePointerOut = (event) => {
      const target = getTooltipTarget(event);
      if (target instanceof HTMLElement) hideFeedbackTooltip();
    };

    const handleFocusIn = (event) => {
      const target = getTooltipTarget(event);
      if (target instanceof HTMLElement) showFloatingTooltipForElement(target);
    };

    const handleFocusOut = (event) => {
      const target = getTooltipTarget(event);
      if (target instanceof HTMLElement) hideFeedbackTooltip();
    };

    root.addEventListener('click', handleClick);
    root.addEventListener('pointerover', handlePointerOver);
    root.addEventListener('pointerout', handlePointerOut);
    root.addEventListener('focusin', handleFocusIn);
    root.addEventListener('focusout', handleFocusOut);
    window.addEventListener('scroll', hideFeedbackTooltip, { passive: true });

    return () => {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('pointerover', handlePointerOver);
      root.removeEventListener('pointerout', handlePointerOut);
      root.removeEventListener('focusin', handleFocusIn);
      root.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('scroll', hideFeedbackTooltip);
      hideFeedbackTooltip();
    };
  }, [activeTab?.markdown, selectableMaps, profileUserId, effectiveAssessmentRunId, itemReactions]);

  useEffect(() => {
    setItemReactions((prev) => {
      const next = {};
      Object.entries(prev).forEach(([id, reaction]) => {
        // Keep reactions for main selectable items and for vocational worlds
        // (which live outside the main selectable map).
        if (selectableMaps.byId.has(id) || VOCATIONAL_WORLD_ITEMS_BY_ID.has(id)) next[id] = reaction;
      });
      return next;
    });
  }, [selectableMaps]);

  useEffect(() => {
    if (selectedInsightItems.length > 0) return;
    setSelectionInsights([]);
    setSelectionInsightsError('');
    setSelectionInsightsLoading(false);
    insightsReadyRef.current = false;
  }, [selectedInsightItems.length]);

  useEffect(() => {
    if (!analysisTabsWithDiscoverMore.length) {
      setActiveAnalysisTab('summary');
      return;
    }
    if (!analysisTabsWithDiscoverMore.some((tab) => tab.key === activeAnalysisTab)) {
      setActiveAnalysisTab(analysisTabsWithDiscoverMore[0].key);
    }
  }, [analysisTabsWithDiscoverMore, activeAnalysisTab]);

  // Deep-link from the profile roadmap: open the requested top section right
  // away — even before the AI report exists. For analysis steps this reveals the
  // "Run CareerDNA Analysis" prompt instead of silently leaving the profile open.
  useEffect(() => {
    if (initialSectionAppliedRef.current) return;
    if (!initialSection) return;
    initialSectionAppliedRef.current = true;
    setOpenTopSection(initialSection);
    scrollTopSectionIntoView(initialSection, 18);
    window.setTimeout(() => scrollTopSectionIntoView(initialSection, 18), 320);
  }, [initialSection]);

  // Once the report is generated and the analysis tabs exist, activate the one
  // the roadmap asked for (strengths, environments, pathways, etc.).
  useEffect(() => {
    if (initialTabAppliedRef.current) return;
    if (initialSection !== 'analysis' || !initialTab) return;
    if (!analysisTabsWithDiscoverMore.some((tab) => tab.key === initialTab)) return;
    initialTabAppliedRef.current = true;
    setActiveAnalysisTab(initialTab);
  }, [initialSection, initialTab, analysisTabsWithDiscoverMore]);

  // Deep-link to an exact card: when the profile favourites open a report item,
  // find that card (tagged with data-fav-key) once its tab has rendered, open it
  // (if it isn't already) and scroll it into view. Best-effort: polls briefly
  // while the tab mounts, then gives up quietly if the item isn't on this tab.
  const initialFocusAppliedRef = useRef(false);
  useEffect(() => {
    if (initialFocusAppliedRef.current) return undefined;
    if (initialSection !== 'analysis' || !initialFocus) return undefined;
    initialFocusAppliedRef.current = true;
    const key = String(initialFocus).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!key) return undefined;
    const sel = `[data-fav-key="${key.replace(/"/g, '\\"')}"]`;
    let tries = 0;
    let timer = null;
    const tick = () => {
      tries += 1;
      const el = document.querySelector(sel);
      if (el) {
        if (!el.classList.contains('is-open')) {
          const toggle = el.querySelector('button, [role="button"], .cw-accordion-item__head, .pathway-role-item__toggle');
          if (toggle) toggle.click();
        }
        window.setTimeout(() => { try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {} }, 250);
        return;
      }
      if (tries < 25) timer = window.setTimeout(tick, 200);
    };
    timer = window.setTimeout(tick, 400);
    return () => { if (timer) window.clearTimeout(timer); };
  }, [initialSection, initialFocus, initialTab]);


  useEffect(() => {
    let cancelled = false;

    async function loadSelectionInsights() {
      if (!selectedInsightItems.length) return;

      const selectedByKey = new Map(
        selectedInsightItems.flatMap((item) => {
          const keys = [item?.id, item?.title, normalizeSignalTitle(item?.title)].filter(Boolean);
          return keys.map((key) => [String(key), item]);
        })
      );

      const getPrecomputedForItem = (item = {}) => {
        const keys = [item?.id, item?.title, normalizeSignalTitle(item?.title)].filter(Boolean);
        for (const key of keys) {
          if (precomputedSelectionInsightMap.has(String(key))) return precomputedSelectionInsightMap.get(String(key));
        }
        return null;
      };

      const precomputed = selectedInsightItems
        .map((item) => {
          const insight = getPrecomputedForItem(item);
          return insight ? { item, insight: mergeInsightWithSourceSignal(insight, item) } : null;
        })
        .filter(Boolean);

      const isCareerWorldInsight = (insight) => insight?.type === 'career_world' || insight?.isCareerWorld;
      const hasScoredPathways = (insight) => Array.isArray(insight?.pathways) && insight.pathways.length > 0;

      const missingItems = selectedInsightItems.filter((item) => !getPrecomputedForItem(item));
      // Career worlds whose precomputed insight predates pathway scoring still need
      // a fetch to obtain their scored pathways (bands). We graft those in below.
      const worldsNeedingPathways = precomputed
        .filter(({ insight }) => isCareerWorldInsight(insight) && !hasScoredPathways(insight))
        .map(({ item }) => item);
      const itemsToFetch = [...missingItems, ...worldsNeedingPathways];

      if (!itemsToFetch.length) {
        setSelectionInsights(precomputed.map((p) => p.insight));
        setSelectionInsightsError('');
        setSelectionInsightsLoading(false);
        insightsReadyRef.current = true;
        return;
      }

      // Only show the full loading screen on the first load. For incremental
      // fetches (e.g. after liking a pathway) keep the current cards on screen
      // and hydrate in the background, so the open card is never unmounted.
      if (!insightsReadyRef.current) setSelectionInsightsLoading(true);
      setSelectionInsightsError('');

      try {
        const data = await fetchSelectionInsights({
          archetypes: computedResults,
          subdimensions: Array.isArray(subdimensionRows) ? subdimensionRows : [],
          likedItems: itemsToFetch,
        });

        if (cancelled) return;
        const fetched = Array.isArray(data?.selectionInsights) ? data.selectionInsights : [];

        const fetchedByKey = new Map();
        fetched.forEach((insight) => {
          [insight?.id, insight?.title, normalizeSignalTitle(insight?.title)]
            .filter(Boolean)
            .forEach((key) => fetchedByKey.set(String(key), insight));
        });
        const findFetched = (item = {}) => {
          for (const key of [item?.id, item?.title, normalizeSignalTitle(item?.title)].filter(Boolean)) {
            if (fetchedByKey.has(String(key))) return fetchedByKey.get(String(key));
          }
          return null;
        };

        // Graft freshly-scored pathways onto precomputed worlds that lacked them.
        const precomputedMerged = precomputed.map(({ item, insight }) => {
          if (!isCareerWorldInsight(insight) || hasScoredPathways(insight)) return insight;
          const match = findFetched(item);
          return hasScoredPathways(match) ? { ...insight, pathways: match.pathways } : insight;
        });

        // Only append fetched insights for items that weren't already precomputed.
        const precomputedKeys = new Set(
          precomputed.flatMap(({ item }) =>
            [item?.id, item?.title, normalizeSignalTitle(item?.title)].filter(Boolean).map(String))
        );
        const hydratedFetched = fetched
          .filter((insight) => ![insight?.id, insight?.title, normalizeSignalTitle(insight?.title)]
            .filter(Boolean)
            .some((key) => precomputedKeys.has(String(key))))
          .map((insight) => {
            const sourceItem = selectedByKey.get(String(insight?.id || ''))
              || selectedByKey.get(String(insight?.title || ''))
              || selectedByKey.get(normalizeSignalTitle(insight?.title));
            return sourceItem ? mergeInsightWithSourceSignal(insight, sourceItem) : insight;
          });

        setSelectionInsights([...precomputedMerged, ...hydratedFetched]);
        insightsReadyRef.current = true;
      } catch (err) {
        if (cancelled) return;
        if (precomputed.length) {
          setSelectionInsights(precomputed);
          setSelectionInsightsError('');
        } else {
          setSelectionInsights([]);
          setSelectionInsightsError(err?.message || 'Could not load deeper insights right now.');
        }
      } finally {
        if (!cancelled) setSelectionInsightsLoading(false);
      }
    }

    loadSelectionInsights();
    return () => {
      cancelled = true;
    };
  }, [selectedInsightItems, computedResults, subdimensionRows, precomputedSelectionInsightMap]);

  // Fetch band + signature pills for the worlds the backend doesn't precompute:
  // the lower-match academic worlds (always) and the 7 vocational worlds (only
  // when the vocational section is shown). Keyed by id and by compact title.
  useEffect(() => {
    let cancelled = false;
    if (!computedResults || !Object.keys(computedResults).length) return undefined;
    const lowerSel = selectableMaps?.bySection?.othercareerworldslowermatch;
    const lowerItems = lowerSel
      ? Array.from(lowerSel.values()).map((w) => ({ id: w.id, title: w.title, careerWorldId: w.careerWorldId || '', type: 'career_world' }))
      : [];
    const vocItems = showVocationalWorlds
      ? VOCATIONAL_WORLD_ITEMS.map((w) => ({ id: w.id, title: w.title, careerWorldId: w.careerWorldId || w.id, type: 'career_world' }))
      : [];
    const likedItems = [...lowerItems, ...vocItems];
    if (!likedItems.length) { setExtraWorldInsights({}); return undefined; }
    (async () => {
      try {
        const data = await fetchSelectionInsights({
          archetypes: computedResults,
          subdimensions: Array.isArray(subdimensionRows) ? subdimensionRows : [],
          likedItems,
        });
        if (cancelled) return;
        const fetched = Array.isArray(data?.selectionInsights) ? data.selectionInsights : [];
        const byKey = {};
        fetched.forEach((insight) => {
          if (insight?.id) byKey[String(insight.id)] = insight;
          if (insight?.title) byKey[`t:${cwCompactKey(insight.title)}`] = insight;
        });
        setExtraWorldInsights(byKey);
      } catch (err) {
        if (!cancelled) setExtraWorldInsights({});
      }
    })();
    return () => { cancelled = true; };
  }, [showVocationalWorlds, computedResults, subdimensionRows, selectableMaps]);

  // The vocational worlds enriched with their fetched band + signature pills.
  // Narrative stays off here (the LLM narrative for Good+ vocational worlds is a
  // separate backend step).
  const vocationalWorldItems = useMemo(
    () => VOCATIONAL_WORLD_ITEMS.map((w) => {
      // Good+ vocational worlds are narrated in the report and precomputed, so
      // prefer that insight; otherwise fall back to the live band+pills fetch.
      const precomputed = precomputedSelectionInsightMap.get(w.id)
        || precomputedSelectionInsightMap.get(w.title)
        || precomputedSelectionInsightMap.get(normalizeSignalTitle(w.title))
        || null;
      const insight = precomputed
        || extraWorldInsights[String(w.id)]
        || extraWorldInsights[`t:${cwCompactKey(w.title)}`]
        || null;
      // Narrative only exists for the Good+ worlds the report narrated.
      const narrative = careerWorldNarrativeByTitle.get(cwCompactKey(w.title)) || '';
      return {
        ...w,
        signalLabel: insight?.signalLabel || '',
        signalBlocks: Number(insight?.signalBlocks || 0),
        signalPct: Number(insight?.signalPct || 0),
        narrative,
        insight,
      };
    }).sort((a, b) => (b.signalBlocks - a.signalBlocks) || (b.signalPct - a.signalPct)),
    [extraWorldInsights, precomputedSelectionInsightMap, careerWorldNarrativeByTitle]
  );

  // Non-University Routes also covers the 7 vocational worlds, which aren't in the
  // academic Career Worlds accordion. Include the liked ones here (but not in
  // Further Study, which is degree-based and doesn't apply to vocational worlds).
  // Carry each world's scored band so Training & Work shows the match pill in the
  // world header, exactly like University and Career Pathways.
  const likedWorldItemsWithVocational = useMemo(() => {
    const voc = vocationalWorldItems
      .filter((w) => itemReactions[w.id] === 'like')
      .map((w) => ({ id: w.id, title: w.title, careerWorldId: w.careerWorldId || w.id, type: 'career_world', signalLabel: w.signalLabel || '' }));
    return [...likedWorldItems, ...voc];
  }, [likedWorldItems, vocationalWorldItems, itemReactions]);

  const registerTopSectionRef = (key) => (node) => {
    if (node) topSectionRefs.current[key] = node;
  };

  const scrollTopSectionIntoView = (key, offset = 18) => {
    window.requestAnimationFrame(() => {
      const target = topSectionRefs.current[key] || (key === 'analysis' ? analysisRef.current : null);
      if (!target) return;

      const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, absoluteTop - offset),
        behavior: 'smooth',
      });
    });
  };

  // Every results tab (profile or analysis, locked or not) re-centres the same
  // way: smooth-scroll the top of the single unified card just under the top of
  // the viewport, then settle once more after content has swapped in.
  const scrollResultsTabIntoView = (offset = 18) => {
    // A single scroll to the TOP of the results card — never a re-scroll or a
    // centring pass, which caused the panel to jump up and down.
    scrollTopSectionIntoView('profile', offset);
  };

  const scrollAnalysisSectionIntoView = ({ offset = 18 } = {}) => {
    scrollTopSectionIntoView('profile', offset);
  };

  const handleAnalysisTabClick = (tabKey) => {
    setActiveAnalysisTab(tabKey);
    if (openTopSection !== 'analysis') setOpenTopSection('analysis');

    // Strengths/Environments have no reactions, so opening the tab is what marks
    // the journey step complete.
    if (tabKey === 'strengths') persistSectionVisit('strength');
    else if (tabKey === 'environments') persistSectionVisit('environment');

    scrollResultsTabIntoView(18);
  };

  // ---- Guided journey: simple next-step footer ----
  const PROFILE_STEP_KEYS = ['profile', 'traits', 'selfawareness'];

  const journeySteps = [
    ...(hasResults ? profileTabs.map((t) => ({ key: t.key, section: 'profile', label: t.label })) : []),
    ...analysisTabsWithDiscoverMore.map((t) => ({ key: t.key, section: 'analysis', label: t.label })),
  ];

  const goToJourneyStep = (key, section) => {
    if (key === 'generate') {
      if (openTopSection !== 'analysis') setOpenTopSection('analysis');
      scrollTopSectionIntoView('analysis', 18);
      window.setTimeout(() => scrollTopSectionIntoView('analysis', 18), 220);
      return;
    }
    if (section === 'profile') {
      setActiveProfileTab(key);
      if (openTopSection !== 'profile') setOpenTopSection('profile');
      scrollTopSectionIntoView('profile', 18);
      window.setTimeout(() => scrollTopSectionIntoView('profile', 18), 220);
    } else {
      handleAnalysisTabClick(key);
    }
  };

  const computeNextStep = (currentKey) => {
    const idx = journeySteps.findIndex((s) => s.key === currentKey);
    if (idx >= 0 && idx < journeySteps.length - 1) return journeySteps[idx + 1];
    const analysisRenderable = computedSummary || loadingSummary || (hasResults && canGenerate);
    if (PROFILE_STEP_KEYS.includes(currentKey) && !computedSummary && analysisRenderable) {
      return { key: 'generate', section: 'analysis', label: 'Generate your CareerDNA analysis' };
    }
    return null;
  };

  const renderNextStep = (currentKey) => {
    const nextStep = computeNextStep(currentKey);
    if (!nextStep) return null;
    const isGenerate = nextStep.key === 'generate';
    const title = isGenerate ? 'Generate your CareerDNA analysis' : nextStep.label;
    const go = () => goToJourneyStep(nextStep.key, nextStep.section);

    return (
      <div className="results-nextstep">
        <button type="button" className="results-nextstep__link" onClick={go}>
          <span className="results-nextstep__label">Next</span>
          <span className="results-nextstep__title">{title}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    );
  };

  // ---- Per-section renderers, used by the swipe deck so any section can be
  // rendered by key (current slide plus its neighbours). ----
  const renderProfileSection = (key) => (
    <>
      {key === 'profile' && (
        <>
          <h2 className="analysis-section-title">Your CareerDNA type</h2>
          <p>
            Your unique CareerDNA is based on seven profiles that represent different ways people think, act and find motivation.
            Your results show how closely you relate to each one. Most people show stronger links with two or three profiles, but it is the combination of all seven that creates your own unique CareerDNA mix.
            Hover over each result to see a brief description of that profile.
          </p>
          <div className="card-chart">
            <BarChart archetypes={computedResults} />
          </div>
        </>
      )}
      {key === 'traits' && (
        <>
          <h2 className="analysis-section-title">Your traits</h2>
          <p>
            Your CareerDNA is built around four core areas: <strong>Who You Are</strong>, <strong>What You Love</strong>, <strong>What Matters</strong>, and <strong>How You Work Best</strong>.
            Together, they capture your key psychological drivers, including your behaviour, interests, values and working preferences.
            Each area is broken down into subdimensions, which show where your natural tendencies are strongest. The chart below visualises these patterns.
            There are no “good” or “bad” scores. Lower scores simply reflect different preferences, not weaknesses. What matters is the overall pattern and what it suggests about where you are most likely to thrive.
          </p>
          <div className="section-divider" />
          <div className="card-chart">
            <div style={{ width: '820px', maxWidth: '100%', margin: '0 auto' }}>
              <DimensionsCarousel
                dimensions={DIMENSIONS}
                scores={scoresForChart}
                maxPerDimension={7}
              />
            </div>
          </div>
        </>
      )}
      {key === 'selfawareness' && (
        <>
          <h2 className="analysis-section-title">How well you know yourself</h2>
          <p>
            This estimates how clearly and consistently your answers describe you across the four CareerDNA areas. It looks at how decisive your answers are and how consistently related answers point in the same direction.
            Higher % suggests a clearer and more consistent self-view at this moment in time. It’s not a measure of ability, intelligence or worth.
            Just a signal of how strongly your preferences and tendencies came through in your answers today.
          </p>
          <div className="card-chart">
            <div style={{ width: '820px', maxWidth: '100%', margin: '0 auto' }}>
              <ClarityChart minItems={1} claritySummary={claritySummary} />
            </div>
          </div>
        </>
      )}
      {renderNextStep(key)}
    </>
  );

  const renderAnalysisSection = (tab, isActive = true) => {
    if (!tab) return null;
    return (
      <div className="analysis-tab-body">
        <div className="analysis-tabs-panel analysis-tabs-panel--full">
          {tab.key === 'discovermore' ? (
            <>
              <SelectionInsightExplorer
                insights={selectionInsights}
                loading={selectionInsightsLoading}
                error={selectionInsightsError}
                onItemReaction={handleNestedItemReaction}
                savedReactions={itemReactions}
              />
              {renderNextStep('discovermore')}
            </>
          ) : tab.key === 'furtherstudy' ? (
            <>
              <FurtherStudyPanel
                likedWorlds={likedWorldItems}
                likedPathwayTitles={likedPathwayTitles}
                archetypes={computedResults}
                subdimensions={Array.isArray(subdimensionRows) ? subdimensionRows : []}
                savedReactions={itemReactions}
                onItemReaction={handleNestedItemReaction}
              />
              {renderNextStep('furtherstudy')}
            </>
          ) : tab.key === 'nonuni' ? (
            <>
              <NonUniversityPanel
                likedWorlds={likedWorldItemsWithVocational}
                likedPathwayTitles={likedPathwayTitles}
                savedReactions={itemReactions}
                onItemReaction={handleNestedItemReaction}
                pathwayBands={(selectionInsights || []).reduce((m, i) => {
                  if (i && i.title && i.signalLabel && !m[i.title]) m[i.title] = i.signalLabel;
                  return m;
                }, {})}
              />
              {renderNextStep('nonuni')}
            </>
          ) : tab.key === 'roleexplorer' ? (
            <>
              <RoleExplorerPanel
                pathways={(selectionInsights || []).filter(
                  (i) => (i?.type === 'pathway' || i?.type === 'role' || i?.isPathway)
                    && Array.isArray(i?.roles) && i.roles.length
                )}
                savedReactions={itemReactions}
                onItemReaction={handleNestedItemReaction}
              />
              {renderNextStep('roleexplorer')}
            </>
          ) : tab.key === 'careerworlds' && careerWorldAccordionItems.length ? (() => {
            const allCw = [...careerWorldAccordionItems, ...careerWorldLowerAccordionItems];
            return (
              <>
                <h2 className="cw-accordion-group__heading">Your career worlds</h2>
                <CareerWorldsAccordion
                  worlds={allCw}
                  savedReactions={itemReactions}
                  onItemReaction={handleNestedItemReaction}
                  introText={[
                    'Career worlds are broad areas of work that may suit how you naturally think, learn and engage. Open each one to see what it is, why it fits you, and how your traits line up, then like the ones you are drawn to.',
                    'Every world here is shown the same way, whether you are planning on university or not. Some are entered through a degree, some through work, training or an apprenticeship, and many can be entered either way. When you open Career Pathways you will see exactly how you get into each one.',
                  ].join('\n')}
                />
                {renderNextStep('careerworlds')}
              </>
            );
          })() : tab.key === 'pathways' && careerPathwayAccordionGroups.length ? (
            <>
              {careerPathwayAccordionGroups.map((group, gi) => (
                <div key={group.key} className="cw-accordion-group">
                  <h2 className="cw-accordion-group__heading">{group.heading}</h2>
                  {gi === 0 ? (
                    <>
                      <div className="cw-accordion__intro">
                        <p className="cw-accordion__intro-p">These career pathways are matched to your subject and profile. Open each one to see what it is, why it fits you, and how your traits line up.</p>
                      </div>
                      <div className="cw-accordion__toolbar">
                        <ResultsFilterBar
                          filter={pathwayTabFilter}
                          onChange={setPathwayTabFilter}
                          groups={['band', 'favourites']}
                        />
                      </div>
                    </>
                  ) : null}
                  <CareerWorldsAccordion
                    worlds={group.items}
                    savedReactions={itemReactions}
                    onItemReaction={handleNestedItemReaction}
                    itemType="pathway"
                    iconFor={getPathwayIcon}
                    filter={pathwayTabFilter}
                    onFilterChange={setPathwayTabFilter}
                    hideFilterBar
                    introText=""
                  />
                </div>
              ))}
              {renderNextStep('pathways')}
            </>
          ) : tab.key === 'advisor' ? (
            isActive ? (
              <CareerAdvisorChat assessmentRunId={effectiveAssessmentRunId} embedded />
            ) : (
              <div className="analysis-box__body"><p>Your CareerDNA advisor.</p></div>
            )
          ) : (
            <>
              <div
                ref={markdownContentRef}
                className="markdown-content"
                dangerouslySetInnerHTML={renderSafeMarkdown(tab.markdown)}
              />
              {renderNextStep(tab.key)}
            </>
          )}
          {SECTION_ADVISOR_CONFIG[tab.key] && effectiveAssessmentRunId ? (
            <SectionAdvisor
              key={tab.key}
              assessmentRunId={effectiveAssessmentRunId}
              section={SECTION_ADVISOR_CONFIG[tab.key].section}
              title={SECTION_ADVISOR_CONFIG[tab.key].title}
              suggestedQuestions={SECTION_ADVISOR_CONFIG[tab.key].questions}
            />
          ) : null}
        </div>
      </div>
    );
  };

  const analysisReady = computedSummary && !computedSummary.startsWith('⚠️');
  // Show the locked / generate / loading / error state when the user is on the
  // analysis section but the analysis has not been generated yet.
  const showAnalysisPlaceholder = openTopSection === 'analysis' && !analysisReady;

  // ---- Swipe slider wiring ----
  // One ordered list of sections the finger-slider moves through: the profile
  // tabs always, plus the analysis tabs once the analysis is generated. The
  // slider's content is derived from this + the active tab (single source of
  // truth) so it can never drift out of sync with the menu.
  const swipeSections = [
    ...profileTabs.map((t) => ({ section: 'profile', key: t.key })),
    ...(analysisReady ? analysisTabsWithDiscoverMore.map((t) => ({ section: 'analysis', key: t.key })) : []),
  ];
  const activeDesc = openTopSection === 'analysis' && activeTab
    ? { section: 'analysis', key: activeTab.key }
    : { section: 'profile', key: activeProfileTab };
  const activeDescIndex = swipeSections.findIndex(
    (s) => s.section === activeDesc.section && s.key === activeDesc.key
  );
  const renderDesc = (desc, isActive) => {
    if (!desc) return null;
    if (desc.section === 'profile') return renderProfileSection(desc.key);
    return renderAnalysisSection(analysisTabsWithDiscoverMore.find((t) => t.key === desc.key), isActive);
  };
  // Move to a neighbouring section via the same state the tabs use (no page
  // scroll on swipe — you're already looking at the panel).
  const goToSectionDesc = (desc) => {
    if (!desc) return;
    if (desc.section === 'profile') {
      setActiveProfileTab(desc.key);
      setOpenTopSection('profile');
    } else {
      setActiveAnalysisTab(desc.key);
      setOpenTopSection('analysis');
      if (desc.key === 'strengths') persistSectionVisit('strength');
      else if (desc.key === 'environments') persistSectionVisit('environment');
    }
    // Land at the top of the new section on every swipe, so you don't arrive
    // half-way down because of where you were on the previous one.
    scrollResultsTabIntoView(18);
  };
  const prevDesc = activeDescIndex > 0 ? swipeSections[activeDescIndex - 1] : null;
  const nextDesc = activeDescIndex >= 0 && activeDescIndex < swipeSections.length - 1
    ? swipeSections[activeDescIndex + 1]
    : null;

  return (
    <div id="results-root">
      {upgradePrompt && (
        <ReportLimitModal
          mode={upgradePrompt.mode || (isFreeViewer ? 'starter' : 'exhausted')}
          currentPlan={reportPlan || 'free'}
          entitlement={{ plan: reportPlan || 'free' }}
          onClose={() => setUpgradePrompt(null)}
          onReturnToProfile={() => { window.location.href = '/profile'; }}
          onApplyCoupon={handleApplyCoupon}
        />
      )}
      <section className="results-container section-intro">
        <h1>Your Unique CareerDNA</h1>
        <p className="one-liner">
          {displayName ? (
            <>
              <strong>Hi, {displayName}!</strong>{' '}
            </>
          ) : (
            <>
              <strong>Hi!</strong>{' '}
            </>
          )}
          CareerDNA combines insights from behavioural science and AI to help you understand what drives you and how you work,
          so you can make informed choices about your direction and development. There is no right or wrong profile. The results
          don’t measure ability or success. They simply describe your patterns of motivation and behaviour that make you who you are.
        </p>
        <div className="section-divider" />
      </section>

      <div ref={pdfRef} id="pdf-content">
        <div ref={chartsWrapperRef} className="results-accordion-wrap">
          <section className="section accordion-section">
            <div ref={registerTopSectionRef('profile')} className="section-card section-card--full">
              {hasResults ? (
                    <div className="analysis-box analysis-box--tabbed is-ready">
                      <div className="analysis-tabs-layout">
                        <aside className="analysis-tabs-sidebar">
                          <div className="analysis-tabs-sidebar__list" ref={profileTabsListRef}>
                            {profileTabs.map((tab) => (
                              <button
                                key={tab.key}
                                type="button"
                                className={`analysis-tab-button ${openTopSection === 'profile' && tab.key === activeProfileTab ? 'is-active' : ''}`}
                                onClick={() => { setActiveProfileTab(tab.key); setOpenTopSection('profile'); scrollResultsTabIntoView(18); }}
                              >
                                <span className="analysis-tab-button__label">{tab.label}</span>
                              </button>
                            ))}
                            {(() => {
                              const analysisLocked = !computedSummary || computedSummary.startsWith('⚠️');
                              const sidebarTabs = analysisLocked ? lockedAnalysisTabs : analysisTabsWithDiscoverMore;
                              return sidebarTabs.map((tab) => {
                                const isActive = analysisLocked
                                  ? openTopSection === 'analysis' && lockedPreviewTab === tab.key
                                  : openTopSection === 'analysis' && activeTab && tab.key === activeTab.key;
                                return (
                                  <button
                                    key={tab.key}
                                    type="button"
                                    className={`analysis-tab-button ${isActive ? 'is-active' : ''} ${analysisLocked ? 'analysis-tab-button--locked' : ''}`}
                                    onClick={() => { if (analysisLocked) { setLockedPreviewTab(tab.key); setOpenTopSection('analysis'); scrollResultsTabIntoView(18); } else { handleAnalysisTabClick(tab.key); } }}
                                  >
                                    <span className="analysis-tab-button__label">{tab.label}</span>
                                    {analysisLocked ? (
                                      <svg className="analysis-tab-button__lock" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                                    ) : null}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </aside>

                        <div className="analysis-tabs-panel">
                          {showAnalysisPlaceholder ? (
                          <div ref={analysisRef} className="analysis-tab-inner">
                    {hasResults && !computedSummary && !loadingSummary && !upgradePrompt && (
                      <section className="results-cta results-cta--inside results-locked">
                        {lockedPreviewTab && ANALYSIS_TAB_TEASERS[lockedPreviewTab] ? (
                          <>
                            <h2>{(lockedAnalysisTabs.find((t) => t.key === lockedPreviewTab) || {}).label || 'Your full analysis'}</h2>
                            <p className="results-locked__teaser">{ANALYSIS_TAB_TEASERS[lockedPreviewTab]}</p>
                            <p className="results-locked__note">
                              This is part of your full CareerDNA analysis. Generate it to unlock this and every other section in the menu.
                            </p>
                          </>
                        ) : (
                          <>
                            <h2>What do these results mean?</h2>
                            <p>
                              The next step is a deeper analysis powered by our CareerDNA algorithm and AI engine that brings your scores together into a clear narrative, diving into
                              your strengths, ideal work environments, career paths and next-step options to help you make better choices with confidence.
                            </p>
                          </>
                        )}

                        {canRunReport && canGenerate ? (
                          <div className="results-actions">
                            <Button type="primary" onClick={handleRunAnalysis} disabled={!!loadingSummary}>
                              <img
                                src={dnaWhiteLogo}
                                alt=""
                                aria-hidden="true"
                                style={{
                                  width: 16,
                                  height: 16,
                                  objectFit: 'contain',
                                  marginRight: 8,
                                  display: 'inline-block',
                                  verticalAlign: 'middle',
                                  flexShrink: 0,
                                  opacity: 0.6,
                                  transform: 'translateY(-1px)',
                                }}
                              />
                              Run CareerDNA Analysis
                            </Button>
                            {!reportUnlimited && reportsRemaining != null && reportsRemaining > 0 ? (
                              <p className="results-locked__reports-left">
                                Generating uses one report. You have {reportsRemaining} report{reportsRemaining === 1 ? '' : 's'} left.
                              </p>
                            ) : null}
                          </div>
                        ) : isFreeViewer ? (
                          <div className="results-actions">
                            <Button type="primary" onClick={() => setUpgradePrompt({ mode: 'starter' })}>
                              Unlock your full analysis
                            </Button>
                            <p className="results-locked__reports-left">
                              Your free profile is a starting point. Unlock the full analysis to open every section above.
                            </p>
                          </div>
                        ) : (
                          <div className="results-actions">
                            <Button type="primary" onClick={() => setUpgradePrompt({ mode: 'exhausted' })}>
                              Check your plans
                            </Button>
                            <p className="results-locked__reports-left">
                              You have used all of your reports this month. Buy another report or explore your plan to continue.
                            </p>
                          </div>
                        )}

                        {analysisQualityMessage && (
                          <div
                            className="analysis-quality-modal-overlay"
                            onClick={() => setAnalysisQualityMessage('')}
                          >
                            <section
                              className="analysis-quality-modal"
                              role="dialog"
                              aria-modal="true"
                              aria-labelledby="analysisQualityTitle"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="analysis-quality-modal-close"
                                onClick={() => setAnalysisQualityMessage('')}
                                aria-label="Close"
                              >
                                ×
                              </button>

                              <div className="analysis-quality-modal-icon" aria-hidden="true">!</div>

                              <h3 id="analysisQualityTitle">Retake recommended</h3>

                              <p>{analysisQualityMessage}</p>

                              <div className="analysis-quality-modal-actions">
                                <button
                                  type="button"
                                  className="analysis-quality-modal-secondary"
                                  onClick={() => setAnalysisQualityMessage('')}
                                >
                                  Close
                                </button>

                                <button
                                  type="button"
                                  className="analysis-quality-modal-secondary"
                                  onClick={() => runAnalysisNow({ bypassQualityGate: true })}
                                >
                                  Generate anyway
                                </button>

                                {typeof (onFreshRetake || onRetake) === 'function' && (
                                  <button
                                    type="button"
                                    className="analysis-quality-modal-primary"
                                    onClick={onFreshRetake || onRetake}
                                  >
                                    Retake the assessment
                                  </button>
                                )}
                              </div>
                            </section>
                          </div>
                        )}
                      </section>
                    )}

                    {!computedSummary && !loadingSummary && !(hasResults && canGenerate) && !upgradePrompt && (
                      <div className="analysis-box__body">
                        <p>Your deeper CareerDNA analysis will appear here once it has been generated.</p>
                      </div>
                    )}

                    {loadingSummary && !computedSummary && (
                      <div className="analysis-box__body">
                        <LoadingSpinnerWithProgress />
                      </div>
                    )}

                    {computedSummary && computedSummary.startsWith('⚠️') && (
                      <div className="analysis-box__body">
                        <p style={{ color: 'red' }}>{computedSummary}</p>
                      </div>
                    )}

                          </div>
                          ) : (
                            <SwipeDeck
                              activeKey={`${activeDesc.section}:${activeDesc.key}`}
                              current={renderDesc(activeDesc, true)}
                              prev={renderDesc(prevDesc, false)}
                              next={renderDesc(nextDesc, false)}
                              onPrev={() => goToSectionDesc(prevDesc)}
                              onNext={() => goToSectionDesc(nextDesc)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="analysis-box">
                      <p>No results found. Please complete the survey first.</p>
                    </div>
                  )}
                </div>
              </section>
        </div>
      </div>


      <footer className="results-footer" aria-label="CareerDNA footer">
        <div className="results-footer-inner">
          <nav className="results-footer-links" aria-label="Footer links">
            <a href="/legal#privacy">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="/legal#terms">Terms of Use</a>
            <span aria-hidden="true">·</span>
            <a href="mailto:hello@mycareerdna.io">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="#report-problem">Report a problem</a>
          </nav>

          <p className="results-footer-copy">
            © 2026 CareerDNA. All rights reserved.
          </p>
        </div>
      </footer>

      <div className="bottom-spacer" />
    </div>
  );
}
