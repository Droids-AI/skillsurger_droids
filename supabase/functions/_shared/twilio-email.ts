// Adapted from TransformBuddy's server-only Twilio Email adapter.
// Keep Skillsurger's existing per-flow switches and request timeout.
const EMAIL_ENDPOINT = 'https://comms.twilio.com/v1/Emails';

export type EmailSwitch = 'WEBINAR_EMAIL_ENABLED' | 'RESUME_AUDIT_EMAIL_ENABLED';

export class EmailSendError extends Error {
  constructor(
    public readonly uncertain: boolean,
    public readonly httpStatus?: number,
    public readonly providerCode?: string,
  ) {
    super('Email could not be confirmed. Please retry later or contact support.');
  }
}

function required(key: string): string {
  const value = Deno.env.get(key)?.trim();
  if (!value) throw new Error(`Email configuration incomplete (${key}).`);
  return value;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function emailDeliveryEnabled(enabledSwitch: EmailSwitch): boolean {
  return Deno.env.get(enabledSwitch) === 'true';
}

export function emailConfigured(enabledSwitch: EmailSwitch): boolean {
  return emailDeliveryEnabled(enabledSwitch) &&
    ['TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_EMAIL_FROM']
      .every(key => Boolean(Deno.env.get(key)?.trim()));
}

// Never expose a generic browser-to-recipient send action.
export async function sendEmail(input: {
  to: { address: string; name?: string };
  subject: string;
  html: string;
  text: string;
}, enabledSwitch: EmailSwitch): Promise<{ operationId: string }> {
  if (!emailDeliveryEnabled(enabledSwitch)) throw new Error('Email delivery is paused.');
  const key = required('TWILIO_API_KEY');
  const secret = required('TWILIO_API_SECRET');
  const from = required('TWILIO_EMAIL_FROM');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to.address) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) {
    throw new Error('A valid sender and recipient email address are required.');
  }

  let response: Response;
  try {
    response = await fetch(EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
      },
      body: JSON.stringify({
        from: { address: from, name: Deno.env.get('TWILIO_EMAIL_FROM_NAME')?.trim() || 'SkillSurger' },
        to: [input.to],
        content: { subject: input.subject, html: input.html, text: input.text },
      }),
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
  } catch {
    // A timeout may follow acceptance: callers must avoid blind resubmission.
    throw new EmailSendError(true);
  }

  const result = await response.json().catch(() => null);
  if (response.status !== 202) {
    // Retain only numeric provider codes, never recipient details or raw errors.
    const code = String(result?.errors?.[0]?.code ?? result?.code ?? '');
    const rejected = response.status >= 400 && response.status < 500 && response.status !== 408;
    throw new EmailSendError(!rejected, response.status, /^\d{1,6}$/.test(code) ? code : undefined);
  }
  if (typeof result?.operationId !== 'string' || !result.operationId.trim()) {
    throw new EmailSendError(true, response.status);
  }
  // Acceptance is not proof of delivery. Keep the operation ID for tracking.
  return { operationId: result.operationId };
}
