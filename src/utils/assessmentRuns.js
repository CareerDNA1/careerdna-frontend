import { supabase } from './supabaseClient';
import { fetchAiSummary } from './fetchAiSummary';
import { calculateProfileQualityGate } from './profileQualityGate';
import { OUTPUT_VERSION } from './outputVersion';
import { saveIdentityProfile } from './identityProfile';
import { calculateResults } from './calculateResults';
import { scoreSubdimensions } from './scoreSubdimensions';
import { computeClarityPercents } from './selfAwarenessSummary';
import { getBankQuestions, getBankWeights, runVersions, currentVersions } from './banks';
import { carryOverFavourites } from './favouriteCarryOver';
import { clearRunCache } from './savedItems';
import { getAcademicStatus, snapshotAnswers, stageFromAnswers } from './academicStatus';

// True when an answer set holds at least one answer. An empty object is not
// a survey: scoring it still yields a full set of zero scores, so every save
// path checks this rather than "is it an object".
export function hasSurveyAnswers(answers) {
  return Boolean(answers && typeof answers === 'object' && !Array.isArray(answers) && Object.keys(answers).length);
}

// Id of the user's newest run (slim query; no jsonb columns).
async function getLatestRunId(userId) {
  const { data, error } = await supabase
    .from('assessment_runs')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

// Re-score a run's saved answers with the question bank and scoring rules
// the run was answered on (bank_version / scoring_version, see utils/banks).
// Scores are never copied forward from an older run: a fix to the bank's
// matrix reaches every run of that bank the next time it is re-run or its
// report is generated, while a NEW bank never touches old runs. Returns null
// when the run has no usable answers (old runs).
export function rescoreRunFromAnswers(run) {
  const answers = run?.survey_answers_json;
  if (!answers || typeof answers !== 'object' || !Object.keys(answers).length) return null;
  const versions = runVersions(run);
  const QUESTIONS = getBankQuestions(versions.bank);
  const WEIGHTS = getBankWeights(versions.bank, versions.scoring);
  const { archetypeScores } = calculateResults(answers, QUESTIONS, WEIGHTS);
  if (!archetypeScores || !Object.keys(archetypeScores).length) return null;
  const subdimensionRows = scoreSubdimensions(answers, QUESTIONS);
  const claritySummary = computeClarityPercents(QUESTIONS, answers, {
    dimensionOrder: ['Who You Are', 'What You Love', 'What Matters', 'How You Work Best'],
  });
  return { archetypes: archetypeScores, subdimensionRows, claritySummary, versions };
}

// When the answers behind a run were given. Rows saved before 19 October 2026
// were backfilled by sql/13; the fallback covers anything the backfill missed.
export function surveyTakenAtOf(run) {
  return run?.survey_taken_at || run?.created_at || null;
}

// Number each distinct sitting of the survey ("Assessment 1, 2, 3 ...") in
// date order across a user's runs. Re-runs share a sitting, so they get the
// same number. Returns a map runId -> { number, takenAt, total }.
export function assessmentNumbersFor(runs) {
  const list = Array.isArray(runs) ? runs : [];
  const sittings = new Map(); // key -> takenAt ISO
  const keyOf = (run) => {
    const t = surveyTakenAtOf(run);
    // Rows from one sitting carry the same timestamp; round to the second so
    // a stray millisecond difference never splits a sitting in two.
    return t ? String(Math.floor(new Date(t).getTime() / 1000)) : `id:${run?.id}`;
  };
  list.forEach((run) => {
    const k = keyOf(run);
    if (!sittings.has(k)) sittings.set(k, surveyTakenAtOf(run));
  });
  const ordered = [...sittings.entries()].sort((a, b) => {
    const ta = a[1] ? new Date(a[1]).getTime() : 0;
    const tb = b[1] ? new Date(b[1]).getTime() : 0;
    return ta - tb;
  });
  const numberOfKey = new Map(ordered.map(([k], i) => [k, i + 1]));
  const out = {};
  list.forEach((run) => {
    const k = keyOf(run);
    out[run.id] = { number: numberOfKey.get(k), takenAt: sittings.get(k), total: ordered.length };
  });
  return out;
}

// Called the moment the last question is answered, before the results page
// exists, so a closed tab or a lost connection never loses a finished survey.
// Writes the answers plus the scores they produce under the current bank. The
// results page later finds this row by its survey nonce
// (findExistingRunForSurvey) and updates it with the full results and the
// report, so no second row is created. Never throws: a failure here must not
// stop the student reaching their results.
export async function saveSurveyAnswersOnFinish({ nonce = '', introAnswers = {}, surveyAnswers = {} } = {}) {
  try {
    if (!surveyAnswers || typeof surveyAnswers !== 'object' || !Object.keys(surveyAnswers).length) return null;
    const existing = await findExistingRunForSurvey({ nonce, surveyAnswers });
    if (existing?.id) return existing;
    const scored = rescoreRunFromAnswers({ survey_answers_json: surveyAnswers });
    return await saveAssessmentRun({
      introAnswers: introAnswers || {},
      surveyAnswers,
      resultsJson: {
        archetypes: scored?.archetypes || {},
        subdimensionRows: scored?.subdimensionRows || [],
        claritySummary: scored?.claritySummary || null,
        introName: introAnswers?.name || '',
        surveyNonce: String(nonce || ''),
        savedAt: 'survey_complete',
      },
      summaryMarkdown: '',
    });
  } catch (err) {
    console.warn('Could not save survey answers on finish:', err?.message || err);
    return null;
  }
}

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
  // Which bank the answers belong to. A fresh survey takes the current
  // versions; a re-run passes the versions of the run it came from.
  versions = null,
  // When the student finished answering. A fresh survey leaves this null
  // (stamped now); a re-run passes the sitting time of the run it came from,
  // so every report from one sitting shows the same assessment date.
  surveyTakenAt = null,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  // A report is never saved without the answers behind it. The one exception
  // is a new report made from an older report whose answers were lost (two
  // rows from September 2026): it carries that report's saved scores and
  // names it in answersMissingFrom. The database enforces the same rule.
  if (!hasSurveyAnswers(surveyAnswers) && !resultsJson?.answersMissingFrom) {
    throw new Error('This report could not be saved because the answers to the assessment are missing. Please take the assessment again.');
  }

  // The run whose favourites carry forward to this one: the run being re-run,
  // or, for a fresh sitting, the run the profile currently follows (falling
  // back to the newest). Resolved before the insert so "newest" is not the
  // run we are about to create.
  let carryFromId = resultsJson?.rerunOf || null;
  if (!carryFromId) {
    try { carryFromId = await getCurrentRunId(); } catch (_) { carryFromId = null; }
    if (!carryFromId) {
      try { carryFromId = await getLatestRunId(user.id); } catch (_) { carryFromId = null; }
    }
  }

  const stamp = { ...currentVersions(), ...(versions || {}) };
  const payload = {
    user_id: user.id,
    intro_answers_json: introAnswers || {},
    survey_answers_json: surveyAnswers || {},
    results_json: { ...(resultsJson || {}), versions: stamp },
    summary_markdown: summaryMarkdown || '',
    output_version: OUTPUT_VERSION,
    bank_version: stamp.bank,
    scoring_version: stamp.scoring,
    form: stamp.form,
    survey_taken_at: surveyTakenAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('assessment_runs')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  // Favourites follow the student: copy likes/dislikes from the previous run
  // onto this one (see utils/favouriteCarryOver). Awaited so the results page
  // that opens next already shows them; never fails the save.
  try {
    await carryOverFavourites({ fromRunId: carryFromId, toRunId: data.id, toStage: stageFromAnswers(introAnswers || {}) });
  } catch (e) {
    console.warn('Favourites carry-over failed:', e?.message || e);
  }

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

  // Compare answer SETS by value, so {value, weight} objects and plain
  // numbers compare equal.
  const answerKey = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    const keys = Object.keys(obj).sort();
    if (!keys.length) return '';
    return keys.map((k) => {
      const v = obj[k];
      const val = v && typeof v === 'object' && 'value' in v ? v.value : v;
      return `${k}=${String(val)}`;
    }).join('|');
  };
  const wanted = answerKey(surveyAnswers);

  // A row is the same survey only if its ANSWERS are the same. The session
  // key (nonce) alone is not enough: if a student starts a new survey without
  // the key rotating, matching on the key would overwrite the old run's
  // results while leaving its old answers in place, and every later re-run
  // would then score the wrong answers (seen 18 Oct 2026). A key match with
  // different answers is treated as a new survey.
  const cleanNonce = String(nonce || '').trim();
  if (cleanNonce && cleanNonce !== 'no-nonce') {
    const byNonce = rows.find((r) => String(r?.results_json?.surveyNonce || '') === cleanNonce);
    if (byNonce) {
      const stored = answerKey(byNonce.survey_answers_json);
      if (!wanted || !stored || stored === wanted) return byNonce;
      return null;
    }
  }
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
  // Saves made from the profile page look up the pinned report; forget the
  // cached one so the next save goes to this report straight away.
  clearRunCache();
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

// Every sitting of the survey the user has completed, oldest first, as
// { key, takenAt, number }. A report can be re-run (same answers, new output),
// so sittings are counted by survey_taken_at (sql/13), which re-runs inherit.
// Light query: three small columns for all of the user's runs.
export async function listAssessmentSittings() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return [];
  const { data, error } = await supabase
    .from('assessment_runs')
    .select('id, created_at, survey_taken_at')
    .eq('user_id', user.id)
    .limit(1000);
  if (error) throw error;
  const map = assessmentNumbersFor(data || []);
  const byKey = new Map();
  Object.values(map).forEach((v) => {
    if (!byKey.has(v.number)) byKey.set(v.number, { number: v.number, takenAt: v.takenAt });
  });
  return [...byKey.values()].sort((a, b) => a.number - b.number);
}

