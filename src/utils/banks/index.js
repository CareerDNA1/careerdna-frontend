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

export const CURRENT_BANK_VERSION = 'v1';
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
// results_json (older rows, exports), then the defaults (everything before
// 17 October 2026 was v1 / v1 / A).
export function runVersions(run) {
  const rj = run?.results_json || {};
  const v = rj.versions || {};
  return {
    bank: String(run?.bank_version || v.bank || DEFAULTS.bank),
    scoring: String(run?.scoring_version || v.scoring || DEFAULTS.scoring),
    form: String(run?.form || v.form || DEFAULTS.form),
  };
}

export function currentVersions() {
  return { ...DEFAULTS };
}

// True when a saved run was answered on an older bank than the one new
// surveys use. Used for the one-line note on the retake confirmation.
export function runIsOnOlderBank(run) {
  return runVersions(run).bank !== CURRENT_BANK_VERSION;
}

export default BANKS;
