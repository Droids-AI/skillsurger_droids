# Skillsurger Phase 0 discovery (10 November 2026)

Phase 0 of the agent-platform master plan (8 Nov 2026), Skillsurger only. Built from the code in this repository, not from marketing pages. Where this disagrees with the master plan, the code wins.

Status words: **Working** = built end to end and verified live recently. **Built, unverified** = the code exists but hasn't been re-tested live since the date given. **Partial** = some of it exists. **Not built** = advertised or proposed only. **Client-only** = runs in the browser using rules (heuristics), with no AI or backend.

## 1. Stack (answers the open questions)

| Question | Answer from the code |
| --- | --- |
| Frontend | React + Vite SPA on Netlify (auto-deploys from `main`). Routes are in `src/App.tsx`. |
| Backend | Supabase project `jpnunlbnthcfvstyymdl`. Edge functions: `skillsurger-api` (all AI and job routes since 3 Nov), `register-webinar`, `register-resume-audit`, `webinar-reminders`, `sheets-sync`, `dodo-webhook`, `whatsapp-status`, `verify-courses`. |
| Payments | Dodo. Subscription reads still go to Intervue-Backend `/api/v1/dodo/*`. `dodo-webhook` exists in Supabase but isn't connected yet. |
| AI provider | OpenAI, `gpt-4.1` (set by `SKILLSURGER_AI_MODEL`), in `supabase/functions/_shared/skillsurger/openai.js`. Every prompt gets a system rule against inventing facts. A second LLM account isn't needed. |
| Job data sources | SerpAPI Google Jobs and JSearch, cached in `skillsurger_jobs_cache` (`_shared/skillsurger/jobs.ts`). |
| Scheduler | pg_cron + pg_net (job `webinar-reminders`, every 10 min). Background work uses `EdgeRuntime.waitUntil`, with task state in `skillsurger_learning_tasks`. |
| Tenant isolation | RLS is on in 20 migration files, with 54 `auth.uid()` ownership policies on the user tables. The newer service tables (payments, reminders, rate limits, jobs cache, learning tasks) have RLS on and grant nothing to anon or authenticated. A per-table `relrowsecurity` check on production is still to do (it needs DB read access). |
| User model | `auth.users.id` = `profiles.id`. All user tables key on `user_id`, which references profiles. This is the mapping the master plan's `app_user` needs. |
| Per-user memory | **None with provenance (no record of where each fact came from).** Facts are spread across `profiles`, `user_skills`, `user_interests`, `cvs`, `saved_jobs`, `mock_interviews`, `interview_feedback_metrics`, `ai_mentorship_sessions`, `learning_paths` and `generated_careers`. None of them records a source, correction history or confidence. The master plan's `memory_record` table would be new. |
| External-site credentials | None stored. There's no Anchor and no job-board login. Provider keys live only in Supabase secrets. |
| Access gate | `skillsurger-api` requires a signed-in user with an active trial or plan, then rate-limits to 60 requests per user per window. |

## 2. Known defects from the 31 Oct QA

| Defect | Cause | Status |
| --- | --- | --- |
| CV Scoring "Failed to score CV" | The backend called `gpt-4-turbo`, which OpenAI has retired (`model_not_found`). | **Fixed in code.** Moved to `skillsurger-api` with `gpt-4.1` (commits `ae09d9e`, `b0942fc`). 27 live contract checks and a browser walkthrough passed on 3 Nov (`SKILLSURGER-SUPABASE-MIGRATION.md`). |
| AI mentor "Internal Server Error" | Same retired model. | **Fixed in code**, with the same 3 Nov evidence. |
| Mock interview needs a saved job first | A product dependency, not a bug. | Unchanged. The UX hint is still to do (see section 5). |

**Re-test on 10 Nov:** the live endpoint is up and correctly rejects anonymous calls (HTTP 401). A signed-in re-run (`node scripts/check-skillsurger-api.cjs` with a QA token) and a production log check are still to do, because both need credentials (see section 6).

## 3. Feature inventory and automation mapping

"Inside" means the feature uses our own API. "External" means it would need Anchor to act on a site we don't own.

