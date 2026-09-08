import { supabase } from './supabaseClient';

function splitFullName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export async function syncProfileFromAuthUser(user, overrides = {}) {
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const fromFullName = splitFullName(metadata.full_name || metadata.name || '');

  const firstName =
    metadata.first_name ||
    metadata.firstName ||
    metadata.given_name ||
    fromFullName.firstName ||
    null;

  const lastName =
    metadata.last_name ||
    metadata.lastName ||
    metadata.family_name ||
    fromFullName.lastName ||
    null;

  const fullName =
    metadata.full_name ||
    metadata.name ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    null;

  const { data: existingProfile, error: existingError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const acceptingLegalNow =
    (overrides.accepted_terms === true && overrides.accepted_privacy === true) ||
    (metadata.accepted_terms === true && metadata.accepted_privacy === true);

  // Do not create a CareerDNA profile row until legal acceptance is confirmed.
  // This prevents Google OAuth users who cancel at the legal confirmation step
  // from leaving dormant, incomplete profiles in Supabase.
  if (!existingProfile && !acceptingLegalNow) {
    return null;
  }

  // Never overwrite existing CareerDNA profile details with blank OAuth metadata.
  // Google may not return names consistently, and an OAuth login should not erase
  // details originally entered through manual signup or later account editing.
  const nextFirstName = existingProfile?.first_name || firstName || null;
  const nextLastName = existingProfile?.last_name || lastName || null;
  const nextFullName =
    existingProfile?.full_name ||
    fullName ||
    [nextFirstName, nextLastName].filter(Boolean).join(' ') ||
    null;

  const payload = {
    id: user.id,
    email: existingProfile?.email || user.email || null,
    first_name: nextFirstName,
    last_name: nextLastName,
    full_name: nextFullName,
    accepted_terms: Boolean(overrides.accepted_terms ?? metadata.accepted_terms ?? existingProfile?.accepted_terms),
    accepted_privacy: Boolean(overrides.accepted_privacy ?? metadata.accepted_privacy ?? existingProfile?.accepted_privacy),
    legal_version: overrides.legal_version ?? metadata.legal_version ?? existingProfile?.legal_version ?? null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getMyProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function isCompleteProfile(profile) {
  return Boolean(profile?.accepted_terms && profile?.accepted_privacy);
}

export async function updateMyProfileDetails({ firstName = '', lastName = '', email = '' }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  const nextFirstName = String(firstName || '').trim();
  const nextLastName = String(lastName || '').trim();
  const nextEmail = String(user.email || email || '').trim();

  const authPayload = {
    data: {
      first_name: nextFirstName || null,
      last_name: nextLastName || null,
    },
  };

  const { error: authError } = await supabase.auth.updateUser(authPayload);
  if (authError) throw authError;

  const payload = {
    id: user.id,
    email: nextEmail,
    first_name: nextFirstName || null,
    last_name: nextLastName || null,
    full_name: [nextFirstName, nextLastName].filter(Boolean).join(' ') || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
