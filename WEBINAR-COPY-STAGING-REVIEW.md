# Webinar copy and Sheet mirror review — 25 October 2026

Status: local review only; not pushed or published.
No application frontend or registration/mirror function deployment was performed.
An explicitly requested, separate QA email was delivered through a temporary
checker and the checker was removed. Full staging QA remains pending the staging
URL/project, Sheet access and a controlled QA phone number.

Email follow-up: on 25 October the owner confirmed `em3116.skillsurger.com`.
A read-only live-secret digest comparison verified that the existing From
address is already `support@em3116.skillsurger.com`. The owner then confirmed
Twilio Email and requested reuse of TransformBuddy's email functions. That
follow-up changes the shared confirmation transport locally, as documented
below; sender settings and production remain unchanged.

## Email adapter follow-up

The new `_shared/twilio-email.ts` adapter is based on TransformBuddy's existing
implementation. It sends explicit text/escaped HTML through the same Twilio
Email endpoint and Basic authentication, and accepts the provider's non-empty
operation ID after HTTP 202. `confirmationEmail.ts` uses it for both webinar
and resume-audit confirmations. The previous receipt ledger, duplicate-send
guards, enable switches, email text and configured From address are retained.
No reminder or Auth-hook changes were made. Deno checks passed for both
registration handlers. One owner-requested QA email through the exact adapter
was accepted by Twilio (HTTP 202) on 25 October at 13:01:06 UTC and subsequently
reported delivered (`COMPLETED`, `total=1`, `delivered=1`, `failed=0`). Operation:
`comms_operation_01m5sjd18yfb2r9acgy0pjgfjb`. The application registration handlers
remain undeployed; see `TWILIO_WEBINAR_EMAIL_SETUP.md`.

## Preview and evidence

- Local page: <http://127.0.0.1:5173/job-search-copilot-webinar>
- Browser evidence: `artifacts/webinar-copy-review/local-preview-evidence.json`
- Screenshots: `artifacts/webinar-copy-review/hero-360.png`,
  `hero-desktop.png`, `coverage-360.png`, `programme-360.png`, `faq-360.png`.
- These are local previews, not staging registration evidence. No registration
  was submitted, and no QA lead or registration conversion was generated.
- Separate one-off email evidence: `artifacts/email-send-check/send-result.json`
  and `status-result.json`. This check used the owner-supplied verification
  inbox without creating a registration or exercising Ads/Sheet integrations.

## Changes

The hero uses the supplied headline, subtext, button label and free/60-minute
line. The new coverage section follows the hero. The existing good-fit/poor-fit
section and minute-by-minute agenda remain unchanged. The final countdown is
removed. The supplied optional programme explanation and two-question FAQ sit
above the footer. Both programme links point to `/pricing` with existing UTM
preservation. `/pricing` itself is unchanged.

The supplied PDF explicitly describes its five testimonials as fictional
mockup material. None of its quotes or personas was added to the page. The
existing sample-data disclaimer is unchanged. No ratings, audience counts,
scarcity statements, outcome guarantees or new tools were added.

