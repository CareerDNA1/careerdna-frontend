import { supabase } from './supabaseClient';

export async function syncProfileFromAuthUser(user) {
  if (!user) return null;

  const firstName =
    user.user_metadata?.first_name ||
    user.user_metadata?.firstName ||
    null;

  const lastName =
    user.user_metadata?.last_name ||
    user.user_metadata?.lastName ||
    null;

  const payload = {
    id: user.id,
    email: user.email || null,
    first_name: firstName,
    last_name: lastName,
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
    .single();

  if (error) throw error;
  return data;
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
  const nextEmail = String(email || '').trim();

  if (!nextEmail) {
    throw new Error('Please enter an email address.');
  }

  const authPayload = {
    data: {
      first_name: nextFirstName || null,
      last_name: nextLastName || null,
    },
  };

  if (nextEmail.toLowerCase() !== String(user.email || '').trim().toLowerCase()) {
    authPayload.email = nextEmail;
  }

  const { error: authError } = await supabase.auth.updateUser(authPayload);
  if (authError) throw authError;

  const payload = {
    id: user.id,
    email: nextEmail,
    first_name: nextFirstName || null,
    last_name: nextLastName || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
