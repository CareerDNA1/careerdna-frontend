// src/utils/profileQualityGate.js
// Central quality gate for deciding whether the AI analysis should run.
// Uses only displayed result outputs: archetype scores, trait scores and clarity scores.

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const scoreFromPossibleObject = (item) => {
  if (item == null) return null;
  if (typeof item === 'number' || typeof item === 'string') return toNumber(item);
  if (typeof item !== 'object') return null;

  return toNumber(
    item.score_pct ??
      item.scorePct ??
      item.percentage ??
      item.percent ??
      item.score ??
      item.value ??
      item.pct
  );
};

export function calculateProfileQualityGate({
  archetypes = {},
  subdimensionRows = [],
  claritySummary = null,
} = {}) {
  const archetypeScores = Object.values(archetypes || {})
    .map(scoreFromPossibleObject)
    .filter(Number.isFinite);

  const archetypeCountAtOrAbove50 = archetypeScores.filter((score) => score >= 50).length;
  const passesArchetypeGate = archetypeCountAtOrAbove50 >= 2;

  const traitScores = (Array.isArray(subdimensionRows) ? subdimensionRows : [])
    .map(scoreFromPossibleObject)
    .filter(Number.isFinite);

  const goodTraitCount = traitScores.filter((score) => score >= 50).length;
  const passesTraitGate = goodTraitCount >= 3;

  const clarityDimensionRows = Array.isArray(claritySummary?.dimensions)
    ? claritySummary.dimensions
    : [];

  const clarityScoresFromRows = clarityDimensionRows
    .map((row) => scoreFromPossibleObject(row?.clarityPct ?? row?.score_pct ?? row?.scorePct ?? row?.percentage ?? row?.percent ?? row?.score ?? row))
    .filter(Number.isFinite);

  const clarityScoresFromMap = clarityScoresFromRows.length
    ? []
    : Object.entries(claritySummary?.byDimensionPct || {})
        .map(([, value]) => scoreFromPossibleObject(value))
        .filter(Number.isFinite);

  const clarityScores = clarityScoresFromRows.length ? clarityScoresFromRows : clarityScoresFromMap;
  const developingClarityCount = clarityScores.filter((score) => score >= 65).length;
  const passesClarityGate = developingClarityCount >= 2;

  const failedChecks = [];
  if (!passesArchetypeGate) failedChecks.push('archetype_signal');
  if (!passesTraitGate) failedChecks.push('trait_signal');
  if (!passesClarityGate) failedChecks.push('clarity_signal');

  return {
    shouldBlockAnalysis: failedChecks.length > 0,
    passesArchetypeGate,
    passesTraitGate,
    passesClarityGate,
    archetypeCountAtOrAbove50,
    goodTraitCount,
    developingClarityCount,
    failedChecks,
  };
}

export function getProfileQualityGateMessage(gate = {}) {
  return 'Your results do not yet show a clear enough CareerDNA pattern for a meaningful analysis. Please retake the survey and answer as thoughtfully and honestly as possible.';
}

export default calculateProfileQualityGate;