// The sitting a run belongs to, from a listAssessmentSittings() result.
export function assessmentOfRun(run, sittings) {
  const t = surveyTakenAtOf(run);
  if (!t || !Array.isArray(sittings)) return null;
  const sec = Math.floor(new Date(t).getTime() / 1000);
  return sittings.find((s) => s.takenAt && Math.floor(new Date(s.takenAt).getTime() / 1000) === sec) || null;
}

// Number of distinct surveys the user has completed.
export async function getDistinctSurveyCount() {
  const sittings = await listAssessmentSittings();
  return sittings.length;
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

  // Saved answers are never replaced by an empty set (that is how two reports
  // lost theirs in September 2026). The database enforces the same rule.
  const safePatch = { ...(patch || {}) };
  if ('survey_answers_json' in safePatch && !hasSurveyAnswers(safePatch.survey_answers_json)) {
    delete safePatch.survey_answers_json;
  }
  if (!Object.keys(safePatch).length) return null;

  const { data, error } = await supabase
    .from('assessment_runs')
    .update(safePatch)
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
  const hasSavedScores = (r) => Boolean(r?.results_json?.archetypes && Object.keys(r.results_json.archetypes).length);
  if (!hasSavedScores(run) && run.id) {
    const fetched = await getAssessmentRunById(run.id);
    if (fetched) fullRun = fetched;
  }
  // The latest assessment (profiles.latest_assessment) has no id of its own.
  // When it has neither answers nor saved scores, read the scores from the
  // report it came from, if that report still exists.
  if (!run.id && !hasSurveyAnswers(run.survey_answers_json) && !hasSavedScores(run) && run.fromRunId) {
    const source = await getAssessmentRunById(run.fromRunId).catch(() => null);
    if (source?.results_json) fullRun = { ...run, results_json: source.results_json };
  }

  const savedResults = fullRun.results_json || {};
  const rescored = rescoreRunFromAnswers(fullRun);
  const archetypes = rescored?.archetypes || savedResults.archetypes || {};

  if (!archetypes || !Object.keys(archetypes).length) {
    throw new Error('We could not find the answers or scores from your last assessment, so a new report cannot be made from it. Please take the assessment again.');
  }
  run = fullRun;
  // Answers lost (two reports from September 2026): the new report is built
  // from the saved scores and says which report they came from.
  const answersMissingFrom = hasSurveyAnswers(run.survey_answers_json)
    ? null
    : (savedResults.answersMissingFrom || run.id || run.fromRunId || 'unknown');

  // Where the person is comes from the profile (academic status), not from
  // the run being re-run and not from the caller: a re-run always produces a
  // report for the person as they are now. The run's own snapshot is only the
  // fallback for an account that has no saved status yet. Developer accounts
  // change their status through the Where you are card, which writes the
  // profile, so the same path serves them.
  let profileStatus = null;
  try { profileStatus = await getAcademicStatus(); } catch (_) { profileStatus = null; }
  const statusAnswers = snapshotAnswers(profileStatus);
  const intro = statusAnswers
    ? { ...(run.intro_answers_json || {}), ...statusAnswers }
    : { ...(run.intro_answers_json || {}), ...(updatedIntroAnswers || {}) };

  const subdimensionRows = rescored?.subdimensionRows
    || (Array.isArray(savedResults.subdimensionRows) ? savedResults.subdimensionRows : []);
  const claritySummary = rescored?.claritySummary || savedResults.claritySummary || null;
  const profileQualityGate = calculateProfileQualityGate({
    archetypes,
    subdimensionRows,
    claritySummary,
    surveyAnswers: run.survey_answers_json || null,
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
      ...(answersMissingFrom ? { answersMissingFrom } : {}),
    },
    summaryMarkdown: '',
    versions: runVersions(run),
    surveyTakenAt: surveyTakenAtOf(run),
  });

  return newRun;
}

