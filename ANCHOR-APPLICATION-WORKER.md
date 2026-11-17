# Approved browser application flow — 17 November 2026

Implementation is built and locally validated. **This is not a live job-board pilot sign-off.** No new migration, worker, task, scheduler, production frontend or customer feature flag was deployed in this build. Earlier deployed connection diagnostics and the Starter secret remain as previously verified.

## Implemented behavior

1. Prepare a job-specific CV from the existing profile-fact workflow and approve that CV separately.
2. Prepare an application with an exact HTTPS destination, the approved CV snapshot, candidate answers and cover note. The server selects browser execution only for an enabled, reviewed board and an operator-enabled pilot user with a sufficient configured allowance. Other users/destinations retain manual handoff.
3. Review and approve the exact application. The user separately grants versioned browser-processing consent and explicitly starts the approved run.
4. Reserve usage against an operator-enabled per-user weekly allowance. The worker checks the active Skillsurger plan, approval/hash/expiry/revocation, current CV/job, board revision, independently verified identity and consent before dispatch.
5. Atomically record a dispatch tombstone, lease and fencing generation before the one Anchor v2 Task POST. Only the server resolves the user's provider identity. Concurrent triggers or ambiguous POST outcomes never launch a second submission.
6. The reviewed task fills only approved fields, uploads the approved CV as a PDF and asks the backend for a one-use submit permission immediately before its one submit click. That check revalidates approval, consent, CV, connection, board and budget enablement. Its scoped capability expires after ten minutes and is stored only as a hash.
7. The reference deterministic adapter blocks unapproved outgoing mutations, off-site navigation/exfiltration, early submit attempts and a second submit POST. Unknown required questions or a sign-in page stop the flow; page text is never treated as an agent instruction.
8. A provider `success` status alone cannot mark an application applied. The task must return a receipt bound to the exact action, payload hash, CV version and URL. A confirmed receipt updates the ledger, saved-job tracker and observed outcome memory once.
9. Missing receipts/timeouts/crashes go to reconciliation. Known run IDs are polled without another submit POST. Checks stop after sixty polls; unknown dispatches without a provider run ID wait for operator review. The operator can record an independently checked outcome, with an evidence reference, without retrying the application.
10. Users can withdraw future browser consent or discard an unstarted draft. Disconnect invalidates unused connection callbacks, ownership execution proof and queued runs before vendor cleanup; provider deletion failures retain the mapping for cleanup retry. Dispatched actions remain blocked from resubmission even after a later closed/failed outcome.

## Verification completed

| Evidence | Actual scope/result |
| --- | --- |
| `npm run check:automation` | 14 synthetic database contract groups; 29 Deno HTTP/client/worker/connection checks; six Chromium adapter scenarios; three combined SQL → worker → adapter scenarios |
| `npm run check:agent`, `npm run check:pipeline` | Existing core and CV/outreach contracts pass |
| Deno checks | All three changed Edge entry points type-check |
| Targeted frontend lint and production build | Pass; pre-existing dependency freshness and bundle-size build notices remain |
| `npm run check:automation:ui` with dev server | Approval, consent, one start, receipt, reconciliation without resubmission and consent withdrawal at 360/390/1280 px; no horizontal overflow or page errors |
| Live Anchor browser | A real Starter browser ran the six **intercepted synthetic form** scenarios. Approved upload/receipt worked, revoked approval/unknown question/login stopped, early-submit/exfiltration attempts were blocked, missing receipt remained unknown. Session explicitly ended. No employer endpoint received data. |

Ignored local evidence is under `artifacts/anchor-worker/`: `anchor-browser-evidence.json`, `live-session-evidence.json`, `local-browser-evidence.json`, `e2e-evidence.json`, `ui-evidence.json` and screenshots. The combined SQL/browser tests mock the Anchor v2 Task transport. The real Anchor session tests use CDP; **they do not establish that a production v2 Task or real employer application works**.

Local interactive preview: `http://127.0.0.1:5173/artifacts/anchor-worker-preview/`. It uses the real components with explicitly labelled synthetic data and intercepted APIs; it makes no real applications. The normal project is at `http://127.0.0.1:5173/`.

## Remaining live integration work

- Select an authorized board/application route and an owner-controlled test account. Python.org public listing access was verified earlier; that is not authorization to automate employer submissions. LinkedIn continues as manual handoff until an authorized route is verified.
- Provision and review a board-specific Anchor Task implementing `application_v1`. `automation/approved-application.mjs` is an executable reference for the controlled QA form, **not an uploaded/live Anchor Task or a universal job-board adapter**. Real boards need their own reviewed selectors, required-answer handling, upload behavior and receipt validation.
- Verify the task packaging/runtime against Anchor; the current v2 API starts a task by ID and does not expose a version pin in the reviewed request contract. Treat each reviewed task ID as immutable; create a new task/revision for changes and require a fresh application approval. Do not edit a task while approvals/runs are outstanding.
- Perform real hosted sign-in, then an independent ownership check with the user through an authenticated channel. A callback, same-app membership, metadata or a successful login alone never activates ownership.
- Obtain the continuing per-user weekly/per-run budget and provider-side usage/overage limits. Reservations enforce application admission, **not a hard provider billing cap**. The provider status contract reviewed does not provide actual per-run cost; actual charges remain null until an operator imports measured usage. Unknown costs retain their reservation, including across week boundaries. A measured charge above a reservation pauses further runs for that user.
- Review the privacy/consent copy, deploy to a staging environment, install the scheduler and run a real approved test application on the permitted test route. Verify account separation, approval revocation during a task, real receipts, actual provider usage and disconnect cleanup before any customer rollout. The plan's two-week pilot and broader S1–S15 acceptance gates are not claimed complete.

