# Skillsurger confirmation email setup

Webinar and resume-audit confirmations use the same transactional Twilio Email
API sender after the registration or audit request is saved. They use separate
enable switches and share the server-only receipt ledger.

Current webinar: **Saturday, 31 October 2026, 3–4 PM IST**.

## Required Supabase secrets

Project: `jpnunlbnthcfvstyymdl`.

- `WEBINAR_EMAIL_ENABLED=true`
- `RESUME_AUDIT_EMAIL_ENABLED=true`
- `TWILIO_API_KEY` and `TWILIO_API_SECRET`
- `TWILIO_EMAIL_FROM` — an address on a domain approved in the matching account
- `TWILIO_EMAIL_FROM_NAME=SkillSurger`

Never expose credentials with a `VITE_` prefix. The previous resume-audit
confirmation webhook is no longer used.

**Historical finding on 24 October:** credentials authenticate,
but the Twilio email sender listing is empty. The configured address is
`support@em3116.skillsurger.com`; this must be checked against the account's
approved sender domain. Existing webinar receipts include a provider rejection.
Do not treat domain DNS or an enabled feature switch as delivery verification.

### Owner-confirmed domain and provider — 25 October

The owner requested `em3116.skillsurger.com` for sending. A fresh read-only
comparison of the Supabase secret digest confirms that `TWILIO_EMAIL_FROM`
already equals `support@em3116.skillsurger.com`. Both email feature switches
are enabled and the Twilio credential secrets are present. No configuration
change or production deployment was needed for this domain request.

Public DNS resolves `em3116.skillsurger.com` to
`u67817132.wl133.sendgrid.net`; the root-domain `s1` and `s2` DKIM CNAMEs also
point to SendGrid. This is evidence of SendGrid DNS setup, not account-level
sender approval for the current Twilio Email API. The owner subsequently
confirmed **Twilio Email** and asked to reuse TransformBuddy's implementation.
No provider switch is needed. The earlier empty Twilio sender listing was checked on
24 October; it was not rechecked by this read-only configuration comparison.

This read-only configuration check did not send email. Local evidence:
`artifacts/webinar-copy-review/sender-domain-evidence.json`.

### TransformBuddy adapter reuse — verified one-off delivery

`supabase/functions/_shared/twilio-email.ts` is adapted from the existing
TransformBuddy file of the same name. TransformBuddy's setup notes record a
prior successful Twilio delivery from its verified `em3090.transformbuddy.ai`
subdomain. That record is not proof of Skillsurger delivery.

Skillsurger's webinar and resume-audit confirmation sender now calls this
adapter with explicit plain-text content and locally HTML-escaped content,
rather than recipient template variables. As in TransformBuddy, HTTP 202 plus
a non-empty operation ID means accepted; no assumed operation-ID prefix is
required. Skillsurger retains its separate enable switches, 10-second timeout,
existing sender secrets, confirmation text, receipt ledger and atomic claim.
Only known non-sends may be retried; ambiguous requests remain protected from
automatic resend. Provider errors retain only safe HTTP/numeric codes.

TransformBuddy files, credentials and paused delivery settings were not changed.
No Auth hooks, reminder schedules or messaging consent behavior were changed.
No migration is required. Deno checks for both Skillsurger registration handlers
passed. The application's updated registration handlers have not been deployed.

At the owner's explicit request, one QA email was sent through this exact
adapter and the existing Skillsurger server credentials on 25 October 2026.
Twilio returned HTTP 202 at 13:01:06 UTC and subsequently reported operation
`comms_operation_01m5sjd18yfb2r9acgy0pjgfjb` as `COMPLETED`, with `total=1`,
`delivered=1`, `failed=0`, `undelivered=0`. Sender:
`support@em3116.skillsurger.com`. Subject:
**Skillsurger email delivery check (QA)**. The destination was the
owner-supplied Gmail verification inbox; no registration or genuine lead was
created. The temporary service-role-protected, fixed-recipient checker was
removed after verification. No provider credentials were copied or changed.

This verifies the adapter's send and provider-reported delivery for one email.
It does not prove inbox placement or the complete registration/receipt/Sheet
flow. Those staging checks remain pending. Local evidence:
`artifacts/email-send-check/send-result.json` and `status-result.json`.

See [SendGrid domain authentication](https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication)
and [Twilio Email prerequisites](https://www.twilio.com/docs/email/api/getting-started).

## Deployment

The existing `20261014010000_lead_confirmations_and_audit_validation.sql` and
`20261015000000_webinar_twilio_email.sql` migrations provide the receipt ledger
and provider tracking columns. They are already applied; no new migration is
required for this fix.

```sh
supabase functions deploy register-webinar --project-ref jpnunlbnthcfvstyymdl --use-api --no-verify-jwt
supabase functions deploy register-resume-audit --project-ref jpnunlbnthcfvstyymdl --use-api --no-verify-jwt
```

## Receipts and retries

An atomic `pending` → `sending` claim prevents concurrent successful sends.
Twilio HTTP 202 plus an operation ID records `accepted`, meaning queued for
processing. Use the operation ID to verify subsequent delivery with Twilio.

A repeat form submission may retry `unconfigured` receipts and known provider
rejections after setup is repaired. Accepted, in-progress, timed-out or ambiguous
sends are not reset. There is no bulk backfill or automatic historical mailing.
Provider numeric error codes are recorded without logging personal details.

Both registrations and uploads remain saved if sending fails. The thank-you
page shows queued, pending or unavailable email status. Webinar users join the
WhatsApp group themselves; a direct WhatsApp confirmation is not promised.

See [the fix handoff](CONFIRMATION-CHECKOUT-FIXES.md) for deployed versions,
remaining account configuration, checkout findings and validation.

References: [Twilio setup](https://www.twilio.com/docs/email/api/getting-started),
[operation tracking](https://www.twilio.com/docs/email/api/operations-and-email-tracking).
