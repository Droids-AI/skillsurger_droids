# Job Search Copilot page split — local review

Implemented for review on 20 October 2026. Owner-requested cleanup removed visible yellow review notes, date requests and editorial placeholders from both pages. Outstanding facts remain documented here; their removal does not confirm new terms or dates.

## Preview

- Free webinar: http://127.0.0.1:5173/job-search-copilot-webinar
- Paid bootcamp: http://127.0.0.1:5173/job-search-bootcamp
- Existing `/job-switch-copilot`, `/training` and `/job-search-copilot` URLs redirect to free registration. Client redirects preserve query parameters; Netlify 301 rules are also prepared. Existing programme links inside the site now lead to the bootcamp.
- Local screenshots: `artifacts/copilot-split-preview/` (ignored by Git).

The webinar uses the existing schedule: **Saturday, 31 October 2026, 3:00–4:00 PM IST**, online. Register with name, email and WhatsApp number, then join the linked WhatsApp group for the meeting link. The current group URL and Saurav’s existing host listing are retained; reconfirm them before publication.

## Facts and placeholders the owner must supply

The paid outline below comes from the existing `jobSwitchProgram.ts`. It has **not** been treated as fresh approval of the commercial terms. Missing facts are tracked in this document rather than shown as editorial requests on the public pages.

| Item | Current draft / confirmation needed |
| --- | --- |
| Webinar schedule | Reconfirm 31 October 2026, 3–4 PM IST and the joining method/group link. |
| Host / trainer | Existing listing: Saurav, Founder, Skillsurger · Lead mentor. Supply full public name, approved short bio, relevant experience and public profile link. No employer logos or credentials were invented. |
| Bootcamp price / GST | Advertised ₹5,000. Existing config says inclusive of 18% GST, but this request explicitly asks for confirmation, so the new page says GST pending. Confirm inclusive/exclusive treatment and final checkout total. |
| GST invoice | Confirm availability, invoice issuer and how participants provide GSTIN and billing details. |
| Launch price | Not claimed. Confirm that this is a genuine launch price before adding that label. |
| Curriculum | Approve or revise the eight sessions below, their deliverables, tools and inclusions. |
| Cohort dates | Supply start/end dates, all eight session dates/times in IST, meeting platform, and booking process for both personal sessions. |
| Format / hours | Reconfirm one month, eight two-hour live online sessions: six group + two personal, 16 hours total. No extra personal sessions implied. |
| Support / community | Reconfirm WhatsApp support for the programme month, membership duration, support hours and response expectations. |
| Bootcamp recordings | Existing offer says group recordings for the programme month; personal sessions not recorded. Reconfirm exact access end date and missed-session process. |
| Webinar recording | Replay availability, delivery method and access duration have not been supplied. |
| Product access | Confirm included subscription/features, usage limits, third-party costs if any, and expiry. No unlimited/lifetime tool access promised. |
| Certificate | Confirm whether it exists and its criteria. Not promised as a benefit. |
| Refund / cancellation | Explicit owner approval needed. The previous seven-day/before-second-session policy is not asserted by the new page. Plain support contact is shown instead. Existing payment and post-purchase logic were left intact; reconcile their existing terms with the approved policy before publication. |
| Eligibility | Confirm experience range, fresher/non-tech eligibility, prerequisites and between-session effort. |
| Testimonials | Supply genuine quotes, public names, roles and permission to publish. Placeholder: `[TESTIMONIAL: need real quote + public name + role + permission to publish]`. No identities, photos, stars, company endorsements or results invented. |
| Product proof | Supply approved redacted screenshots or a recording from the live product. The existing CV feedback illustration is explicitly labelled sample data, not a customer result. |
| Value figures | Supply a documented source for each proposed “worth ₹…” figure. None are used without evidence. |
| Price multiplier | The verified alternatives below do not establish that comparable programmes all cost 10–20 times more. That claim and “almost free” wording were omitted rather than published without support. Supply genuinely comparable ₹50,000–₹1,00,000 offers and scope evidence if you want this ₹5,000 comparison substantiated. |

Approval fields live in `src/lib/constants/jobSearchLanding.ts`. Update copy, FAQs and metadata when additional facts are supplied. Unset session dates and unprovided host details are omitted, without adding invented dates, testimonials or purchase promises.

