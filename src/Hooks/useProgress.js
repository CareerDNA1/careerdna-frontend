// src/Hooks/useProgress.js
//
// Survey progress (intro answers, question answers, current question) lives
// in localStorage so it survives a closed tab, a crashed browser or a phone
// locking mid-survey. It is tagged with the user id that started it, so a
// different account on the same device never sees it.
import { useCallback } from 'react';
import { progressVersions, CURRENT_BANK_VERSION } from '../utils/banks';

const KEY = 'cdna_progress_v1';
const JUMP_KEY = 'cdna_jump_last';
const SUBDIMS_KEY = 'cdna_subdims_v1';

function store() {
  try { return window.localStorage; } catch { return null; }
}

// An unfinished survey started on an older question bank (no bank stamp, or
// a stamp other than the current bank) is discarded, so the student starts
// the new assessment instead of finishing the old one (decision 1 Nov 2026).
// Item ids are reused across banks, so those answers cannot be carried over.
function isOlderBankDraft(p) {
  if (!p || typeof p !== 'object') return false;
  const hasAnswers = p.answers && typeof p.answers === 'object' && Object.keys(p.answers).length > 0;
  return hasAnswers && p.bank !== CURRENT_BANK_VERSION;
}

export function readProgress() {
  try {
    const s = store();
    const raw = s ? s.getItem(KEY) : null;
    const p = raw ? JSON.parse(raw) : {};
    if (isOlderBankDraft(p)) {
      if (s) s.removeItem(KEY);
      try {
        sessionStorage.removeItem(KEY);
        sessionStorage.removeItem(JUMP_KEY);
        sessionStorage.removeItem(SUBDIMS_KEY);
      } catch { /* ignore */ }
      return {};
    }
    return p;
  } catch {
    return {};
  }
}

// Bank versions for the survey stored on this device (see utils/banks).
export function readProgressVersions() {
  return progressVersions(readProgress());
}

export function writeProgress(patch) {
  try {
    const cur = readProgress();
    const s = store();
    if (s) s.setItem(KEY, JSON.stringify({ ...cur, ...patch, updatedAt: Date.now() }));
  } catch { /* storage unavailable: survey still works for this session */ }
}

// Wipe everything to do with an in-progress survey.
export function clearProgress() {
  try {
    const s = store();
    if (s) s.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(JUMP_KEY);
    sessionStorage.removeItem(SUBDIMS_KEY);
  } catch { /* ignore */ }
}

// True when there is an unfinished survey for this user worth offering to resume.
export function resumableProgress(userId) {
  const p = readProgress();
  if (!p || !p.started || p.questionsDone) return null;
  if (userId && p.ownerId && p.ownerId !== userId) return null;
  const answered = p.answers ? Object.keys(p.answers).length : 0;
  if (!answered) return null;
  return { answered, index: typeof p.index === 'number' ? p.index : 0, updatedAt: p.updatedAt || null };
}

export default function useProgress() {
  const read = useCallback(() => readProgress(), []);
  const write = useCallback((patch) => writeProgress(patch), []);
  const clear = useCallback(() => clearProgress(), []);
  return { read, write, clear };
}
