# Skillsurger tracker review

This document records the original pre-change review. For subsequent implementation and testing results, see [Skillsurger status](SKILLSURGER-STATUS.md) and [release notes](SKILLSURGER-RELEASE.md).

Reviewed 12 October 2026 against commit ae449f3. Source: Developer_Master_Task_Tracker_Final_11Oct2026 (1).xlsx in Downloads. This is a code/document review, not independent production QA. No application changes or live registrations were made. Original workbook remains unchanged.

Scope: DEV-001?020, plus Skillsurger-only application of DEV-079?083. QA-001?011, QA-029, QA-036 and QA-037. All other product work is excluded.

The workbook developer rows are Not Started / Not Tested with blank Commit/URL, QA Evidence and Notes. Applicable QA rows are Not Run with blank Tester/Date and Evidence/Notes. Do not mark QA Passed from this review.

## Priorities

Resolve Ads configuration/conversion/idempotency and confirmed date first (DEV-001?004). CV privacy (DEV-009) and factual CV enhancement (DEV-011) are also P0. QA-037 makes WhatsApp delivery a P0 verification gate even though DEV-006 is P1. Then repair parsing, duplicate registration, booking, recovery and learning-course accuracy; build FDE page from verified content.

## Task-by-task findings

### DEV-001 (P0) ? Webinar ads / tracking

Add Google Ads conversion config AW-18357417979 while retaining existing AW-994095654; load gtag.js only once.

Acceptance: Both IDs configured on the intended page; no duplicate gtag.js request.

Review: Missing new Ads ID. index.html configures only AW-994095654. Keep one gtag loader and configure both IDs; AnalyticsTracking currently skips GA initialization when gtag already exists.

Dependency in workbook: None recorded.

### DEV-002 (P0) ? Webinar ads / tracking

Fire conversion AW-18357417979/018aCPbEh5gdEPvvv7FE only after the server confirms successful webinar registration.

Acceptance: Exactly one conversion after HTTP 2xx success; never on page load, click, invalid input, failure, or other routes.

Review: Missing conversion call. WebinarRegistrationForm sends generic analytics and Facebook Lead after submitLead; no specified Google Ads conversion.

Dependency in workbook: None recorded.

### DEV-003 (P0) ? Webinar ads / tracking

Make Google conversion idempotent using registration ID and session guard; disable submit while request is in flight.

Acceptance: Double click and success-page refresh do not create duplicate conversion requests.

Review: Partial: busy state disables the form. submitLead returns void, no registration ID/session conversion guard exists. Add an authoritative server registration result and idempotent tracking.

Dependency in workbook: None recorded.

### DEV-004 (P0) ? Webinar landing page

Show Saturday, 17 October 2026 at 3:00 PM IST in hero, registration card, below-form copy, and success state.

Acceptance: Date/time appears above the fold on desktop and mobile; no copy says timing will be shared without also showing the confirmed date.

Review: Missing. Hero/form/FAQ and webinar thank-you defer timing instead of displaying the confirmed date. Use one shared Saturday, 17 October 2026, 3:00 PM IST schedule (60 minutes). Preserve unrelated thank-you variants.

Dependency in workbook: None recorded.

### DEV-005 (P1) ? Webinar ads / tracking

Test Google conversion in Tag Assistant / DevTools for page load, invalid form, forced server error, successful registration, refresh, and double-click cases.

Acceptance: Evidence confirms zero events on failures and exactly one on success; share real test registration time with owner.

Review: Not verified. Existing smoke test mocks providers and does not assert Google Ads calls. Add all six cases, then verify real delivery in Tag Assistant/DevTools and record timestamp.

Dependency in workbook: Google Ads reporting may lag

### DEV-006 (P1) ? Webinar landing page

Send the webinar joining link to each successful registrant through WhatsApp using the registered WhatsApp number.

Acceptance: Link is sent only after successful registration; message delivery is logged; failed WhatsApp delivery shows a clear recovery path.

Review: Missing in this checkout. Phone is collected, but there is no per-registrant WhatsApp sender, approved-template integration, delivery log, or recovery state. Existing chat/community links do not meet this requirement. Needs approved sender/template and private joining URL.

Dependency in workbook: Use existing approved WhatsApp sender/template

