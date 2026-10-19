// src/utils/selfAwarenessSummary.js
// Profile clarity: how much this student's survey can be trusted, per area
// (Who You Are, What You Love, What Matters, How You Work Best) and overall,
// on a 0 to 100 scale. Rebuilt 2026-10-13 (George). Same API as before so
// ClarityChart, assessmentRuns, ResultsPage and SavedResultPage are unchanged.
//
// Three components per area, each 0..1, from the raw answers after reverse
// keying (a 1 on a reversed item counts the same as a 5 on a positive one):
//
//   consistency      inside each sub-dimension, how closely its four answers
//                    agree with each other (mean distance between every pair,
//                    0 = maximally contradictory, 1 = identical). This is the
//                    per-person form of scale reliability and the main signal.
//   decisiveness     one minus the share of middle-option answers in the area.
//                    Midpoint responding is the recognised marker of
//                    undecidedness; 2s and 4s are legitimate "somewhat" answers
//                    and are not penalised.
//   differentiation  how spread out the student's trait levels are within the
//                    area (standard deviation of the sub-dimension levels,
//                    full marks at CLARITY.differentiationFullSd points).
//                    Holland's differentiation index: a flat area tells the
//                    matcher little even when every answer is consistent.
//
//   area = 0.50 consistency + 0.20 decisiveness + 0.30 differentiation
//   overall = mean of the areas
//
// Response-style flags (utils/responseStyle.js, the same numbers the quality
// gate uses) cap the result: a severe flag caps every area and the overall at
// 40, a mild flag at 60. A straight-lined survey cannot be 70 percent clear
// however consistent its identical answers are.
//
// Bands (ClarityChart): High 70 and above, Developing 50 to 69, else Low.

import { computeResponseStyle } from "./responseStyle";

export const CLARITY = Object.freeze({
  wConsistency: 0.5,
  wDecisiveness: 0.2,
  wDifferentiation: 0.3,
  differentiationFullSd: 20, // trait-level SD (0..100 scale) that earns full marks
  capSevere: 40,
  capMild: 60,
  bandHigh: 70,
  bandDeveloping: 50,
});

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const getVal = (raw) =>
  raw && typeof raw === "object" && "value" in raw ? raw.value : raw;
const normType = (t) => (typeof t === "string" ? t.trim().toLowerCase() : "");
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

/** Normalise any supported answer to [0..1]; apply reverse at the end. */
function toUnit(answer, type, reverse) {
  const t = normType(type);

  if (t === "likert") {
    const n = Number(answer);
    if (!Number.isFinite(n)) return null;
    const u =
      (Math.min(LIKERT_MAX, Math.max(LIKERT_MIN, n)) - LIKERT_MIN) /
      (LIKERT_MAX - LIKERT_MIN);
    return reverse ? 1 - u : u;
  }

  if (t === "yesno" || t === "yn" || t === "boolean") {
    const s = String(answer ?? "").trim().toLowerCase();
    const yes =
      ["y", "yes", "true", "1", "t"].includes(s) || answer === true || answer === 1;
    const u = yes ? 1 : 0;
    return reverse ? 1 - u : u;
  }

  if (t === "forced" || t === "ab" || t === "a/b") {
    const s = String(answer ?? "").trim().toUpperCase();
    const u = s === "B" ? 1 : s === "A" ? 0 : null;
    return u == null ? null : reverse ? 1 - u : u;
  }

  const n = Number(answer);
  if (Number.isFinite(n)) {
    if (n >= 0 && n <= 1) return reverse ? 1 - n : n;
    if (n >= LIKERT_MIN && n <= LIKERT_MAX) {
      const u = (n - LIKERT_MIN) / (LIKERT_MAX - LIKERT_MIN);
      return reverse ? 1 - u : u;
    }
  }
  return null;
}

/** Is this raw answer the middle option? (Likert 3, or 0.5 on a unit scale.) */
function isMidpoint(answer) {
  const n = Number(getVal(answer));
  return Number.isFinite(n) && (n === 3 || n === 0.5);
}

/**
 * Consistency of one sub-dimension. Every pair of its answers is compared on
 * the 1 to 5 scale: one point apart (4 and 5) is agreement; two points apart
 * (3 and 5) a third of a contradiction; three points two thirds; four points
 * (1 against 5) a full contradiction (George, 2026-10-13). The mean penalty is
 * scaled so the most contradictory pattern possible for four items (two at
 * each end; mean penalty 2/3) scores 0, and identical or near-identical
 * answers score 1.
 */
export const CONSISTENCY_TOLERANCE_PTS = 1;

export function subdimensionConsistency(units) {
  const xs = units.filter((v) => v != null);
  if (xs.length < 2) return null;
  const span = LIKERT_MAX - LIKERT_MIN; // 4
  const maxPenaltyPts = span - CONSISTENCY_TOLERANCE_PTS; // 3
  let sum = 0;
  let n = 0;
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      const pts = Math.abs(xs[i] - xs[j]) * span; // distance in scale points
      sum += Math.max(0, pts - CONSISTENCY_TOLERANCE_PTS) / maxPenaltyPts;
      n++;
    }
  }
  const meanPenalty = n ? sum / n : 0;
  return clamp01(1 - meanPenalty / (2 / 3));
}

/** Differentiation of an area: SD of its trait levels (0..100), scaled to 0..1. */
export function areaDifferentiation(levels, fullSd = CLARITY.differentiationFullSd) {
  const xs = levels.filter((v) => Number.isFinite(v));
  if (xs.length < 2) return null;
  const m = mean(xs);
  const variance = xs.reduce((s, x) => s + (x - m) * (x - m), 0) / xs.length;
  return clamp01(Math.sqrt(variance) / fullSd);
}

