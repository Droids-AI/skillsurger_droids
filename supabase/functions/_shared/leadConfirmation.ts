export type EmailStatus = 'pending' | 'sending' | 'accepted' | 'failed' | 'unconfigured';
export interface LeadConfirmation {
  leadId: string;
  email: string;
  name: string;
  subject: string;
  body: string;
}

// Invoked only by server-side lead handlers after the lead is committed.
export async function sendLeadConfirmation(admin: any, lead: LeadConfirmation): Promise<EmailStatus> {
  const webhook = Deno.env.get('LEAD_CONFIRMATION_WEBHOOK_URL');
  const secret = Deno.env.get('LEAD_CONFIRMATION_WEBHOOK_SECRET');
  try {
    const saved = await admin.from('lead_email_notifications').upsert({ lead_id: lead.leadId, status: 'pending' }, { onConflict: 'lead_id', ignoreDuplicates: true });
    if (saved.error) throw new Error('email_outbox_failed');
    if (webhook && secret) {
      // Unconfigured is a known non-send, so it can safely retry after setup.
      const ready = await admin.from('lead_email_notifications').update({ status: 'pending' }).eq('lead_id', lead.leadId).eq('status', 'unconfigured');
      if (ready.error) throw new Error('email_configuration_retry_failed');
    }
    const claim = await admin.from('lead_email_notifications').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('lead_id', lead.leadId).eq('status', 'pending').select('lead_id');
    if (claim.error) throw new Error('email_claim_failed');
    if (claim.data?.length !== 1) {
      const current = await admin.from('lead_email_notifications').select('status').eq('lead_id', lead.leadId).single();
      return current.error ? 'failed' : current.data.status;
    }
    let status: EmailStatus = 'unconfigured';
    if (webhook && secret) {
      status = 'failed';
      try {
        const response = await fetch(webhook, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmation: { ...lead, secret } }),
          signal: AbortSignal.timeout(15000),
        });
        const result = await response.json();
        if (response.ok && result.success === true) status = 'accepted';
      } catch { /* Uncertain sends remain failed; do not auto-resend. */ }
    }
    const updated = await admin.from('lead_email_notifications').update({ status, updated_at: new Date().toISOString() }).eq('lead_id', lead.leadId);
    if (updated.error) throw new Error('email_status_failed');
    return status;
  } catch {
    console.error(JSON.stringify({ area: 'lead-confirmation', code: 'email_confirmation_failed' }));
    return 'failed';
  }
}
