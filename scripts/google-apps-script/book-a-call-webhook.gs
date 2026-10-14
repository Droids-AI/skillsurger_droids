// Google Apps Script Web App used by src/lib/googleSheets.ts (submitLead).
//
// Handles every lead form on the site that calls submitLead() — currently
// /book-a-call (DiagnosisBookingForm) and /free-resume-audit (ResumeAuditForm)
// — by appending a row to a form-specific tab in this Sheet and emailing a
// notification. Supabase is always written first by the app itself; this
// script is the secondary Sheets + email path and is best-effort from the
// app's point of view (a failure here never blocks a submission).
//
// Deployment:
// 1. Open the Google Sheet you want leads to land in.
// 2. Extensions > Apps Script, delete any starter code, paste this file.
// 3. Deploy > New deployment > type "Web app".
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the deployment's Web App URL.
// 5. Set VITE_GOOGLE_SHEETS_WEBHOOK_URL to that URL in .env (and in your
//    hosting provider's environment variables), then redeploy the site.
//
// The first time it runs it will prompt you (the script owner) to authorize
// Gmail/Sheets access — approve it once.

var NOTIFY_EMAIL = 'sauravemail@gmail.com';
var SITE_URL = 'https://skillsurger.com';

// Each known formType gets its own tab with a fixed, matching column set.
// Any formType not listed here falls back to a generic tab whose columns
// are derived from whatever keys are present on the payload.
var SHEET_CONFIG = {
  diagnosis_booking: {
    sheetName: 'Book a Call',
    columns: [
      'receivedAt', 'name', 'email', 'phoneNumber', 'currentRole',
      'targetRole', 'yearsOfExperience', 'currentJobStatus', 'preferredSlot',
      'biggestChallenge', 'timestamp'
    ]
  },
  resume_audit: {
    sheetName: 'Resume Audit',
    columns: [
      'receivedAt', 'fullName', 'email', 'phoneNumber', 'currentRole',
      'targetRole', 'yearsOfExperience', 'currentCTC', 'expectedCTC',
      'noticePeriodStatus', 'linkedinUrl', 'jobDescription',
      'resumeStoragePath', 'timestamp'
    ]
  }
};

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.confirmation) return sendLeadConfirmation(data.confirmation);
  var config = SHEET_CONFIG[data.formType] || genericConfig(data);
  var sheet = getOrCreateSheet(config.sheetName, config.columns);

  var row = config.columns.map(function (col) {
    if (col === 'receivedAt') return new Date();
    return data[col] !== undefined && data[col] !== null ? data[col] : '';
  });
  sheet.appendRow(row);

  try {
    sendNotificationEmail(data);
  } catch (err) {
    // Row is already saved; don't fail the request over an email hiccup.
    Logger.log('Email notification failed: ' + err);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Fallback for any formType we don't have an explicit column layout for,
// so future/unknown lead forms still land somewhere instead of failing.
function genericConfig(data) {
  var keys = Object.keys(data).filter(function (k) {
    return k !== 'formType';
  });
  return {
    sheetName: 'Other Leads',
    columns: ['receivedAt', 'formType'].concat(keys)
  };
}

function getOrCreateSheet(sheetName, columns) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(columns);
  }

  return sheet;
}

function sendNotificationEmail(data) {
  var subject = 'New ' + (data.formType || 'lead') + ' submission: ' +
    (data.name || data.fullName || 'Unknown');

  var lines = ['A new lead was submitted from ' + SITE_URL, '', 'Form: ' + (data.formType || '-')];

  Object.keys(data).forEach(function (key) {
    if (key === 'formType') return;
    lines.push(key + ': ' + data[key]);
  });

  MailApp.sendEmail(NOTIFY_EMAIL, subject, lines.join('\n'));
}

// Server-only receipts: set LEAD_CONFIRMATION_WEBHOOK_SECRET in Script Properties.
// Deploy this script, then set the same secret and its URL in Supabase secrets.
function sendLeadConfirmation(confirmation) {
  var properties = PropertiesService.getScriptProperties();
  var secret = properties.getProperty('LEAD_CONFIRMATION_WEBHOOK_SECRET');
  if (!secret || confirmation.secret !== secret) return jsonResponse({ success: false });
  if (!/^[a-f0-9-]{36}$/i.test(confirmation.leadId || '') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(confirmation.email || '')) return jsonResponse({ success: false });
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var key = 'receipt:' + confirmation.leadId;
    var previous = properties.getProperty(key);
    if (previous === 'accepted') return jsonResponse({ success: true });
    if (previous) return jsonResponse({ success: false });
    // Mark before sending; a timeout or ambiguous response must never send twice.
    properties.setProperty(key, 'sending');
    MailApp.sendEmail({ to: confirmation.email, subject: confirmation.subject, body: confirmation.body, name: 'Skillsurger' });
    properties.setProperty(key, 'accepted');
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false });
  } finally { lock.releaseLock(); }
}

function jsonResponse(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
