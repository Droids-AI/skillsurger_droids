// Receiver for the first-party Anchor test job (skillsurger.com/qa/test-job). Nothing reaches an employer.
// Accepts a submission only for an in-flight automated run that has used its one-time submit permission.
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const ORIGINS = ['https://skillsurger.com', 'https://www.skillsurger.com', 'http://localhost:5173', 'http://127.0.0.1:5173'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CV = 5 * 1024 * 1024;

const text = (form: FormData, key: string, max: number) => {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
};

export async function handle(request: Request): Promise<Response> {
  const origin = request.headers.get('origin') || '';
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin',
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (Number(request.headers.get('content-length') || 0) > MAX_CV + 64 * 1024) return json({ error: 'too_large' }, 413);
  let form: FormData;
  try { form = await request.formData(); } catch { return json({ error: 'invalid_form' }, 400); }
  const actionId = text(form, 'idempotency_key', 64);
  const fullName = text(form, 'full_name', 200), email = text(form, 'email', 320), phone = text(form, 'phone', 60);
  const coverNote = text(form, 'cover_note', 3000);
  const resume = form.get('resume');
  if (!UUID.test(actionId)) return json({ error: 'not_an_authorized_test_application' }, 403);
  if (!fullName || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !phone) return json({ error: 'missing_fields' }, 400);
  if (!(resume instanceof File) || resume.size < 5 || resume.size > MAX_CV) return json({ error: 'cv_required' }, 400);
  const bytes = new Uint8Array(await resume.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') return json({ error: 'cv_must_be_pdf' }, 400);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await admin.rpc('skillsurger_receive_test_application', {
    p_action_id: actionId, p_full_name: fullName, p_email: email, p_phone: phone, p_cover_note: coverNote, p_cv_sha256: digest, p_cv_bytes: bytes.length,
  });
  if (error) {
    if (String(error.message).includes('not_an_authorized_test_application')) return json({ error: 'not_an_authorized_test_application' }, 403);
    console.error(JSON.stringify({ area: 'skillsurger-test-board', code: 'receive_failed' }));
    return json({ error: 'request_failed' }, 503);
  }
  return json({ confirmation_reference: data, action_id: actionId });
}
if (import.meta.main) Deno.serve(handle);
