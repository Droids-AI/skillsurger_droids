# Demo blockers: fixes and retest evidence

Checked 31 October 2026. **Local verification passed. The owner will deploy the API; full production retesting remains pending that deployment.**

Local preview: http://127.0.0.1:5188/dashboard?section=cv-scoring

## Causes and changes

- The live CV stream returns `Failed to score CV`; the live Mentor endpoint returns `Internal Server Error`. Both handlers, and the interview handlers, select `gpt-4-turbo`. A direct request with the existing backend credential returns HTTP 404 / `model_not_found`: that model is deprecated. GPT-4.1 succeeds with the same credential and existing chat/JSON parameters. See the [OpenAI deprecation notice](https://developers.openai.com/api/docs/deprecations) and [GPT-4.1 documentation](https://developers.openai.com/api/docs/models/gpt-4.1).
- The backend patch changes only CV scoring, Mentor start/message, interview responses and interview feedback to `SKILLSURGER_AI_MODEL`, defaulting to `gpt-4.1`. Provider Error objects retain diagnostic metadata. Their controllers log operation, code, HTTP status, request ID and selected model, without logging resumes, conversations or credentials, and show a safe failure message.
- CV scoring now sends the selected target role to the scorer. Its stream reader handles CRLF boundaries, final unterminated events, JSON responses, failed streams, early EOF and a timeout, rather than leaving scoring pending indefinitely.
- The demo profile's stored role is `Demo: Backend Engineer (synthetic profile)`. The live jobs API returns zero for that literal query. The frontend strips those explicit demo labels from the search query, leaving the profile unchanged. A clean `Backend Engineer` query returned 20 provider records, of which 10 matched Bengaluru. `Python Backend Engineer` returned 14 records, of which 13 matched Bengaluru. These are search results, not guarantees of candidate fit or availability.
- The data sources are SerpAPI Google Jobs and JSearch, with an existing backend cache. JSearch previously sent location as a separate search parameter; the [provider documentation](https://www.openwebninja.com/api/jsearch) calls for location in the query. The backend patch uses `Python Backend Engineer in Bengaluru, India`, which returned 10 Bengaluru records from the real provider. Existing frontend location filtering remains enabled.
- Mock interview requests no longer include the latest answer twice. The conversation is saved before requesting feedback, but the interview becomes completed only after feedback is successfully generated and persisted, so a failed feedback request remains retryable.

## Authenticated walkthrough

Used the supplied `skillsurger.career@gmail.com` account, a pasted synthetic CV and fictional interview answers. The local frontend used corrected local AI handlers with the real OpenAI provider, the live job endpoint and live Supabase. No AI or job responses were mocked. Analytics requests were blocked in the local walkthrough browser.

1. CV Text Preview + `Backend Engineer - Python FastAPI` + Score CV: a real AI scorecard appeared (61/100 in this run), with strengths, weaknesses and recommendations. No file was uploaded. This is an illustrative synthetic run, not a customer outcome or fixed score.
2. Created `QA synthetic Python backend preparation — 31 October`, sent the fictional four-year Python/FastAPI profile, and displayed a one-week plan. Supabase contains the greeting, user question and real AI answer.
3. Find Jobs Based on Profile displayed 10 Bengaluru results; Save Job successfully persisted a real provider-returned listing.
4. Selected that saved listing, scheduled an interview, submitted three fictional answers, received three real AI responses, ended the interview and displayed feedback. Reloading retained the completed feedback. Supabase independently confirms seven conversation messages, completed status and scores of technical 3/5, communication 4/5, overall 3/5 for this synthetic run.
5. No browser runtime errors. The profile and trial dates remained unchanged: active trial 30 October–6 November 2026.

The saved listing used for the full UI flow was **Senior Back End Engineer (Golang), MatchPoint, Bengaluru**, returned by the provider. The Python-specific query above was verified separately; it was not substituted into the completed interview. A genuine Python/FastAPI example is [Senior Backend Engineer – Python, IRC302277](https://careers.hitachi.com/senior-backend-engineer-python/job/IRC302277), verified on the employer's career page. Check requirements and availability again before the webinar.

The account retains one saved real job, one clearly labelled QA Mentor session and one completed interview with explicitly fictional answers from this check. These are QA records, not customer proof.

Evidence (local, git-ignored):

- `artifacts/demo-blockers/walkthrough-evidence.json`
- `artifacts/demo-blockers/database-verification.json`
- `artifacts/demo-blockers/live-search-comparison.json`
- `artifacts/demo-blockers/corrected-jsearch-results.json`
- `artifacts/demo-blockers/cv-score.png`, `mentor.png`, `career-jobs.png`, `interview.png`, `feedback.png`

## Backend handoff and live completion

Backend repository: `Droids-AI/Intervue-Backend`, base commit `ecd7fd79a335352fff70879282d5ec7e781d9145`.

The corrected API source is prepared in `/tmp/skillsurger-demo-backend` and is published as commit `34bbedf` on backend `main` for the owner to deploy. A copy is included in `backend-patches/2026-10-31-demo-blockers.patch` for reference; do not apply it again if the backend checkout already contains these fixes. Publishing the frontend does not install the API changes.

Only when applying the patch to a backend checkout that does not yet contain the fixes:

```sh
git apply --unidiff-zero --check /path/to/skillsurger_droids/backend-patches/2026-10-31-demo-blockers.patch
git apply --unidiff-zero /path/to/skillsurger_droids/backend-patches/2026-10-31-demo-blockers.patch
```

The patch changes `app/services/openai.service.js`, `app/controllers/openai.controller.js` and `app/services/jsearch.service.js`. No dependency changes or database migration are required.

The owner is handling API deployment. After deploying both repositories, repeat the authenticated flow against production and inspect the actual API server logs/configuration. If `SKILLSURGER_AI_MODEL` is already set on the host, verify it selects the tested model. Existing job cache entries may remain until their normal expiry.

The known SSH destination rejected the saved login. Azure inventory and GitHub did not reveal a deployment workflow for this API. During diagnosis, production code/configuration was unchanged and production server logs were inaccessible. Frontend publication is now authorized separately; the owner will deploy the API. The provider diagnosis above is from a direct credential check, not an invented server-log result.

## Checks and protected scope

- Frontend production build passed.
- Syntax checks passed for all three changed backend files.
- Git whitespace checks passed.
- The four changed frontend files have pre-existing lint errors; comparison against HEAD found no new diagnostics (64 current errors versus 66 baseline errors, plus one existing hook warning). This is not a clean full-project lint result.
- Payments, subscription logic, ads, webinar date and host were not modified. No emails, webinar registrations, applications or purchases were sent.
