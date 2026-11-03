# Skillsurger Supabase API migration

Skillsurger's normal application APIs now run directly in the `skillsurger-api` Edge Function on project `jpnunlbnthcfvstyymdl`. The frontend sends the same JSON bodies and consumes the same response envelopes. Payment/subscription endpoints and webhooks remain unchanged on Intervue-Backend.

## Routes and compatibility

Base URL: `https://jpnunlbnthcfvstyymdl.supabase.co/functions/v1/skillsurger-api`.

| Existing backend route | Edge route suffix | Response |
| --- | --- | --- |
| `POST /api/v1/openai/skillsurger` | `/openai/skillsurger` | `{ success: true, code: 200, data: ... }` |
| `POST /api/v1/candidate/jobs` | `/candidate/jobs` | `{ success: true, code: 200, data: [...] }` |
| `POST /api/v1/masterclass/submit` | `/masterclass/submit` | `{ success: true, code: 200, data: { message: "Submitted successfully" } }` |
| `/api/v1/dodo/*` | **Not migrated** | Existing backend and schemas unchanged |

Business failures retain `{ success: false, message }`. CV scoring/enhancement preserve `event: progress`, `event: complete` (`{ success, data }`) and `event: error` (`{ success: false, error }`). JSON and SSE callers are both supported. Invalid JSON/inputs and unsupported actions return 400; missing/invalid login returns 401; disallowed origins or inactive plans return 403. These validation/access responses are deliberate additions; valid request and response bodies remain compatible.

All normal AI/job requests now carry `Authorization: Bearer <Supabase user session token>` and the public `apikey` header. Existing `type` and payload fields are unchanged. The masterclass form remains public and rate limited. No provider secret is shipped to the frontend.

The 19 existing dispatcher actions were migrated, and the frontend's previously unhandled `generateFresherLearningPlan` action now has a real implementation:

- CVs: `analyzeCVText`, `scoreCVText`, `enhanceCVText`, `generateCVSuggestions`, `generateFresherCV` (both existing input variants).
- Career/learning: `generateCareerOptions`, `generateVerifiedLearningResources`, `generateVerifiedCareerPathLearningResources`, `generatePersonalizedLearningResources`, `updateLearningPathFromFeedback`, `initiateLearningPathUpdate`, `getLearningPathUpdateStatus`, `generateFresherLearningPlan`.
- Mentor/interviews: `startAIMentorshipSession`, `sendMessageToAIMentor`, `generateInterviewResponse`, `endInterview`.
- Search/referrals: `findJobsBasedOnProfile`, `findHiringManager`, `revealHiringManagerEmail`.

Compatibility is checked against the original controller/service contracts and frontend interfaces. AI-generated wording and current provider results are not byte-for-byte fixtures. Existing handlers in Intervue-Backend remain available for older clients, but the migrated frontend does not use them as a fallback.

## Runtime and state

- GPT-4.1 and the existing Skillsurger prompts handle AI operations. The port includes only Skillsurger code; TransformBuddy services were not migrated or edited.
- Fresher-CV responses retain their existing fields but use only supplied profile/education facts; missing projects, work history and certifications remain empty. The legacy instruction to invent these qualifications is not carried over.
- CV formatting retains the app's existing deterministic, fact-preserving formatter and `canApplyToProfile: false` behavior.
- Optional interview-image feedback uses GPT-4.1 vision with the same optional video-feedback fields. It returns no video assessment when the frames cannot support one. The UI no longer labels this as Gemini.
- Job search calls SerpAPI and JSearch directly, preserving the existing raw job DTO fields and city/full-location/country fallback. The new cache does not store failed/empty searches as successful results.
- Learning resources come from provider-indexed links and the app's existing official skill guides. Verified course identity is checked using the existing provider-page evidence helper. Unknown prices/difficulty stay unknown; ratings are not invented. Official guides remain available when a search is unavailable or has no results.
- Learning-task status lives in Supabase, not an in-memory Map. Background work uses `EdgeRuntime.waitUntil`; task reads are scoped to the authenticated user. A task still processing after five minutes becomes a retryable failure.
- The migration adds only `skillsurger_learning_tasks`, `skillsurger_jobs_cache`, `skillsurger_api_rate_limits` and its private rate-limit RPC. These tables have RLS enabled and grant no direct access to `anon` or `authenticated`.
- Access checks read the existing subscription records without changing the payment model or making an Intervue API call. The frontend's subscription UI still uses its unchanged Dodo endpoint.

