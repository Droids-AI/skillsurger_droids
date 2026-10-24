import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { EmailStatus, LeadConfirmation } from './leadConfirmation.ts';

type EmailSwitch = 'WEBINAR_EMAIL_ENABLED' | 'RESUME_AUDIT_EMAIL_ENABLED';

export async function confirmationEmailStatus(admin: SupabaseClient, leadId: string): Promise<EmailStatus> {
  const result = await admin.from('lead_email_notifications').select('status').eq('lead_id', leadId).maybeSingle();
  return result.error ? 'failed' : result.data?.status || 'pending';
}

// Both lead flows use the same transactional sender and server-only receipt
// ledger. Provider acceptance means queued, never confirmed inbox delivery.
export async function sendConfirmationEmail(admin: SupabaseClient, lead: LeadConfirmation, enabledSwitch: EmailSwitch): Promise<EmailStatus> {
  try {
    const saved = await admin.from('lead_email_notifications').upsert({ lead_id: lead.leadId, status: 'pending' }, { onConflict: 'lead_id', ignoreDuplicates: true });
    if (saved.error) throw new Error('email_outbox_failed');

    const key = Deno.env.get('TWILIO_API_KEY')?.trim();
    const secret = Deno.env.get('TWILIO_API_SECRET')?.trim();
    const from = Deno.env.get('TWILIO_EMAIL_FROM')?.trim();
    const enabled = Deno.env.get(enabledSwitch) === 'true';
    if (!enabled || !key || !secret || !from) {
      const paused = await admin.from('lead_email_notifications').update({ status: 'unconfigured', error_code: enabled ? 'sender_not_configured' : 'delivery_paused', updated_at: new Date().toISOString() }).eq('lead_id', lead.leadId).eq('status', 'pending');
      if (paused.error) throw new Error('email_status_failed');
      return await confirmationEmailStatus(admin, lead.leadId);
    }

    // A user may retry a known non-send after configuration has been repaired.
    // Never reclaim accepted, sending, timed-out or ambiguous provider requests.
    const ready = await admin.from('lead_email_notifications').update({ status: 'pending', error_code: null, updated_at: new Date().toISOString() }).eq('lead_id', lead.leadId).eq('status', 'unconfigured');
    if (ready.error) throw new Error('email_configuration_retry_failed');
    const retry = await admin.from('lead_email_notifications').update({ status: 'pending', error_code: null, updated_at: new Date().toISOString() }).eq('lead_id', lead.leadId).eq('status', 'failed').like('error_code', 'provider_rejected%').is('provider_operation_id', null);
    if (retry.error) throw new Error('email_rejection_retry_failed');
    const claim = await admin.from('lead_email_notifications').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('lead_id', lead.leadId).eq('status', 'pending').select('lead_id');
    if (claim.error) throw new Error('email_claim_failed');
    if (claim.data?.length !== 1) return await confirmationEmailStatus(admin, lead.leadId);

    let status: EmailStatus = 'failed';
    let operationId: string | null = null;
    let errorCode: string | null = 'provider_response_unknown';
    try {
      const response = await fetch('https://comms.twilio.com/v1/Emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${btoa(`${key}:${secret}`)}` },
        body: JSON.stringify({
          from: { address: from, name: Deno.env.get('TWILIO_EMAIL_FROM_NAME')?.trim() || 'SkillSurger' },
          to: [{ address: lead.email, variables: { confirmation_body: lead.body } }],
          content: {
            subject: lead.subject,
            text: '{{ confirmation_body }}',
            html: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;white-space:pre-wrap">{{ confirmation_body | escape }}</div>',
          },
        }),
        signal: AbortSignal.timeout(10000), redirect: 'error',
      });
      const result = await response.json().catch(() => null);
      if (response.status === 202 && typeof result?.operationId === 'string' && /^comms_operation_[a-z0-9]+$/.test(result.operationId)) {
        status = 'accepted'; operationId = result.operationId; errorCode = null;
      } else if (response.status >= 400 && response.status < 500 && response.status !== 408) {
        // Raw provider errors can contain recipient details. Persist codes only.
        const code = String(result?.errors?.[0]?.code ?? result?.code ?? '');
        errorCode = `provider_rejected:${response.status}${/^\d{1,6}$/.test(code) ? `:${code}` : ''}`;
        console.error(JSON.stringify({ area: 'confirmation-email', code: errorCode }));
      }
    } catch { /* A timeout may follow acceptance. Never automatically resend. */ }

    const updated = await admin.from('lead_email_notifications').update({ status, provider_operation_id: operationId, error_code: errorCode, updated_at: new Date().toISOString() }).eq('lead_id', lead.leadId).eq('status', 'sending');
    if (updated.error) throw new Error('email_status_failed');
    return status;
  } catch {
    console.error(JSON.stringify({ area: 'confirmation-email', code: 'confirmation_failed' }));
    return 'failed';
  }
}
