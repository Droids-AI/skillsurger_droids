// Google Apps Script Web App used by src/lib/googleSheets.ts (submitLead).
//
// Handles every lead form on the site that calls submitLead() — currently
// /book-a-call (DiagnosisBookingForm) and the Free Resume Audit form
// (ResumeAuditForm) — by appending a row to this Sheet and emailing a
// notification. Supabase is always written first by the app itself; this
// script is the secondary Sheets + email path and is best-effort from the
// app's point of view (a failure here never blocks a submission).
//
// Deployment:
// 1. Create/open the Google Sheet you want leads to land in.
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

var SHEET_NAME = 'Leads';
var NOTIFY_EMAIL = 'sauravemail@gmail.com';
var SITE_URL = 'https://skillsurger.com/book-a-call';

var COLUMNS = [
  'receivedAt', 'formType', 'name', 'email', 'phoneNumber', 'currentRole',
  'targetRole', 'yearsOfExperience', 'currentJobStatus', 'preferredSlot',
  'biggestChallenge', 'submittedAt'
];

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = getOrCreateSheet();

  sheet.appendRow([
    new Date(),
    data.formType || '',
    data.name || '',
    data.email || '',
    data.phoneNumber || '',
    data.currentRole || '',
    data.targetRole || '',
    data.yearsOfExperience || '',
    data.currentJobStatus || '',
    data.preferredSlot || '',
    data.biggestChallenge || '',
    data.timestamp || ''
  ]);

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

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
  }

  return sheet;
}

function sendNotificationEmail(data) {
  var subject = 'New ' + (data.formType || 'lead') + ' submission: ' + (data.name || 'Unknown');

  var body = [
    'A new lead was submitted from ' + SITE_URL,
    '',
    'Form: ' + (data.formType || '-'),
    'Name: ' + (data.name || '-'),
    'Email: ' + (data.email || '-'),
    'Phone: ' + (data.phoneNumber || '-'),
    'Current role: ' + (data.currentRole || '-'),
    'Target role: ' + (data.targetRole || '-'),
    'Years of experience: ' + (data.yearsOfExperience || '-'),
    'Current job status: ' + (data.currentJobStatus || '-'),
    'Preferred slot: ' + (data.preferredSlot || '-'),
    'Biggest challenge: ' + (data.biggestChallenge || '-'),
    '',
    'Submitted at: ' + (data.timestamp || new Date().toISOString())
  ].join('\n');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}
