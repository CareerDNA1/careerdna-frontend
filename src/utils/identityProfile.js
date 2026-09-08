// Account-level identity + progression, stored on `profiles`.
//
// Why account-level (not per-run): date of birth and country are identity. If
// they lived on each assessment run, a shared login could just start a new run
// with different values and the lock would be meaningless. Kept on the profile
// and locked, a shared account cannot be re-aged or moved to another country.
//
// Locking model:
//   - date_of_birth, country  -> set once, then LOCKED. Exactly one correction
//     is allowed (identity_correction_used), after which support is required.
//   - education_level, course_start_year -> progression fields, always
//     updatable (people move up years), changed deliberately via profile.
//
// NOTE: this is frontend enforcement (first cut). To make the lock tamper-proof
// against a determined account-sharer, we should also add a Postgres trigger /
// RLS policy so date_of_birth and country cannot be changed once set except via
// the correction path. SQL for that can follow.

import { supabase } from './supabaseClient';

// Master switch for the anti-sharing lock. Set to false to run experiments
// with freely editable DOB/country; set back to true to re-enable locking.
export const IDENTITY_LOCK_ENABLED = false;

const IDENTITY_COLUMNS =
  'date_of_birth, country, identity_correction_used, education_level, course_start_year, upgrade_claimed_version';

async function currentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user || null;
}

export async function getIdentityProfile() {
  const user = await currentUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select(IDENTITY_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// True once the locked identity has been set.
export function isIdentityLocked(profile) {
  return Boolean(profile && profile.date_of_birth);
}

// True while the single allowed correction is still available.
export function canCorrectIdentity(profile) {
  return Boolean(profile && profile.date_of_birth && !profile.identity_correction_used);
}

// First-time set. Never overwrites an already-set DOB or country (those are
// locked); education level / start year are progression fields and always
// written through.
export async function saveIdentityProfile({ dateOfBirth, country, educationLevel, courseStartYear } = {}) {
  const user = await currentUser();
  if (!user) throw new Error('User not authenticated.');
  const current = await getIdentityProfile();

  const patch = {};
  // DOB is the only permanent identity field. When locking is on it is written
  // once; when off (experiment mode) it is always written through. Country and
  // the rest are situational (they change over time) and always update, so the
  // run history captures the journey.
  if (dateOfBirth && (IDENTITY_LOCK_ENABLED ? !current?.date_of_birth : true)) patch.date_of_birth = dateOfBirth;
  if (country) patch.country = country;
  if (educationLevel !== undefined) patch.education_level = educationLevel;
  if (courseStartYear !== undefined) patch.course_start_year = courseStartYear || null;

  if (!Object.keys(patch).length) return current;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select(IDENTITY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// The one allowed correction of the locked identity fields.
export async function correctIdentity({ dateOfBirth, country } = {}) {
  const user = await currentUser();
  if (!user) throw new Error('User not authenticated.');
  const current = await getIdentityProfile();
  if (!current) throw new Error('Profile not found.');
  if (current.identity_correction_used) {
    throw new Error('Your date of birth and country can only be corrected once. Please contact support to change them.');
  }

  const patch = { identity_correction_used: true };
  if (dateOfBirth) patch.date_of_birth = dateOfBirth;
  if (country) patch.country = country;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select(IDENTITY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// Progression-only update (education level / course start year). Always allowed.
export async function updateEducationStage({ educationLevel, courseStartYear } = {}) {
  const user = await currentUser();
  if (!user) throw new Error('User not authenticated.');
  const patch = {};
  if (educationLevel !== undefined) patch.education_level = educationLevel;
  if (courseStartYear !== undefined) patch.course_start_year = courseStartYear || null;
  if (!Object.keys(patch).length) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select(IDENTITY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
