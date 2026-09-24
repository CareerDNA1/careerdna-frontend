// src/lib/cdnaSelect.js
const { bestFuzzyMatch } = require("./cdnaValidate");
const {
  resolveAliasCandidates,
  normalizeSubjectAliasKey,
  getSubjectAliasConfig,
} = require("./cdnaSubjectAliases");
const { CDNA_SCORE_CONFIG } = require("./cdnaScoreConfig");

function canonSubdimName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s*&\s*/g, " & ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function clamp(min, max, v) {
  return Math.min(max, Math.max(min, v));
}

function buildTopSubdimMap(ctx = {}) {
  const map = new Map();
  if (ctx.topSubdimMap && typeof ctx.topSubdimMap === "object") {
    for (const [k, v] of Object.entries(ctx.topSubdimMap)) {
      const key = canonSubdimName(k);
      if (!key) continue;
      map.set(key, Number(v) || 0);
    }
  }
  for (const row of ensureArray(ctx.topSubdimProfile)) {
    const key = canonSubdimName(row?.name);
    if (!key) continue;
    map.set(key, Number(row?.score) || 0);
  }
  return map;
}

function buildFullSubdimMap(ctx = {}) {
  const map = new Map();

  if (ctx.fullSubdimMap && typeof ctx.fullSubdimMap === "object") {
    for (const [k, v] of Object.entries(ctx.fullSubdimMap)) {
      const key = canonSubdimName(k);
      if (!key) continue;
      map.set(key, Number(v) || 0);
    }
  }

  if (ctx.userSubdimMap instanceof Map) {
    for (const [k, v] of ctx.userSubdimMap.entries()) {
      const key = canonSubdimName(k);
      if (!key) continue;
      map.set(key, Number(v) || 0);
    }
  }

  const topOnly = buildTopSubdimMap(ctx);
  for (const [k, v] of topOnly.entries()) {
    if (!map.has(k)) map.set(k, Number(v) || 0);
  }

  return map;
}

