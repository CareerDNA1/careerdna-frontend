import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readProgress } from '../Hooks/useProgress';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, isCompleteProfile } from '../utils/profile';

function hasValidStart(p) {
  return !!(p && p.started && p.nonce);
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const userId = user?.id || '';
  const [profileState, setProfileState] = useState('checking');
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
      if (completeProfileUserIdRef.current === userId) {
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
  }, [userId, loading]);

  if (loading || (userId && profileState === 'checking')) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}
        aria-label="Loading"
        aria-busy="true"
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
      </div>
    );
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
