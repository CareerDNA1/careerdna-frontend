import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError } from '../../utils/apiFetch';

// Asks the backend to send the founder welcome email. The backend sends it at
// most once per user, so this only needs to fire once per browser session.
export default function WelcomeEmailTrigger() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const key = `cdna_welcome_checked_${user.id}`;
    try { if (window.sessionStorage.getItem(key)) return; } catch (_) { /* ignore */ }

    (async () => {
      try {
        try {
          await apiFetch('/api/welcome', { method: 'POST', auth: 'required' });
        } catch (e) {
          // Not signed in yet: leave the marker unset so we try again later.
          if (e instanceof ApiError && e.code === 'NOT_SIGNED_IN') return;
          // Any other outcome counts as "asked"; the backend dedupes anyway.
        }
        try { window.sessionStorage.setItem(key, '1'); } catch (_) { /* ignore */ }
      } catch (_) { /* never affect the app */ }
    })();
  }, [user?.id]);

  return null;
}
