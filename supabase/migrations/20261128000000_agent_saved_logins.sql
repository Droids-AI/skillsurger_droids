-- Saved site logins for the AI browser agent: the user gives a site's login once, ticks
-- "Remember", and later runs sign in from here instead of asking again. Encrypted by the edge
-- function (AES-GCM, bound to user + site); only the service role can read the table. Deleted with
-- the account (cascade) or by the user from the agent panel.
begin;

create table if not exists public.skillsurger_agent_logins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null check (site ~ '^[a-z0-9.-]{1,253}$'),
  username_hint text not null default '' check (length(username_hint) <= 200),
  ciphertext text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (user_id, site)
);
alter table public.skillsurger_agent_logins enable row level security;
revoke all on public.skillsurger_agent_logins from anon, authenticated;

-- Which site a login/new-account question was about, so the user can choose to remember it.
alter table public.skillsurger_agent_requests add column if not exists site text;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261128000000', 'agent_saved_logins') on conflict do nothing;
commit;
