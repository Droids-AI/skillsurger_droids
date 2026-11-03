import { supabase } from './supabase';
import axios from 'axios';

// Payment/subscription callers intentionally keep VITE_BACKEND_API.
export const SKILLSURGER_API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skillsurger-api`;
export async function skillsurgerApiHeaders(publicRequest = false): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!publicRequest && !session?.access_token) throw new Error('Please sign in to use this feature.');
  return {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
}

export const skillsurgerHttp = axios.create();
skillsurgerHttp.interceptors.request.use(async config => {
  config.headers.set(await skillsurgerApiHeaders());
  return config;
});
