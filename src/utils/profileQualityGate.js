// src/utils/profileQualityGate.js
// Central quality gate for deciding whether the AI analysis should run, and
// what to tell the student when it should not.
//
// Two kinds of evidence:
//   1. Signal checks on the results (enough archetypes and traits above 50).
//      If these fail there is nothing to report on: hard block.
//   2. Response-style checks on the raw answers (utils/responseStyle.js):
//      agreed with everything, same answer many times in a row, middle option
//      most of the time, contradictions inside a sub-dimension. A severe flag
//      stops the report with a message naming the problem and offers a free
//      retake, but the student may still generate ("Continue anyway"). A
//      straight-line run of 20 or more is a hard block.
//
// The older clarity-based check (decisiveness and coherence) is kept only as
// a fallback for runs saved before raw answers were available to the gate.

import { computeResponseStyle, primaryResponseStyleFlag } from './responseStyle';

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

function legacyClarityPasses(claritySummary) {
  const rows = Array.isArray(claritySummary?.dimensions) ? claritySummary.dimensions : [];
  const fromRows = rows
    .map((row) => scoreFromPossibleObject(row?.clarityPct ?? row?.score_pct ?? row?.scorePct ?? row?.percentage ?? row?.percent ?? row?.score ?? row))
    .filter(Number.isFinite);
  const fromMap = fromRows.length
    ? []
    : Object.entries(claritySummary?.byDimensionPct || {})
        .map(([, value]) => scoreFromPossibleObject(value))
        .filter(Number.isFinite);
  const scores = fromRows.length ? fromRows : fromMap;
  if (!scores.length) return true; // nothing to judge
  // At least two areas at Developing clarity or better (utils/selfAwarenessSummary).
  return scores.filter((score) => score >= 50).length >= 2;
}

