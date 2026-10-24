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

**As of 24 October, live delivery remains unresolved:** credentials authenticate,
but the Twilio email sender listing is empty. The configured address is
`support@em3116.skillsurger.com`; this must be checked against the account's
approved sender domain. Existing webinar receipts include a provider rejection.
Do not treat domain DNS or an enabled feature switch as delivery verification.

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
