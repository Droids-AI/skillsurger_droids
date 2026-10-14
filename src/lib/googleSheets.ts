/**
 * Google Sheets Integration
 * 
 * This module handles submitting form data to Google Sheets.
 * 
 * Setup Instructions:
 * 
 * Option 1: Using Google Apps Script (Recommended for quick setup)
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste the following code:
 * 
 * function doPost(e) {
 *   var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   var data = JSON.parse(e.postData.contents);
 *   
 *   sheet.appendRow([
 *     new Date(),
 *     data.name,
 *     data.email,
 *     data.phoneNumber,
 *     data.timestamp
 *   ]);
 *   
 *   return ContentService.createTextOutput(JSON.stringify({success: true}))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * 4. Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * 5. Copy the Web App URL and set it as VITE_GOOGLE_SHEETS_WEBHOOK_URL in .env
 *
 * Option 2: Using Backend API
 * 1. Set up a backend endpoint at /api/v1/masterclass/submit
 * 2. The endpoint should accept POST requests with { name, email, phoneNumber, timestamp }
 * 3. The backend should handle writing to Google Sheets using Google Sheets API
 */

import { supabase } from './supabase';

interface MasterclassSubmission {
  name: string;
  email: string;
  phoneNumber: string;
  timestamp: string;
}

export async function submitToGoogleSheets(data: MasterclassSubmission): Promise<void> {
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  const backendApi = import.meta.env.VITE_BACKEND_API || 'http://localhost:5002/api/v1';

  // Option 1: Use Google Apps Script Webhook if available
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error('Webhook returned unsuccessful response');
      }

      return;
    } catch (error) {
      console.error('Google Apps Script webhook failed, trying backend API:', error);
      // Fall through to backend API option
    }
  }

  // Option 2: Use Backend API
  try {
    const response = await fetch(`${backendApi}/masterclass/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Backend API returned unsuccessful response');
    }

    return;
  } catch (error) {
    console.error('Backend API failed:', error);
    throw error;
  }
}

/** Resume audits use the validated server endpoint, which saves the lead,
 * sends a confirmation receipt and syncs the sheet. Other lead forms retain
 * the direct leads insert and best-effort sheet notification flow. */
export class LeadSubmissionError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) { super(message); }
}

export type LeadReceipt = { leadId: string; emailStatus: 'pending' | 'sending' | 'accepted' | 'failed' | 'unconfigured' };

export async function submitLead(payload: Record<string, unknown>, formType: string): Promise<LeadReceipt | void> {
  if (formType === 'resume_audit') {
    const { data, error } = await supabase.functions.invoke('register-resume-audit', { body: payload });
    if (error || !data?.leadId) {
      let response = data;
      if (error && 'context' in error && error.context instanceof Response) {
        try { response = await error.context.clone().json(); } catch { /* Use fallback below. */ }
      }
      throw new LeadSubmissionError(response?.error || 'We could not save your audit request. Please try again.', response?.errors || {});
    }
    return data as LeadReceipt;
  }
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  const body = { ...payload, formType, timestamp: new Date().toISOString() };

  const { error } = await supabase.from('leads').insert({ form_type: formType, payload: body });

  if (error) {
    throw new Error(`Failed to save lead: ${error.message}`);
  }

  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
      keepalive: true,
    }).then(async response => {
      if (!response.ok || !(await response.json()).success) {
        throw new Error('Google Sheets sync did not confirm the submission');
      }
    }).catch((error) => {
      console.error('Google Sheets/email webhook failed (lead was still saved to Supabase):', error);
    });
  }
}

