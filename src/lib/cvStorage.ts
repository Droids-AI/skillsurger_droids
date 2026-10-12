import { supabase } from './supabase';

// Persist object paths, never public URLs or expiring bearer URLs.
export function cvObjectPath(reference: string): string {
  if (!reference.startsWith('http')) return reference;
  const url = new URL(reference);
  const expected = new URL(import.meta.env.VITE_SUPABASE_URL);
  if (url.origin !== expected.origin) throw new Error('Invalid CV storage reference. Please re-upload your CV.');
  const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/cvs\/(.+)$/);
  if (!match) throw new Error('Invalid CV storage reference. Please re-upload your CV.');
  return decodeURIComponent(match[1]);
}

export async function getCVSignedUrl(reference: string): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const path = cvObjectPath(reference);
  if (authError || !user || path.split('/')[0] !== user.id || path.includes('..')) throw new Error('You do not have access to this CV.');
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(path, 60);
  if (error || !data?.signedUrl) throw new Error('Could not open your CV. Please try again.');
  return data.signedUrl;
}
