// Supabase Edge Function: webinar-reminders
//
// Runs on a schedule (pg_cron, every 10 minutes) and sends the webinar follow-up
// sequence. The confirmation at registration is sent by register-webinar.
//   reminder_24h   24h before start           WhatsApp + email
//   reminder_1h    1h before start            WhatsApp + email
//   post_event     within 2h after the end    WhatsApp + email (summary + enrolment info)
//   next_day       next morning               WhatsApp
//   final_reminder 48–72h after the end       WhatsApp (final cohort reminder)
// WhatsApp goes only to registrants who ticked consent and have not replied STOP.
// Post-event messages skip anyone who has already paid. Each send is claimed in
// public.webinar_reminders first, so nothing is sent twice.
//
// Secrets:
//   WEBINAR_REMINDERS_SECRET     shared with the cron job (x-cron-secret header)
//   WHATSAPP_REMINDER_TEMPLATES  JSON {"reminder_24h":"<approved template>",...}; a stage
//                                without a template sends no WhatsApp. Each template takes
//                                {{1}} first name, {{2}} schedule, {{3}} link.
//   WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_GRAPH_VERSION, WHATSAPP_TEMPLATE_LANGUAGE
//   WEBINAR_JOIN_URL             meeting link for the pre-event reminders
//   WEBINAR_EMAIL_ENABLED=true, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_EMAIL_FROM
// POST {"dryRun":true} returns who would be messaged without sending anything.
import { createClient } from 'npm:@supabase/supabase-js@2';

const sessionId = 'job-switch-2026-10-24';
const startsAt = Date.parse('2026-10-24T15:00:00+05:30');
const endsAt = Date.parse('2026-10-24T16:00:00+05:30');
const schedule = 'Saturday, 24 October 2026 at 3:00 PM IST';
const groupUrl = 'https://chat.whatsapp.com/L3kJ4PBEKDH6PADvfqYXwE';
const programmeUrl = 'https://skillsurger.com/job-switch-copilot#programme';
const HOUR = 60 * 60 * 1000;
const BATCH = 150;

type Stage = 'reminder_24h' | 'reminder_1h' | 'post_event' | 'next_day' | 'final_reminder';
const STAGES: { stage: Stage; from: number; until: number; email: boolean; postEvent: boolean }[] = [
  { stage: 'reminder_24h', from: startsAt - 24 * HOUR, until: startsAt - HOUR, email: true, postEvent: false },
  { stage: 'reminder_1h', from: startsAt - HOUR, until: startsAt, email: true, postEvent: false },
  { stage: 'post_event', from: endsAt, until: endsAt + 2 * HOUR, email: true, postEvent: true },
  { stage: 'next_day', from: endsAt + 18 * HOUR, until: endsAt + 30 * HOUR, email: false, postEvent: true },
  { stage: 'final_reminder', from: endsAt + 48 * HOUR, until: endsAt + 72 * HOUR, email: false, postEvent: true },
];

function emailFor(stage: Stage, name: string, joinUrl: string): { subject: string; body: string } | null {
  const footer = `\n\nYou are receiving this because you registered for the free Skillsurger job switch webinar. Reply to this email if you no longer want reminders.\n\nTeam Skillsurger`;
  if (stage === 'reminder_24h') return {
    subject: 'Tomorrow: your Skillsurger job switch webinar',
    body: `Hi ${name},\n\nThe free job switch webinar is tomorrow, ${schedule}, for 60 minutes.\n\nJoin link: ${joinUrl}\nWhatsApp group: ${groupUrl}\n\nBefore you join, keep your resume handy and note 2–3 roles you want next.${footer}`,
  };
  if (stage === 'reminder_1h') return {
    subject: 'Starting in 1 hour: Skillsurger job switch webinar',
    body: `Hi ${name},\n\nWe start in one hour (3:00 PM IST).\n\nJoin link: ${joinUrl}${footer}`,
  };
  if (stage === 'post_event') return {
    subject: 'Webinar summary and next steps',
    body: `Hi ${name},\n\nThank you for registering for today's webinar. The short version:\n1. Position your resume for one target role, not five.\n2. Apply to fewer, better-matched roles and follow up with recruiters.\n3. Prepare stories for the interview rounds you keep losing.\n\nIf you want a mentor and a structured 30 days for this, the Job Switch Copilot is ₹5,000 (incl. GST) with 6 group and 2 personal 1-to-1 sessions, and a 7-day refund before the 2nd session: ${programmeUrl}${footer}`,
  };
  return null;
}

