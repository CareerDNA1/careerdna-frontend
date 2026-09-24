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

  // A fresh assessment becomes the current report. A rerun (same answers, new
  // output) only takes over if the run it came from was the current one.
  try {
    const parentId = resultsJson?.rerunOf || null;
    if (!parentId) {
      await setCurrentRunId(data.id);
    } else {
      const pinned = await getCurrentRunId();
      if (!pinned || pinned === parentId) await setCurrentRunId(data.id);
    }
  } catch (e) {
    console.warn('Current run update failed:', e?.message || e);
  }

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

// Find a run this user already saved for the SAME survey, so re-opening the
// results (new browser session, after upgrading, weeks later) updates that run
// instead of inserting a second copy. Matches on the survey nonce stamped into
// results_json, and falls back to identical survey answers for older runs.
export async function findExistingRunForSurvey({ nonce = '', surveyAnswers = null } = {}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from('assessment_runs')
    .select('id, created_at, results_json, survey_answers_json')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];

  const cleanNonce = String(nonce || '').trim();
  if (cleanNonce && cleanNonce !== 'no-nonce') {
    const byNonce = rows.find((r) => String(r?.results_json?.surveyNonce || '') === cleanNonce);
    if (byNonce) return byNonce;
  }

  const answerKey = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const keys = Object.keys(obj).sort();
    if (!keys.length) return '';
    return keys.map((k) => `${k}=${String(obj[k])}`).join('|');
  };
  const wanted = answerKey(surveyAnswers);
  if (!wanted) return null;
  return rows.find((r) => answerKey(r?.survey_answers_json) === wanted) || null;
}

// ---- Current report ----
// The profile page follows one "current" run: journey card, favourites, tiles
// and the advisor's grounding. profiles.current_run_id holds a pinned choice;
// NULL means "the newest run".
export async function setCurrentRunId(runId) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');
  const { error } = await supabase
    .from('profiles')
    .update({ current_run_id: runId || null })
    .eq('id', user.id);
  if (error) throw error;
  return true;
}

export async function getCurrentRunId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('current_run_id')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.current_run_id || null;
}

// The run the profile should follow: the pinned one if it still exists,
// otherwise the newest.
export async function getCurrentAssessmentRun(pinnedId = undefined) {
  let id = pinnedId;
  if (id === undefined) {
    try { id = await getCurrentRunId(); } catch (_) { id = null; }
  }
  if (id) {
    const run = await getAssessmentRunById(id);
    if (run) return run;
  }
  return getLatestAssessmentRun();
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

// `columns` lets callers fetch only the fields they need. The profile page, for
// example, only lists run dates/status, so it skips the heavy jsonb/markdown
// columns (results_json, summary_markdown, survey_answers_json) which otherwise
// balloon the payload to megabytes across 20 runs and make the page crawl.
export async function listAssessmentRuns(limit = 20, columns = '*') {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return [];

  const { data, error } = await supabase
    .from('assessment_runs')
    .select(columns)
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

// Number of distinct surveys the user has completed. A report can be re-run
// (same answers, new output), so distinct surveys are counted by the survey
// nonce stamped into results_json, falling back to a hash of the answers for
// runs saved before the nonce existed.
export async function getDistinctSurveyCount() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return 0;
  const { data, error } = await supabase
    .from('assessment_runs')
    .select('id, survey_answers_json')
    .eq('user_id', user.id)
    .limit(1000);
  if (error) throw error;
  const keys = new Set();
  (data || []).forEach((r) => {
    const a = r?.survey_answers_json;
    if (a && typeof a === 'object' && Object.keys(a).length) {
      keys.add('a:' + Object.keys(a).sort().map((k) => `${k}=${String(a[k])}`).join('|'));
    } else {
      keys.add(`id:${r?.id}`);
    }
  });
  return keys.size;
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

  // The profile lists runs with a slim payload (no results_json) for speed, so a
  // run object passed in from the list may not carry its archetypes. Fetch the
  // full row by id when they're missing.
  let fullRun = run;
  if ((!run.results_json || !run.results_json.archetypes || !Object.keys(run.results_json.archetypes).length) && run.id) {
    const fetched = await getAssessmentRunById(run.id);
    if (fetched) fullRun = fetched;
  }

  const savedResults = fullRun.results_json || {};
  const archetypes = savedResults.archetypes || {};

  if (!archetypes || !Object.keys(archetypes).length) {
    throw new Error('This saved run does not contain archetype data.');
  }
  run = fullRun;

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
      rerunOf: run.id || null,
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
