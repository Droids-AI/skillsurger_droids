# Skillsurger tracker implementation and release checks

Scope: DEV-001 through DEV-020; apply DEV-079 through DEV-083 only to Skillsurger. Other products are excluded. The source tracker and independent QA status remain unchanged until an independent tester records evidence.

Current per-task results and applicable QA fields: [Skillsurger status](SKILLSURGER-STATUS.md). The original review describes the pre-change baseline.

## Implemented behavior

- One gtag loader configures AW-994095654 and AW-18357417979. The webinar conversion uses `AW-18357417979/018aCPbEh5gdEPvvv7FE` and the server registration ID. It fires on a new successful registration response only, guarded by session storage and an in-memory set.
- Saturday, 17 October 2026 at 3:00 PM IST appears in the hero, registration card, below the form and confirmation. The session lasts 60 minutes. Registration closes at the start time on the server.
- `register-webinar` validates contact fields, origin, session and rate limit. Its service-only SQL transaction locks normalized email/session, preserves existing registration, and creates one lead plus one notification record. Anonymous clients cannot read registrations or bypass the endpoint using direct webinar lead inserts.
- A new registration sends one WhatsApp template after persistence when configured. Provider acceptance is not labelled delivered. Signed Meta status callbacks log delivery/read/failure, without allowing out-of-order regressions. Failed/unconfigured delivery keeps the registration and shows a support path. An uncertain send is not automatically repeated.
- The original free form, INR 9,999 one-month offer, eight two-hour sessions including two personal sessions, salary disclaimer and unrelated thank-you flows remain.
- Public Job Readiness Index uses PDF.js and Mammoth for PDF/DOCX, surfaces unreadable/scanned files, and matches complete skills. Java is not inferred from JavaScript. Java and REST have specific questions; unsupported skills do not receive a generic version-control question or invented verification. Quiz results use actual answers.
- CV uploads persist owner-prefixed object paths. Viewing/downloading obtains a fresh 60-second signed URL. Legacy URL references are converted before signing. The migration makes the bucket private and adds restrictive owner fences, including against broad legacy policies.
- CV enhancement performs factual formatting only, requests verified missing metrics/projects, and does not overwrite structured profiles. This intentionally removes generative embellishment rather than trusting an unverified AI rewrite. The equivalent Skillsurger-only API helper has also been applied to the sibling Intervue-Backend checkout; it needs its own deployment.
- Learning resources are labelled course candidates/resources with unknown price/level and no invented ratings. `verify-courses` checks provider HTML and matching Course structured data before showing verified identity; price remains unknown and level is used only when supplied by the provider. Failed/blocked checks remain unverified. Legacy saved paths are normalized on load; regenerated/updated paths go through the same verifier. Domain matches, opaque CORS responses and AI claims no longer count as verification.
- `/book-diagnosis` redirects to `/book-a-call` in both the router and Netlify configuration. Forgot/reset password support requests, PKCE recovery, expired-link recovery, password update and sign-out.
- `/forward-deployed-ai-engineer` renders the workbook's exact 18 sections/156 curriculum items and two capstones, mobile layouts, keyboard-operable curriculum, SEO/OG metadata and the supplied Udemy URL. Overview/prerequisite copy is derived conservatively from curriculum topics. Full parity with the separate spec/course JSON awaits those source files.
- Resume/profile-content debug logs were removed from the affected client flows. Controlled error context has correlation IDs. Staging account setup is provided and refuses the known production project.

## Local verification

Run:

```powershell
npm.cmd install --no-audit --no-fund
npm.cmd run build
npm.cmd run check:tracker
```

The checks use synthetic resumes, an in-memory PostgreSQL instance and mocked providers; they create no live leads/messages. Browser evidence is saved under `artifacts/tracker-browser-evidence.json`; screenshots under `artifacts/`. The SQL test advances only the isolated fixture's registration deadline for repeatability and separately verifies closure. It checks real PostgreSQL uniqueness and RLS, but does not substitute for live Storage API/signed-URL expiry tests.

## Deployment prerequisites and order