function uniqCanonicalList(items = []) {
  const out = [];
  const seen = new Set();
  for (const item of items || []) {
    const key = canonSubdimName(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function buildWeightedSubdimEntries(item = {}) {
  const core = uniqCanonicalList([
    ...ensureArray(item?.coreSubdimensions),
    ...ensureArray(item?.careerWorldCoreSubdimensions),
  ]);
  const secondary = uniqCanonicalList([
    ...ensureArray(item?.secondarySubdimensions),
    ...ensureArray(item?.careerWorldSecondarySubdimensions),
  ]).filter((x) => !core.includes(x));

  if (core.length || secondary.length) {
    return [
      ...core.map((name) => ({ name, weight: 1.0, tier: "core" })),
      ...secondary.map((name) => ({ name, weight: 1.0, tier: "secondary" })),
    ];
  }

  const fallback = extractItemKeySubdimensions(item).map(canonSubdimName);
  const fallbackWeights = CDNA_SCORE_CONFIG.subdimension.fallbackWeights;
  return fallback.map((name, idx) => ({
    name,
    weight: fallbackWeights[idx] ?? fallbackWeights[fallbackWeights.length - 1] ?? 0.16,
    tier: "fallback",
  }));
}

function extractItemKeySubdimensions(item) {
  const raw = [
    ...ensureArray(item?.keySubdimensions),
    ...ensureArray(item?.roleFamilyKeySubdimensions),
    ...ensureArray(item?.careerWorldKeySubdimensions),
    ...ensureArray(item?.subdimensions),
    ...ensureArray(item?.evidenceSubdims),
  ];
  const out = [];
  const seen = new Set();
  for (const sd of raw) {
    const key = canonSubdimName(sd);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function normalizeProfilePct(pct) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return 0;
  return clamp(0, 1, n / 100);
}

function normalizeItemScoreToPct(score = 0, scaleMax = CDNA_SCORE_CONFIG.subdimension.totalScoreScale || 3.2) {
  const n = Number(score);
  const max = Number(scaleMax);
  if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((n / max) * 100)));
}

function getItemSignalFromBreakdown(breakdown = {}, options = {}) {
  const signalPct = Math.max(
    0,
    Math.min(
      100,
      Number.isFinite(Number(breakdown?.rawFitPct))
        ? Number(breakdown.rawFitPct)
        : Number.isFinite(Number(breakdown?.absoluteFitPct))
        ? Number(breakdown.absoluteFitPct)
        : normalizeItemScoreToPct(breakdown?.totalScore, options?.scaleMax)
    )
  );

  const fitPct = Math.max(
    0,
    Math.min(
      100,
      Number.isFinite(Number(breakdown?.fitStrengthPct))
        ? Number(breakdown.fitStrengthPct)
        : Number.isFinite(Number(breakdown?.absoluteFitPct))
        ? Number(breakdown.absoluteFitPct)
        : signalPct
    )
  );

  const coverageRatio = Math.max(
    0,
    Math.min(
      1,
      Number.isFinite(Number(breakdown?.coreCoverageRatio))
        ? Number(breakdown.coreCoverageRatio)
        : Number.isFinite(Number(breakdown?.coverageRatio))
        ? Number(breakdown.coverageRatio)
        : 0
    )
  );

  let signalLabel = "Lower";
  let signalBlocks = 1;

  if (signalPct > 80) {
    signalLabel = "Standout";
    signalBlocks = 4;
  } else if (signalPct > 70) {
    signalLabel = "Strong";
    signalBlocks = 3;
  } else if (signalPct >= 60) {
    signalLabel = "Good";
    signalBlocks = 2;
  }

  return {
    signalPct,
    fitPct,
    coverageRatio,
    coveragePct: Math.round(coverageRatio * 100),
    signalLabel,
    signalBlocks,
  };
}

// Build a name -> percentile (0-100) map covering the user's FULL archetype
// profile, so every tag an item lists can be scored — a tag the user rates low
// still counts and pulls the score down, mirroring how subdimensions are scored
// against the full subdimension profile. Falls back to includedWeights (top
// archetypes only) if the full profile is not present on the context.
function buildArchetypeWeightMap(ctx = {}) {
  const full = Array.isArray(ctx?.fullArchetypes) ? ctx.fullArchetypes : null;
  if (full && full.length) {
    const out = {};
    for (const a of full) {
      if (!a || a.name == null) continue;
      const v = Number(a.score);
      if (Number.isFinite(v)) out[a.name] = v > 1 ? v : v * 100;
    }
    if (Object.keys(out).length) return out;
  }
  return ctx?.includedWeights || {};
}

function scoreItemByArchetypes(item, weights = {}) {
  const tags = Array.isArray(item?.archetypes) ? item.archetypes : [];
  if (!tags.length) return 0;

  let total = 0;
  let count = 0;
  for (const tag of tags) {
    const pct = Number(weights?.[tag]);
    if (Number.isFinite(pct)) {
      total += clamp(0, 1, pct / 100);
      count++;
    }
  }

  return count > 0 ? total / count : 0;
}

// Harmonic mean (F-score) of two 0..1 quantities. Used to combine STRENGTH
// (how well you match) with COVERAGE (how many of the item's traits you match):
// both must be high to score well; a high one cannot fully paper over a low one.
function harmonicMean(a, b) {
  const x = clamp(0, 1, Number(a) || 0);
  const y = clamp(0, 1, Number(b) || 0);
  return x + y > 0 ? (2 * x * y) / (x + y) : 0;
}

// Archetype fit as STRENGTH (average match across the item's tags) and COVERAGE
// (share of the item's tags the user rates at/above the match threshold).
function scoreItemArchetypeFit(item, weights = {}, thresholdPct = 60) {
  const tags = Array.isArray(item?.archetypes) ? item.archetypes : [];
  if (!tags.length) return { strength: 0, coverage: 0 };
  let total = 0;
  let count = 0;
  let matched = 0;
  for (const tag of tags) {
    const pct = Number(weights?.[tag]);
    if (!Number.isFinite(pct)) continue;
    total += clamp(0, 1, pct / 100);
    count++;
    if (pct >= thresholdPct) matched++;
  }
  return {
    strength: count > 0 ? total / count : 0,
    coverage: tags.length > 0 ? matched / tags.length : 0,
  };
}

function scoreItemBySubdimensionProfile(item, ctx = {}) {
  return scoreItemBreakdown(item, ctx).totalScore;
}

function scoreItemBreakdown(item, ctx = {}) {
  const subdimMap = buildFullSubdimMap(ctx);
  const entries = buildWeightedSubdimEntries(item);
  const cfg = CDNA_SCORE_CONFIG.subdimension;
  const archFit = scoreItemArchetypeFit(item, buildArchetypeWeightMap(ctx), cfg.coreMatchThresholdPct);
  const archetypeScore = archFit.strength;
  const archCoverage = archFit.coverage;

  if (!subdimMap.size || !entries.length) {
    return {
      weightedTraitFit: 0,
      subdimensionScore: 0,
      fitStrengthPct: 0,
      rawFitPct: 0,
      rawFit: 0,
      coverageRatio: 0,
      coreCoverageRatio: 0,
      strongestCorePct: 0,
      absoluteFitPct: 0,
      archetypeScore,
      archetypeContribution: 0,
      totalScore: 0,
    };
  }

  const totalWeight = entries.reduce((sum, entry) => sum + (entry.weight || 0), 0) || 1;
  let weightedSum = 0;
  let matchedWeight = 0;
  let coreMatched = 0;
  let coreTotal = 0;
  let secondaryMatched = 0;
  let strongestCore = 0;

  // Group-based tracking: core and secondary averages computed independently
  let coreSum = 0;
  let coreCount = 0;
  let secondarySum = 0;
  let secondaryCount = 0;

  for (const entry of entries) {
    const pct = Number(subdimMap.get(entry.name));
    if (!Number.isFinite(pct)) continue;

    const boosted = normalizeProfilePct(pct);
    if (boosted > 0) {
      weightedSum += entry.weight * boosted;
      matchedWeight += entry.weight;
    }

    const isCorelike = entry.tier === "core" || entry.tier === "fallback";
    if (isCorelike) {
      coreSum += boosted;
      coreCount++;
      coreTotal++;
      if (pct >= cfg.coreMatchThresholdPct) coreMatched++;
      if (pct > strongestCore) strongestCore = pct;
    } else {
      secondarySum += boosted;
      secondaryCount++;
      if (pct >= cfg.coreMatchThresholdPct) secondaryMatched++;
    }
  }

  // Core and secondary group averages — independent of how many subdims are in each group
  const coreAvg = coreCount > 0 ? clamp(0, 1, coreSum / coreCount) : 0;
  const secondaryAvg = secondaryCount > 0 ? clamp(0, 1, secondarySum / secondaryCount) : 0;

  // Combine: cores 70%, secondaries 30% — fall back to whichever group exists
  const groupFit = coreCount > 0 && secondaryCount > 0
    ? clamp(0, 1, coreAvg * cfg.coreGroupWeight + secondaryAvg * cfg.secondaryGroupWeight)
    : coreCount > 0 ? coreAvg : secondaryAvg;

  const weightedTraitFit = groupFit;
  const coverageRatio = clamp(0, 1, matchedWeight / totalWeight);
  const coreCoverageRatio = coreTotal ? clamp(0, 1, coreMatched / coreTotal) : coverageRatio;
  const strongestCorePct = Number(strongestCore) || 0;

  // ---- STRENGTH (how well you match) ----
  const rawFit = clamp(0, 1, weightedTraitFit); // subdimension strength, 0..1

  // ---- COVERAGE (how many of the item's designed traits you match at Strong+) ----
  // Core/secondary weighted the same 70/30 as strength, so a missed CORE trait costs
  // far more than a missed secondary one (protects items with long secondary lists).
  const coreCov = coreTotal > 0 ? coreMatched / coreTotal : 0;
  const secCov = secondaryCount > 0 ? secondaryMatched / secondaryCount : 0;
  const subCoverage = clamp(
    0,
    1,
    coreTotal > 0 && secondaryCount > 0
      ? coreCov * cfg.coreGroupWeight + secCov * cfg.secondaryGroupWeight
      : coreTotal > 0 ? coreCov : secCov
  );

  // ---- Combine STRENGTH and COVERAGE via harmonic mean (F-score), per dimension ----
  const subdimF1 = harmonicMean(rawFit, subCoverage);
  const archetypeF1 = harmonicMean(archetypeScore, archCoverage);

  const subdimFitPct = Math.max(0, Math.min(100, Math.round(subdimF1 * 100)));
  const subdimensionScore = subdimF1 * cfg.totalScoreScale;

  // Per-item-type archetype weight. Strengths (id prefix "str_") are scored on
  // subdimensions alone; everything else uses the default archetype weight.
  const totalCfg = CDNA_SCORE_CONFIG.total || {};
  const isStrengthItem = String(item?.id || "").startsWith("str_");
  const rawArchetypeWeight = isStrengthItem
    ? Number(totalCfg.archetypeContributionWeightStrengths)
    : Number(totalCfg.archetypeContributionWeight);
  const archetypeContributionWeight = clamp(
    0,
    1,
    Number.isFinite(rawArchetypeWeight) ? rawArchetypeWeight : 0
  );
  const subdimensionContributionWeight = 1 - archetypeContributionWeight;

  // Overall fit = weighted blend of the two per-dimension F-scores. Drives the
  // displayed %, the band label, and ordering.
  const blendedFit = clamp(
    0,
    1,
    subdimF1 * subdimensionContributionWeight + archetypeF1 * archetypeContributionWeight
  );
  const blendedFitPct = Math.max(0, Math.min(100, Math.round(blendedFit * 100)));
  const fitStrengthPct = blendedFitPct;
  const absoluteFitPct = blendedFitPct;
  const rawFitPct = blendedFitPct;
  const archetypeContribution = archetypeF1 * cfg.totalScoreScale * archetypeContributionWeight;
  const totalScore = blendedFit * cfg.totalScoreScale;

  return {
    weightedTraitFit,
    subdimensionStrength: rawFit,
    subdimensionCoverage: subCoverage,
    subdimF1,
    subdimensionScore,
    subdimFitPct,
    fitStrengthPct,
    rawFitPct,
    rawFit,
    blendedFit,
    blendedFitPct,
    coverageRatio,
    coreCoverageRatio,
    strongestCorePct,
    absoluteFitPct,
    archetypeScore,
    archetypeCoverage: archCoverage,
    archetypeF1,
    archetypeContribution,
    totalScore,
  };
}

function scoreItemTotal(item, ctx = {}) {
  return scoreItemBreakdown(item, ctx).totalScore;
}

function scoreSharedSubdimensions(a, b) {
  const aEntries = buildWeightedSubdimEntries(a);
  const bNames = new Set(buildWeightedSubdimEntries(b).map((x) => x.name));
  if (!aEntries.length || !bNames.size) return 0;
  let overlap = 0;
  for (const entry of aEntries) {
    if (bNames.has(entry.name)) overlap += entry.weight;
  }
  return overlap;
}

function sortByScoreDesc(itemsWithScores) {
  return itemsWithScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTags = Array.isArray(a.item.archetypes) ? a.item.archetypes.length : 999;
    const bTags = Array.isArray(b.item.archetypes) ? b.item.archetypes.length : 999;
    if (aTags !== bTags) return aTags - bTags;
    const ta = String(a.item.title || "").toLowerCase();
    const tb = String(b.item.title || "").toLowerCase();
    return ta.localeCompare(tb);
  });
}

