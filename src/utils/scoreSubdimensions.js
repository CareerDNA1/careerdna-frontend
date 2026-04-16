// src/utils/scoreSubdimensions.js
// Compute per-subdimension 0–100% scores from raw answers + questions.
// It respects: type: 'likert' (1–5), type: 'forced' ('A'→1, 'B'→5), and reverse flags.

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const toUnitLikert = (v, reverse) => {
  const num = Number(v);
  if (Number.isNaN(num)) return null;
  const clamped = clamp(num, LIKERT_MIN, LIKERT_MAX);
  const span = LIKERT_MAX - LIKERT_MIN || 1;
  const unit = (clamped - LIKERT_MIN) / span; // [0..1]
  return reverse ? (1 - unit) : unit;
};

// Forced-choice: map 'A'→1, 'B'→5 (same as your calculateResults)
const toUnitForced = (raw, reverse) => {
  if (raw == null) return null;
  const letter = String(raw).trim().toUpperCase();
  let num = null;
  if (letter === 'A') num = 1;
  else if (letter === 'B') num = 5;
  else return null; // ignore invalid forced choice

  const span = LIKERT_MAX - LIKERT_MIN || 1;
  const unit = (num - LIKERT_MIN) / span; // [0..1]
  return reverse ? (1 - unit) : unit;
};

export function scoreSubdimensions(answers, questions) {
  if (!answers || typeof answers !== 'object' || !Array.isArray(questions)) return [];

  // Build subdimension → list of question records
  const buckets = new Map();
  for (const q of questions) {
    const sub = (q?.subdimension || '').trim();
    if (!sub) continue;
    if (!buckets.has(sub)) buckets.set(sub, []);
    buckets.get(sub).push(q);
  }

  // Compute average unit score per subdimension
  const rows = [];
  for (const [sub, qlist] of buckets.entries()) {
    const units = [];
    for (const q of qlist) {
      const qid = q?.id;
      let raw = answers?.[qid];
      if (raw && typeof raw === 'object' && 'value' in raw) raw = raw.value;

      if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
        continue; // skip missing
      }

      const type = String(q?.type || '').trim().toLowerCase();
      const reverse = !!q?.reverse;

      if (type === 'likert') {
        const u = toUnitLikert(raw, reverse);
        if (u != null) units.push(u);
      } else if (type === 'forced') {
        const u = toUnitForced(raw, reverse);
        if (u != null) units.push(u);
      }
    }

    const avg = units.length ? (units.reduce((s, x) => s + x, 0) / units.length) : 0;
    const pct = Math.round(clamp(avg * 100, 0, 100));

    rows.push({
      code: sub.replace(/\s+/g, '_').toUpperCase(), // stable code from name (e.g., "Openness to Experience" → "OPENNESS_TO_EXPERIENCE")
      name: sub,
      score_pct: pct,
      n_items: units.length
    });
  }

  return rows;
}

export default scoreSubdimensions;