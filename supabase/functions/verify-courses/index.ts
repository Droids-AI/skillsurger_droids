import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyCourseEvidence } from '../_shared/courseEvidence.ts';
const allowed = (Deno.env.get('WEBINAR_ALLOWED_ORIGINS') || 'https://skillsurger.com,https://www.skillsurger.com').split(',');
Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  if (!allowed.includes(origin)) return new Response('Forbidden', { status: 403 });
  const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin', 'Content-Type': 'application/json' };
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return new Response('{}', { status: 405, headers });
  try {
    const raw = await request.text();
    if (raw.length > 12000) return new Response('{}', { status: 413, headers });
    const body = JSON.parse(raw);
    if (!Array.isArray(body.urls) || body.urls.length > 10 || body.urls.some((url: unknown) => typeof url !== 'string' || url.length > 2000)) return new Response('{}', { status: 400, headers });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${Deno.env.get('RATE_LIMIT_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`));
    const key = 'courses:' + Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2,'0')).join('');
    const limit = await admin.rpc('webinar_rate_limit', { p_key: key });
    if (limit.error || !limit.data) return new Response('{}', { status: 429, headers });
    const resources = await Promise.all(body.urls.map((url: string) => verifyCourseEvidence(url)));
    return new Response(JSON.stringify({ resources }), { headers });
  } catch {
    console.error(JSON.stringify({ area: 'course-verification', code: 'verification_failed', requestId: crypto.randomUUID() }));
    return new Response('{}', { status: 500, headers });
  }
});
