import { supabase } from './supabaseClient';
import { fetchAiSummary } from './fetchAiSummary';
import { calculateProfileQualityGate } from './profileQualityGate';
import { OUTPUT_VERSION } from './outputVersion';
import { saveIdentityProfile } from './identityProfile';

function eduLevelFromStatus(status) {
  if (status === 'undergraduate') return 'undergraduate';
  if (status === 'postgraduate') return 'postgraduate';
  return 'school';
}

export async function saveAssessmentRun({
  introAnswers = {},
  surveyAnswers = {},
  resultsJson = {},
  summaryMarkdown = '',
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  const payload = {
    user_id: user.id,
    intro_answers_json: introAnswers || {},
    survey_answers_json: surveyAnswers || {},
    results_json: resultsJson || {},
    summary_markdown: summaryMarkdown || '',
    output_version: OUTPUT_VERSION,
  };

  const { data, error } = await supabase
    .from('assessment_runs')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  // Best-effort: persist locked identity + progression to the profile.
  // DOB/country are only set if not already present (they are locked), while
  // education level / course start year are progression fields and update.
  try {
    await saveIdentityProfile({
      dateOfBirth: introAnswers?.dateOfBirth,
      country: introAnswers?.country,
      educationLevel: eduLevelFromStatus(introAnswers?.status),
      courseStartYear: introAnswers?.courseStartYear,
    });
  } catch (e) {
    // Never fail the run save because of a profile write.
    console.warn('Identity profile persist failed:', e?.message || e);
  }

  return data;
}

export async function getLatestAssessmentRun() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from('assessment_runs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listAssessmentRuns(limit = 20) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from('assessment_runs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getAssessmentRunCount() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return 0;

  const { count, error } = await supabase
    .from('assessment_runs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) throw error;
  return Number(count) || 0;
}

export async function getAssessmentRunById(runId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from('assessment_runs')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', runId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteAssessmentRun(runId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  const { error } = await supabase
    .from('assessment_runs')
    .delete()
    .eq('user_id', user.id)
    .eq('id', runId);

  if (error) throw error;
  return true;
}

export async function updateAssessmentRun(runId, patch) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  const { data, error } = await supabase
    .from('assessment_runs')
    .update(patch)
    .eq('user_id', user.id)
    .eq('id', runId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function rerunAssessmentWithOutputParameters(run, updatedIntroAnswers = {}) {
  if (!run) throw new Error('Saved run is required.');

  const savedResults = run.results_json || {};
  const archetypes = savedResults.archetypes || {};

  if (!archetypes || !Object.keys(archetypes).length) {
    throw new Error('This saved run does not contain archetype data.');
  }

  const intro = {
    ...(run.intro_answers_json || {}),
    ...(updatedIntroAnswers || {}),
  };

  const subdimensionRows = Array.isArray(savedResults.subdimensionRows) ? savedResults.subdimensionRows : [];
  const claritySummary = savedResults.claritySummary || null;
  const profileQualityGate = calculateProfileQualityGate({
    archetypes,
    subdimensionRows,
    claritySummary,
  });

  const newRun = await saveAssessmentRun({
    introAnswers: intro,
    surveyAnswers: run.survey_answers_json || {},
    resultsJson: {
      ...savedResults,
      archetypes,
      analysisMeta: null,
      introName: intro?.name || '',
      subdimensionRows,
      claritySummary,
      profileQualityGate,
    },
    summaryMarkdown: '',
  });

  return newRun;
}

export async function runAiSummaryForSavedRun(runId, { bypassQualityGate = false } = {}) {
  const run = await getAssessmentRunById(runId);
  if (!run) throw new Error('Saved run not found.');

  const savedResults = run.results_json || {};
  const archetypes = savedResults.archetypes || {};
  const subdimensions = Array.isArray(savedResults.subdimensionRows)
    ? savedResults.subdimensionRows
    : [];
  const intro = run.intro_answers_json || {};
  const claritySummary = savedResults.claritySummary || null;
  const profileQualityGate = calculateProfileQualityGate({
    archetypes,
    subdimensionRows: subdimensions,
    claritySummary,
  });

  if (!archetypes || !Object.keys(archetypes).length) {
    throw new Error('This saved run does not contain archetype data.');
  }

  if (!bypassQualityGate && profileQualityGate.shouldBlockAnalysis) {
    const err = new Error('PROFILE_QUALITY_GATE_BLOCKED');
    err.code = 'PROFILE_QUALITY_GATE_BLOCKED';
    err.profileQualityGate = profileQualityGate;
    throw err;
  }

  let response;

  try {
    response = await fetchAiSummary({
      archetypes,
      introResponses: intro,
      subdimensions,
    });
  } catch (err) {
    if (err?.code === 'REPORT_LIMIT_REACHED') {
      throw err;
    }
    throw err;
  }

  const newSummary = typeof response === 'string' ? response : response?.summary || '';
  const newAnalysisMeta =
    typeof response === 'object'
      ? response?.analysisMeta || response?.sectionSignals || null
      : null;

  const updatedRun = await updateAssessmentRun(runId, {
    summary_markdown: newSummary,
    output_version: OUTPUT_VERSION,
    results_json: {
      ...savedResults,
      analysisMeta: newAnalysisMeta,
      introName: intro?.name || '',
      subdimensionRows: Array.isArray(savedResults.subdimensionRows) ? savedResults.subdimensionRows : [],
      claritySummary,
      profileQualityGate,
      regeneratedAt: new Date().toISOString(),
    },
  });

  return updatedRun;
}
