import { supabase } from './supabase';
import { WEBINAR } from './constants/webinar';
import { reportError } from './safeLogging';
import { getAttribution } from './attribution';

export type RegistrationResult = {
  registrationId: string;
  alreadyRegistered: boolean;
  emailStatus?: 'pending' | 'sending' | 'accepted' | 'failed' | 'unconfigured';
  whatsappStatus: 'pending' | 'accepted' | 'delivered' | 'read' | 'failed' | 'unconfigured';
};

export type WebinarRegistrationInput = {
  name: string; email: string; phoneNumber: string;
  currentRole?: string; targetRole?: string; experience?: string; timeline?: string;
};

export async function registerForWebinar(input: WebinarRegistrationInput): Promise<RegistrationResult> {
  const requestId = crypto.randomUUID();
  const { data, error } = await supabase.functions.invoke('register-webinar', {
    body: { ...input, attribution: getAttribution(), sessionId: WEBINAR.id, pageUrl: window.location.href, requestId },
  });
  if (error || typeof data?.registrationId !== 'string' || !data.registrationId || typeof data.alreadyRegistered !== 'boolean' || !['pending','accepted','delivered','read','failed','unconfigured'].includes(data.whatsappStatus)) {
    const status = error && 'context' in error && error.context instanceof Response ? error.context.status : 0;
    let reference = requestId;
    try {
      const body = error && 'context' in error && error.context instanceof Response ? await error.context.clone().json() : data;
      if (typeof body?.requestId === 'string' && /^[a-f0-9-]{36}$/i.test(body.requestId)) reference = body.requestId;
    } catch { /* Offline errors have only the client correlation ID. */ }
    reportError('webinar-registration', 'registration_failed', reference);
    if (status === 409) throw new Error('Registration for this webinar is closed. Contact us for the next session.');
    if (status === 429) throw new Error('Too many attempts. Please retry in 10 minutes.');
    if (status === 400) throw new Error('Check your name, email and WhatsApp number with +country code.');
    throw new Error(`We could not save your registration. Please try again. Reference: ${reference}`);
  }
  return data as RegistrationResult;
}

const conversions = new Set<string>();
export function trackWebinarConversion(result: RegistrationResult) {
  if (result.alreadyRegistered || !result.registrationId || conversions.has(result.registrationId)) return;
  const key = `webinar-conversion:${result.registrationId}`;
  try { if (sessionStorage.getItem(key)) return; } catch { /* Memory guard still works. */ }
  if (typeof window.gtag !== 'function') return;
  conversions.add(result.registrationId);
  try { sessionStorage.setItem(key, '1'); } catch { /* Ads transaction_id also deduplicates. */ }
  try {
    window.gtag('event', 'conversion', {
      send_to: 'AW-18357417979/018aCPbEh5gdEPvvv7FE',
      transaction_id: result.registrationId,
    });
  } catch { reportError('webinar-tracking', 'conversion_unavailable'); }
}