### Existing curriculum used for the draft

| Session | Format | Focus | Deliverable |
| --- | --- | --- | --- |
| 1 | Group, 2h live | Career diagnosis; CV / LinkedIn positioning | Personalised roadmap, role-specific CV and LinkedIn profile |
| 2 | Group, 2h live | Job search strategy | Target-company shortlist |
| 3 | Group, 2h live | AI-assisted applications and outreach | Application workflow, tracker and outreach templates |
| 4 | Group, 2h live | Technical interview preparation | Interview prep plan |
| 5 | Group, 2h live | Mock interviews and feedback | Strengths / gaps assessment |
| 6 | Group, 2h live | Pipeline review | 30-day continuation plan |
| 7 | Personal, 2h live | Resume and career review | Written CV / career-plan feedback |
| 8 | Personal, 2h live | Interview and strategy review | Individual improvement plan |

All session dates and times are explicitly pending. Modules group the existing outline; no additional coaching hours were invented.

## Comparison sources

Primary provider pages checked 20 October 2026. The same three alternatives appear on both pages, with source footnotes. Prices retain their published currency and billing period. No exchange-rate conversions, unsupported tax claims or equal-scope claims are used.

| Provider / offer | Publicly listed price | Scope and source |
| --- | --- | --- |
| India Career Centre — Career Pivot | ₹9,999 package | Career-transition assessment, two mentoring sessions, career strategy report. [Provider pricing](https://www.indiacareercentre.com/pricing-plans/plans-pricing) |
| InterviewReady — All in One | US$209 paid annually | Self-paced engineering interview courses, AI mock interviewer and question bank. The provider also lists monthly billing separately. [Provider courses / subscription](https://interviewready.io/courses) |
| Design Gurus — Annual Subscription | US$373 paid annually | Course subscription; five AI coding mock interviews per year. [Provider pricing](https://www.designgurus.io/pricing) |

Different content, mentoring, access periods and provider offers apply. Prices can change and should be rechecked before publication. The webinar table compares against a free one-hour introduction, not an equivalent paid programme. It does not advertise the bootcamp price in the webinar body.

### Udemy reviews

Checked the supplied [Forward Deployed Engineer course](https://www.udemy.com/course/ai-forward-deployed-engineer-extensive-program/). The accessible public content did not expose a review quote with its reviewer’s public name. No rating, count or anonymous quote was repurposed as a testimonial. Supply the public review permalink/text and public name if you want it included; it must be labelled as a review of that separate Udemy course, not of this bootcamp.

## Registration and confirmation

- Rescheduled to 31 October 2026, 3–4 PM IST. Before releasing the frontend, apply `supabase/migrations/20261020000000_reschedule_webinar_october_31.sql` and deploy the updated `register-webinar` and `webinar-reminders` functions together. The migration preserves existing registration IDs and notification history. It has been prepared locally, not applied to the hosted database; no reschedule messages have been sent.
- The form now requires only name, email and WhatsApp number. The existing server already accepts absent qualification fields, so this needs no schema migration. Leads without qualification details are not falsely marked qualified by the browser.
- Existing durable registration, duplicate handling, conversion deduplication and email pipeline remain in use. No backend deployment was made.
- A thank-you redirect occurs only after the existing API returns a saved registration. The page shows the schedule, group link, calendar options, pre-work and returned notification statuses.
- Provider acceptance is described as acceptance/queued sending; it is not claimed to be inbox or handset delivery. Failed/unconfigured/unknown statuses give explicit next steps.
- The form gives email communication notice. It does not silently opt participants into direct WhatsApp messaging. The group is an explicit, optional action and its phone-number visibility is explained.
- **Local end-to-end registration and actual email / WhatsApp delivery are unverified.** The Edge Function defaults to production-only allowed origins (`https://skillsurger.com`, `https://www.skillsurger.com`). Local submissions can be rejected unless a development backend/origin is configured. No real lead, email, WhatsApp message or payment was submitted during this work. Do not infer delivery from the preview.
- Hosted notification settings and sender readiness were not inspected or changed. Confirm receipt using an authorised registration before approving the live flow.
- Backend lead metadata still uses the legacy webinar title and `/job-switch-copilot` source label. Those URLs redirect correctly; any desired backend title/source-label change is separate from this frontend preview.

## Analytics and campaign parameters

Existing GA route `page_view` tracking remains. The new pages additionally emit `landing_page_view`, CTA clicks use `job_switch_copilot_cta_clicked`, the form emits `webinar_form_submit`, successful new registrations emit `lead_form_submitted` / `webinar_registered`, and checkout links emit `checkout_started` / `purchase_click`. Existing purchase tracking and payment code are unchanged.

Events contain campaign context, not names, email addresses or phone numbers. Current URL campaign parameters are retained through redirects, links between both pages, registration-to-thank-you navigation and checkout links. Stored first-touch UTM values fill missing link parameters after other site navigation. Actual analytics receipt depends on the configured providers and browser consent/blocking; it was not exercised as a conversion test.

## Changed files

| Files | Change |
| --- | --- |
| `src/pages/JobSwitchCopilot.tsx` | Replaced mixed offer with complete webinar-only page, agenda, four-feature walkthrough outline, value stack, comparison, proof placeholders, 14 FAQs, host, countdown and repeated free CTA. |
| `src/pages/JobSearchBootcamp.tsx` | Added paid-only page, five-module/eight-session curriculum, agenda, inclusions, comparison, audience, proof placeholders, support policy, 15 FAQs and existing checkout links. |
| `src/components/jobSwitchCopilot/CopilotLandingLayout.tsx` | Shared branded header/footer, sections, audience, comparison footnotes, FAQ, host/proof placeholders, sticky bar and countdown. |
| `src/lib/constants/jobSearchLanding.ts` | Draft offer content, approval placeholders, curriculum grouping, agendas, FAQs and sourced comparison data. |
| `src/lib/copilotFunnel.ts` | Campaign-preserving links and landing-event context. |
| `src/App.tsx`, `src/components/SiteLayout.tsx` | Added routes/legacy redirects and focused landing chrome without competing site navigation or floating chat. Other routes retain the existing header/footer/chat. |
| `src/components/leadgen/WebinarRegistrationForm.tsx`, `src/lib/webinarRegistration.ts` | Three-field registration, optional qualification input type, success-only conversion tracking and campaign-preserving thank-you URL. |
| `src/pages/ThankYouPage.tsx`, `src/lib/constants/thankYouContent.ts` | Clear saved-state next steps, notification status and soft bootcamp link for webinar confirmations; paid detail links use the new route. |
| `netlify.toml`, `public/sitemap.xml` | Prepared legacy 301s; listed both canonical pages. The existing metadata renderer picks up their distinct SEO / OG tags. |
| `src/components/Header.tsx`, `src/components/MobileNavigation.tsx`, `src/components/Footer.tsx` | Updated general site navigation to the separate destinations. |
| `src/components/landing/HeroSection.tsx`, `src/components/landing/JobSwitchOffer.tsx`, `src/pages/LandingPage.tsx`, `src/pages/Plans.tsx` | Existing free links go to webinar; programme-detail links go to bootcamp. |
| `src/lib/constants/contentClusters.ts`, `src/lib/constants/seoLandingPages.ts`, `src/pages/seo/SEOLandingPage.tsx`, `src/pages/Training.tsx` | Updated related programme destinations and legacy training redirect. |
| `src/lib/constants/placeholderTestimonials.ts` | Removed unsupplied named quotes, employer claims including Tredence, and ratings; retained one literal request-for-evidence placeholder. |
| `COPILOT-LANDING-PAGES-REVIEW.md` | This handoff. |

## Verification

- Production build and route metadata generation passed.
- Targeted ESLint passed for the new page/layout/funnel code and changed registration/confirmation logic.
- Visually reviewed a 360px webinar screenshot; captured mobile and desktop previews. The comparison table scrolls within its own region on narrow screens. Sticky CTA has bottom safe-area spacing.
- No test cases were written or run, following the earlier instruction.
- No payment implementation, database schema, production configuration or backend deployment changed. User-supplied PDF, Word document and spreadsheets remain untouched.
