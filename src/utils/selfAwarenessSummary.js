// src/utils/selfAwarenessSummary.js
// Computes 0–100% "self-clarity" per dimension + overall.
// NEW: per-subdimension decisiveness, coherence, and automatic pair-agreement.
// Compatible with ClarityChart.js (same API).

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const getVal = (raw) =>
  raw && typeof raw === "object" && "value" in raw ? raw.value : raw;
const normType = (t) => (typeof t === "string" ? t.trim().toLowerCase() : "");

/** Normalize any supported answer to [0..1]; apply reverse at the end. */
function toUnit(answer, type, reverse) {
  const t = normType(type);

  // Likert 1..5
  if (t === "likert") {
    const n = Number(answer);
    if (!Number.isFinite(n)) return null;
    const u =
      (Math.min(LIKERT_MAX, Math.max(LIKERT_MIN, n)) - LIKERT_MIN) /
      (LIKERT_MAX - LIKERT_MIN); // 0..1
    return reverse ? 1 - u : u;
  }

  // Boolean / YesNo
  if (t === "yesno" || t === "yn" || t === "boolean") {
    const s = String(answer ?? "").trim().toLowerCase();
    const yes =
      ["y", "yes", "true", "1", "t"].includes(s) || answer === true || answer === 1;
    const u = yes ? 1 : 0;
    return reverse ? 1 - u : u;
  }

  // Forced A/B
  if (t === "forced" || t === "ab" || t === "a/b") {
    const s = String(answer ?? "").trim().toUpperCase();
    const u = s === "B" ? 1 : s === "A" ? 0 : null;
    return u == null ? null : reverse ? 1 - u : u;
  }

  // Fallback numeric: allow 0..1 or 1..5
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

/** Decisiveness: farther from midpoint (0.5) → higher; rescaled so extremes hit 1.0. */
function decisiveness(units) {
  const xs = units.filter((v) => v != null);
  if (!xs.length) return null;
  const meanAbs = xs.reduce((s, x) => s + Math.abs(x - 0.5), 0) / xs.length; // [0..0.5]
  return clamp01(2 * meanAbs); // [0..1]
}

/** Coherence: 1 - normalized variance around the person’s own mean on [0..1]. */
function coherence(units) {
  const xs = units.filter((v) => v != null);
  if (xs.length < 2) return null;
  const m = xs.reduce((s, x) => s + x, 0) / xs.length;
  const varRaw =
    xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1);
  const varNorm = Math.min(1, varRaw / 0.25); // max variance on [0..1] is ~0.25
  return clamp01(1 - varNorm);
}

/** Automatic pair-agreement inside a subdimension: mean(1 - |xi - xj|) over all pairs. */
function meanPairAgreement(units) {
  const xs = units.filter((v) => v != null);
  if (xs.length < 2) return null;
  let sum = 0,
    n = 0;
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      sum += 1 - Math.abs(xs[i] - xs[j]);
      n++;
    }
  }
  return n ? clamp01(sum / n) : null;
}

/**
 * Main API used by ClarityChart.
 * @param {Array} questions - [{id, dimension, subdimension, type, reverse}]
 * @param {Object} answers  - { [id]: {value} | number | string }
 * @param {Object} opts - { wCertainty, wCoherence, wAgreement, dimensionOrder, minItemsPerDim }
 */
export function computeClarityPercents(questions, answers, opts = {}) {
  const wCertainty = opts.wCertainty ?? 0.4; // fewer 3s
  const wCoherence = opts.wCoherence ?? 0.4; // tighter sub-dim cluster
  const wAgreement = opts.wAgreement ?? 0.2; // duplicate/paraphrase agreement within sub-dim
  const minItemsPerDim = opts.minItemsPerDim ?? 4;
  const order = Array.isArray(opts.dimensionOrder) ? opts.dimensionOrder : null;

  // Bucket answers by subdimension (track dimension too)
  const subBuckets = new Map(); // sub -> { units: number[], dim: string }
  const countsByDim = {};

  for (const q of questions || []) {
    const id = q?.id;
    const dim = q?.dimension?.trim();
    const sub = q?.subdimension?.trim();
    if (!id || !dim || !sub) continue;

    const unit = toUnit(getVal(answers?.[id]), q.type, !!q.reverse);
    if (unit == null) continue;

    if (!subBuckets.has(sub)) subBuckets.set(sub, { units: [], dim });
    subBuckets.get(sub).units.push(unit);
    countsByDim[dim] = (countsByDim[dim] || 0) + 1;
  }

  // Score subdimensions
  const subScores = new Map(); // sub -> { final, D, C, A, n, dim }
  for (const [sub, { units, dim }] of subBuckets.entries()) {
    const D = decisiveness(units);
    const C = coherence(units);
    const A = meanPairAgreement(units);

    // blend only available parts; re-normalize weights if something is null
    const parts = [];
    if (D != null) parts.push([D, wCertainty]);
    if (C != null) parts.push([C, wCoherence]);
    if (A != null) parts.push([A, wAgreement]);

    let final = null;
    if (parts.length) {
      const wsum = parts.reduce((s, p) => s + p[1], 0) || 1;
      final = parts.reduce((s, [v, w]) => s + v * w, 0) / wsum;
    }

    subScores.set(sub, { final, D, C, A, n: units.length, dim });
  }

  // Aggregate subdimensions → dimensions
  const dimAgg = new Map(); // dim -> { vals:[], n_items:0, n_sub:0 }
  for (const [, row] of subScores.entries()) {
    const dim = row.dim;
    if (!dimAgg.has(dim)) dimAgg.set(dim, { vals: [], n_items: 0, n_sub: 0 });
    const b = dimAgg.get(dim);
    if (row.final != null) b.vals.push(row.final);
    b.n_items += row.n;
    b.n_sub += 1;
  }

  const byDimensionPct = {};
  const rows = [];

  for (const [dim, agg] of dimAgg.entries()) {
    // Respect minItemsPerDim gate
    if ((countsByDim[dim] || 0) < minItemsPerDim) {
      byDimensionPct[dim] = null;
      rows.push({ dimension: dim, items: countsByDim[dim] || 0, clarityPct: null });
      continue;
    }
    const mean =
      agg.vals.length ? agg.vals.reduce((s, x) => s + x, 0) / agg.vals.length : null;
    const pct = mean == null ? null : Math.round(100 * clamp01(mean));
    byDimensionPct[dim] = pct;
    rows.push({ dimension: dim, items: countsByDim[dim] || 0, clarityPct: pct });
  }

  // Order as requested
  const ordered = order
    ? order.map((dm) => rows.find((r) => r.dimension === dm)).filter(Boolean)
    : rows.sort((a, b) => String(a.dimension).localeCompare(String(b.dimension)));

  // Overall = average of available dimension %s (not raw items)
  const avail = ordered.filter((r) => r.clarityPct != null);
  const overallPct = avail.length
    ? Math.round(avail.reduce((s, r) => s + r.clarityPct, 0) / avail.length)
    : null;

  return {
    dimensions: ordered,         // [{ dimension, items, clarityPct|null }]
    byDimensionPct,              // { "Who You Are": 71, ... }
    overallPct,                  // e.g., 67
    countsByDim,                 // counts of answered items per dimension
    weights: { wCertainty, wCoherence, wAgreement }
  };
}

export default computeClarityPercents;
