// src/Hooks/useSurveyEngine.js
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { fetchAiSummary } from '../utils/fetchAiSummary';
import { readProgress, writeProgress } from './useProgress';
import QUESTIONS from '../utils/questions_a'; // Form A — interleaved, auditable ordering
import { calculateResults } from '../utils/calculateResults';
import scoreSubdimensions from '../utils/scoreSubdimensions';

function normalizeStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  if (['school', 'gcse', 'a-level', 'alevel', 'sixth form', 'sixth-form'].includes(s)) return 'school';
  if (['undergrad', 'undergraduate', 'ug'].includes(s)) return 'undergraduate';
  if (['postgrad', 'postgraduate', 'pg', 'masters', 'master', 'msc', 'mba'].includes(s)) return 'postgraduate';
  if (['school', 'undergraduate', 'postgraduate'].includes(s)) return s;
  return '';
}

function coerceArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean).map(String);
  return String(x)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}



export function useSurveyEngine(initialIntroResponses) {
  const persisted = readProgress();

  const [introResponsesState, setIntroResponses] = useState(
    persisted.introResponses || initialIntroResponses || {}
  );
  const [answers, setAnswers] = useState(persisted.answers || {});
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [analysisMeta, setAnalysisMeta] = useState(null);
  const activeRequestRef = useRef(0);

  useEffect(() => {
    const p = readProgress();
    if (!p.nonce) {
      writeProgress({ nonce: `cdna-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    }
  }, []);

  useEffect(() => {
    writeProgress({ answers });
  }, [answers]);

  useEffect(() => {
    if (introResponsesState && typeof introResponsesState === 'object') {
      writeProgress({ introResponses: introResponsesState });
    }
  }, [introResponsesState]);

  // Safe scoring path: single source of truth.
  const archetypes = useMemo(() => {
    if (!answers || typeof answers !== 'object') return {};
    if (!Array.isArray(QUESTIONS)) return {};
    return calculateResults(answers, QUESTIONS).archetypeScores;
  }, [answers]);

  const results = archetypes;

  const subdimensionScores = useMemo(() => {
    if (!answers || typeof answers !== 'object') return [];
    if (!Array.isArray(QUESTIONS)) return [];
    return scoreSubdimensions(answers, QUESTIONS);
  }, [answers]);

  useEffect(() => {
    try {
      sessionStorage.setItem('cdna_subdims_v1', JSON.stringify(subdimensionScores));
    } catch {}
  }, [subdimensionScores]);

  const generateSummary = useCallback(async (options = {}) => {
    const force = Boolean(options?.force);
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    setLoading(true);
    if (force) {
      setSummary('');
      setAnalysisMeta(null);
    }

    try {
      let { age, status, schoolSubjects, uniSubject, planUniversity, uniNeed } = introResponsesState || {};

      const ageValue = String(age || '').trim();
      let normStatus = normalizeStatus(status);

      if (!normStatus) {
        if (['13-15', '16-18'].includes(ageValue)) {
          normStatus = 'school';
        } else if (['19-21', '22-24', '25+'].includes(ageValue)) {
          normStatus = 'undergraduate';
        }
      }

      const payload = {
        surveyForm: 'A',  // counterbalanced form version
        archetypes: archetypes || {},
        age: ageValue || undefined,
        status: normStatus || undefined,
        ...(normStatus === 'school'
          ? { schoolSubjects: coerceArray(schoolSubjects) }
          : {
              uniSubject:
                typeof uniSubject === 'string'
                  ? uniSubject
                  : Array.isArray(uniSubject)
                  ? uniSubject[0]
                  : '',
            }),
        subdimensions: subdimensionScores,
        ...(planUniversity ? { planUniversity: String(planUniversity) } : {}),
        ...(uniNeed ? { uniNeed: String(uniNeed) } : {}),
      };

      const response = await fetchAiSummary(payload);
      if (activeRequestRef.current !== requestId) return null;

      if (typeof response === 'string') {
        setSummary(response || '');
        setAnalysisMeta(null);
      } else {
        setSummary(response?.summary || '');
        setAnalysisMeta(response?.analysisMeta || response?.sectionSignals || null);
      }

      return response;
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [introResponsesState, archetypes, subdimensionScores]);

  return {
    introResponses: introResponsesState,
    setIntroResponses,
    answers,
    setAnswers,
    archetypes,
    results,
    subdimensionScores,
    loading,
    summary,
    setSummary,
    analysisMeta,
    setAnalysisMeta,
    generateSummary,

    // helpful passthroughs for pages that destructure these
    questions: QUESTIONS,
    state: { answers, questions: QUESTIONS, introResponses: introResponsesState },
  };
}

export default useSurveyEngine;