### DEV-007 (P1) ? Webinar landing page

Preserve the existing form, price, disclaimers, and unrelated routes while adding WhatsApp delivery.

Acceptance: No unrelated page/form/pricing changes; confirmed date remains visible; production URL and test time reported.

Review: Regression requirement: retain current form, INR 9,999 offer, salary disclaimer and unrelated flows while adding schedule/delivery. Local baseline passes; live preservation is not independently verified.

Dependency in workbook: None recorded.

### DEV-008 (P1) ? Job readiness / resume

Fix resume text extraction and skill detection for PDF and DOCX in the public Job Readiness Index path.

Acceptance: Python, Java, SQL, Docker, and REST APIs from test resumes are extracted and shown; extraction failures are visible.

Review: Confirmed parser defect: ResumeUpload.readFileAsText uses FileReader.readAsText for PDF/DOCX. Reuse actual PDF parsing and DOCX extraction, surface empty/corrupt/unsupported errors, and use boundary-aware skill aliases rather than substring matching (Java versus JavaScript).

Dependency in workbook: None recorded.

### DEV-009 (P0) ? Security / CV storage

Make CV storage private and owner-scoped; replace public originals with short-lived signed URLs.

Acceptance: Unauthenticated request to a test CV URL is denied; authenticated owner can access; other users cannot.

Review: Incomplete; live exposure unverified. pdf.ts and ProfileSection use getPublicUrl for originals. Historical migrations create a private cvs bucket and owner policies, but do not prove live configuration. Replace public URL usage, audit all storage policies and persisted legacy URLs, test owner/non-owner/anonymous access and signed URL expiry.

Dependency in workbook: None recorded.

### DEV-010 (P1) ? Learning path

Verify learning-path results are real courses and accurately label course type, price, level, and verification.

Acceptance: Product pages such as java.com are not mislabeled as verified courses; unknown data is shown as unknown, not fabricated.

Review: Confirmed verification defect: linkVerification marks domain-pattern matches valid without fetching and treats opaque no-cors responses as status 200. enhancedLearningResources maps that to verified and supplies default provider ratings. Validate course identity separately; show unknown type/price/level/verification honestly.

Dependency in workbook: None recorded.

### DEV-011 (P0) ? CV enhancement

Prevent CV Enhance from inventing metrics, projects, tools, or achievements.

Acceptance: Output uses only supplied facts; missing metrics are requested; no claim contradicts the source resume.

Review: Backend-dependent. enhanceCVText calls external /openai/skillsurger; generation implementation is absent here. Fact-grounded prompting and output validation must prevent invented metrics/tools/projects and request missing details. Do not call this fixed from frontend review alone.

Dependency in workbook: None recorded.

### DEV-012 (P1) ? Routing / booking

Repair /book-diagnosis or redirect to the working booking route.

Acceptance: Route loads a usable booking flow and returns a real page status rather than 404.

Review: Missing /book-diagnosis route; /book-a-call exists. Add a redirect and check the real hosting response plus usable booking submission.

Dependency in workbook: None recorded.

### DEV-013 (P1) ? Authentication

Implement the forgot-password flow from the login page.

Acceptance: Link opens reset form; valid request sends a reset flow; invalid/expired token has clear recovery UX.

Review: Confirmed placeholder: LoginPage forgot-password link uses href="#". Implement request/reset routes with Supabase recovery handling and expired-token recovery; verify email redirect allowlist.

Dependency in workbook: None recorded.

### DEV-014 (P1) ? Resume analysis QA

Retest the PDF resume analysis path against the provided skills fixture after parser fix.

Acceptance: Extracted skills match fixture and generated questions reflect those skills, not generic version-control content.

Review: Not tested. Retest both fixtures after parser fix and inspect resulting skill-specific questions, not only extracted text. Original supplied resume fixtures are not embedded in this workbook.

Dependency in workbook: None recorded.

### DEV-015 (P1) ? Webinar registration UX

Handle duplicate registration attempts with clear “You are already registered” messaging when the backend recognizes an existing registration.

Acceptance: Repeat registration produces an understandable existing-registration state and preserves the original record; no duplicate conversion fires unless a new accepted registration exists.

Review: Missing: direct leads insert has no webinar session/email uniqueness handling or already-registered state. Must deduplicate server-side without exposing other leads and return existing-registration result; do not resend conversion/notification for repeats.

