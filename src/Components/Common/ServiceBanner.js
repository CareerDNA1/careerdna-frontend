import React, { useEffect, useState } from 'react';
import { buildApiCandidates } from '../../utils/config';

// Slim top-of-page banner shown when CareerDNA's backend or its Supabase
// dependency is unreachable, so an outage reads as "temporary issue, we're on it"
// instead of raw errors. Polls a lightweight health endpoint.
async function checkHealth() {
  const candidates = buildApiCandidates('/api/health');
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      return { reachable: true, supabase: data?.supabase !== false };
    } catch (_) {
      // try next candidate
    }
  }
  return { reachable: false, supabase: true };
}

export default function ServiceBanner() {
  const [down, setDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    const tick = async () => {
      const h = await checkHealth();
      if (cancelled) return;
      // "down" if the backend is unreachable or Supabase (auth/db) is down.
      setDown(!h.reachable || !h.supabase);
      timer = setTimeout(tick, down ? 20000 : 60000);
    };
    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!down) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 4000,
        background: '#fef3c7', color: '#7c5e10', borderBottom: '1px solid #f6d879',
        padding: '9px 16px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 600,
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      Some features are temporarily unavailable due to a service provider issue. Please try again shortly.
    </div>
  );
}
