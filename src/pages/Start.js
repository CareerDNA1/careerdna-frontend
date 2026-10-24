import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { writeProgress, clearProgress, resumableProgress } from '../Hooks/useProgress';
import { getAcademicStatus, snapshotAnswers } from '../utils/academicStatus';

function makeNonce(len = 16) {
  const bytes = new Uint8Array(len);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Entry point for the survey. If this user has an unfinished survey saved on
// this device, send them straight to the questions with a resume prompt;
// otherwise start a clean run.
export default function Start() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const qs = new URLSearchParams(search);
    const fresh = qs.get('fresh') === '1';

    if (!fresh && resumableProgress(user?.id)) {
      navigate('/survey/questions', { replace: true, state: { askResume: true } });
      return;
    }

    let cancelled = false;
    (async () => {
      // Where the person is (school or university, subject of interest ...)
      // lives on the profile since 21 Oct 2026 and is confirmed at first
      // login, so the survey no longer asks it: the saved status becomes the
      // run's snapshot and we go straight to the instructions. Only an
      // account that somehow has no status still sees the intro questions.
      let status = null;
      try { status = await getAcademicStatus(); } catch (_) { status = null; }
      if (cancelled) return;
      const answers = snapshotAnswers(status);

      clearProgress();
      writeProgress({
        started: true,
        startedAt: Date.now(),
        nonce: makeNonce(),
        ownerId: user?.id || null,
        index: 0,
        ...(answers ? {
          introResponses: {
            ...answers,
            dateOfBirth: status.date_of_birth || answers.dateOfBirth || '',
            country: answers.country || status.country || '',
          },
          introDone: true,
          step: 'instructions',
        } : {}),
      });

      navigate(answers ? '/survey/instructions' : '/survey/intro', { replace: true });
    })();
    return () => { cancelled = true; };
  }, [navigate, search, user?.id]);

  return null;
}
