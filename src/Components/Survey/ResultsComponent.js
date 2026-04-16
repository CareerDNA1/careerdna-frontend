// src/Components/Survey/ResultsComponent.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import './ResultsComponent.css';
import BarChart from './BarChart';
import { marked } from 'marked';
import Button from '../Common/Button';
import { FaBolt } from 'react-icons/fa';

import DimensionsCarousel from './DimensionsCarousel';
import DIMENSIONS from '../../utils/Dimensions';
import ClarityChart from './ClarityChart';
import SelectionInsightExplorer from './SelectionInsightExplorer';

async function fetchSelectionInsights(payload) {
  const candidates = [];
  const configuredBase =
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) || '';
  const trimmedBase = String(configuredBase || '').trim().replace(/\/$/, '');

  if (trimmedBase) {
    candidates.push(`${trimmedBase}/api/selection-insights`);
  }

  candidates.push('/api/selection-insights');

  if (typeof window !== 'undefined') {
    const currentOrigin = window.location?.origin || '';
    if (/localhost:3000$/i.test(currentOrigin)) {
      candidates.push('http://localhost:3001/api/selection-insights');
    }
  }

  const tried = [];
  let lastError = null;

  for (const url of candidates) {
    if (!url || tried.includes(url)) continue;
    tried.push(url);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });

      if (res.status === 404) {
        lastError = new Error('Request failed 404');
        continue;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed ${res.status}`);
      }
      return data;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Could not load deeper insights right now.');
}


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

function LoadingSpinnerWithProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => (p >= 99 ? p : p + Math.random() * 1.5));
    }, 290);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="analysis-loader">
      <div className="circular-loader">
        <svg className="progress-ring" width="100" height="100">
          <circle
            className="progress-ring__circle"
            stroke="#2f80ed"
            strokeWidth="8"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
            style={{
              strokeDasharray: 251,
              strokeDashoffset: 251 - (progress / 100) * 251,
            }}
          />
        </svg>
        <div className="progress-text">{Math.floor(progress)}%</div>
      </div>
      <p style={{ marginTop: 16, color: '#666', fontSize: 14 }}>
        Generating your personalised summary...
      </p>
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

const SECTION_SIGNAL_KEYS = {
  strengths: ['strengths'],
  idealenvironments: ['environments'],
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
};

const SELECTABLE_SECTION_CONFIG = {
  careerworlds: { keys: ['careerWorlds'], type: 'career_world' },
  careerworldsmostalignedwithyourinterestarea: { keys: ['careerWorldsAligned', 'career_worlds_aligned', 'careerWorlds'], type: 'career_world' },
  othercareerworldstoexplore: { keys: ['careerWorldsOther', 'career_worlds_other', 'careerWorlds'], type: 'career_world' },
  universitysubjectsbestfit: { keys: ['subjectsBestFit', 'subjects_best_fit', 'broad_subjects', 'subjects'], type: 'subject' },
  otherstrongoptionstoexplore: { keys: ['subjectsOther', 'subjects_other', 'subjects'], type: 'subject' },
  moreadjacentoptionstoexplore: { keys: ['subjectsOther', 'subjects_other', 'subjects'], type: 'subject' },
  universitysubjectsmostalignedwithyourinterestarea: { keys: ['subjectsAligned', 'subjects_aligned', 'broad_subjects', 'subjects'], type: 'subject' },
  otheruniversitysubjectsworthexploring: { keys: ['subjectsExploratory', 'subjects_exploratory', 'subjects'], type: 'subject' },
  otherspecialistoptionstoexplore: { keys: ['specialistSubjects', 'specialist_subjects', 'subjects'], type: 'subject' },
  careerpathways: { keys: ['pathways', 'roles'], type: 'role' },
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

      out.push({
        id: row?.id || makeSelectableItemId(sectionKey, title),
        title,
        type: row?.type || config.type,
        sourceSection: sectionKey,
        signalLabel: row?.signalLabel || '',
        signalBlocks: row?.signalBlocks || 0,
        careerWorldId: row?.careerWorldId || '',
        careerWorldTitle: row?.careerWorldTitle || '',
        familyTitle: row?.familyTitle || '',
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

function decorateAnalysisSignals(root, analysisMeta, itemReactions = {}) {
  if (!root) return;

  root.querySelectorAll('.cdna-item-rail').forEach((node) => node.remove());
  root.querySelectorAll('.cdna-signal-item').forEach((node) => node.classList.remove('cdna-signal-item'));
  root.querySelectorAll('.cdna-selectable-item').forEach((node) => node.classList.remove('cdna-selectable-item'));

  if (!analysisMeta?.sections) return;

  const sectionMaps = buildSignalMaps(analysisMeta);
  const selectableMaps = buildSelectableMaps(analysisMeta).bySection;
  const headings = Array.from(root.querySelectorAll('h2, h3'));

  headings.forEach((heading) => {
    const normalizedHeading = normalizeHeading(heading.textContent);
    const sectionCandidates = SECTION_SIGNAL_KEYS[normalizedHeading] || [];
    if (!sectionCandidates.length) return;

    let next = heading.nextElementSibling;
    while (next && !/^H[23]$/i.test(next.tagName)) {
      if (next.tagName === 'OL' || next.tagName === 'UL') break;
      next = next.nextElementSibling;
    }

    if (!next || (next.tagName !== 'OL' && next.tagName !== 'UL')) return;
    const titleMap = sectionCandidates
      .map((key) => sectionMaps[key])
      .find((map) => map && map.size);
    if (!titleMap) return;

    const selectableMap = selectableMaps[normalizedHeading] || null;

    Array.from(next.querySelectorAll(':scope > li')).forEach((li) => {
      const itemTitleKey = extractSignalTitleFromListItem(li);
      const signal = titleMap.get(itemTitleKey);
      if (!signal) return;

      li.classList.add('cdna-signal-item');

      const railEl = document.createElement('div');
      railEl.className = 'cdna-item-rail';

      const signalEl = document.createElement('div');
      signalEl.className = 'cdna-item-signal';
      signalEl.innerHTML = `
        <span class="cdna-item-signal-label">${signal.signalLabel || 'Strong'}</span>
        <span class="cdna-item-signal-blocks" aria-hidden="true">
          ${Array.from({ length: 4 }, (_, idx) => `<span class="cdna-item-signal-block ${idx < Number(signal.signalBlocks || 0) ? 'is-filled' : ''}"></span>`).join('')}
        </span>
      `;
      railEl.appendChild(signalEl);

      const selectableItem = selectableMap?.get(itemTitleKey);
      if (selectableItem) {
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
            aria-label="Save ${selectableItem.title}"
            title="Save"
            data-tooltip="Save"
          >
            <span class="cdna-item-action-icon" aria-hidden="true">♥</span>
          </button>
          <button
            type="button"
            class="cdna-item-action cdna-item-action--dislike ${reaction === 'dislike' ? 'is-active' : ''}"
            data-item-id="${selectableItem.id}"
            data-reaction="dislike"
            aria-pressed="${reaction === 'dislike' ? 'true' : 'false'}"
            aria-label="Not for me: ${selectableItem.title}"
            title="Not for me"
            data-tooltip="Not for me"
          >
            <span class="cdna-item-action-icon" aria-hidden="true">👎</span>
          </button>
        `;
        railEl.appendChild(actionsEl);
      }

      li.appendChild(railEl);
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
  { key: 'summary', label: 'Summary' },
  { key: 'strengths', label: 'Strengths' },
  { key: 'environments', label: 'Ideal Environments' },
  { key: 'careerworlds', label: 'Career Worlds' },
  { key: 'pathways', label: 'University Subjects' },
];