export function clarityBand(pct) {
  if (pct == null) return null;
  if (pct >= CLARITY.bandHigh) return "High";
  if (pct >= CLARITY.bandDeveloping) return "Developing";
  return "Low";
}

/**
 * Main API used by ClarityChart, assessmentRuns, ResultsPage.
 * @param {Array} questions - [{id, dimension, subdimension, type, reverse}]
 * @param {Object} answers  - { [id]: {value} | number | string }
 * @param {Object} opts - { dimensionOrder, minItemsPerDim, responseStyle }
 *   Legacy weight options (wCertainty, wCoherence, wAgreement) are ignored.
 */
export function computeClarityPercents(questions, answers, opts = {}) {
  const minItemsPerDim = opts.minItemsPerDim ?? 4;
  const order = Array.isArray(opts.dimensionOrder) ? opts.dimensionOrder : null;

  // Bucket answers by sub-dimension (tracking the area), count midpoints per area.
  const subBuckets = new Map(); // sub -> { units: number[], dim }
  const countsByDim = {};
  const midpointsByDim = {};

  for (const q of questions || []) {
    const id = q?.id;
    const dim = q?.dimension?.trim();
    const sub = q?.subdimension?.trim();
    if (!id || !dim || !sub) continue;

    const raw = answers?.[id];
    const unit = toUnit(getVal(raw), q.type, !!q.reverse);
    if (unit == null) continue;

    if (!subBuckets.has(sub)) subBuckets.set(sub, { units: [], dim });
    subBuckets.get(sub).units.push(unit);
    countsByDim[dim] = (countsByDim[dim] || 0) + 1;
    if (isMidpoint(raw)) midpointsByDim[dim] = (midpointsByDim[dim] || 0) + 1;
  }

  // Per sub-dimension: consistency and level.
  const dimAgg = new Map(); // dim -> { consistencies: [], levels: [], n_sub }
  for (const [, { units, dim }] of subBuckets.entries()) {
    if (!dimAgg.has(dim)) dimAgg.set(dim, { consistencies: [], levels: [], n_sub: 0 });
    const b = dimAgg.get(dim);
    const c = subdimensionConsistency(units);
    if (c != null) b.consistencies.push(c);
    const lvl = mean(units);
    if (lvl != null) b.levels.push(100 * lvl);
    b.n_sub += 1;
  }

  // Response-style cap (same indices as the quality gate).
  const style =
    opts.responseStyle && typeof opts.responseStyle === "object"
      ? opts.responseStyle
      : answers && typeof answers === "object" && Object.keys(answers).length
      ? computeResponseStyle(answers)
      : null;
  const severity = style?.severity || "none";
  const cap =
    severity === "severe" || severity === "block"
      ? CLARITY.capSevere
      : severity === "mild"
      ? CLARITY.capMild
      : 100;

  const byDimensionPct = {};
  const rows = [];

  for (const [dim, agg] of dimAgg.entries()) {
    const items = countsByDim[dim] || 0;
    if (items < minItemsPerDim) {
      byDimensionPct[dim] = null;
      rows.push({ dimension: dim, items, clarityPct: null, components: null });
      continue;
    }

    const consistency = agg.consistencies.length ? mean(agg.consistencies) : null;
    const decisiveness = items ? 1 - (midpointsByDim[dim] || 0) / items : null;
    // Spread only counts to the extent the levels it is measured on are
    // reliable: random answers also produce widely spread trait levels, and
    // that spread is noise, not information.
    const rawDifferentiation = areaDifferentiation(agg.levels);
    const differentiation =
      rawDifferentiation == null ? null : rawDifferentiation * (consistency ?? 1);

    const parts = [];
    if (consistency != null) parts.push([consistency, CLARITY.wConsistency]);
    if (decisiveness != null) parts.push([decisiveness, CLARITY.wDecisiveness]);
    if (differentiation != null) parts.push([differentiation, CLARITY.wDifferentiation]);

    let pct = null;
    if (parts.length) {
      const wsum = parts.reduce((s, p) => s + p[1], 0) || 1;
      const blended = parts.reduce((s, [v, w]) => s + v * w, 0) / wsum;
      pct = Math.min(cap, Math.round(100 * clamp01(blended)));
    }

    byDimensionPct[dim] = pct;
    rows.push({
      dimension: dim,
      items,
      clarityPct: pct,
      components: {
        consistency: consistency == null ? null : Math.round(100 * consistency),
        decisiveness: decisiveness == null ? null : Math.round(100 * decisiveness),
        differentiation: differentiation == null ? null : Math.round(100 * differentiation),
      },
    });
  }

  const ordered = order
    ? order.map((dm) => rows.find((r) => r.dimension === dm)).filter(Boolean)
    : rows.sort((a, b) => String(a.dimension).localeCompare(String(b.dimension)));

  const avail = ordered.filter((r) => r.clarityPct != null);
  const overallPct = avail.length
    ? Math.min(cap, Math.round(avail.reduce((s, r) => s + r.clarityPct, 0) / avail.length))
    : null;

  return {
    dimensions: ordered, // [{ dimension, items, clarityPct|null, components }]
    byDimensionPct, // { "Who You Are": 71, ... }
    overallPct, // e.g. 67
    overallBand: clarityBand(overallPct),
    countsByDim,
    weights: {
      consistency: CLARITY.wConsistency,
      decisiveness: CLARITY.wDecisiveness,
      differentiation: CLARITY.wDifferentiation,
    },
    responseStyleSeverity: severity,
    cap: cap < 100 ? cap : null,
  };
}

export default computeClarityPercents;