export async function runAiSummaryForSavedRun(runId, { bypassQualityGate = false } = {}) {
  const run = await getAssessmentRunById(runId);
  if (!run) throw new Error('Saved run not found.');

  const savedResults = run.results_json || {};
  const rescored = rescoreRunFromAnswers(run);
  const archetypes = rescored?.archetypes || savedResults.archetypes || {};
  const subdimensions = rescored?.subdimensionRows
    || (Array.isArray(savedResults.subdimensionRows) ? savedResults.subdimensionRows : []);
  const intro = run.intro_answers_json || {};
  const claritySummary = rescored?.claritySummary || savedResults.claritySummary || null;
  const profileQualityGate = calculateProfileQualityGate({
    archetypes,
    subdimensionRows: subdimensions,
    claritySummary,
    surveyAnswers: run.survey_answers_json || null,
  });

  if (!archetypes || !Object.keys(archetypes).length) {
    throw new Error('This saved run does not contain archetype data.');
  }

  if ((!bypassQualityGate && profileQualityGate.shouldBlockAnalysis) || profileQualityGate.hardBlock) {
    const err = new Error('PROFILE_QUALITY_GATE_BLOCKED');
    err.code = 'PROFILE_QUALITY_GATE_BLOCKED';
    err.profileQualityGate = profileQualityGate;
    throw err;
  }

  let response;

  try {
    response = await fetchAiSummary({
      versions: runVersions(run),
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
      archetypes,
      analysisMeta: newAnalysisMeta,
      introName: intro?.name || '',
      subdimensionRows: subdimensions,
      claritySummary,
      profileQualityGate,
      regeneratedAt: new Date().toISOString(),
    },
  });

  return updatedRun;
}