function normalizeViewerStatus(raw = '') {
  const value = String(raw || '').trim().toLowerCase();
  if (['school', 'gcse', 'a-level', 'alevel', 'sixth form', 'sixth-form'].includes(value)) return 'school';
  if (['undergrad', 'undergraduate', 'ug', 'postgrad', 'postgraduate', 'pg', 'masters', 'master', 'msc', 'mba'].includes(value)) return 'undergraduate';
  return '';
}

function sectionBelongsToTab(title = '') {
  const key = normalizeHeading(title);
  if (!key || key === 'summary') return 'summary';
  if (key === 'strengths') return 'strengths';
  if (key === 'idealenvironments') return 'environments';
  if (
    key === 'careerworlds' ||
    key === 'careerworldsmostalignedwithyourinterestarea' ||
    key === 'othercareerworldstoexplore'
  ) {
    return 'careerworlds';
  }
  if (
    key === 'careerpathways' ||
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

  const sections = [];
  if (matches[0].index > 0) {
    const preface = source.slice(0, matches[0].index).trim();
    if (preface) sections.push({ title: 'Summary', markdown: preface });
  }

  matches.forEach((entry, idx) => {
    const nextIndex = idx < matches.length - 1 ? matches[idx + 1].index : source.length;
    const markdown = source.slice(entry.index, nextIndex).trim();
    if (markdown) sections.push({ title: entry.title, markdown });
  });

  return sections;
}

function getFinalTabLabel(md = '', analysisMeta = {}, viewerStatus = '') {
  const normalizedStatus = normalizeViewerStatus(viewerStatus);
  if (normalizedStatus && normalizedStatus !== 'school') return 'Career Pathways';

  const sections = splitMarkdownIntoSections(md);
  const hasCareerPathways = sections.some((section) => normalizeHeading(section?.title) === 'careerpathways');
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

function buildAnalysisTabs(md = '', analysisMeta = {}, viewerStatus = '') {
  const buckets = {
    summary: [],
    strengths: [],
    environments: [],
    careerworlds: [],
    pathways: [],
  };

  splitMarkdownIntoSections(md).forEach((section) => {
    const bucket = sectionBelongsToTab(section?.title);
    buckets[bucket].push(String(section?.markdown || '').trim());
  });

  const normalizedStatus = normalizeViewerStatus(viewerStatus);
  const defsBase = normalizedStatus === 'school'
    ? ANALYSIS_TAB_BASE_DEFS.filter((tab) => tab.key !== 'pathways')
    : ANALYSIS_TAB_BASE_DEFS;

  const defs = defsBase.map((tab) =>
    tab.key === 'pathways' ? { ...tab, label: getFinalTabLabel(md, analysisMeta, viewerStatus) } : tab
  );

  return defs
    .map((tab) => ({
      ...tab,
      markdown: (buckets[tab.key] || []).filter(Boolean).join('\n\n'),
    }))
    .filter((tab) => tab.markdown);
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
  archetypes,
  summary,
  subdimensionRows,
  claritySummary,
  analysisMeta,
  viewerStatus,
}) {
  const analysisRef = useRef(null);
  const markdownContentRef = useRef(null);
  const [itemReactions, setItemReactions] = useState({});
  const [showSelectionExplorer, setShowSelectionExplorer] = useState(false);
  const [selectionInsights, setSelectionInsights] = useState([]);
  const [selectionInsightsLoading, setSelectionInsightsLoading] = useState(false);
  const [selectionInsightsError, setSelectionInsightsError] = useState('');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('summary');

  const localChartsWrapperRef = useRef(null);
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

  const computedSummary = useMemo(() => {
    if (!rawSummary) return '';
    return stripSubdimensionSection(rawSummary);
  }, [rawSummary]);

  const displayName = useMemo(() => normaliseName(introName), [introName]);
  const selectableMaps = useMemo(() => buildSelectableMaps(analysisMeta), [analysisMeta]);
  const precomputedSelectionInsightMap = useMemo(() => {
    const rows = Array.isArray(analysisMeta?.precomputedSelectionInsights)
      ? analysisMeta.precomputedSelectionInsights
      : [];
    return new Map(
      rows.map((item) => {
        const key = item?.id || item?.title;
        return [key, item];
      }).filter(([key]) => !!key)
    );
  }, [analysisMeta]);
  const analysisTabs = useMemo(() => buildAnalysisTabs(computedSummary, analysisMeta, viewerStatus), [computedSummary, analysisMeta, viewerStatus]);
  const activeTab = useMemo(
    () => analysisTabs.find((tab) => tab.key === activeAnalysisTab) || analysisTabs[0] || null,
    [analysisTabs, activeAnalysisTab]
  );

  const likedInsightItemIds = useMemo(
    () => Object.entries(itemReactions)
      .filter(([, reaction]) => reaction === 'like')
      .map(([id]) => id),
    [itemReactions]
  );

  const selectedInsightItems = useMemo(
    () => likedInsightItemIds.map((id) => selectableMaps.byId.get(id)).filter(Boolean),
    [likedInsightItemIds, selectableMaps]
  );

  const handleRunAnalysis = async () => {
    if (typeof fetchAiSummary !== 'function') return;
    analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await fetchAiSummary({ force: true });
  };

  const hasResults = Object.keys(computedResults).length > 0;
  const canGenerate = typeof fetchAiSummary === 'function';

  useEffect(() => {
    if (!activeTab?.markdown || !markdownContentRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      decorateAnalysisSignals(markdownContentRef.current, analysisMeta, itemReactions);
    });
    return () => window.cancelAnimationFrame(frame);
  });

  useEffect(() => {
    const root = markdownContentRef.current;
    if (!root) return undefined;

    const handleClick = (event) => {
      const button = event.target instanceof Element
        ? event.target.closest('.cdna-item-action')
        : null;
      if (!(button instanceof HTMLButtonElement)) return;

      const itemId = button.dataset.itemId;
      const reaction = button.dataset.reaction;
      if (!itemId || !reaction) return;

      setItemReactions((prev) => {
        const current = prev[itemId] || '';
        if (current === reaction) {
          const next = { ...prev };
          delete next[itemId];
          return next;
        }
        return { ...prev, [itemId]: reaction };
      });
    };

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, [activeTab?.markdown]);

  useEffect(() => {
    setItemReactions((prev) => {
      const next = {};
      Object.entries(prev).forEach(([id, reaction]) => {
        if (selectableMaps.byId.has(id)) next[id] = reaction;
      });
      return next;
    });
  }, [selectableMaps]);

  useEffect(() => {
    if (selectedInsightItems.length > 0) return;
    setShowSelectionExplorer(false);
    setSelectionInsights([]);
    setSelectionInsightsError('');
    setSelectionInsightsLoading(false);
  }, [selectedInsightItems.length]);

  useEffect(() => {
    if (!analysisTabs.length) {
      setActiveAnalysisTab('summary');
      return;
    }
    if (!analysisTabs.some((tab) => tab.key === activeAnalysisTab)) {
      setActiveAnalysisTab(analysisTabs[0].key);
    }
  }, [analysisTabs, activeAnalysisTab]);

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

    async function loadSelectionInsights() {
      if (!showSelectionExplorer || !selectedInsightItems.length) return;

      const precomputed = selectedInsightItems
        .map((item) => precomputedSelectionInsightMap.get(item?.id || item?.title || ''))
        .filter(Boolean);
      const missingItems = selectedInsightItems.filter(
        (item) => !precomputedSelectionInsightMap.has(item?.id || item?.title || '')
      );

      if (!missingItems.length) {
        setSelectionInsights(precomputed);
        setSelectionInsightsError('');
        setSelectionInsightsLoading(false);
        return;
      }

      setSelectionInsightsLoading(true);
      setSelectionInsightsError('');

      try {
        const data = await fetchSelectionInsights({
          archetypes: computedResults,
          subdimensions: Array.isArray(subdimensionRows) ? subdimensionRows : [],
          likedItems: missingItems,
        });

        if (cancelled) return;
        const fetched = Array.isArray(data?.selectionInsights) ? data.selectionInsights : [];
        setSelectionInsights([...precomputed, ...fetched]);
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
  }, [showSelectionExplorer, selectedInsightItems, computedResults, subdimensionRows, precomputedSelectionInsightMap]);

  const handleToggleSelectionExplorer = () => {
    setShowSelectionExplorer((prev) => !prev);
  };

  return (
    <div id="results-root">
      <section className="results-container section-intro">
        <h1>Your Unique CareerDNA</h1>
        <p className="one-liner">
          {displayName && <strong>{displayName}</strong>}, CareerDNA combines insights from behavioural science and AI
          to help you understand what drives you and how you work, so you can make informed choices about your direction
          and development. There is no right or wrong profile. The results don’t measure ability or success. They simply describe
          your patterns of motivation and behaviour that make you who you are.
        </p>
        <div className="section-divider" />
      </section>

      <div ref={pdfRef} id="pdf-content">
        <div ref={chartsWrapperRef}>
          <section className="section">
            <div className="section-card section-card--full">
              <h2 style={{ color: '#2f80ed' }}>Your CareerDNA Signature</h2>
              <p>
                Your signature is based on seven archetypes that represent different ways people think, act and find motivation.
                Your results show how closely you relate to each one. Most people show stronger links with two or three types that together form a distinctive profile. Hover over each result to see a brief description of that archetype.
              </p>

              <div className="card-chart">
                {hasResults ? (
                  <BarChart archetypes={computedResults} />
                ) : (
                  <div className="analysis-box">
                    <p>No results found. Please complete the survey first.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {hasResults && (
            <section className="section">
              <div className="section-card section-card--full">
                <h2 style={{ color: '#2f80ed' }}>Your CareerDNA Traits</h2>
                <p>
                  Your CareerDNA is built around four lenses: <strong>Who You Are</strong>, <strong>What You Love</strong>, <strong>What Matters</strong>, and <strong>How You Work Best</strong>.
                  Together, they capture the main psychological dimensions that shape your motivation and fit, from personality traits and interests to values and working preferences.
                  Each lens includes specific subdimensions that show where your strengths naturally lie and what kind of environments bring out your best.
                </p>

                <div className="card-chart">
                  <div style={{ width: '820px', maxWidth: '100%', margin: '0 auto' }}>
                    <DimensionsCarousel
                      dimensions={DIMENSIONS}
                      scores={scoresForChart}
                      maxPerDimension={7}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="section">
            <div className="section-card section-card--full">
              <h2 style={{ color: '#2f80ed' }}>How clearly do you know yourself?</h2>
              <p>
                This estimates how clearly and consistently your answers describe you across the four CareerDNA dimensions.
                It looks at how decisive your answers are and how well your answers point in the same direction across related items.
                Higher % means a clearer self-view. It’s not a measure of ability but just a signal of confidence and consistency in how you see yourself today.
              </p>
              <div className="card-chart">
                <div style={{ width: '820px', maxWidth: '100%', margin: '0 auto' }}>
                  <ClarityChart minItems={1} claritySummary={claritySummary} />
                </div>
              </div>
            </div>
          </section>
        </div>

        {hasResults && canGenerate && !computedSummary && (
          <section className="results-cta">
            <h2>What do these results mean?</h2>
            <p>
              Your CareerDNA results are a starting point. The next step is a deeper analysis powered by our
              CareerDNA algorithm and AI engine that brings your scores together into a clear narrative, diving into
              your strengths, ideal work environments, fit areas and next-step options to help you make better choices with confidence.
            </p>

            {!loadingSummary && (
              <div className="results-actions">
                <Button type="primary" onClick={handleRunAnalysis} disabled={!!loadingSummary}>
                  <FaBolt style={{ marginRight: 8 }} />
                  Run CareerDNA Analysis
                </Button>
              </div>
            )}
          </section>
        )}

        {(computedSummary || loadingSummary) && (
          <>
            <div className={`analysis-box analysis-box--tabbed ${activeTab ? 'is-ready' : ''}`}>
              <div className="analysis-box__header" ref={analysisRef}>
                <h2>🧠 Your CareerDNA Analysis</h2>
                <p>Use the tabs to move through the main parts of your CareerDNA analysis.</p>
              </div>

              {loadingSummary && !computedSummary ? (
                <div className="analysis-box__body">
                  <LoadingSpinnerWithProgress />
                </div>
              ) : computedSummary && computedSummary.startsWith('⚠️') ? (
                <div className="analysis-box__body">
                  <p style={{ color: 'red' }}>{computedSummary}</p>
                </div>
              ) : activeTab ? (
                <div className="analysis-tabs-layout">
                  <aside className="analysis-tabs-sidebar">
                    <div className="analysis-tabs-sidebar__title">Analysis sections</div>
                    <div className="analysis-tabs-sidebar__list">
                      {analysisTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={`analysis-tab-button ${tab.key === activeTab.key ? 'is-active' : ''}`}
                          onClick={() => setActiveAnalysisTab(tab.key)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </aside>

                  <div className="analysis-tabs-panel">
                    <div
                      ref={markdownContentRef}
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ __html: marked(activeTab.markdown) }}
                    />
                  </div>
                </div>
              ) : computedSummary ? (
                <div className="analysis-box__body">
                  <div
                    ref={markdownContentRef}
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: marked(computedSummary) }}
                  />
                </div>
              ) : null}
            </div>

            {selectedInsightItems.length > 0 && (
              <div className="selection-discover-wrap">
                <button
                  type="button"
                  className="selection-discover-btn"
                  onClick={handleToggleSelectionExplorer}
                >
                  {showSelectionExplorer
                    ? 'Hide selected options'
                    : `Discover more about ${selectedInsightItems.length} selected option${selectedInsightItems.length === 1 ? '' : 's'}`}
                </button>
              </div>
            )}

            {showSelectionExplorer && selectedInsightItems.length > 0 && (
              <SelectionInsightExplorer
                insights={selectionInsights}
                loading={selectionInsightsLoading}
                error={selectionInsightsError}
              />
            )}

            {canGenerate && (
              <div className="analysis-footer">
                <Button type="secondary" onClick={handleRunAnalysis} disabled={!!loadingSummary}>
                  <FaBolt style={{ marginRight: 8 }} />
                  {loadingSummary ? 'Re-running CareerDNA Analysis...' : 'Re-run CareerDNA Analysis'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bottom-spacer" />
    </div>
  );
}
