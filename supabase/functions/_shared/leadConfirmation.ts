import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { sendConfirmationEmail } from './confirmationEmail.ts';

export type EmailStatus = 'pending' | 'sending' | 'accepted' | 'failed' | 'unconfigured';
export interface LeadConfirmation {
  leadId: string;
  email: string;
  name: string;
  subject: string;
  body: string;
}

export function sendLeadConfirmation(admin: SupabaseClient, lead: LeadConfirmation) {
  return sendConfirmationEmail(admin, lead, 'RESUME_AUDIT_EMAIL_ENABLED');
}
