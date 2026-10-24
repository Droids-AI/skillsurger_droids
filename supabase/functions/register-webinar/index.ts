import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendWebinarConfirmation } from '../_shared/webinarEmail.ts';
import { greenApiConfigured, sendGreenApiMessage } from '../_shared/greenApi.ts';

const sessionId = 'job-switch-2026-10-31';
const startsAt = '2026-10-31T15:00:00+05:30';
const schedule = 'Saturday, 31 October 2026 at 3:00 PM IST';
const experienceOptions = ['Under 3 years', '3–5 years', '6–8 years', '9–12 years', 'More than 12 years'];
const timelineOptions = ['Within 1 month', '1–3 months', '3–6 months', 'Just exploring'];
const text = (value: unknown, max = 100) => String(value ?? '').trim().slice(0, max);
const origins = (Deno.env.get('WEBINAR_ALLOWED_ORIGINS') || 'https://skillsurger.com,https://www.skillsurger.com').split(',');
const cors = (origin: string) => ({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' });

Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  if (!origins.includes(origin)) return new Response('Forbidden', { status: 403 });
  const headers = { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const requestId = crypto.randomUUID();
  try {
    const raw = await request.text();
    if (raw.length > 4096) return respond({ error: 'Request too large', requestId }, 413);
    let input;
    try { input = JSON.parse(raw); } catch { return respond({ error: 'Invalid request', requestId }, 400); }
    if (!input || typeof input !== 'object') return respond({ error: 'Invalid request', requestId }, 400);
    const name = String(input.name || '').trim();
    const email = String(input.email || '').trim().toLowerCase();
    const phone = String(input.phoneNumber || '').replace(/[\s()-]/g, '');
    if (input.sessionId !== sessionId || !name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+[1-9]\d{6,14}$/.test(phone)) {
      return respond({ error: 'Enter a valid name, email and WhatsApp number including +country code.', requestId }, 400);
    }
    // Qualification fields are optional server-side so a stale cached page can still register.
    const currentRole = text(input.currentRole);
    const targetRole = text(input.targetRole);
    const experience = experienceOptions.includes(input.experience) ? input.experience : '';
    const timeline = timelineOptions.includes(input.timeline) ? input.timeline : '';
    const whatsappConsent = input.whatsappConsent === true;
    const attribution = input.attribution && typeof input.attribution === 'object' ? input.attribution : {};
    const qualified = ['3–5 years', '6–8 years', '9–12 years'].includes(experience) && timeline !== '' && timeline !== 'Just exploring';
    if (Date.now() >= new Date(startsAt).getTime()) return respond({ error: 'Registration for this session is closed.', requestId }, 409);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${Deno.env.get('RATE_LIMIT_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`));
    const key = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
    const limit = await admin.rpc('webinar_rate_limit', { p_key: key });
    if (limit.error) throw new Error('rate_limit_failed');
    if (!limit.data) return respond({ error: 'Too many attempts. Please retry in 10 minutes.', requestId }, 429);
    const lead = {
      name, email, phoneNumber: phone, webinarTitle: 'How to switch jobs and target 1.5x to 5x salary growth',
      startsAt, durationMinutes: 60, source: 'job-switch-copilot', timestamp: new Date().toISOString(),
      // URL is normalized: no arbitrary query parameters/contact details in logs or leads.
      pageUrl: `${origin}/job-switch-copilot`, requestId,
      currentRole, targetRole, experience, timeline,
      whatsappConsent: whatsappConsent ? 'yes' : 'no',
      // Lead source and campaign, first touch, from the visitor's landing URL.
      utmSource: text(attribution.utmSource) || (text(attribution.referrer) ? `referral:${text(attribution.referrer)}` : 'direct'),
      utmMedium: text(attribution.utmMedium), utmCampaign: text(attribution.utmCampaign),
      utmContent: text(attribution.utmContent), utmTerm: text(attribution.utmTerm), gclid: text(attribution.gclid, 200),
      landingPage: text(attribution.landingPage, 200),
      // CRM fields: stage moves New → Qualified → Registered → Attended → Sales Follow-up → Paid → Onboarded → Completed/Refunded.
      offer: 'free_webinar → job_switch_copilot', registrationDate: new Date().toISOString().slice(0, 10),
      stage: 'Registered', qualified: qualified ? 'yes' : 'no', expectedValue: qualified ? 5000 : 0,
      paymentStatus: 'unpaid', owner: '', lastContact: '',
    };
    const result = await admin.rpc('register_webinar', { p_session_id: sessionId, p_payload: lead });
    if (result.error) throw new Error('registration_failed');
    const { registrationId, alreadyRegistered } = result.data;
    let whatsappStatus = 'pending';
    try {
    const joinUrl = Deno.env.get('WEBINAR_JOIN_URL') || 'https://chat.whatsapp.com/L3kJ4PBEKDH6PADvfqYXwE';
    if (!alreadyRegistered && !whatsappConsent) {
      // No messaging consent: never send WhatsApp messages to this number.
      whatsappStatus = 'unconfigured';
      const saved = await admin.from('webinar_notifications').update({ status: whatsappStatus, error_code: 'no_consent', request_id: requestId }).eq('registration_id', registrationId);
      if (saved.error) throw new Error('notification_log_failed');
    } else if (!alreadyRegistered) {
      if (!greenApiConfigured()) {
        whatsappStatus = 'unconfigured';
        const saved = await admin.from('webinar_notifications').update({ status: whatsappStatus, error_code: 'sender_not_configured', request_id: requestId }).eq('registration_id', registrationId);
        if (saved.error) throw new Error('notification_log_failed');
      } else {
        // Atomically claim notification. A retry never sends a second message.
        const claim = await admin.from('webinar_notifications').update({ status: 'sending', request_id: requestId }).eq('registration_id', registrationId).eq('status', 'pending').select('registration_id');
        if (claim.error || claim.data?.length !== 1) throw new Error('notification_claim_failed');
        let messageId: string | null = null;
        let errorCode: string | null = null;
        try {
          const firstName = name.split(/\s+/)[0];
          const sent = await sendGreenApiMessage(phone, `Hi ${firstName}, you're registered for the free Skillsurger job switch webinar.\n\n${schedule}, 60 minutes online.\n\nJoin here: ${joinUrl}\n\nBefore the webinar: keep your resume handy and note 2–3 roles you want next.\n\nWe'll remind you before it starts. Reply STOP to stop WhatsApp messages.`);
          messageId = sent.id;
          whatsappStatus = messageId ? 'accepted' : 'failed';
          errorCode = messageId ? null : 'provider_rejected';
        } catch { whatsappStatus = 'failed'; errorCode = 'provider_response_unknown'; }
        const saved = await admin.from('webinar_notifications').update({ status: whatsappStatus, provider_message_id: messageId, error_code: errorCode, updated_at: new Date().toISOString() }).eq('registration_id', registrationId);
        if (saved.error) throw new Error('notification_log_failed');
      }
    } else {
      const notification = await admin.from('webinar_notifications').select('status').eq('registration_id', registrationId).single();
      if (notification.error) throw new Error('notification_status_failed');
      whatsappStatus = notification.data.status === 'sending' ? 'pending' : notification.data.status;
    }
    } catch {
      // Registration already committed. Notification trouble must not turn a
      // saved registration into a failure/retry or lose its conversion result.
      whatsappStatus = 'failed';
      console.error(JSON.stringify({ area: 'webinar-notification', code: 'notification_failed', requestId }));
    }
    const calendarStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const calendarDates = `${calendarStamp(new Date(startsAt))}/${calendarStamp(new Date(new Date(startsAt).getTime() + 60 * 60 * 1000))}`;
    const emailStatus = await sendWebinarConfirmation(admin, {
      leadId: result.data.leadId, email, name,
      subject: 'Your Skillsurger webinar registration is confirmed',
      body: `Hi ${name},\n\nYou are registered for the free Skillsurger job switch webinar.\n${schedule} — 60 minutes online.\n\nJoin the WhatsApp group for the meeting link and reminders: https://chat.whatsapp.com/L3kJ4PBEKDH6PADvfqYXwE\n\nAdd the session to your calendar: https://calendar.google.com/calendar/render?action=TEMPLATE&text=Skillsurger%20webinar&dates=${calendarDates}\n\nBefore the webinar (10 minutes):\n1. Keep your current resume handy as a PDF.\n2. Write down 2–3 roles or companies you want next.\n3. Note where your search is stuck: callbacks, interviews or offers.\n\nTeam Skillsurger`,
    });
    if (!alreadyRegistered) {
      // Same Google Sheet sync the other lead forms use ("Webinar Registrations" tab).
      // Best-effort: a Sheets hiccup must not fail a saved registration.
      const sync = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/sheets-sync`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ ...lead, formType: 'webinar_registration' }),
      }).then(response => { if (!response.ok) throw new Error(String(response.status)); })
        .catch(() => console.error(JSON.stringify({ area: 'webinar-sheets', code: 'sheets_sync_failed', requestId })));
      // deno-lint-ignore no-explicit-any
      const runtime = (globalThis as any).EdgeRuntime;
      if (runtime?.waitUntil) runtime.waitUntil(sync); else await sync;
    }
    return respond({ registrationId, alreadyRegistered, whatsappStatus, emailStatus, requestId });
  } catch {
    console.error(JSON.stringify({ area: 'webinar-registration', code: 'request_failed', requestId }));
    return respond({ error: 'Unable to register. Please retry.', requestId }, 500);
  }
});