export function calculateProfileQualityGate({
  archetypes = {},
  subdimensionRows = [],
  claritySummary = null,
  surveyAnswers = null,
  responseStyle = null,
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

  // Response style: computed here from raw answers when available, otherwise
  // taken as given (saved with the run), otherwise absent.
  const style =
    responseStyle && typeof responseStyle === 'object'
      ? responseStyle
      : surveyAnswers && typeof surveyAnswers === 'object' && Object.keys(surveyAnswers).length
      ? computeResponseStyle(surveyAnswers)
      : null;

  const primaryFlag = style ? primaryResponseStyleFlag(style) : null;
  // Severity for GATING ignores the contradiction flag: contradictions lower
  // the Profile Clarity score, where they are explained, but never on their
  // own send a student to the retake dialog (18 Oct 2026). Straight-lining,
  // agreeing or disagreeing with everything, and all-midpoint still do.
  const gatingFlags = Array.isArray(style?.flags) ? style.flags.filter((f) => f.code !== 'contradiction') : [];
  const rank = { none: 0, mild: 1, severe: 2, block: 3 };
  const styleSeverity = style
    ? gatingFlags.reduce((top, f) => (rank[f.severity] > rank[top] ? f.severity : top), 'none')
    : 'none';

  // Legacy clarity check only when there is no response-style evidence.
  const passesClarityGate = style ? true : legacyClarityPasses(claritySummary);

  const failedChecks = [];
  if (!passesArchetypeGate) failedChecks.push('archetype_signal');
  if (!passesTraitGate) failedChecks.push('trait_signal');
  if (!passesClarityGate) failedChecks.push('clarity_signal');
  if (styleSeverity === 'severe' || styleSeverity === 'block') failedChecks.push(`style_${primaryFlag?.code || 'unknown'}`);

  // Hard block: nothing to report on, or an obvious non-attempt.
  const hardBlock = !passesArchetypeGate || !passesTraitGate || styleSeverity === 'block';
  // Soft block: the student is told what happened and may continue anyway.
  const shouldBlockAnalysis = hardBlock || !passesClarityGate || styleSeverity === 'severe';

  return {
    shouldBlockAnalysis,
    hardBlock,
    canGenerateAnyway: shouldBlockAnalysis && !hardBlock,
    passesArchetypeGate,
    passesTraitGate,
    passesClarityGate,
    archetypeCountAtOrAbove50,
    goodTraitCount,
    developingClarityCount: null,
    responseStyle: style,
    primaryFlag,
    failedChecks,
  };
}

// Student-facing explanation, specific to what the answers show.
export function getProfileQualityGateMessage(gate = {}) {
  const flag = gate?.primaryFlag || null;
  const code = flag?.code || '';

  if (gate?.hardBlock && code === 'straight_line') {
    return 'You chose the same answer twenty-five or more times in a row, so these answers do not tell us anything about you. Your Type is still here. Retake when you have a few quiet minutes.';
  }
  if (gate?.hardBlock) {
    return 'Your answers do not separate out enough for a report: almost everything sits in the middle or low. Your Type is still here. Retake when you have a few quiet minutes.';
  }

  switch (code) {
    case 'agree_everything':
      return 'You agreed with almost every statement. That lifts all your scores at once, so your matches will look stronger than they are and the report cannot tell your real interests apart from the rest.';
    case 'disagree_everything':
      return 'You disagreed with almost every statement. That lowers all your scores at once, so your matches will look weaker than they are and the report cannot see what you actually prefer.';
    case 'straight_line':
      return 'You chose the same answer many times in a row. Runs like that usually mean the questions were not being read, so the report would be built on answers that do not reflect you.';
    case 'midpoint':
      return 'You chose the middle option most of the time. The middle is fine when it is true, but with this many the report cannot tell what you lean towards.';
    case 'contradiction':
      return 'Inside the same areas, your answers often contradict each other. That usually means some questions were misread, so the scores for those areas are not reliable.';
    default:
      return 'Your answers point in several directions at once, so a report would not tell you anything reliable yet. This usually happens when questions are answered quickly, or the middle option is chosen more often than not.';
  }
}

// One line placed above a report that was generated anyway.
export function getProfileQualityCaveat(gate = {}) {
  const code = gate?.primaryFlag?.code || '';
  switch (code) {
    case 'agree_everything':
      return 'A note on this report: you agreed with almost every statement in the questionnaire, which lifts every trait at once. The career worlds, pathways and strengths below may therefore look like stronger matches than they really are, and the differences between them are smaller than they appear. Retaking the questionnaire when you can weigh each statement separately will give a sharper picture.';
    case 'disagree_everything':
      return 'A note on this report: you disagreed with almost every statement in the questionnaire, which lowers every trait at once. The career worlds, pathways and strengths below may therefore look like weaker matches than they really are, and things you would enjoy may be sitting further down the list than they should. Retaking the questionnaire when you can weigh each statement separately will give a sharper picture.';
    case 'straight_line':
      return 'A note on this report: your answers included long runs of the same option in a row, which usually means some questions were answered without being read. The trait scores behind this report, and the matches built from them, may describe the pattern of clicking rather than you. Treat what follows as a rough first look, and retake the questionnaire when you have a quiet moment.';
    case 'midpoint':
      return 'A note on this report: you chose the middle option for a large share of the questions, so many traits sit close together and the questionnaire could not tell which ones matter most to you. The matches below are less certain than usual and may change if you retake with clearer answers. Liking and disliking the worlds and pathways as you read will also sharpen them.';
    case 'contradiction':
      return 'A note on this report: within several traits, your answers to related questions pointed in opposite directions, which usually means some questions were misread. The scores for those traits are less reliable than usual, so a few of the matches below may be stronger or weaker than they should be. Retaking the questionnaire when you have a quiet moment will give a steadier picture.';
    default:
      return 'A note on this report: our checks found a pattern in your answers that makes them less reliable than usual, so the matches below may not describe you as well as they could. Retaking the questionnaire when you have a quiet moment will give a steadier picture.';
  }
}

export default calculateProfileQualityGate;
