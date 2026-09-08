import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy shim.
 *
 * The live survey flow is now routed through:
 * /start -> /survey/intro -> /survey/instructions -> /survey/questions -> /results
 *
 * This file is intentionally kept as a safe redirect so any accidental imports
 * or old links do not revive the deprecated all-in-one survey flow.
 */
export default function SurveyPage() {
  return <Navigate to="/start" replace />;
}
