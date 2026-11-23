-- AI browser agent: applies to an approved job on any site (LinkedIn included) in an Anchor browser,
-- driven through Anchor's browser MCP server. Live progress, questions to the user (login, OTP,
-- new account, unknown answers, CAPTCHA takeover) and a final "review before submit" step.
-- All access goes through the skillsurger-browser-agent edge function (service role); browsers never read
-- these tables directly, so the LLM transcript, live-view capability URL and secrets stay server-side.
begin;

create table if not exists public.skillsurger_agent_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  policy_version text not null,
  linkedin_risk_accepted_at timestamptz,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.skillsurger_agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_id uuid not null references public.agent_action_ledger(id) on delete cascade,
  status text not null default 'starting' check (status in
    ('starting','working','waiting_user','ready_to_submit','check_needed','submitted','stopped','failed')),
  application_url text not null,
  anchor_session_id text,
  live_view_url text,
  cv_file_path text,
  current_url text,
  current_title text,
  activity text,                       -- one line for the UI: what the agent is doing right now
  step_count int not null default 0,
  max_steps int not null default 90,
  messages jsonb not null default '[]'::jsonb,
  submit_approved_at timestamptz,
  submit_clicked_at timestamptz,
  lease_owner uuid,
  lease_until timestamptz,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);
-- One live run per user (their browser profile holds their logins) and per application.
create unique index if not exists skillsurger_agent_runs_one_live_user on public.skillsurger_agent_runs (user_id)
  where status in ('starting','working','waiting_user','ready_to_submit');
create unique index if not exists skillsurger_agent_runs_one_live_action on public.skillsurger_agent_runs (action_id)
  where status in ('starting','working','waiting_user','ready_to_submit','check_needed');
create index if not exists skillsurger_agent_runs_action on public.skillsurger_agent_runs (action_id, created_at desc);

create table if not exists public.skillsurger_agent_steps (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.skillsurger_agent_runs(id) on delete cascade,
  kind text not null,                  -- navigate | click | type | select | upload | read | ask | info | error | submit | done
  summary text not null,
  page_url text,
  page_title text,
  screenshot_path text,
  created_at timestamptz not null default now()
);
create index if not exists skillsurger_agent_steps_run on public.skillsurger_agent_steps (run_id, id);

create table if not exists public.skillsurger_agent_requests (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.skillsurger_agent_runs(id) on delete cascade,
  tool_call_id text not null,
  kind text not null check (kind in ('login','otp','new_account','question','takeover','submit_review')),
  message text not null,
  fields jsonb not null default '[]'::jsonb,
  screenshot_path text,
  status text not null default 'pending' check (status in ('pending','answered','cancelled')),
  answer jsonb,                        -- non-secret answers only
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index if not exists skillsurger_agent_requests_run on public.skillsurger_agent_requests (run_id, created_at);

-- Passwords / one-time codes, AES-GCM encrypted by the edge function, deleted after use or at run end.
create table if not exists public.skillsurger_agent_secrets (
  request_id uuid not null references public.skillsurger_agent_requests(id) on delete cascade,
  field text not null,
  ciphertext text not null,
  expires_at timestamptz not null default now() + interval '30 minutes',
  primary key (request_id, field)
);

alter table public.skillsurger_agent_consent  enable row level security;
alter table public.skillsurger_agent_runs     enable row level security;
alter table public.skillsurger_agent_steps    enable row level security;
alter table public.skillsurger_agent_requests enable row level security;
alter table public.skillsurger_agent_secrets  enable row level security;
-- No policies: only the service role (edge function) reads or writes these tables.
revoke all on public.skillsurger_agent_consent, public.skillsurger_agent_runs, public.skillsurger_agent_steps,
  public.skillsurger_agent_requests, public.skillsurger_agent_secrets from anon, authenticated;

-- Short lease so only one edge invocation drives a run at a time.
create or replace function public.skillsurger_agent_lease(p_run_id uuid, p_owner uuid, p_seconds int)
returns setof public.skillsurger_agent_runs language sql security definer set search_path = public as $$
  update public.skillsurger_agent_runs set lease_owner = p_owner, lease_until = now() + make_interval(secs => p_seconds), updated_at = now()
   where id = p_run_id and status in ('starting','working')
     and (lease_until is null or lease_until < now() or lease_owner = p_owner)
  returning *;
$$;
revoke all on function public.skillsurger_agent_lease(uuid, uuid, int) from public, anon, authenticated;
grant execute on function public.skillsurger_agent_lease(uuid, uuid, int) to service_role;

-- Storage for step screenshots (private; served through short signed URLs).
insert into storage.buckets (id, name, public) values ('agent-screenshots', 'agent-screenshots', false)
on conflict (id) do nothing;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261123000000', 'browser_agent') on conflict do nothing;
commit;