Dependency in workbook: None recorded.

### DEV-016 (P1) ? FDE course landing page

Build dedicated Forward Deployed AI Engineer course landing page using supplied spec and course JSON.

Acceptance: Page has correct title, description, 18 sections, 156 curriculum items, two capstones, and clear Udemy CTA.

Review: No FDE route/page found. Workbook includes the curriculum; full referenced landing-page spec/course JSON is not present in this checkout. Build from source material without inventing details.

Dependency in workbook: None recorded.

### DEV-017 (P1) ? FDE course landing page

Render course overview, audience, outcomes, prerequisites, delivery format, section curriculum, FAQs, and capstones.

Acceptance: Content matches source JSON/spec; no unsupported employment or salary guarantees.

Review: Missing page. Curriculum source exists; audience, overview, prerequisites, delivery and FAQ source must be checked against the referenced full spec.

Dependency in workbook: None recorded.

### DEV-018 (P1) ? FDE course landing page

Wire the Udemy CTA to the supplied course URL.

Acceptance: CTA opens https://www.udemy.com/course/draft/7361879/?referralCode=059C9E3DEB7126402751; verify it is publicly accessible before launch.

Review: Missing CTA. Workbook supplies a Udemy /course/draft/ URL; public anonymous accessibility has not been verified and is a launch prerequisite.

Dependency in workbook: None recorded.

### DEV-019 (P2) ? FDE course landing page

Make course landing page responsive, accessible, metadata-ready, and consistent with existing SkillSurger styling.

Acceptance: Mobile/tablet/desktop layouts work; keyboard navigation and readable contrast pass; title/description/OG preview are set.

Review: Not implemented/tested: responsive and keyboard checks plus SEO/OG are required once FDE page exists.

Dependency in workbook: None recorded.

### DEV-020 (P1) ? FDE course landing page

Validate all course counts and capstone labels against source data during build and QA.

Acceptance: 18 sections, 156 curriculum items, OmniGuard and AuditMesh names/topics match source exactly.

Review: Workbook curriculum source can be validated now; page parity cannot be tested until built. Preserve exact OmniGuard/AuditMesh topics.

Dependency in workbook: None recorded.

### DEV-079 (P1) ? Release management

Maintain staging and production smoke-test checklist with deployment commit, URL, environment, and rollback notes.

Acceptance: Every deploy is recorded with tested commit and verification evidence; release checklist is complete before ads point to it.

Review: Apply to Skillsurger only: record staging/production URL, deployed commit, rollback and smoke-test evidence. Git push alone does not prove production deployment.

Dependency in workbook: None recorded.

### DEV-080 (P1) ? Release management

Run a fresh end-to-end regression pass after fixes rather than relying on developer “works on my machine” status.

Acceptance: Independent QA covers fresh and existing accounts, mobile and desktop, success and failure paths.

Review: Fresh independent staging/production regression still required. Existing local mocked check is developer evidence only.

Dependency in workbook: None recorded.

### DEV-081 (P1) ? Observability

Add structured server/client error logging for the listed silent failures and provider errors, without logging sensitive resume or health data.

Acceptance: Errors include request/correlation ID and safe context; secrets and personal document contents are excluded.

Review: Apply to Skillsurger only: structured safe errors/correlation IDs and remove resume/profile-content logs. External backend needs the same treatment.

Dependency in workbook: None recorded.

### DEV-082 (P2) ? Documentation

Provide deployment notes and concise test evidence per completed P0/P1 task.

Acceptance: Each completed row has production URL/commit and evidence; owner can independently verify.

Review: Apply to Skillsurger only: attach commit, production URL and concise evidence per completed P0/P1 row.

Dependency in workbook: None recorded.

### DEV-083 (P1) ? QA setup

Create synthetic test accounts and provider sandbox configurations for each product in staging.

Acceptance: Developer can test all flows with non-customer data; credentials are stored securely and shared with the owner.

Review: Apply to Skillsurger only: provision synthetic staging accounts and provider sandboxes; do not use customer resumes or log credentials.

Dependency in workbook: None recorded.

## Testing fields and required cases

