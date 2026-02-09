# Google Sheets Integration Setup Guide

This guide explains how to set up Google Sheets integration for the Masterclass form submission.

## Overview

When users fill out the "Watch Free Masterclass" form on the `/training` page, their information (name, email, phone number) is automatically saved to a Google Sheet.

## Setup Options

### Option 1: Google Apps Script Webhook (Recommended - Quick Setup)

This is the easiest method and doesn't require backend changes.

#### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Masterclass Submissions" (or any name you prefer)
4. Add headers in the first row:
   - Column A: `Timestamp`
   - Column B: `Name`
   - Column C: `Email`
   - Column D: `Phone Number`
   - Column E: `Submitted At`

#### Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code
3. Paste the following code:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Append row with data
    sheet.appendRow([
      new Date(), // Timestamp
      data.name || '',
      data.email || '',
      data.phoneNumber || '',
      data.timestamp || new Date().toISOString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Test function to verify setup
function test() {
  var testData = {
    name: 'Test User',
    email: 'test@example.com',
    phoneNumber: '+911234567890',
    timestamp: new Date().toISOString()
  };
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}
```

4. Click **Save** (or press `Ctrl+S` / `Cmd+S`)
5. Name your project (e.g., "Masterclass Form Handler")

#### Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "Masterclass form submission handler"
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone** (important for public access)
4. Click **Deploy**
5. **Copy the Web App URL** (it will look like: `https://script.google.com/macros/s/.../exec`)

#### Step 4: Configure Environment Variable

1. Add the webhook URL to your `.env` file:

```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Restart your development server

#### Step 5: Test the Integration

1. Go to `/training` page
2. Click "Watch Free Masterclass"
3. Fill out the form and submit
4. Check your Google Sheet - you should see a new row with the submitted data

---

### Option 2: Backend API Endpoint

If you prefer to handle Google Sheets integration through your backend:

#### Step 1: Set Up Backend Endpoint

Create an endpoint at `/api/v1/masterclass/submit` that:

1. Accepts POST requests with JSON body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+911234567890",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

2. Writes data to Google Sheets using the [Google Sheets API](https://developers.google.com/sheets/api)

#### Step 2: Backend Implementation Example (Node.js)

```javascript
const { google } = require('googleapis');

async function submitToGoogleSheets(data) {
  // Initialize Google Sheets API
  const auth = new google.auth.GoogleAuth({
    keyFile: 'path/to/service-account-key.json', // Service account credentials
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // From Google Sheet URL

  // Append row
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:E', // Adjust range as needed
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[
        new Date().toISOString(),
        data.name,
        data.email,
        data.phoneNumber,
        data.timestamp
      ]],
    },
  });
}

// Express route example
app.post('/api/v1/masterclass/submit', async (req, res) => {
  try {
    await submitToGoogleSheets(req.body);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    res.status(500).json({ success: false, message: 'Failed to save data' });
  }
});
```

#### Step 3: Configure Backend API URL

Make sure your `.env` file has:

```env
VITE_BACKEND_API=https://api.wisedroids.ai/api/v1
```

The frontend will automatically use the backend API if no webhook URL is configured.

---

## Troubleshooting

### Form submission fails

1. **Check browser console** for error messages
2. **Verify environment variables** are set correctly
3. **Test the webhook/API endpoint** directly using curl or Postman

### Data not appearing in Google Sheet

1. **Check Google Apps Script execution logs**:
   - Go to Apps Script → View → Execution log
   - Look for any errors

2. **Verify sheet permissions**:
   - Make sure the sheet is accessible
   - For Apps Script: Ensure "Who has access" is set to "Anyone"

3. **Check the sheet name**:
   - Make sure you're checking the correct sheet
   - Verify the script is using `getActiveSheet()` or the correct sheet name

### CORS Errors

If using Google Apps Script webhook:
- Make sure deployment is set to "Anyone" access
- The webhook URL should end with `/exec` (not `/dev`)

---

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent spam
2. **Validation**: Backend should validate email format and phone numbers
3. **Spam Protection**: Consider adding CAPTCHA or similar protection
4. **Data Privacy**: Ensure compliance with GDPR/privacy regulations

---

## Testing

You can test the integration using curl:

```bash
curl -X POST https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+911234567890",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }'
```

Or using the test function in Apps Script (run `test()` function in the script editor).

---

## Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check Google Apps Script execution logs
3. Verify all environment variables are set correctly
4. Ensure the Google Sheet has proper permissions

