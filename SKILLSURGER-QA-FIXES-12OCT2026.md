# QA report fixes — 12 October report, implemented 14 October 2026

Source: `skillsurger-qa-bugs-12-oct-2026-be4786db.pdf`. The report contains fourteen numbered items. This record distinguishes local code verification from production configuration and delivery.

| Report item | Change or verified behavior | Verification / remaining work |
| --- | --- | --- |
| 1. Unsupported marketing claims | Removed homepage counters, unverified named testimonials, unsupported success/improvement percentages, percentile claims, and structured-data rating. Kept explicitly labelled sample previews. | Browser checks plus source scan. |
| 2. Webinar confirmation | Added a server-side email receipt containing schedule, WhatsApp group and calendar link. It runs after persistence, claims one outbox record, and never automatically repeats an ambiguous send. WhatsApp template integration is retained. Confirmation pages distinguish accepted, pending and failed/unconfigured delivery. | Mock delivery, duplicate and failure checks pass. Production sender configuration and actual receipt remain pending; no Supabase CLI access token is available. |
| 3. Empty learning paths | Reject empty generation before saving; Python/AWS profiles get official resources if AI output is empty. Existing empty paths can be regenerated into their existing row. Counts say resources rather than calling every guide a course. | Contract and browser generation/retry checks. |
| 4. Location ignored | Onboarding saves preferred location and profile city. Existing missing cities are backfilled by migration. Both job-search entry points use preferred location, normalize Bangalore/Bengaluru, send country code, and filter out mismatched locations. Removed implicit US default; preserve actual published currencies, including INR. | Browser checks assert Bangalore request, India results and INR pay. |
| 5. Audit validation / heavy form / receipt | Name, email and PDF are required; contact/role details are optional and collapsed. Invalid numbers have field-specific feedback before upload and on server validation. Valid international numbers and omitted phone are accepted. Added validated, rate-limited, idempotent server submission and receipt flow. Reuse uploaded PDF on retry. | Browser and server checks cover invalid/local/server errors, optional phone, retry and email result. Actual email receipt requires production setup. |
| 6. Missing source metadata | Build generates per-route title, description, canonical, OG and Twitter tags directly from React SEO props and page data. Added real 1200 × 630 PNG preview; fixed relative OG URLs. Preserved FDE curriculum prerender. | Source metadata checked on all 53 generated routes, plus existing FDE route. |
| 7. Saved job stale state | Dashboard URL is the source of section state, eliminating conflicting history/state effects. Saved-job mutations notify subscribers; Mentorship Hub refreshes on mount/tab/focus/event. Search results no longer delete or automatically replace saved jobs. | Browser save → interview selector without reload. |
| 8. Interview discovery | Existing empty-state button to Career Explorer verified; Save Job has stronger visual emphasis. Blocking tour no longer opens automatically on dashboard. | Browser empty state → find job → save → mentorship. |
| 9. Initial paywall | Removed subscription prerequisite for authenticated profile/dashboard access. New users can complete their profile without landing on pricing. AI subscription gates and paid checkout remain intact. Public job search is accessible to guests. | Browser account without subscription stays on Profile. |
| 10. CV onboarding promise | Copy explicitly directs users to upload a CV in Profile after onboarding. | Browser checks visible copy and saved location. |
| 11. Public job search | Added progress text, time-aware waiting message, result counts, location/experience/date filters, and expandable descriptions. Requests have bounded timeouts and do not retry outages with an alternate payload. | Guest browser loading, filtering and description checks. |
| 12. Accessibility / layout / labels / mentor | User-type choices are native keyboard buttons with selection state. Dashboard starts with mobile sidebar closed and keeps content shrinkable. ATS label uses correct capitalization in scoring and enhancement. Mentor sessions start with a greeting, older empty sessions have a visible prompt, and response waits have progress text. | Keyboard and 320/390/768/1280 dashboard checks; mentor greeting check. |
| 13. Signup enumeration | Same generic notice for an already registered email and signup awaiting confirmation; unauthenticated signup does not upload CVs or write profiles. Login link remains available. | Browser both responses, zero unauthenticated profile writes. Remote Supabase Auth settings must also be verified for backend enumeration protection; UI copy alone does not change the Auth API response. |
| 14. Watch list | Hide Human Mentors when no mentors are available. Rename badge to “Quiz: Perfect Score”. Keep sample audit label. Existing booking alias, password recovery and synthetic PDF/DOCX parsing are included in regression checks. | Existing tracker browser suite and report checks. |

## Production prerequisites for receipts

The updated audit form requires its new endpoint. Deploy backend prerequisites before deploying this frontend.

1. Apply outstanding migrations in chronological order, including `20261014000000_reschedule_webinar_october_24.sql` and `20261014010000_lead_confirmations_and_audit_validation.sql`. The latter adds email outbox/audit request storage, restricts audit inserts to the validated endpoint, updates webinar RPC results and backfills missing profile locations.
2. Update the existing Google Apps Script deployment with `scripts/google-apps-script/book-a-call-webhook.gs`. In Script Properties set `LEAD_CONFIRMATION_WEBHOOK_SECRET` to a server-only secret; authorize MailApp. Confirmation requests require that secret and deduplicate by lead UUID. Existing sheet/owner notification behavior remains available.
3. Set Supabase Edge secrets `LEAD_CONFIRMATION_WEBHOOK_URL` to the script deployment URL and `LEAD_CONFIRMATION_WEBHOOK_SECRET` to the same secret. Keep these out of `VITE_*` variables. Update `WEBINAR_ALLOWED_ORIGINS` to exact production/staging origins.
4. Deploy `register-webinar` and `register-resume-audit`. Preserve `whatsapp-status`, the existing WhatsApp secrets/template and `sheets-sync`. Use exactly one sheet-sync path per lead; avoid an INSERT database webhook and direct edge sync both appending the same row.
5. Deploy the frontend only after the new endpoint and migration are applied. On an owner-controlled address/number, verify a real webinar and audit receipt, schedule, link, one outbox record, no repeated send, and signed WhatsApp status if that sender is enabled. Accepted mail requests are not inbox-delivery evidence.

Email records in `failed` or `sending` need operator review before a retry because the provider may have sent a message. Known `unconfigured` records can safely be retried after configuration. [Google MailApp quotas](https://developers.google.com/apps-script/reference/mail/mail-app#getRemainingDailyQuota()) apply; monitor the outbox and provision a production sender appropriate to actual volume.

## Local checks

- `npm run build`: passed; production bundle and 53 routes with metadata plus full FDE prerender.
- Report contract checks, isolated PostgreSQL, mocked Edge handlers and all **11** report browser scenarios passed. Re-run them with `npm run check:qa-report`.
- `npm run check:tracker`: all six existing suites passed, including 12 browser cases for curriculum, CV/storage, ads, recovery and PDF/DOCX parsing.
- `git diff --check`.
- Repository TypeScript check: untouched HEAD has 98 distinct diagnostics, current code has 94; **zero new diagnostics**. The existing repository errors still prevent a clean full TypeScript check.

All external requests in browser/Edge tests are mocked. No live messages, real payments or production data cleanup were performed. The PDF and original spreadsheet inputs remain unchanged. Listed synthetic test-data deletion is an operational task separate from the reported product bugs.

Supabase documents signup behavior separately from the app UI: [signUp API reference](https://supabase.com/docs/reference/javascript/auth-signup). Verify new and existing addresses against the production Auth API before marking enumeration protection complete.
