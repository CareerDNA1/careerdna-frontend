import { supabase } from './supabaseClient';
import { deriveEducationStage, currentSchoolYear, universityYear, academicStartYear } from './educationProgression';
import HE from '../data/institutions_he.json';
import SCHOOLS from '../data/institutions_schools.json';

// Academic status: where the person is, stored ONCE on the profile.
//
// The answers keep the shape the app has always used for the survey's intro
// questions (status, institution, schoolYear, planUniversity, schoolScope,
// schoolSubjects, uniSubject, courseYear, courseStartYear, uniNeed, country,
// dateOfBirth, age, name), so the report pipeline, the results page and the
// backend read exactly what they read before. The difference is where it
// lives: on `profiles.academic_status` instead of on every run. A run keeps a
// read-only snapshot in intro_answers_json at the moment it is created.
//
// Every change writes a row to education_events (the person's timeline).
//
// Country, status, year group and course start year are set when the person
// joins, move on by themselves each September and are never changed by the
// person (support does it). School or university can be changed once per
// academic year. Plans and subjects are free. The rule is enforced by a
// database trigger (sql/21); the form greys the fields out to match.

export const STAGES = ['school', 'university', 'apprenticeship', 'gap_year', 'working', 'other'];

const STATUS_COLUMNS =
  'id, plan, is_developer, date_of_birth, country, identity_correction_used, course_start_year, ' +
  'academic_status, stage, institution_name, institution_id, subject_interest, intended_route, ' +
  'course_length_years, stage_correction_used, status_confirmed_year, onboarding_completed_at, institution_changed_year, status_changed_year';

async function currentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user || null;
}

export async function getAcademicStatus() {
  const user = await currentUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select(STATUS_COLUMNS).eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data || null;
}

// Developer mode is exactly profiles.is_developer (set by sql/18 from the
// accounts with the Developer badge, changed only in the database). It is
// independent of plan, so a developer can test Premium with the locks off.
export function isDeveloperProfile(profile) {
  return profile?.is_developer === true;
}

// Map the intro-shaped answers to the stage column.
export function stageFromAnswers(a = {}) {
  const s = String(a?.status || '');
  if (s === 'school') return 'school';
  if (s === 'undergraduate' || s === 'postgraduate') return 'university';
  if (s === 'other') return 'other';
  return null;
}

function routeFromAnswers(a = {}) {
  if (String(a?.status || '') !== 'school') return null;
  if (a.planUniversity === 'yes') return 'university';
  if (a.planUniversity === 'no') return 'apprenticeship';
  return 'undecided';
}

function subjectFromAnswers(a = {}) {
  if (a?.uniSubject) return String(a.uniSubject);
  if (Array.isArray(a?.schoolSubjects) && a.schoolSubjects.length) return String(a.schoolSubjects[0]);
  return null;
}

// Fields that are a transition (stage change) vs an ordinary edit, for the
// event kind. Used by the Where you are card to label the timeline.
export function classifyChange(prev = {}, next = {}) {
  const ps = stageFromAnswers(prev);
  const ns = stageFromAnswers(next);
  if (ps && ns && ps !== ns) return 'transition';
  if ((prev.institution || '') !== (next.institution || '')) return 'moved_institution';
  if (subjectFromAnswers(prev) !== subjectFromAnswers(next)) return 'changed_subject';
  if (routeFromAnswers(prev) !== routeFromAnswers(next)) return 'changed_route';
  if ((prev.courseYear || '') !== (next.courseYear || '') || (prev.uniNeed || '') !== (next.uniNeed || '') || (prev.schoolScope || '') !== (next.schoolScope || '')) return 'changed_course';
  return null;
}

