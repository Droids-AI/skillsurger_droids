import { createClient } from 'npm:@supabase/supabase-js@2';
import { validateAudit } from '../_shared/auditValidation.ts';
import { sendLeadConfirmation } from '../_shared/leadConfirmation.ts';

const origins = (Deno.env.get('WEBINAR_ALLOWED_ORIGINS') || 'https://skillsurger.com,https://www.skillsurger.com').split(',');
Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  if (!origins.includes(origin)) return new Response('Forbidden', { status: 403 });
  const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const reference = crypto.randomUUID();
  try {
    const raw = await request.text();
    if (raw.length > 20000) return respond({ error: 'Request too large' }, 413);
    let input;
    try { input = JSON.parse(raw); } catch { return respond({ error: 'Invalid request' }, 400); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return respond({ error: 'Invalid request' }, 400);
    const errors = validateAudit(input);
    if (!/^[a-f0-9-]{36}$/i.test(String(input.requestId || ''))) errors.submit = 'Please retry your request.';
    if (Object.keys(errors).length) return respond({ errors }, 400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${Deno.env.get('RATE_LIMIT_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`));
    const key = 'audit:' + Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
    const limit = await admin.rpc('webinar_rate_limit', { p_key: key });
    if (limit.error) throw new Error('rate_limit_failed');
    if (!limit.data) return respond({ error: 'Too many attempts. Please retry in 10 minutes.' }, 429);
    const fields = ['fullName', 'email', 'phoneNumber', 'currentRole', 'targetRole', 'yearsOfExperience', 'currentCTC', 'expectedCTC', 'noticePeriodStatus', 'linkedinUrl', 'jobDescription', 'resumeStoragePath'];
    const payload: Record<string, unknown> = Object.fromEntries(fields.map(key => [key, String(input[key] || '').trim()]));
    payload.email = String(payload.email).toLowerCase();
    payload.phoneNumber = String(payload.phoneNumber).replace(/[\s()-]/g, '');
    payload.timestamp = new Date().toISOString();
    const result = await admin.rpc('register_resume_audit', { p_request_id: input.requestId, p_payload: payload });
    if (result.error) throw new Error('audit_persistence_failed');
    const emailStatus = await sendLeadConfirmation(admin, {
      leadId: result.data.leadId, email: String(payload.email), name: String(payload.fullName),
      subject: 'Your Skillsurger resume audit request is received',
      body: `Hi ${payload.fullName},\n\nWe have received your resume audit request. We’ll review structure, keywords, ATS readability, and role fit.\n\nYou can book a career diagnosis call at https://skillsurger.com/book-a-call or contact us at https://skillsurger.com/contact.\n\nTeam Skillsurger`,
    });
    if (!result.data.alreadyRegistered) {
      const sync = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sheets-sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, formType: 'resume_audit' }), signal: AbortSignal.timeout(15000) }).catch(() => {});
      const runtime = (globalThis as any).EdgeRuntime;
      if (runtime?.waitUntil) runtime.waitUntil(sync); else await sync;
    }
    return respond({ leadId: result.data.leadId, emailStatus });
  } catch {
    console.error(JSON.stringify({ area: 'resume-audit', code: 'request_failed', reference }));
    return respond({ error: 'We could not save your audit request. Please try again.', reference }, 500);
  }
});
