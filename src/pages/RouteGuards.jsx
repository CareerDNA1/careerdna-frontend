import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readProgress } from '../Hooks/useProgress';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, isCompleteProfile } from '../utils/profile';

function hasValidStart(p) {
  return !!(p && p.started && p.nonce);
}

// Full-page wait shown while the sign-in and profile checks run. If the
// database or the auth service is slow or unhealthy those checks can hang,
// and a spinner that never ends tells the student nothing. After a short
// while the spinner gains a line of text and a Try again button that
// reloads the page, which restarts every check from scratch.
const SLOW_LOAD_AFTER_MS = 10000;

function RouteWait() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SLOW_LOAD_AFTER_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '0 20px',
        textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
      aria-busy={!slow}
    >
      <span
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '3px solid #dbe6fb',
          borderTopColor: '#2f6fed',
          animation: 'cdna-route-spin 0.75s linear infinite',
        }}
      />
      <style>{'@keyframes cdna-route-spin{to{transform:rotate(360deg)}}'}</style>
      {slow ? (
        <>
          <p style={{ margin: '6px 0 0', color: '#4b5c6b', fontSize: '0.95rem', maxWidth: '36ch' }}>
            This is taking longer than usual. Give it a moment, or try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2px',
              padding: '9px 18px',
              borderRadius: '999px',
              border: '1px solid #2f6fed',
              background: '#ffffff',
              color: '#2f6fed',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </>
      ) : null}
    </div>
  );
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const userId = user?.id || '';
  const [profileState, setProfileState] = useState('checking');
  const [onboarded, setOnboarded] = useState(true);
  // While onboarding is incomplete, every route change re-reads the profile
  // (so finishing /welcome releases the redirect); afterwards it is constant.
  const recheckKey = onboarded ? '' : location.pathname;
  const completeProfileUserIdRef = useRef('');

  useEffect(() => {
    let cancelled = false;

    async function checkProfile() {
      if (loading) return;

      if (!userId) {
        completeProfileUserIdRef.current = '';
        setProfileState('signed-out');
        return;
      }

      // If we have already confirmed this signed-in user's profile during this
      // app session, do not flash the whole app back to "Loading..." on token
      // refresh, tab focus, or Supabase auth state refresh events.
      // (While onboarding is still incomplete we re-read the profile on each
      // route change, so finishing /welcome releases the redirect.)
      if (completeProfileUserIdRef.current === userId && onboarded) {
        setProfileState('complete');
        return;
      }

      try {
        setProfileState((prev) => (prev === 'complete' ? prev : 'checking'));
        const profile = await getMyProfile();
        if (cancelled) return;

        const complete = isCompleteProfile(profile);
        if (complete) completeProfileUserIdRef.current = userId;
        else completeProfileUserIdRef.current = '';

        // First login: where you are (date of birth, school or university,
        // subject of interest ...) is confirmed once, before anything else.
        // Accounts from before this existed have the answers prefilled from
        // their last report and only confirm them.
        setOnboarded(Boolean(profile?.onboarding_completed_at));
        setProfileState(complete ? 'complete' : 'incomplete');
      } catch (_) {
        if (cancelled) return;
        completeProfileUserIdRef.current = '';
        setProfileState('incomplete');
      }
    }

    checkProfile();

    return () => {
      cancelled = true;
    };
    // recheckKey: re-check after the onboarding page navigates away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loading, recheckKey]);

  if (loading || (userId && profileState === 'checking')) {
    return <RouteWait />;
  }

  if (!userId) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (profileState !== 'complete') {
    return (
      <Navigate
        to="/signup"
        replace
        state={{
          message: 'Please complete your CareerDNA account before continuing.',
          googleNeedsCompletion: true,
        }}
      />
    );
  }

  if (!onboarded && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function StartedGuard() {
  const p = readProgress();
  if (!hasValidStart(p)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function IntroGuard() {
  const p = readProgress();
  if (!hasValidStart(p)) return <Navigate to="/" replace />;
  if (!p.introDone) return <Navigate to="/survey/intro" replace />;
  return <Outlet />;
}

export function InstructionsGuard() {
  const p = readProgress();
  if (!hasValidStart(p)) return <Navigate to="/" replace />;
  if (!p.introDone) return <Navigate to="/survey/intro" replace />;
  if (!p.instructionsDone) return <Navigate to="/survey/instructions" replace />;
  return <Outlet />;
}

export function ResultsGuard() {
  const p = readProgress();
  if (!hasValidStart(p)) return <Navigate to="/" replace />;
  if (!(p.questionsDone || p.resultsDone || p.results)) {
    return <Navigate to="/survey/questions" replace />;
  }
  return <Outlet />;
}

// Admin-only routes. Non-admins are sent to their profile before any admin
// code or data is requested; the page is simply not there for them. The
// backend still checks is_admin on every admin request, so this is a second
// layer, not the only one.
export function RequireAdmin() {
  const { user, loading } = useAuth();
  const [state, setState] = useState('checking'); // checking | admin | denied

  useEffect(() => {
    let cancelled = false;
    if (loading) return undefined;
    if (!user?.id) { setState('denied'); return undefined; }
    (async () => {
      try {
        const profile = await getMyProfile();
        if (!cancelled) setState(profile?.is_admin === true ? 'admin' : 'denied');
      } catch (_) {
        if (!cancelled) setState('denied');
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, loading]);

  if (state === 'checking') return null;
  if (state === 'denied') return <Navigate to="/profile" replace />;
  return <Outlet />;
}
