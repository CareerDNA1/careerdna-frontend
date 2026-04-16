import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readProgress } from '../Hooks/useProgress';
import { useAuth } from '../context/AuthContext';

function hasValidStart(p) {
  return !!(p && p.started && p.nonce);
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
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
