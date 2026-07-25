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

/**
 * Generic lead submission for new Job Switch Copilot forms (resume audit,
 * diagnosis booking, etc). Kept separate from submitToGoogleSheets so the
 * existing masterclass form/webhook contract is never altered.
 *
 * Persistence:
 * 1. Supabase `leads` table (see migration 20260706071747_add_leads_table.sql)
 *    — always written, and the only path the caller waits on/can fail from.
 * 2. Google Apps Script webhook, if VITE_GOOGLE_SHEETS_WEBHOOK_URL is set —
 *    appends the row to Google Sheets and emails a notification (see
 *    scripts/google-apps-script/book-a-call-webhook.gs). Fired best-effort
 *    so a Google-side hiccup never blocks or fails the user's submission.
 */
export async function submitLead(payload: Record<string, unknown>, formType: string): Promise<void> {
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  const body = { ...payload, formType, timestamp: new Date().toISOString() };

  const { error } = await supabase.from('leads').insert({ form_type: formType, payload: body });

  if (error) {
    throw new Error(`Failed to save lead: ${error.message}`);
  }

  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((error) => {
      console.error('Google Sheets/email webhook failed (lead was still saved to Supabase):', error);
    });
  }
}

