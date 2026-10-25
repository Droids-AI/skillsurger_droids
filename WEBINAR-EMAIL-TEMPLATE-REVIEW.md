# Branded webinar confirmation email — 25 October 2026

Implemented and approved by the owner for commit and push on 25 October 2026.
No preview email has been sent. The publishing order below ensures the icons
are available before the live registration handler uses the template.

Local preview:
<http://127.0.0.1:5173/artifacts/webinar-email-preview/preview.html>

Screenshots and rendered HTML/plain text are in the ignored directory
`artifacts/webinar-email-preview/`.

## Template

- Skillsurger brain mark, wordmark and navy/blue colours.
- Personal greeting and confirmed registration heading.
- Session date, full time range in IST, duration and online format.
- Green WhatsApp group button with the official white WhatsApp glyph.
- Google Calendar button with a calendar icon. The event contains the group
  link and uses the same session start/end as the displayed email.
- Existing three preparation steps, optional group/privacy explanation,
  support link and fallback action links.
- Matching plain-text alternative, generated with the HTML from the same data.
- Tables, inline styles, PNG icons, system fonts and Outlook VML button fallbacks.
  Names and link attributes are HTML-escaped.

`buildWebinarConfirmation()` runs server-side after the registration is saved.
The shared sender accepts the server-rendered HTML through an optional `html`
property. Resume-audit messages retain their existing default HTML fallback.
No browser-provided HTML is accepted. Registration storage, attribution,
notification claims, receipt statuses, retries and duplicate prevention are
unchanged. No migration is needed.

## Validation

The production build passed and includes both PNG icon assets.
Deno type checks passed for both registration handlers. Targeted Deno lint
passed using the repository's existing inline dependency import convention.
Browser previews were reviewed at 360px, 600px and 900px, including images
blocked and styles limited to inline rules. No horizontal overflow was
observed. WhatsApp and calendar button destinations were inspected; the
calendar time is `20261031T093000Z/20261031T103000Z`, equivalent to 3–4 PM IST.
HTML size is about 11 KB.

This is browser rendering evidence, not Gmail/Outlook inbox verification.
No test cases or automated suite were added or run, and no email was sent.

## Publishing order

Publish the website assets first and verify these URLs return PNG images:

- `https://skillsurger.com/email/whatsapp-white.png`
- `https://skillsurger.com/email/calendar-blue.png`

Then deploy `register-webinar` with the new template and shared sender. The
shared sender is bundled into each function, so a GitHub push alone does not
update the live email. Before this release, the deployed webinar handler was
version 15 and used the previous simple HTML.

An already accepted email is not resent when someone resubmits registration.
Previewing the new design in an inbox requires an explicitly requested one-off
preview, without resetting the existing accepted receipt or creating a lead.

Icon sources are documented in `public/email/ASSET-SOURCES.md`.
