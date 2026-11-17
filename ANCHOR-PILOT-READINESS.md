# Anchor pilot continuation — updated 17 November 2026

The source plans are `anchor-automation-requirements-v2-443e4c1b.docx` and the newer `agent-platform-master-2026-11-08-updated-c5c94e77.docx`. This is a Skillsurger implementation/status update, not pilot sign-off.

## Existing implementation confirmed

- Phase 0 inventory: `PHASE0-DISCOVERY.md` (10 November snapshot; its “no Anchor/no memory” findings precede the subsequent implementation).
- Shared memory schema, external identities, approval-bound action ledger, leased queue: `20261110020000_agent_platform_core.sql`.
- Signed webhook receiver and durable inbox: `anchor-webhook` / `20261110010000_anchor_webhook_inbox.sql`.
- Hosted account connection: `anchor-connect`, disabled unless `FF_SKILLSURGER_CONNECT=true`. Callback identities remain `pending_verification`.
- Factual CV tailoring, separate CV/application approval, manual application handoff, outreach drafts and reports: `skillsurger-agent` / `20261110030000_application_pipeline.sql`.
- All four 10 November migrations and the three Edge functions above are present on the hosted Supabase project. Presence is not evidence of a complete Anchor application run.

## Live check on 16 November

Historical check at `2026-11-16T11:23:11Z`. The local readiness evidence file now contains the newer check below.

| Check | Observed result |
| --- | --- |
| Supabase Anchor API key / webhook signing secret | Both present; secret values never returned |
| Anchor authentication | Billing and application-list GET requests accepted |
| Account tier returned by Anchor | `monthly_free` |
| Available credits returned by Anchor | `0` |
| Provider cost limit returned | `null` (not proof of a configured spending cap) |
| `ANCHOR_APPLICATIONS` mapping | Missing; no configured job board |
| Customer connect feature flag | Off |
| Private `/readiness` | HTTP 200 with service-role credential |
| Anonymous `/readiness` | HTTP 403 |
| Public `/sites` while feature off | HTTP 404 |
| Final deployed `anchor-connect` | ACTIVE, version 3 |
| Live RLS metadata | Enabled on all nine checked agent/inbox/tailored-CV tables; this alone does not prove every ownership policy |

## Updated key and plan check on 17 November

The owner supplied a replacement key and confirmed the Starter subscription. Updated only `ANCHOR_API_KEY` in the hosted Supabase secret store; the key was not written to a repository file or returned in logs. No function redeployment was needed.

Evidence: ignored local `artifacts/anchor-continuation/readiness.json`, checked at `2026-11-17T04:28:37.510990+00:00`.

- Billing and application-list GET requests succeed with the new key. Anchor now reports `tier: monthly_starter`, confirming the plan through the running Edge function.
- Anchor's billing response still reports `credits: 0` and `cost_limit: null`. These fields alone do not establish the Starter plan's included usage or whether a browser session can run; no billable session was started.
- Private readiness remains HTTP 200; anonymous readiness remains HTTP 403.
- No job board is mapped and customer connections remain disabled (public `/sites`: HTTP 404).
- No billing, budget, feature-flag, webhook-secret or job-board configuration was changed.

## Live public job-board test — 17 November