Record result, tester, date/time (IST), environment, tested commit, URL and screenshots/network/delivery evidence. Separate developer implementation status from independent QA. Retest failures after deployment.

- **QA-001 (P0) ? Page load without registration**: Open webinar page; do not submit. Expected: No conversion event or request is sent. Workbook result: Not Run.
- **QA-002 (P0) ? Invalid registration**: Submit empty/invalid email or phone. Expected: No conversion request; validation message shown. Workbook result: Not Run.
- **QA-003 (P0) ? Server failure then retry**: Force 500/offline; then retry successfully. Expected: Zero event on failed attempt; exactly one after successful response. Workbook result: Not Run.
- **QA-004 (P0) ? Success conversion payload**: Complete valid real/test registration. Expected: Request contains destination AW-18357417979 and label 018aCPbEh5gdEPvvv7FE; transaction ID used when available. Workbook result: Not Run.
- **QA-005 (P0) ? Duplicate prevention**: Double-click submit and refresh success state. Expected: At most one conversion per registration in browser session. Workbook result: Not Run.
- **QA-006 (P0) ? Date visibility**: Check desktop and mobile without scrolling past first form. Expected: Sat 17 Oct 2026, 3 PM IST appears in hero, card, below form, and success view. Workbook result: Not Run.
- **QA-007 (P1) ? DOCX fixture**: Analyze resume with Python, Java, SQL, Docker, REST APIs. Expected: All five skills are extracted and relevant questions are generated. Workbook result: Not Run.
- **QA-008 (P1) ? PDF fixture**: Analyze equivalent PDF resume. Expected: Skills match source; extraction failure is visible rather than silently generalized. Workbook result: Not Run.
- **QA-009 (P0) ? Unauthorized file access**: Open original CV URL in private browser/no auth. Expected: Access denied; signed URL expires; non-owner cannot view. Workbook result: Not Run.
- **QA-010 (P0) ? No fabricated facts**: Enhance resume without metrics/projects. Expected: No fabricated percentage, project, or skill; missing details requested. Workbook result: Not Run.
- **QA-011 (P1) ? Course validation**: Generate path for Java. Expected: Only genuine courses shown; type/price/level/verification are accurate or unknown. Workbook result: Not Run.
- **QA-029 (P1) ? Fresh user regression**: Test logged-out, new account, existing account, mobile and desktop. Expected: Critical flows pass end to end with clear errors and no duplicate records. Workbook result: Not Run.
- **QA-036 (P1) ? Landing page parity**: Compare page to supplied JSON/spec. Expected: 18 sections / 156 items / 2 capstones accurately represented; no invented Udemy link. Workbook result: Not Run.
- **QA-037 (P0) ? Successful webinar registration**: Register with a valid WhatsApp number and inspect delivery log. Expected: Private joining link is sent to that number after success; no send on failed registration. Workbook result: Not Run.

## Evidence obtained during this review

- FDE Curriculum worksheet contains 156 numbered items across 18 sections. Exact capstone rows include: Capstone 1: OmniGuard - Secure AI Integration; OmniGuard Build: RBAC, Hybrid RAG, Secure SQL and Guardrails; Capstone 2: AuditMesh - Multi-Agent Compliance System; AuditMesh Build: LangGraph Supervisor, MCP, Human Approval and Cost Tracing. No FDE page parity test was possible.
- Ran node scripts/check-ad-landing.cjs on the existing dist build: PASS for guest/authenticated mobile menu, redirects, INR 9,999 offer, webinar-before-programme ordering, mocked server failure/retry, one saved lead, confirmation and widths 320/390/768/1280. This did not rebuild source or validate live providers.
- All submissions/provider responses were mocked. No real test registration timestamp, Ads request verification, WhatsApp delivery log, live storage test or independent tester signoff exists from this review.
- Existing smoke test aborts external tracking requests; it cannot satisfy QA-001?005 merely by passing.

## Inputs and external checks still needed

Approved WhatsApp sender/template and private meeting link; staging/sandbox credentials; original PDF/DOCX resume fixtures; referenced FDE landing-page spec and full course JSON; public Udemy URL confirmation; external AI backend access for CV factuality; deployed Supabase storage/policies verification; confirmed hosting environment/commit and independent QA evidence. The workbook itself supplies the webinar date and full curriculum list, so those are not missing inputs.
