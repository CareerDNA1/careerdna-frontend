import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiFetch';

// Users asked about on this page load, so a failure is retried on the next
// load rather than on every page change.
const attemptedThisLoad = new Set();

// Asks the backend to send the founder welcome email. The backend sends it at
// most once per user. The browser only remembers "done" once the backend says
// the email was sent or was already handled; any failure is retried later.
export default function WelcomeEmailTrigger() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!user?.id) return;
    // The login page is where the email confirmation link lands, and it signs
    // that temporary session straight out. Ask once the person is properly in.
    if (pathname === '/login' || pathname === '/signup' || pathname === '/reset-password') return;
    const key = `cdna_welcome_checked_${user.id}`;
    try { if (window.sessionStorage.getItem(key)) return; } catch (_) { /* ignore */ }
    if (attemptedThisLoad.has(user.id)) return;
    attemptedThisLoad.add(user.id);

    (async () => {
      try {
        const res = await apiFetch('/api/welcome', { method: 'POST', auth: 'required' });
        if (res?.sent || res?.reason === 'already handled') {
          try { window.sessionStorage.setItem(key, '1'); } catch (_) { /* ignore */ }
        }
      } catch (_) { /* retried on the next page load; never affect the app */ }
    })();
  }, [user?.id, pathname]);

  return null;
}
