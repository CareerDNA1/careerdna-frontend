import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { CAREERDNA_LEGAL_VERSION } from '../../pages/LegalPage';
import { AUTH_EXPIRED_EVENT } from '../../utils/apiFetch';

// Shown once to signed-in users whose recorded acceptance is older than the
// current Terms and Privacy Notice. They must accept to carry on. The Terms
// and Privacy links open the usual legal modal on top of this one.
//
// What changed in each version, in plain language. Add an entry when the
// version in LegalPage.js is bumped.
const CHANGE_SUMMARY = {
  '2026-10-05-v6': [
    'We now say exactly what is sent to our AI provider (OpenAI) to write your report and advisor answers, and what is never sent: your name, email, date of birth and school name stay with us.',
    'We list every company that helps run CareerDNA and where your data is stored (the EU, in Ireland).',
    'We explain how long we keep each type of data and what happens when you delete your account.',
    'We explain how Your Advisor responds if a message suggests someone may be at risk, and when we may share information to keep someone safe.',
  ],
};

export default function LegalUpdateGate() {
  const { user } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  // When the session has ended, SessionExpiredGate (App.js) takes over; this
  // gate steps aside so the two never stack. A fresh sign-in resets it.
  useEffect(() => {
    const onExpired = () => setSessionExpired(true);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);
  useEffect(() => { setSessionExpired(false); }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    setNeedsAcceptance(false);
    if (!user?.id) return undefined;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('legal_version')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled || !data) return; // no profile yet: signup is still syncing it
        if ((data.legal_version || '') !== CAREERDNA_LEGAL_VERSION) setNeedsAcceptance(true);
      } catch (_) {
        /* never block the app because this check failed */
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const visible = needsAcceptance && !sessionExpired;

  useEffect(() => {
    if (!visible) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [visible]);

  if (!visible) return null;

  const accept = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({
          accepted_terms: true,
          accepted_privacy: true,
          legal_version: CAREERDNA_LEGAL_VERSION,
        })
        .eq('id', user.id);
      if (updErr) throw updErr;
      setNeedsAcceptance(false);
    } catch (e) {
      setError('We could not save your acceptance. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const changes = CHANGE_SUMMARY[CAREERDNA_LEGAL_VERSION] || [];

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="legal-update-title">
      <section className="auth-card" style={styles.card}>
        <div style={styles.iconWrap} aria-hidden="true">
          <svg viewBox="0 0 24 24" style={styles.icon}>
            <path d="M12 3.4 18.2 6v5.2c0 4.1-2.5 7.6-6.2 9.2-3.7-1.6-6.2-5.1-6.2-9.2V6L12 3.4Z" />
            <path d="m9.5 12.2 1.7 1.7 3.7-4" />
          </svg>
        </div>
        <h2 id="legal-update-title" style={styles.title}>We have updated our Terms and Privacy Notice</h2>
        <p style={styles.lead}>
          Before you carry on, please take a moment to read what has changed. The main points:
        </p>
        <ul style={styles.list}>
          {changes.map((c) => (
            <li key={c} style={styles.listItem}>{c}</li>
          ))}
        </ul>
        <p style={styles.links}>
          Read the full <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Notice</a>.
        </p>
        {error && <p style={styles.error} role="alert">{error}</p>}
        <button
          type="button"
          className="auth-button"
          style={styles.button}
          onClick={accept}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'I have read and accept'}
        </button>
      </section>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 990, // below the legal modal (1000) so Terms and Privacy open on top
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '22px',
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(2px)',
  },
  card: {
    width: 'min(92vw, 520px)',
    maxHeight: '88vh',
    overflowY: 'auto',
    padding: 'clamp(20px, 2.5vw, 28px)',
    borderRadius: '18px',
    background: '#ffffff',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    boxSizing: 'border-box',
  },
  iconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#eaf2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  icon: { width: '24px', height: '24px', fill: 'none', stroke: '#2f6fed', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' },
  title: { margin: '0 0 8px', fontSize: '1.15rem', lineHeight: 1.3, color: '#0f172a', fontWeight: 700 },
  lead: { margin: '0 0 8px', color: '#334155', fontSize: '0.9rem', lineHeight: 1.45 },
  list: { margin: '0 0 10px', paddingLeft: '18px', color: '#334155', fontSize: '0.88rem', lineHeight: 1.45 },
  listItem: { marginBottom: '5px' },
  links: { margin: '0 0 14px', color: '#334155', fontSize: '0.88rem' },
  error: { margin: '0 0 12px', color: '#b91c1c', fontSize: '0.9rem' },
  button: { width: '100%' },
};
