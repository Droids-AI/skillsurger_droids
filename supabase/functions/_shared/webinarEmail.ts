import type { EmailStatus, LeadConfirmation } from './leadConfirmation.ts';

const endpoint = 'https://comms.twilio.com/v1/Emails';

// Called only for a newly committed webinar registration. Resume audit and
// other lead emails retain their existing provider and configuration.
export async function sendWebinarConfirmation(admin: any, lead: LeadConfirmation): Promise<EmailStatus> {
  try {
    const saved = await admin.from('lead_email_notifications').upsert({
      lead_id: lead.leadId, status: 'pending',
    }, { onConflict: 'lead_id', ignoreDuplicates: true });
    if (saved.error) throw new Error('email_outbox_failed');

    const key = Deno.env.get('TWILIO_API_KEY')?.trim();
    const secret = Deno.env.get('TWILIO_API_SECRET')?.trim();
    const from = Deno.env.get('TWILIO_EMAIL_FROM')?.trim();
    const enabled = Deno.env.get('WEBINAR_EMAIL_ENABLED') === 'true';
    if (!enabled || !key || !secret || !from) {
      const paused = await admin.from('lead_email_notifications').update({
        status: 'unconfigured', error_code: enabled ? 'sender_not_configured' : 'delivery_paused',
        updated_at: new Date().toISOString(),
      }).eq('lead_id', lead.leadId).eq('status', 'pending');
      if (paused.error) throw new Error('email_status_failed');
      return 'unconfigured';
    }

    // Only one request may claim a receipt. Accepted, failed or uncertain sends
    // are not automatically submitted again.
    const claim = await admin.from('lead_email_notifications').update({
      status: 'sending', updated_at: new Date().toISOString(),
    }).eq('lead_id', lead.leadId).eq('status', 'pending').select('lead_id');
    if (claim.error) throw new Error('email_claim_failed');
    if (claim.data?.length !== 1) {
      return await webinarEmailStatus(admin, lead.leadId);
    }

    let status: EmailStatus = 'failed';
    let operationId: string | null = null;
    let errorCode: string | null = 'provider_response_unknown';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
        },
        body: JSON.stringify({
          from: { address: from, name: Deno.env.get('TWILIO_EMAIL_FROM_NAME')?.trim() || 'SkillSurger' },
          // Personalization values are data, so a name cannot inject Liquid or
          // HTML into a provider-rendered confirmation template.
          to: [{ address: lead.email, variables: { confirmation_body: lead.body } }],
          content: {
            subject: lead.subject,
            text: '{{ confirmation_body }}',
            html: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033"><h1 style="font-size:22px">Your webinar registration is confirmed</h1><div style="white-space:pre-wrap">{{ confirmation_body | escape }}</div><p><a href="https://chat.whatsapp.com/L3kJ4PBEKDH6PADvfqYXwE">Join the webinar WhatsApp group</a></p></div>',
          },
        }),
        signal: AbortSignal.timeout(10000),
        redirect: 'error',
      });
      const result = await response.json().catch(() => null);
      if (response.status === 202 && typeof result?.operationId === 'string' && /^comms_operation_[a-z0-9]+$/.test(result.operationId)) {
        status = 'accepted';
        operationId = result.operationId;
        errorCode = null;
      } else if (response.status >= 400 && response.status < 500) {
        errorCode = 'provider_rejected';
      }
    } catch { /* A timeout may follow acceptance: do not automatically retry. */ }

    const updated = await admin.from('lead_email_notifications').update({
      status, provider_operation_id: operationId, error_code: errorCode,
      updated_at: new Date().toISOString(),
    }).eq('lead_id', lead.leadId).eq('status', 'sending');
    if (updated.error) throw new Error('email_status_failed');
    return status;
  } catch {
    // Never log recipients, message bodies, provider responses or credentials.
    console.error(JSON.stringify({ area: 'webinar-email', code: 'confirmation_failed' }));
    return 'failed';
  }
}

export async function webinarEmailStatus(admin: any, leadId: string): Promise<EmailStatus> {
  const result = await admin.from('lead_email_notifications').select('status').eq('lead_id', leadId).maybeSingle();
  if (result.error) return 'failed';
  return result.data?.status || 'pending';
}