The owner authorized choosing a board and testing it. Selected the public [Python.org Job Board](https://www.python.org/jobs/) for a single read-only browser session. Its [robots policy](https://www.python.org/robots.txt) does not disallow `/jobs/`; this does not establish permission for automated submissions or account actions.

Evidence: ignored local `artifacts/anchor-continuation/public-board-probe.json`, listing screenshot `python-jobs-listing.png` and detail screenshot `python-job-detail.png` in the same directory. Test ran `2026-11-17T04:34:03.897Z`–`2026-11-17T04:34:22.426Z`.

- **PASS:** Anchor created a real browser session and Playwright connected over the returned CDP endpoint.
- **PASS:** Public job listing page returned HTTP 200 and exposed 21 listing rows. Extracted three real titles and URLs.
- **PASS:** Opened the first listing, [Internet Measurement Researcher (Censorship & Proxies)](https://www.python.org/jobs/8213/). Detail page returned HTTP 200 and its heading matched the listing title. Captured screenshots of both pages.
- **PASS:** Explicitly terminated the created session through Anchor's session-specific DELETE endpoint. Session also had a two-minute maximum duration, one-minute idle timeout, no proxy, no CAPTCHA solver, no persistent identity and no video recording. The browser was limited to `python.org`; non-read HTTP methods were blocked.
- Billing immediately before the test reported `monthly_starter`, `included_credits: 50`, `credits_used: 0`, `credits: 0`. **The `credits: 0` field did not prevent session creation**; the earlier diagnostics omitted included credits. These are pre-run fields, not a measured cost for this test.
- No accounts, logins, job applications, messages, production board mappings or customer feature flags were created or changed. Paid plan/billing settings were not changed.

This verifies the key, Starter session allocation, remote browser control, public listing extraction, detail navigation and cleanup. It does not verify Skillsurger's authenticated account-connection flow, identity ownership, approval-to-submit worker, webhook reconciliation or an end-to-end application. Customer connections remain disabled pending those checks.

## Application worker build — later on 17 November

The approved-run worker, one-use final submit permission, dashboard controls, deterministic QA adapter and isolated checks are now implemented locally. A real Anchor browser passed the controlled synthetic-form checks and was closed. This build is not deployed or a real job-board application sign-off. See `ANCHOR-APPLICATION-WORKER.md` for verification scope, preview, remaining live-task/account gates and deployment order. The older "not implemented" statements below describe the earlier continuation.

## Changes in this continuation

- Added operator-only `GET /functions/v1/anchor-connect/readiness`, using the service-role credential. It remains accessible to the operator while customer connections are disabled, never returns provider keys/raw responses, and makes only two provider GETs (`/v1/billing`, `/v1/applications`). It creates no sessions, identities, tasks or applications.
- Prevented pending callback claims from rewriting Anchor identity metadata or deleting an unverified identity on disconnect. Same-application membership does not prove user ownership. Unverified claims are removed locally; any vendor cleanup requires operator verification. Independently activated connections still request vendor deletion before deleting the local mapping; provider failure preserves the mapping for retry.
- Validated configured domain/application-ID pairs and rejected inherited object property names as application selections.
- Disabled provider redirects so the API key cannot be forwarded to another host. Empty successful DELETE responses remain supported.
- Deployed the `anchor-connect` update only. No billing changes, feature-flag activation, payment changes, account creation, external submissions or other product deployments.

## Next steps that need owner input

1. Starter authentication and a single owner-authorized public browsing run are verified. Included credits are reported above. Agree a continuing per-user usage budget before ongoing automation.
2. Python.org public browsing is verified. Select the first board for authenticated applications and check its current automation terms/authorized routes; use manual handoff where permission is absent or unclear.
3. Create/select the corresponding Anchor Application, then set `ANCHOR_APPLICATIONS` in Supabase secrets as a JSON domain-to-application-ID mapping. Example shape only: `{"jobs.example.com":"application-id"}`. Never configure the example as a real board.
4. Establish independently verified identity ownership (provider-attested binding or a documented trusted operator check). Neither callback parameters, successful login, metadata written by our server nor buying a plan proves that binding. Do not activate pending connections on those signals alone.
5. Set the per-user usage budget/cap, verify the webhook delivery configuration and perform a test-account connection/disconnection run. Continue with the budgeted task worker, reconciliation and evidence capture, then the S1–S14 acceptance tests and two-week pilot. Full browser submission automation is not yet implemented or verified.

## Validation

```sh
deno test --no-lock --allow-env=ANCHOR_API_KEY,ANCHOR_APPLICATIONS,ANCHOR_WEBHOOK_SECRET,FF_SKILLSURGER_CONNECT supabase/functions/anchor-connect/handler.test.ts supabase/functions/_shared/anchor.test.ts
deno check --no-lock supabase/functions/anchor-connect/index.ts
npm run check:agent
npm run check:pipeline
```

All 14 focused checks passed, as did the Deno type check and both existing schema suites. The focused checks cover callback replay/expiry, cross-user claims, operator-only diagnostics, configuration validation, no vendor mutation/deletion from unverified claims, provider deletion failure and empty DELETE responses. Existing in-memory schema suites cover RLS, approvals, ledger deduplication and pipeline constraints. These checks do not substitute for a real job-board connection/submission test.

Official contracts checked on 16 November: [OmniConnect](https://docs.anchorbrowser.io/essentials/omniconnect), [identity tokens](https://docs.anchorbrowser.io/api-reference/applications/create-identity-token), [identities](https://docs.anchorbrowser.io/api-reference/identities/get-identity), [application identities](https://docs.anchorbrowser.io/api-reference/applications/list-application-identities), [billing](https://docs.anchorbrowser.io/api-reference/billing/get-billing-info).
