import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { LeadConfirmation } from './leadConfirmation.ts';
import { sendConfirmationEmail } from './confirmationEmail.ts';

export function sendWebinarConfirmation(admin: SupabaseClient, lead: LeadConfirmation) {
  return sendConfirmationEmail(admin, lead, 'WEBINAR_EMAIL_ENABLED');
}
