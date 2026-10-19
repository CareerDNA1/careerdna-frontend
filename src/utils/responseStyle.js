// src/utils/responseStyle.js
// Response-style checks computed from the raw survey answers (1 to 5, before
// any reverse scoring). They detect ways of answering that make the results
// unreliable, independent of what the answers say:
//
//   acquiescence   agreed (or disagreed) with nearly everything
//   straightLine   the same answer many times in a row, in presentation order
//   midpoint       the middle option most of the time
//   contradiction  inside a sub-dimension, the positive and reverse items
//                  disagree after reverse scoring (misread or careless)
//
// Each index is stored with the run so the pilot can measure how common each
// pattern is. Thresholds are the audit's defaults and live in one place below.

import QUESTIONS_PRESENTED from './questions_a';

export const RESPONSE_STYLE_THRESHOLDS = Object.freeze({
  // Acquiescence index: mean of (mean raw answer on positive items, mean raw
  // answer on reverse items). Content pushes the two apart; a general lean
  // pushes both the same way. 3.0 is neutral.
  acquiescenceSevereHigh: 4.2,
  acquiescenceSevereLow: 1.8,
  acquiescenceMildHigh: 3.9,
  acquiescenceMildLow: 2.1,
  // Longest run of the identical answer, in the order the questions were shown.
  straightLineBlock: 25,
  straightLineSevere: 12,
  // Share of answers that are the middle option.
  midpointSevere: 0.5,
  midpointMild: 0.35,
  // Share of sub-dimensions where positive and reverse items disagree by more
  // than contradictionGap points (on the 1 to 5 scale) after reverse scoring.
  // With one reverse item per sub-dimension in bank v1, a single weakly worded
  // reverse item flips a whole sub-dimension, so the gap and the severe share
  // are set loosely (18 Oct 2026). Tighten when every sub-dimension has two
  // reverse items. Contradiction never blocks a report on its own; it feeds
  // the Profile Clarity index (see profileQualityGate.js).
  contradictionGap: 2,
  contradictionSevere: 0.5,
  contradictionMild: 0.3,
  // Need most of the bank answered to say anything.
  minAnswered: 60,
});

const toRaw = (answer) => {
  const v = answer && typeof answer === 'object' && 'value' in answer ? answer.value : answer;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};

const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export function computeResponseStyle(answers = {}, questions = QUESTIONS_PRESENTED) {
  const T = RESPONSE_STYLE_THRESHOLDS;
  const list = Array.isArray(questions) ? questions : [];

  const rawPositive = [];
  const rawReverse = [];
  const sequence = []; // raw answers in presentation order
  let midpointCount = 0;
  const bySub = new Map(); // sub -> { pos: [], rev: [] } (reverse-scored, 1..5)

  for (const q of list) {
    if (!q || !q.id) continue;
    const raw = toRaw(answers?.[q.id]);
    if (raw == null) continue;
    sequence.push(raw);
    if (raw === 3) midpointCount += 1;
    if (q.reverse) rawReverse.push(raw); else rawPositive.push(raw);
    const sub = String(q.subdimension || '').trim();
    if (sub) {
      if (!bySub.has(sub)) bySub.set(sub, { pos: [], rev: [] });
      const scored = q.reverse ? 6 - raw : raw;
      bySub.get(sub)[q.reverse ? 'rev' : 'pos'].push(scored);
    }
  }

  const answered = sequence.length;

  // Acquiescence.
  const mPos = mean(rawPositive);
  const mRev = mean(rawReverse);
  const acquiescence = mPos != null && mRev != null ? (mPos + mRev) / 2 : mPos ?? mRev;

  // Straight-lining.
  let longestRun = 0;
  let run = 0;
  let prev = null;
  for (const v of sequence) {
    run = v === prev ? run + 1 : 1;
    prev = v;
    if (run > longestRun) longestRun = run;
  }

  // Midpoint share.
  const midpointRate = answered ? midpointCount / answered : 0;

  // Contradiction share across sub-dimensions that have both item kinds.
  let subsChecked = 0;
  let subsContradicting = 0;
  for (const { pos, rev } of bySub.values()) {
    if (!pos.length || !rev.length) continue;
    subsChecked += 1;
    if (Math.abs(mean(pos) - mean(rev)) > T.contradictionGap) subsContradicting += 1;
  }
  const contradictionRate = subsChecked ? subsContradicting / subsChecked : 0;

  // Flags.
  const flags = [];
  const add = (code, severity, detail) => flags.push({ code, severity, detail });

  if (answered >= T.minAnswered) {
    if (longestRun >= T.straightLineBlock) add('straight_line', 'block', longestRun);
    else if (longestRun >= T.straightLineSevere) add('straight_line', 'severe', longestRun);

    if (acquiescence != null) {
      if (acquiescence >= T.acquiescenceSevereHigh) add('agree_everything', 'severe', acquiescence);
      else if (acquiescence <= T.acquiescenceSevereLow) add('disagree_everything', 'severe', acquiescence);
      else if (acquiescence >= T.acquiescenceMildHigh) add('agree_everything', 'mild', acquiescence);
      else if (acquiescence <= T.acquiescenceMildLow) add('disagree_everything', 'mild', acquiescence);
    }

    if (midpointRate >= T.midpointSevere) add('midpoint', 'severe', midpointRate);
    else if (midpointRate >= T.midpointMild) add('midpoint', 'mild', midpointRate);

    if (contradictionRate >= T.contradictionSevere) add('contradiction', 'severe', contradictionRate);
    else if (contradictionRate >= T.contradictionMild) add('contradiction', 'mild', contradictionRate);

    // Agreeing (or disagreeing) with everything makes the positive and reverse
    // items disagree after reverse scoring, so a lean plus severe contradiction
    // is one thing, not two: report it as the lean, at severe.
    const lean = flags.find((f) => f.code === 'agree_everything' || f.code === 'disagree_everything');
    const contra = flags.find((f) => f.code === 'contradiction' && f.severity === 'severe');
    if (lean && contra) {
      lean.severity = 'severe';
      flags.splice(flags.indexOf(contra), 1);
    }
  }

  const rank = { none: 0, block: 3, severe: 2, mild: 1 };
  const severity = flags.reduce((top, f) => (rank[f.severity] > rank[top] ? f.severity : top), 'none');

  return {
    answered,
    acquiescence: acquiescence == null ? null : Math.round(acquiescence * 100) / 100,
    meanRaw: answered ? Math.round(mean(sequence) * 100) / 100 : null,
    longestRun,
    midpointRate: Math.round(midpointRate * 1000) / 1000,
    contradictionRate: Math.round(contradictionRate * 1000) / 1000,
    flags,
    severity, // 'none' | 'mild' | 'severe' | 'block'
  };
}

// The one most important flag, for the message. Block beats severe beats mild;
// within a level the order below is the order of usefulness to the student.
const PRIORITY = ['straight_line', 'agree_everything', 'disagree_everything', 'midpoint', 'contradiction'];
export function primaryResponseStyleFlag(style = {}) {
  const flags = Array.isArray(style?.flags) ? style.flags : [];
  const rank = { none: 0, block: 3, severe: 2, mild: 1 };
  return flags
    .slice()
    .sort((a, b) => (rank[b.severity] - rank[a.severity]) || (PRIORITY.indexOf(a.code) - PRIORITY.indexOf(b.code)))[0] || null;
}

export default computeResponseStyle;
