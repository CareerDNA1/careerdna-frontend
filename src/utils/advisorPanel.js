// Tiny shared store for the advisor drawer ("Your Advisor"). Any part of the app
// can open it, close it, or tell it what the student is looking at, so the
// drawer can lead with the right suggested questions. One conversation, one
// panel, remembered across tabs and page loads.
import { useEffect, useState } from 'react';

const OPEN_KEY = 'cdna:advisor:open';

const state = {
  open: false,
  context: null,      // { section, title, questions[] }
  prefill: '',        // a question to place in the input when the drawer opens
  prefillSend: false, // send the prefilled question straight away
  facts: { stage: '', grades: false, saved: false, applied: false }, // what the student has done so far
};
const listeners = new Set();

try {
  state.open = window.localStorage.getItem(OPEN_KEY) === '1';
} catch (_) {
  // storage unavailable: start closed
}

function emit() {
  listeners.forEach((fn) => { try { fn(); } catch (_) { /* ignore */ } });
}

function persistOpen() {
  try { window.localStorage.setItem(OPEN_KEY, state.open ? '1' : '0'); } catch (_) { /* ignore */ }
}

export function openAdvisor({ question = '', send = false } = {}) {
  state.open = true;
  state.prefill = String(question || '');
  state.prefillSend = Boolean(send && question);
  persistOpen();
  emit();
}

export function closeAdvisor() {
  state.open = false;
  persistOpen();
  emit();
}

export function toggleAdvisor() {
  if (state.open) closeAdvisor(); else openAdvisor();
}

// What the student is looking at right now (section key, human title, and the
// questions worth suggesting there). Pass null when leaving a context.
export function setAdvisorContext(context) {
  const next = context ? {
    section: String(context.section || ''),
    title: String(context.title || ''),
    questions: Array.isArray(context.questions) ? context.questions.filter(Boolean) : [],
  } : null;
  const same = JSON.stringify(next) === JSON.stringify(state.context);
  if (same) return;
  state.context = next;
  emit();
}

// Stage (school or university) and what the student has entered so far, so
// the suggested questions only offer what the advisor can actually answer.
export function setAdvisorFacts(partial = {}) {
  const next = { ...state.facts, ...(partial || {}) };
  if (JSON.stringify(next) === JSON.stringify(state.facts)) return;
  state.facts = next;
  emit();
}

// The drawer calls this once it has consumed the prefilled question.
export function clearAdvisorPrefill() {
  if (!state.prefill && !state.prefillSend) return;
  state.prefill = '';
  state.prefillSend = false;
  emit();
}

export function getAdvisorPanelState() {
  return { open: state.open, context: state.context, prefill: state.prefill, prefillSend: state.prefillSend, facts: state.facts };
}

export function useAdvisorPanel() {
  const [snap, setSnap] = useState(getAdvisorPanelState);
  useEffect(() => {
    const fn = () => setSnap(getAdvisorPanelState());
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return snap;
}