Migration `20261103000000_skillsurger_edge_apis.sql` is already applied to the hosted project. No manual migration is needed for this release.

## Secrets and deployment

The new function uses `OPENAI_API_KEY`, `SKILLSURGER_AI_MODEL`, `SERPAPI_KEY`, `JSEARCH_API_KEY`, `HUNTER_API_KEY`, `LUSHA_API_KEY`, and three separately namespaced masterclass Sheet secrets: `SKILLSURGER_MASTERCLASS_SHEET_ID`, `SKILLSURGER_MASTERCLASS_CLIENT_EMAIL`, `SKILLSURGER_MASTERCLASS_PRIVATE_KEY`.

Only those new secrets were configured. Existing email/Sheets/payment secret digests were compared before and after and remained unchanged. Existing registration, email, reminder and payment functions were not deployed or edited.

```sh
DENO_DIR=/tmp/skillsurger-edge-deno deno check --no-lock --node-modules-dir=none supabase/functions/skillsurger-api/index.ts
supabase functions deploy skillsurger-api --project-ref jpnunlbnthcfvstyymdl --use-api --no-verify-jwt
npm run build
```

`verify_jwt = false` is required because the router also serves the public masterclass form. AI and job routes independently validate the user JWT with Supabase Auth, verify active access and enforce per-user rate limits before invoking providers.

## Verification on 3 November 2026

- **27 live contract checks passed**, covering all 20 actions, both fresher-CV inputs, job search, masterclass submission, polling through a completed persisted task, both SSE variants, authorization/CORS/input failures and absence of a payment route in this function.
- The frontend browser flow passed against the deployed function: pasted synthetic CV scoring, Mentor response, real job search/save, three interview answers, feedback persistence and refresh. The network audit found **zero non-payment requests to Intervue-Backend**; its only requests were unchanged `GET /api/v1/dodo/subscription/...` reads.
- The masterclass success check appended one clearly marked synthetic Sheet row. The exact QA row was cleared afterwards; no customer row was changed and no email/SMS was sent.
- Synthetic CVs/answers and the existing QA trial account were used. Real AI/provider responses were not mocked. Camera/microphone hardware was not tested.
- Frontend build and Edge type checks passed. New frontend lint diagnostics: zero compared with the existing baseline. Targeted Edge lint passed. The repository still has pre-existing lint debt; this is not a clean full-project lint result.

Re-run contract checks with a valid QA session supplied securely through environment variables:

```sh
SKILLSURGER_EDGE_TEST_URL=https://jpnunlbnthcfvstyymdl.supabase.co/functions/v1/skillsurger-api \
SKILLSURGER_EDGE_TEST_TOKEN='<QA user access token>' \
SKILLSURGER_EDGE_TEST_ANON='<project public API key>' \
node scripts/check-skillsurger-api.cjs
```

The valid masterclass write is opt-in (`SKILLSURGER_TEST_MASTERCLASS=1`) so ordinary checks do not add Sheet rows. These tests invoke real providers and use their quotas. They never call a payment API or change subscription records.

Local, git-ignored evidence: `artifacts/supabase-api-migration/contracts-combined.json`, `secrets-evidence.json`, `masterclass-cleanup.json`, and `browser/walkthrough-evidence.json` with screenshots. Production frontend verification is recorded separately after publishing.