// Save the whole status. `kind` labels the event; `source` says where the
// change came from (onboarding, profile_card, checkin, developer).
export async function saveAcademicStatus(answers, { source = 'profile_card', kind = null, useCorrection = false, markOnboarded = false } = {}) {
  const user = await currentUser();
  if (!user) throw new Error('User not authenticated.');
  const current = await getAcademicStatus();
  const prev = (current && current.academic_status) || {};
  const next = { ...answers };
  // Year group: the form shows this year's value (chosen year + Septembers
  // since). If that is what came back, keep the original choice and its
  // year so nothing looks changed; if the person picked another year, the
  // choice is dated today and the clock starts again.
  if (next.status === 'school' && next.schoolYear) {
    const shownNow = currentSchoolYear(prev.schoolYear, prev.schoolYearSetYear);
    if (prev.schoolYear && shownNow != null && `year${shownNow}` === String(next.schoolYear)) {
      next.schoolYear = prev.schoolYear;
      next.schoolYearSetYear = prev.schoolYearSetYear || academicStartYear();
    } else {
      next.schoolYearSetYear = academicStartYear();
    }
  } else {
    delete next.schoolYearSetYear;
  }
  const eventKind = kind || classifyChange(prev, next) || (markOnboarded ? 'onboarded' : null);

  const patch = {
    academic_status: next,
    stage: stageFromAnswers(next),
    institution_name: next.institution ? String(next.institution).trim() : null,
    institution_id: next.institutionId || null,
    subject_interest: subjectFromAnswers(next),
    intended_route: routeFromAnswers(next),
    course_start_year: next.courseStartYear ? Number(next.courseStartYear) : (current?.course_start_year || null),
  };
  if (next.country) patch.country = next.country;
  if (useCorrection) patch.stage_correction_used = true;
  if (markOnboarded) patch.onboarding_completed_at = new Date().toISOString();

  const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select(STATUS_COLUMNS).single();
  if (error) {
    const msg = String(error.message || '');
    const locked = [
      ['COUNTRY_LOCKED', 'You set your country when you joined. To change it, email support@mycareerdna.io.'],
      ['STATUS_LOCKED', 'Your status can be updated once in a new school year, from September. If something has changed before then, email support@mycareerdna.io.'],
      ['FACTS_LOCKED', 'Your year group is set when you join and moves up each September. If it is wrong, email support@mycareerdna.io.'],
      ['INSTITUTION_LOCKED', 'Your school or university can be changed once each school year, and it has already been changed this year. If you have moved again, email support@mycareerdna.io.'],
    ].find(([code]) => msg.includes(code));
    if (locked) { const e = new Error(locked[1]); e.code = locked[0]; throw e; }
    throw error;
  }

  if (eventKind) {
    try {
      await supabase.from('education_events').insert({
        user_id: user.id,
        kind: eventKind,
        from_stage: stageFromAnswers(prev),
        to_stage: stageFromAnswers(next),
        details: { before: prev, after: next },
        source,
      });
    } catch (_) { /* the status is saved; the timeline row is best effort */ }
  }
  return data;
}

export async function markStatusConfirmed() {
  const user = await currentUser();
  if (!user) return null;
  const year = academicYearStart();
  const { data, error } = await supabase.from('profiles').update({ status_confirmed_year: year }).eq('id', user.id).select(STATUS_COLUMNS).single();
  if (error) throw error;
  try {
    await supabase.from('education_events').insert({ user_id: user.id, kind: 'confirmed', details: { year }, source: 'checkin' });
  } catch (_) { /* best effort */ }
  return data;
}

