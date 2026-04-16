import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { writeProgress } from '../Hooks/useProgress';

const KEY = 'cdna_progress_v1';

function makeNonce(len = 16) {
  const bytes = new Uint8Array(len);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Start() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    // Always reset when starting (unless you add your own resume logic here)
    sessionStorage.removeItem(KEY);

    const qs = new URLSearchParams(search);
    const resume = qs.get('resume') === '1';

    const nonce = makeNonce();
    writeProgress({
      started: true,
      startedAt: Date.now(),
      nonce,
      resume
    });

    navigate('/survey/intro', { replace: true });
  }, [navigate, search]);

  return null;
}
