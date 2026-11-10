-- Durable inbox for Anchor Browser webhooks (agent-platform plan, Part B section 7).
-- Verified events are stored once (event id is the key, so Anchor retries are
-- no-ops). Nothing acts on them yet; the Phase 1 action ledger will.
create table if not exists public.anchor_webhook_events (
  id text primary key,                 -- Anchor event id, evt_...
  type text not null,                  -- e.g. task.completed, identity.authentication_failed
  project_id text,
  event_created_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists anchor_webhook_events_unprocessed_idx
  on public.anchor_webhook_events (received_at) where processed_at is null;
alter table public.anchor_webhook_events enable row level security;
revoke all on public.anchor_webhook_events from anon, authenticated;
