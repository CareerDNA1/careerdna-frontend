// src/utils/calculateResults.js
// Reverse-aware legacy-scale scoring for the current CareerDNA matrix.
// - Likert answers stay on a 1..5 scale after reverse correction.
// - Forced A/B answers are mapped to 1 or 5 to match the legacy scale.
// - Archetypes are scored as weighted averages on the 1..5 scale.
// - Percentages are reported as (weightedAverage / 5) * 100.
//
// This preserves the older score shape while fixing the old bug where
// reverse-coded items were not handled correctly.

import archetypeWeights from './archetypeWeights';

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const getAnswerValue = raw => (raw && typeof raw === 'object' && 'value' in raw ? raw.value : raw);
const isMissing = v => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const normType = t => (typeof t === 'string' ? t.trim().toLowerCase() : '');

/** Map a Likert 1..5 to 1..5 after reverse correction */
function toLegacyLikert(v, reverse) {
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  const clamped = clamp(n, LIKERT_MIN, LIKERT_MAX);
  return reverse ? (LIKERT_MAX + LIKERT_MIN - clamped) : clamped;
}

/** Forced A/B -> 1 or 5 after reverse correction */
function toLegacyForced(raw, reverse) {
  if (raw == null) return null;
  const letter = String(raw).trim().toUpperCase();
  let value = null;
  if (letter === 'A') value = 1;
  else if (letter === 'B') value = 5;
  else return null;
  return reverse ? (LIKERT_MAX + LIKERT_MIN - value) : value;
}

function getArchetypeKeys(weights) {
  const firstRowKey = Object.keys(weights || {})[0];
  return firstRowKey ? Object.keys(weights[firstRowKey] || {}) : [];
}

export function calculateResults(answers, questions) {
  const archetypes = getArchetypeKeys(archetypeWeights);

  const weightedSums = {};
  const weightDenoms = {};
  archetypes.forEach(a => {
    weightedSums[a] = 0;
    weightDenoms[a] = 0;
  });

  for (const q of questions || []) {
    const qid = q?.id;
    const subdim = String(q?.subdimension || '').trim();
    const qType = normType(q?.type);
    const rawAns = getAnswerValue(answers?.[qid]);

    if (isMissing(rawAns)) continue;

    let value = null;
    if (qType === 'forced') {
      value = toLegacyForced(rawAns, !!q?.reverse);
    } else {
      value = toLegacyLikert(rawAns, !!q?.reverse);
    }
    if (value == null) continue;

    const weightRow = archetypeWeights[subdim];
    if (!weightRow) continue;

    for (const [arch, w] of Object.entries(weightRow)) {
      const weightNum = Number(w);
      if (!Number.isFinite(weightNum) || weightNum <= 0) continue;

      weightedSums[arch] += value * weightNum;
      weightDenoms[arch] += weightNum;
    }
  }

  const resultPercentages = {};
  for (const arch of archetypes) {
    const denom = weightDenoms[arch] || 0;
    if (denom === 0) {
      resultPercentages[arch] = 0;
      continue;
    }

    const weightedAverage = weightedSums[arch] / denom; // 1..5 scale
    const pct = (weightedAverage / LIKERT_MAX) * 100;
    resultPercentages[arch] = Math.max(0, Math.min(100, Math.round(pct)));
  }

  return resultPercentages;
}

export default calculateResults;