| Feature (route) | Evidence | Status | Automation mapping (proposed) | Gate / test |
| --- | --- | --- | --- | --- |
| CV scoring (`/dashboard?section=cv-scoring`) | `CVScoring.tsx` → `scoreCVText` (SSE stream) | Working (3 Nov) | Inside. Store each score with its date and target role so the trend over time shows. Score the tailored CV once tailoring exists. | S6, S9 |
| CV parse / enhance | `analyzeCVText`; `enhanceCVText` = deterministic `factualCVFormatter` | Working (3 Nov) | Inside. Parsed facts become the seed for verified profile memory. | S12 |
| CV suggestions per job (closest thing to "Resume Tailoring") | `CVSuggestionManager.tsx` → `generateCVSuggestions(targetJob, cvData)` | Partial: suggestions only, with no stored per-job CV version and no diff approval | Inside. Extend it into versioned tailored CVs, each linked to its job, with a diff approval step (master plan 4.3, steps 2–3). | S3, S11, S12 |
| Fresher CV | `generateFresherCV` (only facts the user supplied) | Working (3 Nov) | Inside. No automation needed. | S12 |
| CV builder + PDF (`/ai-resume-builder`) | `AIResumeBuilder.tsx`, `src/lib/pdf.ts` | Built, unverified | Inside. Export the approved tailored version. | S9 |
| Career explorer | `CareerExplorer.tsx` → `generateCareerOptions`, table `generated_careers` | Working (3 Nov) | Inside. Feed accepted or rejected paths into memory. | S5 |
| Job search + save (`/job-search`, dashboard) | `findJobs` / `findJobsBasedOnProfile`, `saved_jobs` | Working (3 Nov) | Inside. Store a one-line "why this match" with each saved job, and a periodic job digest (master plan 4.5). | S5 |
| Application tracker | Only `ApplicationTrackerMockup.tsx` (marketing). `saved_jobs` has no status column. | **Not built** | Inside. A status column or action log on saved jobs, driven by the ledger once applications exist. | S7 |
| Hiring-manager lookup ("Recruiter outreach") | `findHiringManager` (SerpAPI Google search for `site:linkedin.com/in` profiles), `revealHiringManagerEmail` (Lusha) | Built, unverified | Draft messages only; the user sends them. Keep outreach history so nothing goes out twice. This is a Google search, not LinkedIn scraping, but any LinkedIn messaging stays manual. | S3, S13, S14 |
| Mock interview (`/mock-interview`) | `generateInterviewResponse`, `endInterview` (+ GPT-4.1 vision on camera frames), `mock_interviews`, `interview_feedback_metrics` | Working (3 Nov). Camera hardware not tested. | Inside. Choose questions from past weak areas. Offer a practice set when an application reaches the interview stage. | S9 |
| AI mentor (`section=mentorship`) | `startAIMentorshipSession`, `sendMessageToAIMentor`, `ai_mentorship_sessions` | Working (3 Nov) | **Gap:** the prompt only uses the topic, not the user's profile. The master plan wants answers grounded in profile memory. | S6 |
| Learning paths (`section=learning`) | `learningResources`, `startLearningTask` / `learningTaskStatus`, `learning_paths`, `verify-courses` | Working (3 Nov) | Inside. Match target job descriptions against the profile to find gaps. No invented "verified" labels. | S9 |
| Profile + data deletion | `ProfileSection.tsx`; `DataManagement.tsx` (per-category delete) **is not mounted on any page** | Partial: profile works, self-serve deletion is unreachable | Inside. The deletion process (master plan proposes 30 days) will need to cover the new memory tables. | — |
| Free resume audit (`/free-resume-audit`) | `register-resume-audit`, bucket `resume-audits`, confirmation email | Working (lead capture + email). **The audit itself is manual. There's no AI in the function.** | Inside. Optionally pre-score with `scoreCVText` and store it for the human reviewer. | S9 |
| Webinar funnel (`/job-search-copilot-webinar`) | `register-webinar`, `webinar-reminders` (pg_cron), `funnel_daily`, Sheets mirror | Working | Already automated (the master plan's "Funnel follow-through" item is done). | — |
| Job Readiness Index (`/job-readiness-index`) | `JobReadinessIndex.tsx`, `job-readiness/*` | **Client-only**: keyword and word-count rules plus a fixed delay | Honesty risk (S9): the page reads like an AI analysis. Label it as a quick rule-based check, or route it through `scoreCVText`. | S9 |
| LinkedIn Profile Optimizer (`/linkedin-profile-optimizer`) | `LinkedInProfileOptimizer.tsx` (comment in the code: "Simulate analysis delay"), local `analyzeLinkedInProfile` | **Client-only**, with a simulated 3.5 s delay | Same S9 risk. The user pastes text; nothing touches LinkedIn. | S9 |
| Masterclass form | `/masterclass/submit` → Google Sheet | Working (3 Nov) | No automation needed. | — |
| Pricing / subscription (`/pricing`, `/upgrade`, `/subscription`) | `Plans.tsx`, Intervue-Backend Dodo routes | Working (unchanged) | Out of scope until Dodo is wired. | — |
| Contact forms (home, `/contact`) | `submitLead(..., 'contact_message')` → leads + Sheets tab | Working (17 Oct) | No automation needed. | — |
| SEO guides (15 routes), blog, marketing pages | `SEOLandingPage.tsx`, `contentClusters.ts`, `Blog*.tsx` | Static | No automation needed. | — |
| Job applications on external sites | — | **Not built** (master plan Phase 1) | External via Anchor, only where the site's terms allow it; otherwise hand off to the user to submit. | S1–S4, S8, S10, S11 |

### Coverage check
- **Routes:** every route in `src/App.tsx` is covered above. The redirect-only routes (`/book-diagnosis`, `/training`, `/job-switch-copilot`, `/job-search-copilot`, `/forward-deployed-ai-engineer`) and the auth routes (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback*`, `/get-started`, `/onboarding`, `/user-type-selection`) need no automation.
- **Tables not listed above:** `career_suggestions`, `learning_recommendations`, `learning_plans`, `mentorship_sessions` and `mentor_profiles` (all older, read by the dashboard); plus the funnel and service tables `leads`, `webinar_*`, `lead_email_notifications`, `messaging_opt_outs`, `skillsurger_api_rate_limits`, payments. They have no agent mapping because they're either funnel or ops data, or storage for a feature already covered.
- **Scheduled jobs:** only `webinar-reminders`. The 31 Oct session has ended, so it now runs every 10 minutes with nothing to send. It can be unscheduled until the next webinar date is set.

## 4. Privacy (Phase 0 deliverable)

`src/lib/constants/faqs.ts` said data is "never shared with third parties". That was already untrue: resumes, mentor chats and interview answers or frames go to OpenAI.

The draft change in this commit:
- **FAQ:** says data isn't sold or shared for advertising, names OpenAI as the AI processor, and says to email support@skillsurger.com for deletion (the delete screen isn't reachable today).
- **Privacy Policy:** adds section 5, "Service Providers That Process Your Data" (Supabase, OpenAI, SerpAPI/JSearch, Hunter/Lusha, Twilio, Google Workspace, Dodo, Google Ads/Clarity/Hotjar). It commits to updating the policy and asking for consent before any new processing, such as job-site automation through Anchor.

**This wording needs the owner's approval before release.** Anchor isn't named as a current processor because it isn't used yet. Recording consent per user is part of Phase 1.

## 5. Small fixes worth doing before Phase 1
1. Mentor prompt: pass the user's profile summary (role, experience, skills, target role) so answers are personal (master plan test S6).
2. Mock interview: when the user has no saved job, show "Save a job first", with a link to job search.
3. Label the Job Readiness Index and LinkedIn Optimizer as rule-based checks, and remove the simulated delay (test S9).
4. Mount `DataManagement` in the dashboard so users can delete their own data.
5. Add a status column to saved jobs (Saved → Applied → Interview → Offer/Rejected) as the start of the application tracker.

## 6. Blocked, needs the owner
- **Signed-in live re-test:** this needs a QA user token, or a password for the QA account, to run `scripts/check-skillsurger-api.cjs`. The script calls real providers and uses their quotas.
- **Production log and RLS check:** reading production logs and `pg_class` through the Supabase Management API was denied by the permission policy in this session. Approving it via `/permissions` (read-only) would close both.
- **Owner decisions** (master plan, Part E): which Anchor account to use and Starter approval ($50/month), the OpenAI project and spend limit, the pilot job board, the per-user budget, the memory deletion period, and approval of the privacy wording.