function ensureArchetypeCoverage(picked, scored, includedArchetypes = [], limit) {
  return ensureArray(picked).slice(0, Math.max(0, Number(limit) || 0));
}

function matchUserSubjectsToLibSubjects(userSubjects = [], libSubjects = []) {
  return resolveMultipleSubjectIntents(userSubjects, libSubjects).matchedSubjects;
}

function findBestMatchingSubject(userSubject = "", libSubjects = []) {
  return makeSubjectIntent(userSubject, libSubjects).bestSubject;
}

function dedupeByTitle(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = String(it?.title || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function normalizedTitle(s) {
  return normalizeSubjectAliasKey(s);
}

function findExactTitleSubject(userSubject = "", libSubjects = []) {
  const norm = normalizedTitle(userSubject);
  if (!norm) return null;
  return libSubjects.find((s) => normalizedTitle(s?.title) === norm) || null;
}

function findFuzzyTitleSubject(userSubject = "", libSubjects = []) {
  const titles = libSubjects.map((s) => normalizedTitle(s.title));
  const norm = normalizedTitle(userSubject);
  if (!norm) return null;
  const best = bestFuzzyMatch(norm, titles, (x) => x);
  return best ? libSubjects.find((s) => normalizedTitle(s.title) === best) || null : null;
}

function resolveAliasTitleMatches(userSubject = "", libSubjects = []) {
  const aliasCfg = getSubjectAliasConfig(userSubject);
  const wanted = ensureArray(aliasCfg?.subjectTitles).map((t) => normalizedTitle(t)).filter(Boolean);
  if (!wanted.length) return [];

  const byNorm = new Map();
  for (const subj of libSubjects || []) {
    const norm = normalizedTitle(subj?.title);
    if (norm) byNorm.set(norm, subj);
  }

  const out = [];
  const seen = new Set();
  for (const title of wanted) {
    const subj = byNorm.get(title);
    const key = String(subj?.title || "").toLowerCase();
    if (!subj || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(subj);
  }
  return out;
}

function makeSubjectIntent(userSubject = "", libSubjects = []) {
  const aliasCfg = getSubjectAliasConfig(userSubject);
  const aliasTitleMatches = resolveAliasTitleMatches(userSubject, libSubjects);
  const aliasFallbackMatches = resolveAliasCandidates(userSubject, libSubjects);
  const exact = findExactTitleSubject(userSubject, libSubjects);
  const fuzzy = findFuzzyTitleSubject(userSubject, libSubjects);

  let matchedSubjects = [];
  let bestSubject = null;
  let matchSource = "none";

  if (aliasTitleMatches.length) {
    matchedSubjects = aliasTitleMatches;
    bestSubject = aliasTitleMatches[0] || null;
    matchSource = "alias_titles";
  } else if (aliasFallbackMatches.length) {
    matchedSubjects = aliasFallbackMatches;
    bestSubject = aliasFallbackMatches[0] || null;
    matchSource = "alias";
  } else if (exact) {
    matchedSubjects = [exact];
    bestSubject = exact;
    matchSource = "exact";
  } else if (fuzzy) {
    matchedSubjects = [fuzzy];
    bestSubject = fuzzy;
    matchSource = "fuzzy";
  }

  matchedSubjects = dedupeByTitle(matchedSubjects);

  const primaryWorldIds = new Set();
  const secondaryWorldIds = new Set();

  const explicitPrimary = ensureArray(aliasCfg?.primaryCareerWorldIds || aliasCfg?.careerWorldIds).filter(Boolean);
  const explicitSecondary = ensureArray(aliasCfg?.secondaryCareerWorldIds).filter(Boolean);

  if (explicitPrimary.length || explicitSecondary.length) {
    for (const id of explicitPrimary) primaryWorldIds.add(id);
    for (const id of explicitSecondary) {
      if (!primaryWorldIds.has(id)) secondaryWorldIds.add(id);
    }
  } else if (bestSubject) {
    const worldId = bestSubject?.careerWorldId;
    if (worldId) primaryWorldIds.add(worldId);
    for (const id of ensureArray(bestSubject?.adjacentCareerWorldIds)) {
      if (id && !primaryWorldIds.has(id)) secondaryWorldIds.add(id);
    }
  }

  return {
    label: userSubject,
    matchSource,
    aliasConfig: aliasCfg,
    matchedSubjects,
    bestSubject: bestSubject || null,
    primaryWorldIds: Array.from(primaryWorldIds),
    secondaryWorldIds: Array.from(secondaryWorldIds).filter((id) => !primaryWorldIds.has(id)),
  };
}

function mergeSubjectIntents(intents = []) {
  const matched = [];
  const seenTitles = new Set();
  const primaryWorldIds = new Set();
  const secondaryWorldIds = new Set();

  for (const intent of intents) {
    for (const subj of ensureArray(intent?.matchedSubjects)) {
      const key = String(subj?.title || "").toLowerCase();
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      matched.push(subj);
    }
    for (const id of ensureArray(intent?.primaryWorldIds)) {
      if (id) primaryWorldIds.add(id);
    }
    for (const id of ensureArray(intent?.secondaryWorldIds)) {
      if (id && !primaryWorldIds.has(id)) secondaryWorldIds.add(id);
    }
  }

  const bestSubject = intents.find((x) => x?.bestSubject)?.bestSubject || null;

  const exactMatchedTitleSet = new Set();
  const broadMatchedTitleSet = new Set();
  for (const intent of intents) {
    const target = intent?.matchSource === "alias" ? broadMatchedTitleSet : exactMatchedTitleSet;
    for (const subj of ensureArray(intent?.matchedSubjects)) {
      const key = String(subj?.title || "").toLowerCase();
      if (key) target.add(key);
    }
  }

  return {
    intents,
    matchedSubjects: matched,
    matchedTitleSet: new Set(matched.map((s) => String(s?.title || "").toLowerCase())),
    exactMatchedTitleSet,
    broadMatchedTitleSet,
    primaryWorldIds: Array.from(primaryWorldIds),
    secondaryWorldIds: Array.from(secondaryWorldIds).filter((id) => !primaryWorldIds.has(id)),
    bestSubject,
  };
}

function resolveMultipleSubjectIntents(userSubjects = [], libSubjects = []) {
  const rawLabels = Array.isArray(userSubjects) ? userSubjects : [userSubjects];
  const labels = rawLabels
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const intents = labels.map((label) => makeSubjectIntent(label, libSubjects));
  return mergeSubjectIntents(intents);
}

function subjectCareerWorldBonus(careerWorld, subjectIntent = null) {
  if (!careerWorld || !subjectIntent) return 0;

  const worldId = careerWorld.id || careerWorld.careerWorldId || "";
  if (!worldId) return 0;

  const primary = new Set(ensureArray(subjectIntent.primaryWorldIds));
  const secondary = new Set(ensureArray(subjectIntent.secondaryWorldIds));

  let bonus = 0;
  if (primary.has(worldId)) bonus += 0.55;
  else if (secondary.has(worldId)) bonus += 0.16;

  const subjectTags = new Set(ensureArray(subjectIntent.bestSubject?.archetypes));
  const worldTags = ensureArray(careerWorld?.archetypes);
  let overlap = 0;
  for (const tag of worldTags) if (subjectTags.has(tag)) overlap += 1;
  bonus += Math.min(overlap, 2) * 0.03;

  return bonus;
}

function buildScoreMap(list = [], ctx = {}) {
  const scored = list.map((item) => ({ item, score: scoreItemTotal(item, ctx) }));
  const byId = new Map();
  const byTitle = new Map();
  for (const row of scored) {
    if (row.item?.id) byId.set(row.item.id, row.score);
    if (row.item?.title) byTitle.set(row.item.title, row.score);
  }
  return { scored, byId, byTitle };
}

function worldScoreForSubject(subject, worldScoreById) {
  if (!subject) return 0;
  let bonus = worldScoreById.get(subject.careerWorldId) || 0;
  const adjacent = Array.isArray(subject.adjacentCareerWorldIds) ? subject.adjacentCareerWorldIds : [];
  for (const id of adjacent) bonus = Math.max(bonus, (worldScoreById.get(id) || 0) * 0.55);
  return bonus;
}

function worldScoreForEnvironment(env, worldScoreById) {
  const ids = Array.isArray(env.careerWorldIds) ? env.careerWorldIds : [];
  let bonus = 0;
  for (const id of ids) bonus = Math.max(bonus, worldScoreById.get(id) || 0);
  return bonus;
}

function roleWorldBonus(role, subject, worldScoreById) {
  if (!role) return 0;
  let bonus = 0;
  const mainId = subject?.careerWorldId || "";
  const adj = new Set(Array.isArray(subject?.adjacentCareerWorldIds) ? subject.adjacentCareerWorldIds : []);
  if (role.careerWorldId && role.careerWorldId === mainId) bonus += (worldScoreById.get(role.careerWorldId) || 0) * 0.38;
  else if (role.careerWorldId && adj.has(role.careerWorldId)) bonus += (worldScoreById.get(role.careerWorldId) || 0) * 0.18;
  return bonus;
}

function subjectSimilarityToRole(subject, role) {
  const subj = new Set(Array.isArray(subject?.archetypes) ? subject.archetypes : []);
  const roleTags = Array.isArray(role?.archetypes) ? role.archetypes : [];
  let overlap = 0;
  for (const tag of roleTags) if (subj.has(tag)) overlap += 1;
  return overlap * 0.06;
}

function roleFamilyItemsFromFlatRoles(allRoles = []) {
  if (!Array.isArray(allRoles) || !allRoles.length) return [];

  const groups = new Map();

  for (const role of allRoles) {
    const familyId = String(role?.roleFamilyId || "").trim();
    const familyTitle = String(role?.roleFamilyTitle || role?.title || "").trim();
    if (!familyTitle) continue;

    const careerWorldId = String(role?.careerWorldId || "").trim();
    const key = familyId || `${careerWorldId}::${familyTitle.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: familyId || `rf_${careerWorldId}_${familyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_")}` ,
        title: familyTitle,
        careerWorldId,
        careerWorldTitle: role?.careerWorldTitle || "",
        careerWorldArchetypes: ensureArray(role?.careerWorldArchetypes),
        archetypes: ensureArray(role?.roleFamilyArchetypes),
        keySubdimensions: ensureArray(role?.roleFamilyKeySubdimensions),
        coreSubdimensions: ensureArray(role?.roleFamilyCoreSubdimensions),
        secondarySubdimensions: ensureArray(role?.roleFamilySecondarySubdimensions),
        whyBelongs: role?.whyBelongs || "",
        confidence: role?.confidence || "",
        sourceUrls: ensureArray(role?.sourceUrls),
        roles: [],
      });
    }

    const group = groups.get(key);
    group.roles.push({
      id: role?.id || "",
      title: role?.title || "",
      archetypes: ensureArray(role?.archetypes),
      keySubdimensions: ensureArray(role?.keySubdimensions),
      entryLevelFit: role?.entryLevelFit || "",
    });

    if (!group.archetypes.length) {
      group.archetypes = ensureArray(role?.archetypes);
    }
    if (!group.keySubdimensions.length) {
      group.keySubdimensions = ensureArray(role?.keySubdimensions);
    }
  }

  return Array.from(groups.values());
}

function buildScoredCareerWorldRows(careerWorlds = [], ctx = {}, opts = {}) {
  const subjectIntent =
    opts && opts.subjectIntent
      ? opts.subjectIntent
      : resolveMultipleSubjectIntents(opts?.subjectLabels || opts?.subjects || [], opts?.allSubjects || []);

  const primaryWorldIds = new Set(ensureArray(subjectIntent?.primaryWorldIds));
  const secondaryWorldIds = new Set(ensureArray(subjectIntent?.secondaryWorldIds));
  const baseRows = buildScoreMap(careerWorlds, ctx).scored;

  return sortByScoreDesc(
    baseRows.map((row) => {
      const worldId = row?.item?.id || row?.item?.careerWorldId || "";

      return {
        item: row.item,
        baseScore: row.score,
        subjectBonus: 0,
        score: row.score,
        subjectTier: primaryWorldIds.has(worldId)
          ? "primary"
          : secondaryWorldIds.has(worldId)
          ? "secondary"
          : "other",
      };
    })
  );
}

function buildScoredEnvironmentRows(environments = [], topCareerWorlds = [], ctx = {}) {
  return sortByScoreDesc(
    environments.map((env) => {
      const baseScore = scoreItemTotal(env, ctx);
      return {
        item: env,
        baseScore,
        worldBonus: 0,
        score: baseScore,
      };
    })
  );
}

function buildScoredRoleRows(allRoles = [], matchedSubject = null, topCareerWorlds = [], ctx = {}) {
  const familyItems = roleFamilyItemsFromFlatRoles(allRoles);

  const matchedWorldId = String(matchedSubject?.careerWorldId || "").trim();
  const adjacentWorldIds = new Set(
    ensureArray(matchedSubject?.adjacentCareerWorldIds).map((id) => String(id || "").trim()).filter(Boolean)
  );

  return sortByScoreDesc(
    familyItems.map((family) => {
      const baseScore = scoreItemTotal(family, ctx);
      const familyWorldId = String(family?.careerWorldId || "").trim();

      let currentSubjectBonus = 0;
      if (matchedWorldId && familyWorldId) {
        if (familyWorldId === matchedWorldId) currentSubjectBonus = 0.55;
        else if (adjacentWorldIds.has(familyWorldId)) currentSubjectBonus = 0.18;
      }

      return {
        item: family,
        baseScore,
        currentSubjectBonus,
        subjectWorldBonus: 0,
        subjectSimilarityBonus: 0,
        sharedSubdimBonus: 0,
        score: baseScore + currentSubjectBonus,
      };
    })
  );
}

function selectStrengths(strengths = [], ctx = {}, limit = 5, maxGood = 2) {
  const scored = strengths.map((item) => {
    const breakdown = scoreItemBreakdown(item, ctx);
    const signal = getItemSignalFromBreakdown(breakdown);
    return { item, score: breakdown.totalScore, signalLabel: signal.signalLabel };
  });
  const sorted = sortByScoreDesc(scored);
  const selected = [];
  let goodCount = 0;
  for (const row of sorted) {
    if (selected.length >= limit) break;
    const isGood = row.signalLabel === "Good";
    if (isGood && goodCount >= maxGood) continue;
    selected.push(row.item);
    if (isGood) goodCount++;
  }
  return selected;
}

function selectCareerWorlds(careerWorlds = [], ctx = {}, limit = 5, opts = {}) {
  const scored = buildScoredCareerWorldRows(careerWorlds, ctx, opts);
  return scored.slice(0, limit).map((x) => x.item);
}

function selectEnvironmentsForWorlds(environments = [], topCareerWorlds = [], ctx = {}, limit = 5, maxGood = 2) {
  const scored = environments.map((env) => {
    const breakdown = scoreItemBreakdown(env, ctx);
    const signal = getItemSignalFromBreakdown(breakdown);
    return { item: env, score: breakdown.totalScore, signalLabel: signal.signalLabel };
  });
  const sorted = sortByScoreDesc(scored);
  const selected = [];
  let goodCount = 0;
  for (const row of sorted) {
    if (selected.length >= limit) break;
    const isGood = row.signalLabel === "Good";
    if (isGood && goodCount >= maxGood) continue;
    selected.push(row.item);
    if (isGood) goodCount++;
  }
  return selected;
}


function subjectClusterKey(subject) {
  const explicit = String(subject?.subjectCluster || subject?.cluster || "").trim().toLowerCase();
  if (explicit) return explicit;

  const title = String(subject?.title || "").toLowerCase();
  const worldId = String(subject?.careerWorldId || "").toLowerCase();

  if (
    worldId.includes("health_care") ||
    /counselling|psychotherapy|occupational therapy|nursing|midwifery|medicine|dentistry|physiotherapy|paramedic|pharmacy|health|optometry|radiography|veterinary/.test(title)
  ) {
    return "helping-care";
  }

  if (
    worldId.includes("education_coaching") ||
    /education|teaching|social work|childhood|youth/.test(title)
  ) {
    return "helping-development";
  }

  if (worldId.includes("psychology_behaviour") || /psychology/.test(title)) {
    return "psychology-behaviour";
  }

  if (
    worldId.includes("marketing_media") ||
    /journalism|media|marketing|communications|pr\b|english language|languages|english literature|creative writing/.test(title)
  ) {
    return "communication-media";
  }

  if (
    worldId.includes("creative_arts") ||
    worldId.includes("architecture_built") ||
    /architecture|planning|design|art\b|animation|film|photography|fashion|music|drama|dance|games/.test(title)
  ) {
    return "design-creative";
  }

  if (
    worldId.includes("software_ai") ||
    worldId.includes("data_analytics") ||
    worldId.includes("engineering_manufacturing") ||
    /computer science|software|engineering|mathematics|statistics/.test(title)
  ) {
    return "technical-quant";
  }

  if (
    worldId.includes("science_research") ||
    /biology|chemistry|physics|forensic|biomedical|zoology/.test(title)
  ) {
    return "science-research";
  }

  if (
    worldId.includes("law_governance") ||
    /law|politics|criminology|policing/.test(title)
  ) {
    return "policy-governance";
  }

  if (
    worldId.includes("environment_sustainability") ||
    /environmental|earth sciences|geography|agriculture/.test(title)
  ) {
    return "environment-sustainability";
  }

  if (
    worldId.includes("finance_economics") ||
    worldId.includes("business") ||
    /finance|economics|accounting|business|management|events|hospitality|tourism/.test(title)
  ) {
    return "finance-business";
  }

  if (
    worldId.includes("society_culture") ||
    /anthropology|archaeology|classics|history|philosophy|religion|theology|sociology/.test(title)
  ) {
    return "society-culture";
  }

  return worldId || title;
}

function subjectFamilyKey(subject) {
  const explicit = String(subject?.subjectFamily || subject?.family || "").trim().toLowerCase();
  if (explicit) return explicit;
  return subjectClusterKey(subject);
}

function buildScoredSubjectRows(allSubjects = [], topCareerWorlds = [], ctx = {}, userSubjects = []) {
  const topWorldScored = buildScoreMap(topCareerWorlds, ctx).scored;
  const orderedTopWorldIds = topWorldScored
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item.id)
    .filter(Boolean);

  const topWorldSet = new Set(orderedTopWorldIds);
  const candidates = ensureArray(allSubjects).filter((subj) => topWorldSet.has(subj?.careerWorldId));

  return candidates
    .map((subj) => {
      const baseScore = scoreItemTotal(subj, ctx);
      const worldRank = orderedTopWorldIds.indexOf(subj?.careerWorldId);
      const finalScore = baseScore;

      return {
        item: subj,
        score: finalScore,
        finalScore,
        baseScore,
        worldBonus: 0,
        worldRankBonus: 0,
        preferredWorldBonus: 0,
        userBonus: 0,
        secondaryBonus: 0,
        calibrationBonus: 0,
        spillPenalty: 0,
        cluster: subjectClusterKey(subj),
        family: subjectFamilyKey(subj),
        matchedUser: false,
        broadMatchedUser: false,
        preferredWorld: false,
        worldRank,
        secondaryMatchCount: 0,
      };
    })
    .sort((a, b) => {
      const diff = subjectDisplayScore(b) - subjectDisplayScore(a);
      if (diff !== 0) return diff;
      if ((a?.worldRank ?? 999) !== (b?.worldRank ?? 999)) return (a?.worldRank ?? 999) - (b?.worldRank ?? 999);
      return String(a?.item?.title || "").localeCompare(String(b?.item?.title || ""));
    });
}