async function sendWhatsApp(phone: string, template: string, params: string[]): Promise<{ ok: boolean; id: string | null }> {
  const response = await fetch(`https://graph.facebook.com/${Deno.env.get('WHATSAPP_GRAPH_VERSION')}/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('WHATSAPP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.slice(1), type: 'template', template: {
      name: template, language: { code: Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE') || 'en' },
      components: [{ type: 'body', parameters: params.map(text => ({ type: 'text', text })) }],
    } }),
  });
  const body = await response.json().catch(() => null);
  const id = response.ok ? body?.messages?.[0]?.id ?? null : null;
  return { ok: !!id, id };
}

async function sendEmail(to: string, subject: string, body: string): Promise<{ ok: boolean; id: string | null }> {
  const response = await fetch('https://comms.twilio.com/v1/Emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${Deno.env.get('TWILIO_API_KEY')?.trim()}:${Deno.env.get('TWILIO_API_SECRET')?.trim()}`)}` },
    // The body is passed as a variable so names cannot inject template markup.
    body: JSON.stringify({
      from: { address: Deno.env.get('TWILIO_EMAIL_FROM')?.trim(), name: Deno.env.get('TWILIO_EMAIL_FROM_NAME')?.trim() || 'SkillSurger' },
      to: [{ address: to, variables: { reminder_body: body } }],
      content: { subject, text: '{{ reminder_body }}', html: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;white-space:pre-wrap">{{ reminder_body | escape }}</div>' },
    }),
    signal: AbortSignal.timeout(10000), redirect: 'error',
  });
  const result = await response.json().catch(() => null);
  const id = response.status === 202 && typeof result?.operationId === 'string' ? result.operationId : null;
  return { ok: !!id, id };
}

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('WEBINAR_REMINDERS_SECRET');
  if (!secret) return new Response('Not configured', { status: 503 });
  if (request.headers.get('x-cron-secret') !== secret) return new Response('Forbidden', { status: 403 });
  const dryRun = (await request.json().catch(() => ({})))?.dryRun === true;
  const now = Date.now();
  const due = STAGES.filter(s => now >= s.from && now < s.until);
  if (!due.length) return Response.json({ due: [], sent: 0 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let templates: Record<string, string> = {};
  try { templates = JSON.parse(Deno.env.get('WHATSAPP_REMINDER_TEMPLATES') || '{}'); } catch { /* treated as none */ }
  const whatsappReady = !!(Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') && Deno.env.get('WHATSAPP_ACCESS_TOKEN') && Deno.env.get('WHATSAPP_GRAPH_VERSION'));
  const emailReady = Deno.env.get('WEBINAR_EMAIL_ENABLED') === 'true' && !!(Deno.env.get('TWILIO_API_KEY') && Deno.env.get('TWILIO_API_SECRET') && Deno.env.get('TWILIO_EMAIL_FROM'));
  const joinUrl = Deno.env.get('WEBINAR_JOIN_URL') || groupUrl;

  const registrations = await admin.from('webinar_registrations').select('id, email, created_at, leads(payload)').eq('session_id', sessionId);
  const optOuts = await admin.from('messaging_opt_outs').select('phone');
  const sent = await admin.from('webinar_reminders').select('registration_id, stage, channel');
  if (registrations.error || optOuts.error || sent.error) {
    console.error(JSON.stringify({ area: 'webinar-reminders', code: 'load_failed' }));
    return new Response('Retry', { status: 500 });
  }
  const optedOut = new Set((optOuts.data || []).map((row: { phone: string }) => row.phone));
  const done = new Set((sent.data || []).map((row: { registration_id: string; stage: string; channel: string }) => `${row.registration_id}:${row.stage}:${row.channel}`));

  const jobs: { registrationId: string; stage: Stage; channel: 'whatsapp' | 'email'; send: () => Promise<{ ok: boolean; id: string | null }> }[] = [];
  for (const s of due) {
    for (const row of registrations.data || []) {
      // Registrations made after a stage's send time skip it: the confirmation just covered them.
      if (Date.parse(row.created_at) >= s.from) continue;
      const lead = (Array.isArray(row.leads) ? row.leads[0]?.payload : row.leads?.payload) || {};
      if (s.postEvent && (lead.paymentStatus === 'paid' || ['Paid', 'Onboarded', 'Completed', 'Refunded'].includes(lead.stage))) continue;
      const name = String(lead.name || '').trim().split(/\s+/)[0] || 'there';
      const phone = String(lead.phoneNumber || '');
      const template = templates[s.stage];
      if (whatsappReady && template && lead.whatsappConsent === 'yes' && /^\+\d{7,15}$/.test(phone) && !optedOut.has(phone) && !done.has(`${row.id}:${s.stage}:whatsapp`)) {
        jobs.push({ registrationId: row.id, stage: s.stage, channel: 'whatsapp', send: () => sendWhatsApp(phone, template, [name, schedule, s.postEvent ? programmeUrl : joinUrl]) });
      }
      const email = emailFor(s.stage, name, joinUrl);
      if (s.email && email && emailReady && row.email && !done.has(`${row.id}:${s.stage}:email`)) {
        jobs.push({ registrationId: row.id, stage: s.stage, channel: 'email', send: () => sendEmail(row.email, email.subject, email.body) });
      }
    }
  }
  if (dryRun) {
    const counts: Record<string, number> = {};
    for (const job of jobs) counts[`${job.stage}:${job.channel}`] = (counts[`${job.stage}:${job.channel}`] || 0) + 1;
    return Response.json({ dryRun: true, due: due.map(s => s.stage), whatsappReady, emailReady, counts });
  }

  let delivered = 0, failed = 0;
  const batch = jobs.slice(0, BATCH);
  for (let i = 0; i < batch.length; i += 10) {
    await Promise.all(batch.slice(i, i + 10).map(async job => {
      const key = { registration_id: job.registrationId, stage: job.stage, channel: job.channel };
      const claim = await admin.from('webinar_reminders').upsert({ ...key, status: 'sending' }, { onConflict: 'registration_id,stage,channel', ignoreDuplicates: true }).select('registration_id');
      if (claim.error || claim.data?.length !== 1) return;
      let result = { ok: false, id: null as string | null };
      try { result = await job.send(); } catch { /* a timeout may follow acceptance: never retried */ }
      if (result.ok) delivered++; else failed++;
      await admin.from('webinar_reminders').update({ status: result.ok ? 'accepted' : 'failed', provider_message_id: result.id, error_code: result.ok ? null : 'provider_rejected', updated_at: new Date().toISOString() })
        .eq('registration_id', job.registrationId).eq('stage', job.stage).eq('channel', job.channel);
    }));
  }
  if (failed) console.error(JSON.stringify({ area: 'webinar-reminders', code: 'some_sends_failed', failed }));
  return Response.json({ due: due.map(s => s.stage), sent: delivered, failed, remaining: Math.max(0, jobs.length - batch.length) });
});