No account passwords or provider keys belong in browser code, documents, task outputs, Git or chat.

## Deployment order after preview review

1. Apply `supabase/migrations/20261117000000_anchor_application_worker.sql` to the reviewed environment. It creates no enabled boards, budgets or consent. The historical four 10 November migrations are prerequisites.
2. Deploy `skillsurger-automation`, `skillsurger-agent` and `anchor-connect` from this tree. Keep `FF_SKILLSURGER_AUTOMATION` and `FF_SKILLSURGER_CONNECT` off until pilot configuration and ownership checks are ready.
3. Deploy the frontend/privacy copy through the normal preview/review process. `/pricing`, payments, ads, webinar date and host are unchanged.
4. Configure `ANCHOR_APPLICATIONS` in Edge secrets and the matching `skillsurger_automation_boards` row. Required fields: exact site, application/task IDs, reviewed revision, source terms URL/date, operator reviewer and per-run reservation. Do not seed the fictional QA host as a real board.
5. Set a pilot user's `skillsurger_automation_policy` allowance through the service role. Collect the user's separate consent in the UI. Never enable accounts globally by default.
6. Complete and independently verify hosted sign-in. Use the operator endpoint below only with a genuine authenticated confirmation reference.
7. Install `automation/install-schedule.sql` after placing the operator credential in Supabase Vault. The existing project has `pg_cron`, `pg_net` and `supabase_vault` (read-only verification on 17 November). The recipe runs `/tick` each minute only while work is due and reads the credential from Vault; no secret is embedded in SQL. It was not installed during this build.
8. Enable the two flags for the reviewed pilot, then run the real test-account flow before wider release. Turning automation off blocks new dispatches and final submit permissions; status polling can continue to reconcile existing tasks. Do not remove evidence or requeue an unknown outcome.

## API contracts

Base: `/functions/v1/skillsurger-automation`. All routes POST JSON; user routes require the signed-in user's JWT. Operator routes require the service-role credential and are never called by the browser.

| Route | Caller | Body / behavior |
| --- | --- | --- |
| `/context` | User | `{actionId}` → own run, consent and readiness flags; no raw identity or task secrets |
| `/consent` | User | `{enabled, policyVersion:"2026-11-17"}` → versioned permission/revocation for this user |
| `/run` | User | `{actionId}` → idempotent reserve/enqueue/first work; explicit separate approval already required |
| `/refresh` | User | `{actionId}` → bounded check of own existing run |
| `/authorize-submit` | Reviewed task | `{run_id, token}` → `{authorized}`; scoped one-use capability, no user/service key exposed to the task |
| `/tick` | Operator scheduler | `{}` → at most five due runs; leases prevent overlap |
| `/verify-connection` | Operator | `{connectionId,userId,operator,authenticatedConfirmationReference}` → requires pending mapping, configured application, validated provider identity, same-app check **and** independent human ownership confirmation |
| `/resolve` | Operator | `{runId,outcome:"submitted"\|"not_submitted",operator,evidenceReference}` → independently checked site outcome; no retry |
| `/record-cost` | Operator | `{runId,costCredits,usageReference}` → measured provider charge; over-reservation pauses this user's policy |

`skillsurger-agent /application` accepts optional `applicationUrl` alongside `savedJobId` and returns the existing `{action,created}` shape with added payload fields. `/application-close {actionId}` closes only an owned, unstarted draft. Manual `/applied` refuses Anchor-mode actions and rechecks CV approval.

## Anchor Task application_v1 contract

Inputs are strings: `contract_version`, `action_id`, `payload_hash`, `application_url`, `cv_version_id`, `cv_json`, `answers_json`, `cover_note`, `idempotency_key`, `local_run_id`, `submit_authorization_url`, `submit_authorization_token`. The provider identity is resolved from the server-owned mapping and passed in the v2 run request, never accepted from the user. The submit token is a secret capability: do not log or return it.

The reviewed task must return `action_id`, `payload_hash`, `cv_version_id`, `application_url`, `outcome` and a non-empty `confirmation_reference` for `submitted`/`already_submitted`. Other supported outcomes: `needs_login`, `needs_input`, `not_submitted`, `unknown`. Do not guess required answers, confirmation references or receipt status. The server ignores arbitrary task-returned costs.

The task must enforce the same pre-submit capability and request restrictions as the reference adapter, set bounded browser timeouts, avoid unreviewed AI fallback and clean up its session. The worker requests `identity_skip_validation:false`, `cleanup_sessions:true`, `sync:false`.

## Changed files

- New migration: approved-run queue, usage reservations, board/policy/consent storage, ownership evidence, pre-submit capabilities, fenced transitions, bounded reconciliation, manual resolution and private RPCs/RLS.
- New `skillsurger-automation` Edge entry point; new `_shared/automation/{contracts,worker}.ts`; shared Anchor v2 task client and improved included-credit diagnostics.
- Existing `skillsurger-agent` preparation/manual-flow updates and connection disconnect invalidation.
- New `ApplicationExecution.tsx`; pipeline/tracker copy and controls; privacy processing/consent copy.
- Deterministic reference adapter, isolated HTML fixture, scheduler installation recipe and focused check scripts; npm check commands and Supabase function configuration.
- The earlier untracked source DOCX/PDF files were read as context only and are not implementation deliverables to stage blindly.

Official contracts checked: [Anchor task run](https://docs.anchorbrowser.io/api-reference/tasks/run-a-task), [task status](https://docs.anchorbrowser.io/api-reference/tasks/get-task-run-status), [OmniConnect](https://docs.anchorbrowser.io/essentials/omniconnect), [Supabase scheduled Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions), [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart).
