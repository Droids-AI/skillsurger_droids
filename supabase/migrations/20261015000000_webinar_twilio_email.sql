-- Server-only provider tracking for the existing confirmation receipt ledger.
-- No registrations or historical delivery statuses are changed.
alter table public.lead_email_notifications
  add column provider_operation_id text,
  add column error_code text;

comment on column public.lead_email_notifications.provider_operation_id is
  'Twilio Email operation ID. accepted means queued by the provider, not delivered to the inbox.';