The Google Sheet mirror retains all existing columns in their original
positions and adds `sessionId`, `referrer` and `firstSeenAt` at the end.
It carries all attribution fields from the existing collector:
`utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `gclid`,
`landingPage`, `referrer` and `firstSeenAt`.

The original seven flattened attribution fields are already part of the
Supabase payload. `referrer` and `firstSeenAt` are added only to the Sheet
request. The Supabase payload and registration RPC call are byte-identical
to baseline `b81f15e`; no schema or persistence behavior changes are included.

The registration handler now checks both the Sheet response HTTP status and
`success: true`. A failure produces a structured `sheets_sync_failed` error
with request, registration and session IDs, HTTP status when available, and
a safe failure category. The Sheet handler logs `sheet_write_failed` with
request/session IDs and the provider error. A failed mirror does not undo the
authoritative Supabase registration. Existing duplicate protection and the
new-registration-only mirror call are unchanged. No retry/backfill was added.

## Verification performed

| Check | Result and limits |
| --- | --- |
| Production build | Passed, including metadata generation for 54 routes. Existing chunk-size/browser-data warnings remain. |
| Frontend lint | Targeted ESLint passed for the changed React files. |
| Edge type checks | Deno checks passed for `register-webinar` and `sheets-sync`. |
| Mobile order | Checked at 360 × 800. Coverage follows hero; programme explanation and FAQ are the final sections before footer. Document width is 360px; no horizontal overflow. |
| CTA and FAQ | Hero CTA focuses `webinar-name`; both FAQ answers open correctly. No page runtime errors were observed. |
| Countdown/proof | Zero countdown elements. Existing sample-data disclaimer remains. No PDF testimonials used. |
| Tags in local browser | Both Ads configurations `AW-994095654` and `AW-18357417979` present. Google tag script returned HTTP 200. Delayed Clarity `sybddksu04` loaded with HTTP 200 and its collection request returned HTTP 204. This does not verify Ads conversions or Clarity dashboard reporting. |
| Preserved source | Form, client POST, attribution collector, confirmation page, reminders, analytics files, HTML tags and `/pricing` source match baseline `b81f15e`. Audience and Supabase payload/RPC fragments also match. Hashes in the browser evidence JSON were captured before the later owner-requested shared email adapter change. The earlier email-sender hash is historical evidence, not a claim that the current adapter still matches the baseline. |
| One-off email | Owner-authorized QA email accepted and subsequently reported delivered by Twilio. No registration, Sheet row or Ads conversion created. This does not replace the required full staging flow. |

No automated test suite or test cases were added or run. Browser inspection
was limited to navigation, reading runtime state and screenshots.

## Required staging QA — not yet completed

1. Obtain the staging frontend URL, its Supabase project, Sheet read access
   and an owner-controlled QA phone. An email inbox was supplied and used for
   the separate one-off delivery check. The current local configuration
   points to the production project, `jpnunlbnthcfvstyymdl`; it must not be
   presented as an isolated staging environment. Repository deployment and
   hosting checks did not expose a staging URL.
2. Deploy the reviewed changes to staging only, retaining the existing
   registration, confirmation, messaging and tracking integrations.
3. Make one clearly marked QA registration through the real form with known
   campaign values. Record the POST response/request ID and registration ID;
   verify one Supabase registration and lead, then compare its attribution
   with the Sheet row. Inspect the mirror-only fields separately. Resubmit
   the same contact and refresh confirmation; verify row counts and IDs.
4. Record the actual returned `emailStatus`, the message rendered on the
   confirmation page, and the matching notification receipt. Accepted means
   queued by the provider, not inbox delivery. Do not change sender settings
   or email/reminder behavior in this task.
5. Verify real form-submit and registration events plus conversion duplicate
   prevention in the staging browser. Keep QA-labelled records out of genuine
   lead reporting. Suppress QA conversion delivery in the QA browser, without
   changing site integrations, so the registration is not imported as a real
   Ads lead.
6. Share the staged URL, registration/Sheet comparison, email outcome and
   tracking evidence for owner review. Publish only after that review.

## Ads mapping and reporting

Existing source maps a new successful registration to
`AW-18357417979/018aCPbEh5gdEPvvv7FE`, using the registration ID as
`transaction_id`. It skips `alreadyRegistered` responses and uses in-memory
and session-storage guards. `webinar_form_submit` tracks a valid submit
attempt; `webinar_registered` runs only for a newly saved registration.
The second Ads tag, `AW-994095654`, remains configured; the application has no
explicit webinar conversion call for that tag. No mapping was changed.

Runtime conversion mapping and duplicate prevention: **pending staging QA**.
Actual conversions appearing in Google Ads: **not verified**. No Ads reporting
access was available and no genuine conversion was attempted. A debugger or
data-layer event will not be reported as proof of an Ads dashboard conversion.

## Changed files

| File | Purpose |
| --- | --- |
| `src/pages/JobSwitchCopilot.tsx` | Supplied hero, coverage, optional programme and FAQ; remove countdown. |
| `src/components/jobSwitchCopilot/CopilotLandingLayout.tsx` | Webinar footer soft link to `/pricing`. |
| `supabase/functions/register-webinar/index.ts` | Mirror-only attribution/session additions and response/failure visibility. |
| `supabase/functions/sheets-sync/index.ts` | Append mirror columns and correlate failure logs. |
| `supabase/functions/sheets-sync/README.md` | Document mirror fields and operational log handling. |
| `supabase/functions/_shared/twilio-email.ts` | Adapt TransformBuddy's Twilio Email sender for Skillsurger's existing switches and brand. |
| `supabase/functions/_shared/confirmationEmail.ts` | Use the reused adapter while retaining the receipt ledger and duplicate-send protections. |
| `TWILIO_WEBINAR_EMAIL_SETUP.md` | Record the confirmed domain/provider, configuration evidence and adapter reuse. |
| `WEBINAR-COPY-STAGING-REVIEW.md` | Scope, evidence, limits and staging handoff. |

The user-supplied PDF remains untouched and untracked. Local browser artifacts
are ignored by Git. No database migration is needed for the prepared changes.
