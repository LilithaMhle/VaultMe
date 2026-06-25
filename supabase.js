// Create a Supabase client using the CDN-provided `createClient` when available
const supabaseUrl = 'https://plcpbaxesvhurpcjpzlm.supabase.co';
const supabaseAnonKey = 'sb_publishable_iYcD2b7g3rVQ6EsJDVNf6g_9PrhT3S1';

(function(){
  const createClientFn = (typeof createClient !== 'undefined') ? createClient : (typeof supabase !== 'undefined' && supabase.createClient) ? supabase.createClient : null;
  if (!createClientFn) {
    console.error('Supabase createClient not found. Ensure the CDN script is loaded before this file.');
    return;
  }

  // Attach client to window so other scripts can use `supabase`
  window.supabase = createClientFn(supabaseUrl, supabaseAnonKey);

  // Helper: sign up a user and include profile metadata. Attempts sign-in afterwards.
  window.signUpWithProfile = async function(email, password, profile){
    const meta = {
      full_name: profile.name || '',
      role: profile.role || '',
      location: profile.location || '',
      linkedin: profile.linkedin || '',
      github: profile.github || '',
      bio: profile.bio || '',
      profile_photo: profile.profilePhoto || '',
      cv: profile.cv || '',
      cv_name: profile.cvName || ''
    };

    const { data, error } = await window.supabase.auth.signUp({ email, password }, { data: meta });
    if (error) return { error };

    // Try signing in to create a session (some Supabase projects auto-confirm)
    try { await window.supabase.auth.signInWithPassword({ email, password }); } catch(e) { /* ignore */ }

    return { data };
  };

})();