import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let pendingRecoveryCallback = false;
try {
  // Older auth-js versions drop redirectType during an automatic PKCE exchange.
  // Capture only the recovery verifier before that exchange consumes it.
  const verifier = JSON.parse(localStorage.getItem('supabase.auth.token-code-verifier') || 'null');
  pendingRecoveryCallback = location.pathname === '/reset-password' && new URLSearchParams(location.search).has('code') && typeof verifier === 'string' && /\/(?:recovery|PASSWORD_RECOVERY)$/.test(verifier);
} catch { /* PASSWORD_RECOVERY remains the normal callback path. */ }

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
// Capture recovery even if the auth client finishes before the route mounts.
supabase.auth.onAuthStateChange((event, session) => {
  try {
    if ((event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && pendingRecoveryCallback)) && session) {
      pendingRecoveryCallback = false;
      sessionStorage.setItem('skillsurger-recovery', JSON.stringify({ userId: session.user.id, expires: Date.now() + 3600000 }));
    } else if (event === 'SIGNED_OUT') sessionStorage.removeItem('skillsurger-recovery');
  } catch { /* The live PASSWORD_RECOVERY event still works without storage. */ }
});
