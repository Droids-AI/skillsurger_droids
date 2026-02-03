import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep session detection for OAuth callbacks
    detectSessionInUrl: true,
    // Use PKCE flow for OAuth
    flowType: 'pkce',
    // Persist session in localStorage
    persistSession: true,
    // Keep auto refresh enabled but with visibility handling
    autoRefreshToken: true,
    // Use default storage key
    storageKey: 'supabase.auth.token',
    // CRITICAL: Prevent automatic session refresh when page becomes visible
    // This stops the page from triggering auth state changes on tab switch
    debug: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
});