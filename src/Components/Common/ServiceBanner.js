import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/apiFetch';

// Slim top-of-page banner shown when CareerDNA's backend or its Supabase
// dependency is unreachable, so an outage reads as "temporary issue, we're on it"
// instead of raw errors. Polls a lightweight health endpoint.
async function checkHealth() {
  try {
    const data = await apiFetch('/api/health', { auth: false, timeoutMs: 12000 });
    return { reachable: true, supabase: data?.supabase !== false };
  } catch (_) {
    return { reachable: false, supabase: true };
  }
}

export default function ServiceBanner() {
  const [down, setDown] = useState(false);

  useEffect(() => {
    // Local development restarts the backend all the time (nodemon), which
    // would keep tripping this. The banner is for real outages in production.
    if (process.env.NODE_ENV === 'development') return undefined;
    let cancelled = false;
    let timer = null;
    let fails = 0;
    const tick = async () => {
      const h = await checkHealth();
      if (cancelled) return;
      const bad = !h.reachable || !h.supabase;
      // Only show the banner after three consecutive failed checks (about a
      // minute of real outage), so a blip, a slow reply or a cold start never
      // flashes it. Any success clears it immediately.
      if (bad) {
        fails += 1;
        if (fails >= 3) setDown(true);
      } else {
        fails = 0;
        setDown(false);
      }
      // Re-check sooner while we suspect a problem, so it clears quickly once
      // the backend recovers.
      timer = setTimeout(tick, bad ? 20000 : 90000);
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While the banner is up the fixed navbars move down by its height (see the
  // body.cdna-service-down rules in AccountNavbar.css and Navbar.css).
  useEffect(() => {
    if (!down) return undefined;
    document.body.classList.add('cdna-service-down');
    return () => document.body.classList.remove('cdna-service-down');
  }, [down]);

  if (!down) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30050,
        height: 40, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fef3c7', color: '#7c5e10', borderBottom: '1px solid #f6d879',
        padding: '0 16px', textAlign: 'center', fontSize: '0.84rem', lineHeight: 1.2, fontWeight: 600,
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        overflow: 'hidden',
      }}
    >
      Some features are temporarily unavailable due to a service provider issue. Please try again shortly.
    </div>
  );
}
