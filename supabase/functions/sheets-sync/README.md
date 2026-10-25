# sheets-sync

Appends a lead submission to a Google Sheet, using a Google service account.
Called directly from the browser (`submitLead()` in `src/lib/googleSheets.ts`
already fire-and-forget POSTs to `VITE_GOOGLE_SHEETS_WEBHOOK_URL` — point
that env var at this function's URL and no client code changes are needed).
No Apps Script deployment, no user OAuth flow, and the service account's
private key never leaves the server — the browser only ever sees this
function's URL.

## 1. Google Cloud Console (one-time)

1. Enable the **Google Sheets API** for a project.
2. **Credentials → Create Credentials → Service Account**. No project-level
   role needed.
3. Open the service account → **Keys → Add Key → Create new key → JSON**.
   Download it — you need the `client_email` and `private_key` fields.
4. Open the target Google Sheet → **Share** → add the service account's
   `client_email` as **Editor**.

## 2. Deploy the function

Via Supabase CLI:

```
supabase functions deploy sheets-sync --no-verify-jwt
```

Or via the Supabase Dashboard: **Edge Functions → Create function**, name it
`sheets-sync`, paste in `index.ts`, and under its settings turn **off**
"Enforce JWT verification" — the browser calls this function directly with
no auth header (same as the old Apps Script webhook), so JWT verification
must be disabled or every call will 401.

## 3. Set secrets

Dashboard: **Project Settings → Edge Functions → Secrets** (or
`supabase secrets set` via CLI):

- `GOOGLE_SHEET_ID` — the ID from the sheet's URL
  (`https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — `client_email` from the JSON key
- `GOOGLE_PRIVATE_KEY` — `private_key` from the JSON key, pasted as-is
  (including the `-----BEGIN PRIVATE KEY-----` header/footer; the function
  un-escapes `\n` automatically)

## 4. Point the site at it

Set (in `.env`, and in your hosting provider's env vars):

```
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://<project-ref>.supabase.co/functions/v1/sheets-sync
```

Redeploy the site. `submitLead()` already fire-and-forget POSTs the form
payload to this env var after saving to Supabase — no other code changes
needed. Every "Book a Call" / "Free Resume Audit" submission will now also
append to the matching tab ("Book a Call" / "Resume Audit" / "Other Leads")
in the sheet.

## Notes

- Webinar registrations are committed to Supabase first. The registration
  handler mirrors only a new registration, never a duplicate response.
- The webinar tab includes all five UTM fields, `gclid`, `landingPage`,
  `sessionId`, `referrer` and `firstSeenAt`. The last three columns are
  appended after `lastContact`, preserving the positions of historical data.
  `referrer` and `firstSeenAt` come from the existing request attribution and
  are mirror-only additions; the Supabase registration payload is unchanged.
- A successful mirror requires both an HTTP success and `{ "success": true }`.
  Failures appear as `sheets_sync_failed` in `register-webinar` Edge logs, with
  the request ID, registration ID, session ID, HTTP status (when available)
  and failure reason. `sheets-sync` logs `sheet_write_failed` with matching
  request/session IDs and the provider error. A mirror failure does not undo
  a saved registration. There is no automatic retry or historical backfill;
  reconcile a failed row against Supabase before replaying it.
- This replaces the Google Apps Script webhook approach
  (`scripts/google-apps-script/book-a-call-webhook.gs`) — that path is no
  longer used and can be deleted.
- Failures here don't affect the user-facing form: `submitLead()` treats the
  Supabase `leads` insert as the source of truth and only fires this webhook
  best-effort afterward.
- The service account's private key lives only in Supabase's Edge Function
  secrets — it is never sent to or exposed in the browser. Do not build a
  client-side path that calls the Google Sheets API directly with these
  credentials; that would leak the private key to anyone viewing the page
  source.
