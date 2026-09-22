import { supabase } from './supabaseClient';

// Student academic profile (self-entered): GCSEs + predicted A-levels, stored as
// a jsonb `academic_profile` column on the Supabase `profiles` table. Used to
// personalise university matches (reach / match / safe). Optional; never gates
// the core CareerDNA experience.

// UCAS tariff points per A-level grade (used later for the reach/match/safe band).
export const ALEVEL_TARIFF = { 'A*': 56, A: 48, B: 40, C: 32, D: 24, E: 16 };
export const ALEVEL_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E'];
export const GCSE_GRADES = [9, 8, 7, 6, 5, 4, 3, 2, 1];

// Common A-level subject names for the picker (free text also allowed). Kept in
// step with the controlled vocabulary used by subject_requirements on the backend.
export const ALEVEL_SUBJECTS = [
  'Maths', 'Further Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Economics', 'Geography', 'History', 'English Literature', 'English Language',
  'Psychology', 'Sociology', 'Politics', 'Philosophy', 'Religious Studies',
  'Art & Design', 'Design & Technology', 'Media Studies', 'Film Studies', 'Music',
  'Music Technology', 'Drama & Theatre Studies', 'Dance', 'Physical Education',
  'Business', 'Law', 'French', 'Spanish', 'German', 'Latin', 'Statistics', 'Electronics',
];
export const GCSE_SUBJECTS = [
  'Maths', 'English Language', 'English Literature', 'Science (Combined)', 'Biology',
  'Chemistry', 'Physics', 'Geography', 'History', 'French', 'Spanish', 'Computer Science',
];

export function emptyAcademicProfile() {
  return {
    qualification_type: 'A-level',
    gcses: [],
    predicted_alevels: [],
    prediction_source: 'self',
    updated_at: null,
  };
}

// Total predicted UCAS tariff from the A-level grades entered.
export function predictedTariff(predicted = []) {
  return (Array.isArray(predicted) ? predicted : []).reduce(
    (sum, r) => sum + (ALEVEL_TARIFF[String(r?.grade || '').toUpperCase()] || 0),
    0
  );
}

export function hasAcademicData(ap) {
  if (!ap) return false;
  const g = Array.isArray(ap.gcses) ? ap.gcses.filter((x) => x && x.subject) : [];
  const a = Array.isArray(ap.predicted_alevels) ? ap.predicted_alevels.filter((x) => x && x.subject) : [];
  return g.length > 0 || a.length > 0;
}

// Resolve the signed-in user, retrying briefly. Right after a client-side
// navigation the Supabase session can take a moment to hydrate (or a concurrent
// auth token refresh briefly holds the lock), during which getUser() returns
// null. Without the retry the profile page would read "no grades" and wrongly
// show the roadmap step as not done / the grades card as empty.
async function resolveUser(retries = 3) {
  for (let i = 0; i <= retries; i += 1) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

export async function getMyAcademicProfile() {
  const user = await resolveUser();
  if (!user) return null;

  // One retry on a transient read error (e.g. token refresh mid-request).
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase
      .from('profiles')
      .select('academic_profile')
      .eq('id', user.id)
      .maybeSingle();
    if (!error) return data?.academic_profile || null;
    lastError = error;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw lastError;
}

export async function saveMyAcademicProfile(academicProfile) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  // Clean: drop empty rows, coerce grades, stamp source + date.
  const gcses = (Array.isArray(academicProfile?.gcses) ? academicProfile.gcses : [])
    .filter((r) => r && String(r.subject || '').trim())
    .map((r) => ({ subject: String(r.subject).trim(), grade: Number(r.grade) || null }));
  const predicted = (Array.isArray(academicProfile?.predicted_alevels) ? academicProfile.predicted_alevels : [])
    .filter((r) => r && String(r.subject || '').trim())
    .map((r) => ({ subject: String(r.subject).trim(), grade: String(r.grade || '').toUpperCase() || null }));

  const payload = {
    id: user.id,
    academic_profile: {
      qualification_type: academicProfile?.qualification_type || 'A-level',
      gcses,
      predicted_alevels: predicted,
      prediction_source: 'self',
      updated_at: new Date().toISOString().slice(0, 10),
    },
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('academic_profile')
    .single();

  if (error) throw error;
  return data?.academic_profile || null;
}