function subjectDisplayScore(row = {}) {
  return Number(row?.finalScore ?? row?.score) || 0;
}
function sortSubjectRows(rows = []) {
  return rows.slice().sort((a, b) => {
    const diff = subjectDisplayScore(b) - subjectDisplayScore(a);
    if (diff !== 0) return diff;
    if ((a?.worldRank ?? 999) !== (b?.worldRank ?? 999)) return (a?.worldRank ?? 999) - (b?.worldRank ?? 999);
    return String(a?.item?.title || "").localeCompare(String(b?.item?.title || ""));
  });
}


function attachSubjectScoreMeta(item, row, displayRank = 0) {
  if (!item || !row) return item;
  const meta = {
    baseScore: Number(row.baseScore || 0),
    worldBonus: Number(row.worldBonus || 0),
    worldRankBonus: Number(row.worldRankBonus || 0),
    preferredWorldBonus: Number(row.preferredWorldBonus || 0),
    userBonus: Number(row.userBonus || 0),
    secondaryBonus: Number(row.secondaryBonus || 0),
    calibrationBonus: Number(row.calibrationBonus || 0),
    spillPenalty: Number(row.spillPenalty || 0),
    finalScore: Number(row.finalScore || row.score || 0),
    worldRank: Number.isFinite(row.worldRank) ? row.worldRank : -1,
    cluster: row.cluster || "",
    family: row.family || "",
    matchedUser: Boolean(row.matchedUser),
    broadMatchedUser: Boolean(row.broadMatchedUser),
    preferredWorld: Boolean(row.preferredWorld),
    displayRank,
  };

  Object.defineProperty(item, '__cdnaSubjectScore', {
    value: meta,
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return item;
}

function buildSubjectSelectionResult(rows = [], sectionLabel = "broad") {
  return rows.map((row, idx) => ({
    item: row.item,
    meta: {
      baseScore: Number(row.baseScore || 0),
      worldBonus: Number(row.worldBonus || 0),
      worldRankBonus: Number(row.worldRankBonus || 0),
      preferredWorldBonus: Number(row.preferredWorldBonus || 0),
      userBonus: Number(row.userBonus || 0),
      secondaryBonus: Number(row.secondaryBonus || 0),
      calibrationBonus: Number(row.calibrationBonus || 0),
      spillPenalty: Number(row.spillPenalty || 0),
      finalScore: Number(row.finalScore || row.score || 0),
      worldRank: Number.isFinite(row.worldRank) ? row.worldRank : -1,
      cluster: row.cluster || "",
      family: row.family || "",
      matchedUser: Boolean(row.matchedUser),
      broadMatchedUser: Boolean(row.broadMatchedUser),
      preferredWorld: Boolean(row.preferredWorld),
      displayRank: idx + 1,
      subjectPriority: String(row?.item?.subjectPriority || "").trim().toLowerCase(),
      sectionLabel,
    },
    score: Number(row.finalScore || row.score || 0),
  }));
}

function pickSubjectRows(
  rows = [],
  {
    total = 10,
    maxPerWorld = 2,
    usedTitles = new Set(),
    usedFamilies = new Set(),
    enforceFamilyUniqueness = true,
  } = {}
) {
  const selectedRows = [];
  const nextTitles = new Set(usedTitles || []);
  const nextFamilies = new Set(usedFamilies || []);
  const worldCounts = new Map();

  for (const row of rows || []) {
    const titleKey = String(row?.item?.title || "").toLowerCase();
    const familyKey = String(row?.family || "").trim().toLowerCase();
    const worldId = row?.item?.careerWorldId || "";

    if (!titleKey || nextTitles.has(titleKey)) continue;
    if (enforceFamilyUniqueness && familyKey && nextFamilies.has(familyKey)) continue;
    if (
      Number.isFinite(maxPerWorld) &&
      maxPerWorld !== Infinity &&
      worldId &&
      (worldCounts.get(worldId) || 0) >= maxPerWorld
    ) {
      continue;
    }

    selectedRows.push(row);
    nextTitles.add(titleKey);
    if (familyKey) nextFamilies.add(familyKey);
    if (worldId) worldCounts.set(worldId, (worldCounts.get(worldId) || 0) + 1);
    if (selectedRows.length >= total) break;
  }

  return {
    selectedRows,
    usedTitles: nextTitles,
    usedFamilies: nextFamilies,
  };
}

function selectSegmentedSubjectsForCareerWorlds(
  allSubjects = [],
  topCareerWorlds = [],
  ctx = {},
  {
    userSubjects = [],
    total = 10,
    maxPerWorld = 2,
    broadTarget = 6,
    specialistMax = 4,
  } = {}
) {
  const rows = buildScoredSubjectRows(allSubjects, topCareerWorlds, ctx, userSubjects);
  const broadRows = rows.filter(
    (row) => String(row?.item?.subjectPriority || "").trim().toLowerCase() !== "specialist"
  );
  const specialistRows = rows.filter(
    (row) => String(row?.item?.subjectPriority || "").trim().toLowerCase() === "specialist"
  );

  const broadPrimary = pickSubjectRows(broadRows, {
    total: Math.min(total, broadTarget),
    maxPerWorld,
    enforceFamilyUniqueness: true,
  });

  const specialistPrimary = pickSubjectRows(specialistRows, {
    total: Math.min(specialistMax, Math.max(0, total - broadPrimary.selectedRows.length)),
    maxPerWorld,
    usedTitles: broadPrimary.usedTitles,
    // Important: do NOT inherit broad families here.
    // We want the specialist section to dedupe within itself,
    // but not to be blocked just because a broad cousin from the same family
    // already appeared in the main list.
    usedFamilies: new Set(),
    enforceFamilyUniqueness: true,
  });

  let combinedBroadRows = [...broadPrimary.selectedRows];
  let usedTitles = specialistPrimary.usedTitles;
  // Keep broad-family uniqueness for any extra broad overflow rows.
  // Specialist families should not suppress additional broad entries.
  let usedFamilies = broadPrimary.usedFamilies;
  let remaining = Math.max(0, total - combinedBroadRows.length - specialistPrimary.selectedRows.length);

  if (remaining > 0) {
    const broadOverflowUnique = pickSubjectRows(broadRows, {
      total: remaining,
      maxPerWorld,
      usedTitles,
      usedFamilies,
      enforceFamilyUniqueness: true,
    });
    combinedBroadRows = [...combinedBroadRows, ...broadOverflowUnique.selectedRows];
    usedTitles = broadOverflowUnique.usedTitles;
    usedFamilies = broadOverflowUnique.usedFamilies;
    remaining = Math.max(0, total - combinedBroadRows.length - specialistPrimary.selectedRows.length);
  }

  if (remaining > 0) {
    const broadOverflowAnyFamily = pickSubjectRows(broadRows, {
      total: remaining,
      maxPerWorld,
      usedTitles,
      usedFamilies,
      enforceFamilyUniqueness: false,
    });
    combinedBroadRows = [...combinedBroadRows, ...broadOverflowAnyFamily.selectedRows];
  }

  const finalBroadRows = sortSubjectRows(combinedBroadRows).slice(0, total);
  const finalSpecialistRows = sortSubjectRows(specialistPrimary.selectedRows).slice(0, specialistMax);
  const combinedRows = [...finalBroadRows, ...finalSpecialistRows].slice(0, total);

  return {
    broad: buildSubjectSelectionResult(finalBroadRows, "broad"),
    specialist: buildSubjectSelectionResult(finalSpecialistRows, "specialist"),
    combined: buildSubjectSelectionResult(combinedRows, "combined"),
  };
}

function selectScoredSubjectsForCareerWorlds(
  allSubjects = [],
  topCareerWorlds = [],
  ctx = {},
  options = {}
) {
  return selectSegmentedSubjectsForCareerWorlds(allSubjects, topCareerWorlds, ctx, options).combined;
}

function selectSubjectsForCareerWorlds(
  allSubjects = [],
  topCareerWorlds = [],
  ctx = {},
  { userSubjects = [], total = 10, maxPerWorld = 2 } = {}
) {
  const rows = buildScoredSubjectRows(allSubjects, topCareerWorlds, ctx, userSubjects);
  const selectedRows = [];
  const selectedTitles = new Set();
  const worldCounts = new Map();

  for (const row of rows) {
    const titleKey = String(row?.item?.title || "").toLowerCase();
    const worldId = row?.item?.careerWorldId || "";
    if (!titleKey || selectedTitles.has(titleKey)) continue;
    if (
      Number.isFinite(maxPerWorld) &&
      maxPerWorld !== Infinity &&
      worldId &&
      (worldCounts.get(worldId) || 0) >= maxPerWorld
    ) {
      continue;
    }
    selectedRows.push(row);
    selectedTitles.add(titleKey);
    if (worldId) worldCounts.set(worldId, (worldCounts.get(worldId) || 0) + 1);
    if (selectedRows.length >= total) break;
  }

  if (selectedRows.length < total) {
    for (const row of rows) {
      const titleKey = String(row?.item?.title || "").toLowerCase();
      if (!titleKey || selectedTitles.has(titleKey)) continue;
      selectedRows.push(row);
      selectedTitles.add(titleKey);
      if (selectedRows.length >= total) break;
    }
  }

  return sortSubjectRows(selectedRows)
    .slice(0, total)
    .map((row, idx) => attachSubjectScoreMeta(row.item, row, idx + 1));
}

function selectRolesForSubject(allRoles = [], matchedSubject = null, topCareerWorlds = [], ctx = {}, { total = 8 } = {}) {
  const scored = buildScoredRoleRows(allRoles, matchedSubject, topCareerWorlds, ctx);

  const matchedWorldId = String(matchedSubject?.careerWorldId || "").trim();
  const adjacentWorldIds = new Set(
    ensureArray(matchedSubject?.adjacentCareerWorldIds).map((id) => String(id || "").trim()).filter(Boolean)
  );

  const filtered = matchedWorldId
    ? scored.filter((row) => {
        const familyWorldId = String(row?.item?.careerWorldId || "").trim();
        return familyWorldId && (familyWorldId === matchedWorldId || adjacentWorldIds.has(familyWorldId));
      })
    : scored;

  return filtered.slice(0, total).map((x) => x.item);
}

function rankBank(list = [], ctx = {}, limit = 5) {
  const scored = buildScoreMap(list, ctx).scored;
  const sorted = sortByScoreDesc(scored);
  return sorted.slice(0, limit).map((x) => x.item);
}

function selectEnvironments(environments = [], ctx = {}, limit = 5, maxGood = 2) {
  const scored = environments.map((env) => {
    const breakdown = scoreItemBreakdown(env, ctx);
    const signal = getItemSignalFromBreakdown(breakdown);
    return { item: env, score: breakdown.totalScore, signalLabel: signal.signalLabel };
  });
  const sorted = sortByScoreDesc(scored);
  const selected = [];
  let goodCount = 0;
  for (const row of sorted) {
    if (selected.length >= limit) break;
    const isGood = row.signalLabel === "Good";
    if (isGood && goodCount >= maxGood) continue;
    selected.push(row.item);
    if (isGood) goodCount++;
  }
  return selected;
}



module.exports = {
  scoreItemByArchetypes,
  scoreItemBySubdimensionProfile,
  scoreItemBreakdown,
  buildArchetypeWeightMap,
  scoreItemTotal,
  buildScoredCareerWorldRows,
  buildScoredEnvironmentRows,
  buildScoredRoleRows,
  buildScoredSubjectRows,
  subjectDisplayScore,
  rankBank,
  selectStrengths,
  selectCareerWorlds,
  selectEnvironmentsForWorlds,
  selectEnvironments,
  selectScoredSubjectsForCareerWorlds,
  selectSegmentedSubjectsForCareerWorlds,
  selectSubjectsForCareerWorlds,
  selectRolesForSubject,
  matchUserSubjectsToLibSubjects,
  findBestMatchingSubject,
  resolveMultipleSubjectIntents,
  normalizeItemScoreToPct,
  getItemSignalFromBreakdown,
};
