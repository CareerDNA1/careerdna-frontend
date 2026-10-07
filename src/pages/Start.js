import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { writeProgress, clearProgress, resumableProgress } from '../Hooks/useProgress';

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

    clearProgress();
    writeProgress({
      started: true,
      startedAt: Date.now(),
      nonce: makeNonce(),
      ownerId: user?.id || null,
      index: 0,
    });

    navigate('/survey/intro', { replace: true });
  }, [navigate, search, user?.id]);

  return null;
}
