// src/utils/calculateResults.js
// CareerDNA v2 — BD-first archetype scoring.
//
// Step 1 (BD scores): average all Likert items per Behavioural Dimension → 0–100%.
//   Each BD gets exactly one score regardless of how many questions measure it.
//
// Step 2 (archetype scores): weighted average of BD scores using archetypeWeights.
//   BDs with weight 0 are skipped; each contributing BD counts once in the denominator.
//
// Return shape: { archetypeScores: { Achiever: 72, … }, subdimensionScores: { Originality: 68, … } }
//
// Forced A/B handling is retained below but disabled — no v2 questions use type:'forced'.

import archetypeWeights from './archetypeWeights';
import { scoreSubdimensions } from './scoreSubdimensions';

function getArchetypeKeys(weights) {
  const firstRowKey = Object.keys(weights || {})[0];
  return firstRowKey ? Object.keys(weights[firstRowKey] || {}) : [];
}

export function calculateResults(answers, questions) {
  // ── Step 1: BD scores (0–100) via scoreSubdimensions ────────────────────────
  const bdRows = scoreSubdimensions(answers, questions || []);

  // Build a lookup map: BD name string → score_pct
  const bdScoreMap = {};
  for (const row of bdRows) {
    bdScoreMap[row.name] = row.score_pct;
  }

  // subdimensionScores keyed by BD name for the chart / advisor
  const subdimensionScores = { ...bdScoreMap };

  // ── Step 2: archetype scores (weighted average of BD scores) ─────────────────
  const archetypes = getArchetypeKeys(archetypeWeights);

  const weightedSums = {};
  const weightDenoms = {};
  archetypes.forEach(a => {
    weightedSums[a] = 0;
    weightDenoms[a] = 0;
  });

  for (const [bdName, weightRow] of Object.entries(archetypeWeights)) {
    const bdScore = bdScoreMap[bdName];
    if (bdScore === undefined) continue; // BD not answered / not in questions

    for (const [arch, w] of Object.entries(weightRow)) {
      const weightNum = Number(w);
      if (!Number.isFinite(weightNum) || weightNum <= 0) continue;

      weightedSums[arch] += bdScore * weightNum;
      weightDenoms[arch] += weightNum;
    }
  }

  const archetypeScores = {};
  for (const arch of archetypes) {
    const denom = weightDenoms[arch] || 0;
    if (denom === 0) {
      archetypeScores[arch] = 0;
      continue;
    }
    // bdScore values are already 0–100, so no /5×100 needed
    const pct = weightedSums[arch] / denom;
    archetypeScores[arch] = Math.max(0, Math.min(100, Math.round(pct)));
  }

  return { archetypeScores, subdimensionScores };
}

export default calculateResults;
