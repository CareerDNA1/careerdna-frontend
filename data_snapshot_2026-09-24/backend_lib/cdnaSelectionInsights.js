const { scoreItemTotal, scoreItemBreakdown } = require('./cdnaSelect');
const { CDNA_SCORE_CONFIG } = require('./cdnaScoreConfig');
const { ROLE_DESCRIPTIONS } = require('./roleDescriptions');

function norm(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function clamp(min, max, value) {
  return Math.min(max, Math.max(min, value));
}

function uniqBy(items = [], keyFn = (item) => item) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function formatList(values = []) {
  const items = uniqBy(
    (Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean),
    (value) => norm(value)
  );
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function pushSignatureItems(target = [], seen = new Set(), items = [], tier = 'signature') {
  for (const name of Array.isArray(items) ? items : []) {
    const label = String(name || '').trim();
    const key = norm(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    target.push({ name: label, tier });
  }
}

function buildSubjectSignatureSubdimensions(subject = {}) {
  const seen = new Set();
  const ordered = [];
  pushSignatureItems(ordered, seen, subject.coreSubdimensions, 'core');
  pushSignatureItems(ordered, seen, subject.secondarySubdimensions, 'secondary');

  if (!ordered.length) {
    pushSignatureItems(ordered, seen, subject.evidenceSubdims, 'signature');
    pushSignatureItems(ordered, seen, subject.keySubdimensions, 'signature');
  }

  return ordered;
}

function buildRoleSignatureSubdimensions(role = {}) {
  const seen = new Set();
  const ordered = [];
  pushSignatureItems(ordered, seen, role.coreSubdimensions, 'core');
  pushSignatureItems(ordered, seen, role.secondarySubdimensions, 'secondary');
  pushSignatureItems(ordered, seen, role.roleFamilyCoreSubdimensions, 'core');
  pushSignatureItems(ordered, seen, role.roleFamilySecondarySubdimensions, 'secondary');
  if (!ordered.length) {
    pushSignatureItems(ordered, seen, role.keySubdimensions, 'signature');
    pushSignatureItems(ordered, seen, role.roleFamilyKeySubdimensions, 'signature');
    pushSignatureItems(ordered, seen, role.evidenceSubdims, 'signature');
  }
  return ordered;
}

function buildCareerWorldSignatureSubdimensions(world = {}) {
  const seen = new Set();
  const ordered = [];
  pushSignatureItems(ordered, seen, world.coreSubdimensions, 'core');
  pushSignatureItems(ordered, seen, world.secondarySubdimensions, 'secondary');

  if (!ordered.length) {
    pushSignatureItems(ordered, seen, world.evidenceSubdims, 'signature');
    pushSignatureItems(ordered, seen, world.careerWorldKeySubdimensions, 'signature');
    pushSignatureItems(ordered, seen, world.keySubdimensions, 'signature');
    pushSignatureItems(ordered, seen, world.subdimensions, 'signature');
  }

  return ordered;
}


function pickRoleSummary(role = {}) {
  const candidates = [
    role?.fullSummary,
    role?.summary,
    role?.fallbackSummary,
    role?.description,
    role?.roleDescription,
    role?.shortDescription,
    role?.longDescription,
    role?.overview,
    role?.roleOverview,
    role?.whatTheyDo,
    role?.whatYouDo,
    role?.entryLevelSummary,
    role?.whyItFits,
    role?.fitDescription,
  ];

  for (const candidate of candidates) {
    const text = String(candidate || '').trim();
    if (!text) continue;
    if (/^(high|medium|mid|low|strong|good|standout|emerging)$/i.test(text)) continue;
    return text;
  }

  return '';
}

function roleFamilyItemsFromFlatRoles(allRoles = []) {
  const groups = new Map();

  for (const role of Array.isArray(allRoles) ? allRoles : []) {
    if (!role?.title) continue;

    const familyId = String(role?.roleFamilyId || '').trim();
    const familyTitle = String(role?.roleFamilyTitle || role?.title || '').trim();
    if (!familyTitle) continue;

    const careerWorldId = String(role?.careerWorldId || '').trim();
    const key = familyId || `${careerWorldId}::${familyTitle.toLowerCase()}`;

    if (!groups.has(key)) {
      groups.set(key, {
        id: familyId || `rf_${careerWorldId}_${familyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        title: familyTitle,
        type: 'pathway',
        careerWorldId,
        careerWorldTitle: role?.careerWorldTitle || '',
        archetypes: Array.isArray(role?.roleFamilyArchetypes) ? role.roleFamilyArchetypes : [],
        signatureSubdimensions: buildRoleSignatureSubdimensions({
          coreSubdimensions: role?.roleFamilyCoreSubdimensions || role?.coreSubdimensions,
          secondarySubdimensions: role?.roleFamilySecondarySubdimensions || role?.secondarySubdimensions,
          keySubdimensions: role?.roleFamilyKeySubdimensions || role?.keySubdimensions,
          evidenceSubdims: role?.evidenceSubdims,
        }),
        whyBelongs: role?.whyBelongs || '',
        confidence: role?.confidence || '',
        roles: [],
      });
    }

    const family = groups.get(key);
    const roleSummary = pickRoleSummary(role);

    family.roles.push({
      id: role?.id || '',
      title: role?.title || '',
      archetypes: Array.isArray(role?.archetypes) ? role.archetypes : [],
      keySubdimensions: Array.isArray(role?.keySubdimensions) ? role.keySubdimensions : [],
      coreSubdimensions: Array.isArray(role?.coreSubdimensions) ? role.coreSubdimensions : [],
      secondarySubdimensions: Array.isArray(role?.secondarySubdimensions) ? role.secondarySubdimensions : [],
      entryLevelFit: role?.entryLevelFit || '',
      fullSummary: roleSummary,
      summary: roleSummary,
      fallbackSummary: roleSummary,
      // Rich six-field Role Explorer definition (keyed by role id); fall back to
      // the short summary if a role has no long-form definition yet.
      description: (role?.id && ROLE_DESCRIPTIONS[role.id]) || roleSummary,
    });

    if (!family.archetypes.length && Array.isArray(role?.archetypes)) {
      family.archetypes = [...role.archetypes];
    }

    if (!family.signatureSubdimensions.length) {
      family.signatureSubdimensions = buildRoleSignatureSubdimensions(role);
    }
  }

  return Array.from(groups.values());
}

function buildSelectionIndexes(library = {}) {
  const subjectById = new Map();
  const subjectByTitle = new Map();
  const roleById = new Map();
  const roleByTitle = new Map();
  const pathwayById = new Map();
  const pathwayByTitle = new Map();
  const careerWorldById = new Map();
  const careerWorldByTitle = new Map();
  const directSubjectsByWorldId = new Map();
  const adjacentSubjectsByWorldId = new Map();

  const addToGroupedMap = (map, key, entry) => {
    if (!key) return;
    const arr = map.get(key) || [];
    arr.push(entry);
    map.set(key, arr);
  };

  for (const subject of Array.isArray(library.subjects) ? library.subjects : []) {
    if (!subject?.title) continue;
    const entry = {
      ...subject,
      type: 'subject',
      signatureSubdimensions: buildSubjectSignatureSubdimensions(subject),
    };
    if (entry.id) subjectById.set(String(entry.id), entry);
    subjectByTitle.set(norm(entry.title), entry);

    addToGroupedMap(directSubjectsByWorldId, String(entry?.careerWorldId || ''), entry);
    for (const worldId of Array.isArray(entry?.adjacentCareerWorldIds) ? entry.adjacentCareerWorldIds : []) {
      addToGroupedMap(adjacentSubjectsByWorldId, String(worldId || ''), entry);
    }
  }

  for (const role of Array.isArray(library.rolesFlat) ? library.rolesFlat : []) {
    if (!role?.title) continue;
    const entry = {
      ...role,
      type: 'role',
      familyTitle: role.roleFamilyTitle || role.familyTitle || '',
      signatureSubdimensions: buildRoleSignatureSubdimensions(role),
    };
    if (entry.id) roleById.set(String(entry.id), entry);
    roleByTitle.set(norm(entry.title), entry);
  }

  for (const pathway of roleFamilyItemsFromFlatRoles(library.rolesFlat)) {
    if (!pathway?.title) continue;
    pathwayById.set(String(pathway.id), pathway);
    pathwayByTitle.set(norm(pathway.title), pathway);
  }

  for (const world of Array.isArray(library.career_worlds) ? library.career_worlds : []) {
    if (!world?.title) continue;
    const worldId = String(world?.id || world?.careerWorldId || '');
    const directSubjects = uniqBy(directSubjectsByWorldId.get(worldId) || [], (item) => norm(item?.title));
    const adjacentSubjects = uniqBy(adjacentSubjectsByWorldId.get(worldId) || [], (item) => norm(item?.title))
      .filter((item) => !directSubjects.some((direct) => norm(direct?.title) === norm(item?.title)));

    const entry = {
      ...world,
      id: worldId || world?.id,
      type: 'career_world',
      signatureSubdimensions: buildCareerWorldSignatureSubdimensions(world),
      linkedSubjectsExact: directSubjects,
      linkedSubjectsAdjacent: adjacentSubjects,
    };

    if (entry.id) careerWorldById.set(String(entry.id), entry);
    careerWorldByTitle.set(norm(entry.title), entry);
  }

  return Object.freeze({
    subjectById,
    subjectByTitle,
    roleById,
    roleByTitle,
    pathwayById,
    pathwayByTitle,
    careerWorldById,
    careerWorldByTitle,
  });
}

function getSelectionLibraryItem(requestItem = {}, indexes = {}) {
  const type = String(requestItem?.type || '').trim().toLowerCase();
  const id = String(requestItem?.id || '').trim();
  const titleKey = norm(requestItem?.title || '');

  if (type === 'subject') {
    if (id && indexes.subjectById?.has(id)) return indexes.subjectById.get(id);
    if (titleKey && indexes.subjectByTitle?.has(titleKey)) return indexes.subjectByTitle.get(titleKey);
    return null;
  }

  if (type === 'career_world') {
    if (id && indexes.careerWorldById?.has(id)) return indexes.careerWorldById.get(id);
    if (titleKey && indexes.careerWorldByTitle?.has(titleKey)) return indexes.careerWorldByTitle.get(titleKey);
    return null;
  }

  if (type === 'role' || type === 'pathway') {
    if (id && indexes.pathwayById?.has(id)) return indexes.pathwayById.get(id);
    if (titleKey && indexes.pathwayByTitle?.has(titleKey)) return indexes.pathwayByTitle.get(titleKey);
    if (id && indexes.roleById?.has(id)) return indexes.roleById.get(id);
    if (titleKey && indexes.roleByTitle?.has(titleKey)) return indexes.roleByTitle.get(titleKey);
    return null;
  }

  if (id && indexes.careerWorldById?.has(id)) return indexes.careerWorldById.get(id);
  if (id && indexes.pathwayById?.has(id)) return indexes.pathwayById.get(id);
  if (id && indexes.subjectById?.has(id)) return indexes.subjectById.get(id);
  if (id && indexes.roleById?.has(id)) return indexes.roleById.get(id);
  if (titleKey && indexes.careerWorldByTitle?.has(titleKey)) return indexes.careerWorldByTitle.get(titleKey);
  if (titleKey && indexes.pathwayByTitle?.has(titleKey)) return indexes.pathwayByTitle.get(titleKey);
  if (titleKey && indexes.subjectByTitle?.has(titleKey)) return indexes.subjectByTitle.get(titleKey);
  if (titleKey && indexes.roleByTitle?.has(titleKey)) return indexes.roleByTitle.get(titleKey);
  return null;
}

function buildArchetypeScoreMap(profile = {}) {
  const map = new Map();
  for (const row of Array.isArray(profile.sorted) ? profile.sorted : []) {
    const key = String(row?.name || '').trim();
    if (!key) continue;
    map.set(key, Number(row?.score) || 0);
  }
  return map;
}

function getSubdimensionScore(profile = {}, name = '') {
  const wanted = norm(name);
  if (!wanted) return 0;

  const entries = profile?.userSubdimMap instanceof Map
    ? Array.from(profile.userSubdimMap.entries())
    : [];

  for (const [raw, score] of entries) {
    if (norm(raw) === wanted) {
      const n = Number(score);
      return Number.isFinite(n) ? n : 0;
    }
  }

  const topProfile = Array.isArray(profile?.topSubdimProfile) ? profile.topSubdimProfile : [];
  for (const row of topProfile) {
    if (norm(row?.name) === wanted) {
      const n = Number(row?.score);
      return Number.isFinite(n) ? n : 0;
    }
  }

  return 0;
}

function stateFromScore(score = 0) {
  if (score >= 70) return 'full';
  if (score >= 55) return 'mid';
  return 'grey';
}

function buildScoringContext(profile = {}) {
  const fullSubdimMap = profile?.userSubdimMap instanceof Map
    ? Object.fromEntries(Array.from(profile.userSubdimMap.entries()))
    : {};

  return {
    includedArchetypes: Array.isArray(profile?.included) ? profile.included : [],
    includedWeights: profile?.includedWeights || {},
    fullArchetypes: Array.isArray(profile?.sorted) ? profile.sorted : [],
    topSubdimProfile: Array.isArray(profile?.topSubdimProfile) ? profile.topSubdimProfile : [],
    fullSubdimMap,
    userSubdimMap: profile?.userSubdimMap instanceof Map ? profile.userSubdimMap : new Map(),
  };
}

function buildRelevantArchetypes(libraryItem = {}, profile = {}, maxItems = 2) {
  const archetypeScores = buildArchetypeScoreMap(profile);
  return uniqBy(
    (Array.isArray(libraryItem?.archetypes) ? libraryItem.archetypes : [])
      .map((name) => ({ name, userScore: Number(archetypeScores.get(name) || 0) }))
      .sort((a, b) => b.userScore - a.userScore)
      .map((row) => row.name),
    (value) => norm(value)
  ).slice(0, maxItems);
}

function buildRelevantSubdimensionNames(signatureSubdimensions = [], profile = {}, maxItems = 2) {
  return uniqBy(
    (Array.isArray(signatureSubdimensions) ? signatureSubdimensions : [])
      .map((entry) => ({
        name: entry?.name || '',
        userScore: getSubdimensionScore(profile, entry?.name),
      }))
      .filter((row) => row.name)
      .sort((a, b) => b.userScore - a.userScore)
      .map((row) => row.name),
    (value) => norm(value)
  ).slice(0, maxItems);
}

// Fixed score thresholds: >80 = Standout, >70 = Strong, >=60 = Good, else Lower.
// Applied to the absolute fit percentage (0–100).
function getLabelFromFixedThresholds(fitPct) {
  const pct = Number(fitPct) || 0;
  if (pct > 80) return { signalLabel: 'Standout', signalBlocks: 4 };
  if (pct > 70) return { signalLabel: 'Strong',   signalBlocks: 3 };
  if (pct >= 60) return { signalLabel: 'Good',    signalBlocks: 2 };
  return { signalLabel: 'Lower', signalBlocks: 1 };
}

function buildLinkedSubjectSummary(subject = {}, careerWorld = {}, profile = {}) {
  const subjectTitle = String(subject?.title || 'This subject').trim();
  const archetypes = buildRelevantArchetypes(subject, profile, 2);
  const subdims = buildRelevantSubdimensionNames(subject.signatureSubdimensions || [], profile, 2);
  const worldTitle = String(careerWorld?.title || 'this area').trim();

  const intro = `${subjectTitle} is a strong degree route into ${worldTitle}, helping you build the knowledge base and way of thinking often used in that space.`;

  const archetypeSentence = archetypes.length
    ? `It is especially supported by your ${formatList(archetypes)} pattern.`
    : 'It already matches several parts of your broader profile.';

  const subdimSentence = subdims.length
    ? `Traits like ${formatList(subdims)} help explain why it can feel like a natural fit for you.`
    : 'Some of the clearest fit still comes from the broader pattern in your profile.';

  return `${intro} ${archetypeSentence} ${subdimSentence}`.trim();
}

const WORLD_ANCHOR_SUBJECT_TITLES = Object.freeze({
  cw_finance_economics_investment: ['Finance', 'Accounting and Finance', 'Economics'],
});

function buildAnchorTokens(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !['and', 'the', 'of', 'for', 'to', 'in'].includes(token));
}

function scoreAnchorRelevance(subject = {}, careerWorld = {}) {
  const worldId = String(careerWorld?.id || careerWorld?.careerWorldId || '').trim();
  const titleKey = norm(subject?.title || '');
  const explicitAnchors = (WORLD_ANCHOR_SUBJECT_TITLES[worldId] || []).map((value) => norm(value));

  if (titleKey && explicitAnchors.includes(titleKey)) {
    return 0.28;
  }

  const worldTokens = new Set(buildAnchorTokens(careerWorld?.title || ''));
  if (!worldTokens.size) return 0;

  const subjectTokens = new Set(buildAnchorTokens(subject?.title || ''));
  let overlap = 0;
  for (const token of subjectTokens) {
    if (worldTokens.has(token)) overlap += 1;
  }

  return overlap > 0 ? Math.min(0.18, overlap * 0.09) : 0;
}

function scoreLinkedSubjects(careerWorld = {}, profile = {}, limit = 4, subjectPopulationScoreMap = null) {
  const ctx = buildScoringContext(profile);
  const exact = Array.isArray(careerWorld?.linkedSubjectsExact) ? careerWorld.linkedSubjectsExact : [];
  const adjacent = Array.isArray(careerWorld?.linkedSubjectsAdjacent) ? careerWorld.linkedSubjectsAdjacent : [];

  // Build sorted global population scores for rank-based labelling.
  // Signal labels are derived from fixed absolute-score thresholds (>75 / >65 / >=50)
  // applied to fitPct, so no population map is needed for ranking.

  const rawRows = [
    ...exact.map((subject) => ({ subject, relation: 'direct' })),
    ...adjacent.map((subject) => ({ subject, relation: 'adjacent' })),
  ]
    .map(({ subject, relation }) => {
      const breakdown = scoreItemBreakdown(subject, ctx);
      // fitPct: group-based ungated score (core 70% / secondary 30%) — consistent with main scoring pipeline
      const fitPct = Math.max(0, Math.min(100, breakdown.fitStrengthPct || 0));
      const anchorBonus = scoreAnchorRelevance(subject, careerWorld);
      const rankScore = breakdown.totalScore + anchorBonus;

      return {
        subject,
        relation,
        fitPct,
        breakdown,
        rankScore,
        anchorBonus,
        familyKey: norm(subject?.subjectFamily || subject?.family || subject?.subjectCluster || subject?.cluster || subject?.title),
      };
    })
    .sort((a, b) => {
      if (b.fitPct !== a.fitPct) return b.fitPct - a.fitPct;
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (a.relation !== b.relation) return a.relation === 'direct' ? -1 : 1;
      return String(a?.subject?.title || '').localeCompare(String(b?.subject?.title || ''));
    });

  const selected = [];
  const usedTitles = new Set();
  const familyCounts = new Map();

  const tryAdd = (row, options = {}) => {
    const { enforceFamily = true, maxFamilyCount = null } = options;
    const titleKey = norm(row?.subject?.title);
    const familyKey = row?.familyKey || '';
    const currentFamilyCount = familyKey ? Number(familyCounts.get(familyKey) || 0) : 0;

    if (!titleKey || usedTitles.has(titleKey)) return;
    if (enforceFamily && familyKey && currentFamilyCount > 0) return;
    if (maxFamilyCount != null && familyKey && currentFamilyCount >= maxFamilyCount) return;

    selected.push(row);
    usedTitles.add(titleKey);
    if (familyKey) familyCounts.set(familyKey, currentFamilyCount + 1);
  };

  // Pass 1: non-specialist subjects, one per family
  for (const row of rawRows.filter((row) => String(row?.subject?.subjectPriority || '').trim().toLowerCase() !== 'specialist')) {
    if (selected.length >= limit) break;
    tryAdd(row, { enforceFamily: true });
  }
  // Pass 2: fill remaining slots, up to 2 per family
  for (const row of rawRows) {
    if (selected.length >= limit) break;
    tryAdd(row, { enforceFamily: false, maxFamilyCount: 2 });
  }

  return selected
    .map((row) => {
      const { signalLabel, signalBlocks } = getLabelFromFixedThresholds(row.fitPct);
      const fitPct = row.fitPct;
      const summary = buildLinkedSubjectSummary({
        ...row.subject,
        signatureSubdimensions: buildSubjectSignatureSubdimensions(row.subject),
      }, careerWorld, profile);
      return {
        id: row?.subject?.id || row?.subject?.title || '',
        title: row?.subject?.title || '',
        absoluteFitScore: fitPct,
        signalLabel,
        signalBlocks,
        fullSummary: summary,
        summary,
      };
    })
    // Only show "Good" or better (signalBlocks >= 2); always include the top result
    .filter((item, idx) => idx === 0 || item.signalBlocks >= 2);
}

function buildSelectionInsight(libraryItem = {}, profile = {}, requestItem = {}, options = {}) {
  const subjectPopulationScoreMap = options?.subjectPopulationScoreMap || null;
  const archetypeScores = buildArchetypeScoreMap(profile);
  const archetypes = (Array.isArray(libraryItem.archetypes) ? libraryItem.archetypes : [])
    .map((name) => {
      const userScore = Number(archetypeScores.get(name) || 0);
      return {
        name,
        userScore,
        state: stateFromScore(userScore),
      };
    });

  // Career worlds carry `signatureSubdimensions` ({name, tier}); pathways and
  // roles carry plain `coreSubdimensions` / `secondarySubdimensions` string
  // arrays instead. Fall back to those so pathways also get their trait pills.
  const rawSignatureSubdims = Array.isArray(libraryItem.signatureSubdimensions) && libraryItem.signatureSubdimensions.length
    ? libraryItem.signatureSubdimensions
    : [
        ...(Array.isArray(libraryItem.coreSubdimensions) ? libraryItem.coreSubdimensions : [])
          .map((name) => (typeof name === 'string' ? { name, tier: 'core' } : { name: name?.name || '', tier: name?.tier || 'core' })),
        ...(Array.isArray(libraryItem.secondarySubdimensions) ? libraryItem.secondarySubdimensions : [])
          .map((name) => (typeof name === 'string' ? { name, tier: 'secondary' } : { name: name?.name || '', tier: name?.tier || 'secondary' })),
      ];

  const subdimensions = rawSignatureSubdims
    .filter((entry) => entry && entry.name)
    .map((entry) => {
      const userScore = getSubdimensionScore(profile, entry?.name);
      return {
        name: entry?.name || '',
        tier: entry?.tier || 'signature',
        userScore,
        state: stateFromScore(userScore),
      };
    });

  const strongSubdimensionCount = subdimensions.filter((x) => x.state === 'full').length;
  const roles = Array.isArray(libraryItem?.roles) ? libraryItem.roles : [];
  const type = requestItem?.type || libraryItem?.type || 'subject';
  const isPathway = type === 'pathway' || roles.length > 0;
  const isCareerWorld = type === 'career_world';
  const linkedSubjects = isCareerWorld ? scoreLinkedSubjects(libraryItem, profile, 5, subjectPopulationScoreMap) : [];
  const canonicalSignal = options?.canonicalSignal || extractCanonicalSignal(requestItem);

  // Roles within a pathway. Each role now carries its own core/secondary
  // subdimensions and archetypes, so score it with the same matrix scorer and
  // rank by match. Show EVERY role in the pathway (including Lower matches), best
  // first — the Role Explorer lists all roles the pathway contains rather than
  // hiding the lower-scoring ones. Mirrors the Career Pathways tab behaviour.
  const buildRole = (role) => {
    const roleSummary = pickRoleSummary(role);
    const base = {
      id: role?.id || '',
      title: role?.title || '',
      entryLevelFit: role?.entryLevelFit || '',
      fullSummary: roleSummary,
      summary: roleSummary,
      fallbackSummary: roleSummary,
      // Long-form six-field definition for the Role Explorer card, injected in index.js.
      description: role?.description || '',
    };
    if (!options?.ctx) return base;
    const breakdown = scoreItemBreakdown(role, options.ctx);
    const fitPct = Number(breakdown?.fitStrengthPct || breakdown?.absoluteFitPct || 0);
    const { signalLabel, signalBlocks } = getLabelFromFixedThresholds(fitPct);
    return { ...base, signalLabel, signalBlocks, signalPct: Math.round(fitPct) };
  };
  let scoredRoles = roles.map(buildRole);
  if (options?.ctx) {
    scoredRoles = scoredRoles.sort((a, b) => Number(b.signalPct) - Number(a.signalPct));
  }

  return {
    id: requestItem?.id || libraryItem?.id || libraryItem?.title,
    sourceId: libraryItem?.id || null,
    type,
    title: requestItem?.title || libraryItem?.title || '',
    careerWorldId: libraryItem?.careerWorldId || libraryItem?.id || '',
    careerWorldTitle: libraryItem?.careerWorldTitle || requestItem?.careerWorldTitle || '',
    familyTitle:
      requestItem?.familyTitle ||
      libraryItem?.familyTitle ||
      libraryItem?.roleFamilyTitle ||
      libraryItem?.subjectFamily ||
      '',
    whyBelongs: libraryItem?.whyBelongs || '',
    confidence: libraryItem?.confidence || '',
    isPathway,
    isCareerWorld,
    roles: scoredRoles,
    linkedSubjects,
    signalLabel: canonicalSignal.signalLabel || requestItem?.signalLabel || '',
    signalBlocks: Number(canonicalSignal.signalBlocks || requestItem?.signalBlocks || 0),
    signalPct: Number(canonicalSignal.signalPct || requestItem?.signalPct || 0),
    fitPct: Number(canonicalSignal.fitPct || requestItem?.fitPct || 0),
    coveragePct: Number(canonicalSignal.coveragePct || requestItem?.coveragePct || 0),
    coreCoverageRatio: Number(canonicalSignal.coreCoverageRatio || requestItem?.coreCoverageRatio || 0),
    canonicalSignal,
    archetypes,
    subdimensions,
    strongSubdimensionCount,
    totalSubdimensionCount: subdimensions.length,
    fitCoverage: subdimensions.length ? clamp(0, 1, strongSubdimensionCount / subdimensions.length) : 0,
  };
}


function extractCanonicalSignal(item = {}) {
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

module.exports = {
  buildSelectionIndexes,
  getSelectionLibraryItem,
  buildSelectionInsight,
  extractCanonicalSignal,
};