export async function listEducationEvents(limit = 50) {
  const user = await currentUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('education_events')
    .select('id, kind, from_stage, to_stage, details, effective_from, source, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export function academicYearStart(asOf = new Date()) {
  return asOf.getMonth() + 1 >= 9 ? asOf.getFullYear() : asOf.getFullYear() - 1;
}

// Plain-language description of where the person is now, derived from the
// stored status and today's date (so it advances by itself each September).
export function describeStatus(profile) {
  const a = (profile && profile.academic_status) || {};
  const stage = profile?.stage || stageFromAnswers(a);
  const dob = profile?.date_of_birth || a.dateOfBirth || null;
  const inst = profile?.institution_name || a.institution || '';
  if (stage === 'university') {
    const start = profile?.course_start_year || a.courseStartYear || null;
    const yr = start ? universityYear(start) : (a.courseYear || null);
    const level = a.status === 'postgraduate' ? 'Postgraduate' : 'Undergraduate';
    const bits = [`${level}${yr ? `, year ${yr}` : ''}`];
    if (inst) bits.push(`at ${inst}`);
    if (a.uniSubject) bits.push(`studying ${a.uniSubject}`);
    return { stage, headline: bits.join(' '), year: yr, phase: 'undergraduate' };
  }
  if (stage === 'school') {
    const yr = currentSchoolYear(a.schoolYear, a.schoolYearSetYear);
    const d = deriveEducationStage({ educationLevel: 'school', dob });
    if (yr) d.phase = yr > 13 ? 'left_education' : yr >= 12 ? 'sixth_form' : yr >= 10 ? 'gcse' : yr === 9 ? 'choosing_gcse' : 'pre_gcse';
    const yearText = yr ? (yr > 13 ? 'Finished school' : `Year ${yr}`) : 'At school';
    const bits = [yearText];
    if (inst) bits.push(`at ${inst}`);
    const subj = subjectFromAnswers(a);
    if (subj) bits.push(`interested in ${subj}`);
    const route = routeFromAnswers(a);
    if (route === 'university') bits.push('thinking about university');
    else if (route === 'apprenticeship') bits.push('thinking about an apprenticeship or work');
    return { stage, headline: bits.join(', ').replace(', at', ' at'), year: yr, phase: d.phase };
  }
  if (stage === 'other') return { stage, headline: a.currentActivity ? String(a.currentActivity) : 'Not in school or university', year: null, phase: 'other' };
  return { stage: stage || null, headline: '', year: null, phase: null };
}

// Whether the yearly check-in is due: first visit on or after 1 September
// that has not been confirmed for this academic year, or (university) on or
// after 1 July of the final year of the course.
export function checkinDue(profile, asOf = new Date()) {
  if (!profile || !profile.onboarding_completed_at) return false;
  const year = academicYearStart(asOf);
  if ((profile.status_confirmed_year || 0) < year) return true;
  if (profile.stage === 'university' && profile.course_start_year && profile.course_length_years) {
    const finalYearEnd = new Date(Number(profile.course_start_year) + Number(profile.course_length_years), 6, 1); // 1 July
    if (asOf >= finalYearEnd && (profile.status_confirmed_year || 0) < year + 1) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Institution lookup (UK). Universities and HE colleges from Discover Uni;
// schools, sixth form and FE colleges from the DfE register once
// scripts/build_schools_lookup.js has been run. Free text is always allowed.
const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const HE_ITEMS = Array.isArray(HE?.items) ? HE.items : [];
const SCHOOL_ITEMS = Array.isArray(SCHOOLS?.items) ? SCHOOLS.items : [];

export function hasSchoolLookup() { return SCHOOL_ITEMS.length > 0; }

// kind: 'school' (schools + sixth form + FE colleges) or 'he' (universities +
// HE colleges). Matches the start of the name or of any word in it, like the
// subject search, so "read" finds "University of Reading".
export function searchInstitutions(query, kind = 'he', limit = 12) {
  const q = norm(query);
  const pool = kind === 'school' ? SCHOOL_ITEMS : HE_ITEMS;
  if (!q) return [];
  const words = q.split(' ');
  const scored = [];
  for (const it of pool) {
    const n = norm(it.name);
    const t = norm(it.town);
    let score = 0;
    const nameWords = n.split(' ');
    const townWords = t.split(' ');
    if (n.startsWith(q)) score = 4;
    else if (words.every((w) => nameWords.some((nw) => nw.startsWith(w)))) score = 3;
    else if (words.every((w) => nameWords.some((nw) => nw.startsWith(w)) || townWords.some((tw) => tw.startsWith(w)))) score = 2;
    else if (n.includes(q)) score = 1;
    // Universities above colleges on equal matches ("read" should give the
    // University of Reading before a college in Reading).
    if (score && it.kind === 'university') score += 0.5;
    if (score) scored.push({ score, it });
  }
  scored.sort((a, b) => b.score - a.score || a.it.name.localeCompare(b.it.name));
  return scored.slice(0, limit).map(({ it }) => ({ ...it, label: it.town ? `${it.name} (${it.town})` : it.name }));
}

// Status (school / university): once in a new academic year, never in the
// year the person joined.
export function canChangeStatus(profile, asOf = new Date()) {
  if (!profile) return false;
  if (isDeveloperProfile(profile)) return true;
  if (!profile.onboarding_completed_at) return true;
  const joined = profile.status_changed_year || academicYearStart(new Date(profile.onboarding_completed_at));
  return joined < academicYearStart(asOf);
}

// School or university: one self-service change per academic year.
export function canChangeInstitution(profile, asOf = new Date()) {
  if (!profile) return false;
  if (isDeveloperProfile(profile)) return true;
  if (!profile.onboarding_completed_at) return true;
  return (profile.institution_changed_year || 0) !== academicYearStart(asOf);
}

// The answers as they stand today, for a run's read-only snapshot and for
// seeding the survey: year group and university year moved on to this
// academic year, date of birth and country from the profile columns.
export function snapshotAnswers(profile) {
  const a = profile?.academic_status && typeof profile.academic_status === 'object' ? profile.academic_status : null;
  if (!a) return null;
  const out = {
    ...a,
    dateOfBirth: profile.date_of_birth || a.dateOfBirth || '',
    country: a.country || profile.country || '',
  };
  if (a.status === 'school') out.schoolYear = schoolYearValue(a) || a.schoolYear;
  const start = profile.course_start_year || a.courseStartYear;
  if ((a.status === 'undergraduate' || a.status === 'postgraduate') && start) {
    const yr = universityYear(start);
    if (yr && yr >= 1 && yr <= 7) out.courseYear = yr;
  }
  return out;
}

// The year group to show in a form: this year's value as "yearN".
export function schoolYearValue(a = {}) {
  const yr = currentSchoolYear(a?.schoolYear, a?.schoolYearSetYear);
  return yr && yr >= 10 && yr <= 13 ? `year${yr}` : (a?.schoolYear || '');
}
