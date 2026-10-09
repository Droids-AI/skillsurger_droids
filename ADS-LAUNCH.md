# Skillsurger ad landing page

The canonical landing page is `/job-switch-copilot`. `/training` redirects
there, and `/pricing` redirects to its programme section. Netlify has matching
301 redirects; React handles the same routes on other hosts.

The only public paid offer is Job Switch Copilot at ₹9,999 for one month:
eight two-hour sessions, including two individual sessions (six group sessions
and two 1-to-1 sessions; 16 hours total). Registration is for a separate,
free one-hour webinar about targeting 1.5x to 5x salary growth. No webinar date
is shown until a current schedule is provided.

## Registration storage and deployment

- The form saves `form_type = webinar_registration` to `public.leads` first.
- Apply `supabase/migrations/20261009000000_allow_authenticated_lead_submissions.sql`
  so signed-in users can register too. The original leads migration must
  already be applied.
- Deploy the updated `supabase/functions/sheets-sync/index.ts` to the existing
  Supabase project. Set `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and
  `GOOGLE_PRIVATE_KEY`, and share the destination sheet with that service account.
- Keep `VITE_GOOGLE_SHEETS_WEBHOOK_URL` pointing at the sync function and deploy
  the site. The function creates a **Webinar Registrations** tab automatically.
- The browser waits up to 10 seconds for sheet sync before the confirmation
  page. A Sheets failure does not discard a lead already saved in Supabase.
  Failed syncs need recovery from the `leads` table; this is not a guaranteed
  delivery queue.
- The function also accepts Supabase database webhook INSERT envelopes.
  If switching to database-triggered sync, remove browser-triggered sync first
  to avoid duplicate sheet rows.
- The sheet URL is `https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID>/edit`.
  Its actual ID is not present in this checkout; verify a controlled submission
  appears in that sheet before launching ads.

## Validation

Run `npm run build` and lint the changed files. Browser smoke verification is
available with `node scripts/check-ad-landing.cjs` after a build; it needs
Playwright and installed Chrome. It mocks all external services and does not
create real leads. Screenshots are written to `artifacts/`.

The smoke check covers mobile navigation (including an authenticated session),
training/pricing redirects, the displayed offer, failed-save retry, webinar
payload, confirmation, and horizontal overflow at 320/390/768/1280 px.
It does not verify production Supabase policies or Google Sheets delivery.