1. Confirm the staging project/hostname. Set staging account variables and run `node scripts/create-skillsurger-qa-accounts.cjs --create`. Its credential file is ignored; never paste its content in issues or commits. Configure Meta test recipients/sender, a provider sandbox and a controlled QA email inbox.
2. Authenticate the Supabase CLI locally. Confirm the project reference before applying migrations. This session found no CLI access token. Do not run all historical migrations blindly on a populated project: review remote migration history and apply the two new migrations only after staging verification and backup.
3. Deploy `register-webinar`, `whatsapp-status` and `verify-courses`. They are public endpoints with their own validation; `supabase/config.toml` disables gateway JWT verification for them. The course verifier accepts only an allowlist of HTTPS provider course paths, restricts redirects, caps page size and rate-limits batches. Service-role keys stay server-side.
4. Set server secrets: `WEBINAR_ALLOWED_ORIGINS` (comma-separated exact staging/production origins), `RATE_LIMIT_SALT`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_GRAPH_VERSION` (supported provider version), `WHATSAPP_WEBINAR_TEMPLATE`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WEBINAR_JOIN_URL`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. The approved template must have body parameters in the exact order: name, schedule, private joining URL. Confirm the owner's existing sender before enabling any send.
5. Configure Meta status callbacks to `/functions/v1/whatsapp-status`. Verify challenge and signed payloads. Review `webinar_notifications` using an authorized admin; do not expose it through an anonymous dashboard. Pending/sending/unknown deliveries need operational review; never blindly resend an uncertain provider request.
6. Configure a server-side `leads` INSERT database webhook to `sheets-sync` for webinar leads. The new webinar flow does not append directly from the browser. Avoid parallel browser/webhook writes for the same webinar lead. Set/verify the actual spreadsheet ID and sharing; record its URL and a real-time test append. Durable Google-side retries and the target sheet link require operational configuration and are not claimed by local mocks.
7. Add exact `/reset-password` origins to Supabase Auth redirect allowlists. Test actual email delivery, an expired link and a valid recovery link. Synthetic `.invalid` accounts are not email-delivery tests.
8. Deploy the sibling Skillsurger API helper if other clients use that backend, then the frontend after the registration endpoint and storage migration are verified. Keep the frontend on the prior commit until backend prerequisites pass; the new frontend requires the new endpoint.
9. Verify the supplied Udemy draft URL is publicly accessible while logged out. Anonymous HEAD/GET returned HTTP 200 but `course_landing_page_limited_access` and `view_restriction: true`; it is not a public enrolment page. The CTA is labelled as an availability check. Do not claim it is a launched public course. Obtain the referenced full spec/JSON before signing off content parity.

## Independent QA and release record

For each applicable case, record result, tester, IST timestamp, environment, deployed commit, URL and evidence. Cover QA-001–011, QA-029, QA-036 and QA-037. Also test booking submission and forgot-password recovery. DEV-006 is P1 in the task sheet, but WhatsApp delivery QA-037 is P0.

Before ads point to a release:

- Record previous/new frontend and backend commits, staging/production URLs, Supabase migration history and deployment time.
- Tag Assistant/DevTools: zero conversion on load/invalid/failure/other routes; one on accepted new registration; transaction ID matches; refresh/double click/existing registration does not duplicate. Share the real synthetic registration's time with the owner. Ads reporting may lag.
- WhatsApp: one private join link to the controlled registered number after persistence; no send on failed registration; delivery receipt logged; failed delivery recovery works.
- CV Storage: anonymous original URL denied, owner authenticated access works, other owner denied, fresh signed URL expires. Old public CDN caches may require invalidation by the storage operator.
- Test fresh/existing accounts and logged-out mobile/desktop flows with non-customer fixtures. Compare PDF/DOCX skills and quiz questions; corrupted/scanned resumes surface an error.
- Independently check CV factuality and course labels. Compare all course items and capstone labels against the workbook plus full spec when supplied.
- Rollback: redeploy prior frontend before disabling the registration endpoint. Keep persisted registration IDs/notification logs and the private bucket; never restore public CV access as a rollback. Roll back the sibling helper from its recorded original file/commit only after review.

Local developer checks cannot supply independent QA signoff, production deployment evidence, a real WhatsApp receipt, live Ads reporting, a sheet link or public Udemy availability.

References: [Supabase password recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl), [Google conversion measurement](https://developers.google.com/tag-platform/devguides/conversions), [PGlite local PostgreSQL](https://pglite.dev/docs/).
