# Confirmation and checkout fixes — 24 October 2026

## Implemented

- Webinar and resume-audit confirmations share the transactional Twilio sender
  and the server-only `lead_email_notifications` ledger. Resume audits no longer
  depend on the unconfigured `LEAD_CONFIRMATION_WEBHOOK_URL`.
- Repeat submissions can retry a previously unconfigured or explicitly rejected
  email. Accepted, sending and ambiguous requests are not resent. This does not
  send historical registrations a mailing.
- Provider HTTP and numeric error codes are retained for diagnosis without
  storing raw errors, recipients or message bodies in logs.
- Webinar form, FAQ, thank-you page and calendar copy direct users to join the
  WhatsApp group themselves and do not promise a direct WhatsApp confirmation.
  The phone field starts with an editable +91 prefix.
- Existing static Dodo `/buy/` checkout links default to `country=IN` and
  `paymentCurrency=INR`. Existing explicit choices, return URLs and other
  parameters are preserved. This covers subscription links and applicable
  environment-configured tier links.
- Lite pricing copy now reads ₹5,000 one-time. The owner confirmed the Dodo
  product was changed from a subscription to a one-time purchase with no discount.

## Production backend

Supabase project: `jpnunlbnthcfvstyymdl`.

- `register-webinar`: deployed, active version 14.
- `register-resume-audit`: deployed, active version 9.
- `RESUME_AUDIT_EMAIL_ENABLED=true` was configured with the existing Twilio
  credentials. The webinar email switch was already enabled.
- No new migration is required. Existing receipts and registrations are retained.

## Account configuration still required

**Email delivery is not yet fixed or verified.** Live receipts showed four
unconfigured resume-audit emails, one explicitly rejected webinar email, and one
unconfigured webinar email. The configured Twilio credentials authenticate, but
the email sender listing is empty. The configured From address is
`support@em3116.skillsurger.com`. Confirm and activate the correct sender/domain
in the matching Twilio account. A public DNS record alone does not prove that
the sender is approved in that account.

The owner must supply a verification inbox before actual confirmation messages
are sent. Verify both provider acceptance and eventual delivery; HTTP 202 alone
does not prove delivery to the recipient's mail server or inbox.

**Checkout observations and owner update:** the earlier inspection of
`https://dodo.pe/kc8etqr6z2a` showed a ₹20,000 discount against ₹25,000, totalling
₹5,000 including ₹762.71 GST. The owner subsequently confirmed that the Lite
product is now ₹5,000 one-time with no discount. The saved Lite product URL
still returned “This link isn't available” on the last inspection. A current
working Lite payment link has not been supplied, so the bootcamp still uses its
existing short link. That short link ignores country/currency overrides.
The corrected product has not yet been independently verified or connected to
the bootcamp. Preserve the ₹5,000 total, tax treatment and return URL when doing so.

For API access, store `DODO_PAYMENTS_API_KEY` only in local, untracked `.env.local`.
Never use a `VITE_` name or commit the key. The site must not receive payment API
credentials. No Dodo payments, product prices or discounts were modified.

## Validation and preview

Production build, targeted frontend ESLint, and Deno type checks for both lead
handlers pass. A pre-existing boolean inference issue in `greenApi.ts` was fixed
with an explicit return type to permit the function type check.

Mobile and desktop landing-page previews were captured. Hosted checkout was
inspected without entering customer details or submitting a payment. No email
was sent, no resume was uploaded, and no test cases or suites were added or run.

Local preview: `http://127.0.0.1:5173/job-search-copilot-webinar` and
`http://127.0.0.1:5173/job-search-bootcamp`. Frontend publication follows the
repository's existing deployment workflow when these changes are pushed.

The owner requested committing and pushing the current changes to `main`, with
further email configuration and delivery verification deferred.

## Provider references

- [Twilio email prerequisites and sender approval](https://www.twilio.com/docs/email/api/getting-started)
- [Twilio operation and delivery tracking](https://www.twilio.com/docs/email/api/operations-and-email-tracking)
- [Dodo static payment-link parameters](https://docs.dodopayments.com/developer-resources/integration-guide#payment-links)
