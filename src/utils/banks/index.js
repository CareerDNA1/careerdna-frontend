// src/utils/banks/index.js
// Question bank registry (audit item 29, 17 October 2026).
//
// A "bank" is everything a set of answers must be scored with: the question
// list (ids, texts, reverse keys, trait membership), the presentation order
// (form), and the scoring rules that go with it (weight matrix; bands and the
// clarity formula are shared code and are versioned by scoring_version).
//
// Rules
//   * New surveys always use CURRENT_BANK_VERSION.
//   * A saved run is always re-scored with the bank named on the run
//     (bank_version), never with whatever is current. A re-run inherits the
//     versions of the run it came from because the answers are the same.
//   * Adding a bank: add questions_v2.js / questions_a_v2.js / weights, register
//     it below, then move the CURRENT_* pointers. Nothing else changes.
//   * A wording-only change (same ids, same keys, same trait membership) is a
//     point release (v2.1) and may share the parent's scoring; any item that
//     moves trait, is re-keyed or is replaced is a new major version.

import v1Questions from '../questions';
import v1FormA from '../questions_a';
import v1Weights from '../archetypeWeights';
import v2Questions from '../questions_v2';
import v2FormA from '../questions_a_v2';
import v2Weights from '../archetypeWeights_v2';

export const CURRENT_BANK_VERSION = 'v2';
// The bank of anything saved without a bank stamp. Every run saved before bank
// v2 existed was answered on v1 (the database column also defaults to 'v1'),
// so an unstamped run is never re-scored on a newer bank by accident.
export const LEGACY_BANK_VERSION = 'v1';
export const CURRENT_SCORING_VERSION = 'v1';
export const CURRENT_FORM = 'A';

const BANKS = {
  v1: {
    version: 'v1',
    label: '100-item bank, 25 traits (2026)',
    questions: v1Questions,          // canonical order, used for scoring
    forms: { A: v1FormA },           // presentation orders
    scoring: {
      v1: { weights: v1Weights },
    },
  },
  // CareerDNA v5 (29 Oct 2026): 108 items, 27 traits. Five traits renamed
  // (see utils/traitNames.js), Work-Life Balance and Active & Outdoors added.
  // Item ids are reused with different items, so v1 answers are never scored
  // with this bank. "Scoring v1" is the same formula with this bank's matrix.
  v2: {
    version: 'v2',
    label: '108-item bank, 27 traits (CareerDNA v5, 2026)',
    questions: v2Questions,
    forms: { A: v2FormA },
    scoring: {
      v1: { weights: v2Weights },
    },
  },
};

const DEFAULTS = Object.freeze({
  bank: CURRENT_BANK_VERSION,
  scoring: CURRENT_SCORING_VERSION,
  form: CURRENT_FORM,
});

export function isKnownBankVersion(version) {
  return Boolean(BANKS[String(version || '').trim()]);
}

// The bank for a version. Unknown versions fall back to the current bank with
// a console warning rather than crashing a report page; the saved stamp on the
// run still says what it really was.
export function getBank(version = CURRENT_BANK_VERSION) {
  const key = String(version || '').trim() || CURRENT_BANK_VERSION;
  const bank = BANKS[key];
  if (bank) return bank;
  if (typeof console !== 'undefined') {
    console.warn(`[banks] unknown bank_version "${key}", scoring with ${CURRENT_BANK_VERSION}`);
  }
  return BANKS[CURRENT_BANK_VERSION];
}

export function getBankQuestions(version) {
  return getBank(version).questions;
}

export function getBankForm(version, form = CURRENT_FORM) {
  const bank = getBank(version);
  return bank.forms[form] || bank.forms[CURRENT_FORM] || bank.questions;
}

export function getBankWeights(version, scoringVersion) {
  const bank = getBank(version);
  const key = String(scoringVersion || '').trim();
  const scoring = (key && bank.scoring[key]) || bank.scoring[Object.keys(bank.scoring)[0]];
  return scoring.weights;
}

// Versions stamped on a saved run. Reads the columns first, then the copy in
// results_json (older rows, exports), then the legacy defaults (everything
// saved before bank stamps existed was v1 / v1 / A).
export function runVersions(run) {
  const rj = run?.results_json || {};
  const v = rj.versions || {};
  return {
    bank: String(run?.bank_version || v.bank || LEGACY_BANK_VERSION),
    scoring: String(run?.scoring_version || v.scoring || DEFAULTS.scoring),
    form: String(run?.form || v.form || DEFAULTS.form),
  };
}

export function currentVersions() {
  return { ...DEFAULTS };
}

// Versions for a survey that is in progress on this device. A survey started
// after bank v2 went live carries its bank in the saved progress; one started
// before (answers saved, no stamp) is finished and scored on v1, the bank its
// answers belong to. A survey with no answers yet is on the current bank.
export function progressVersions(progress) {
  const p = progress && typeof progress === 'object' ? progress : {};
  const hasAnswers = p.answers && typeof p.answers === 'object' && Object.keys(p.answers).length > 0;
  const bank = isKnownBankVersion(p.bank) ? String(p.bank) : hasAnswers ? LEGACY_BANK_VERSION : CURRENT_BANK_VERSION;
  return { bank, scoring: CURRENT_SCORING_VERSION, form: CURRENT_FORM };
}

// The presentation order that goes with a question list from any bank (the
// canonical list or one of its forms). Used by the response-style checks,
// which read answers in the order they were shown.
export function presentationFormFor(questions) {
  for (const bank of Object.values(BANKS)) {
    if (questions === bank.questions || Object.values(bank.forms).includes(questions)) {
      return bank.forms[CURRENT_FORM] || bank.questions;
    }
  }
  return Array.isArray(questions) ? questions : getBankForm(CURRENT_BANK_VERSION);
}

// True when a saved run was answered on an older bank than the one new
// surveys use. Used for the one-line note on the retake confirmation.
export function runIsOnOlderBank(run) {
  return runVersions(run).bank !== CURRENT_BANK_VERSION;
}

export default BANKS;
