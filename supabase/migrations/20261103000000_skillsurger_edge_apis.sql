-- Skillsurger-only Edge API state. No payment/subscription objects are changed.
create table if not exists public.skillsurger_learning_tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('processing','completed','failed')),
  progress text not null,
  resources jsonb,
  error text,
  start_time bigint not null,
  end_time bigint,
  created_at timestamptz not null default now()
);
create index if not exists skillsurger_learning_tasks_user_idx on public.skillsurger_learning_tasks(user_id,created_at);
alter table public.skillsurger_learning_tasks enable row level security;
revoke all on public.skillsurger_learning_tasks from anon, authenticated;
grant all on public.skillsurger_learning_tasks to service_role;
create table if not exists public.skillsurger_jobs_cache (
  cache_key text primary key,
  jobs_data jsonb not null,
  expires_at timestamptz not null
);
alter table public.skillsurger_jobs_cache enable row level security;
revoke all on public.skillsurger_jobs_cache from anon, authenticated;
grant all on public.skillsurger_jobs_cache to service_role;
create table if not exists public.skillsurger_api_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 1
);
alter table public.skillsurger_api_rate_limits enable row level security;
revoke all on public.skillsurger_api_rate_limits from anon, authenticated;
grant all on public.skillsurger_api_rate_limits to service_role;
create or replace function public.skillsurger_api_rate_limit(p_key text, p_limit integer default 60)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_attempts integer;
begin
  insert into public.skillsurger_api_rate_limits(key) values(p_key)
  on conflict(key) do update set
    attempts=case when skillsurger_api_rate_limits.window_start < now()-interval '10 minutes' then 1 else skillsurger_api_rate_limits.attempts+1 end,
    window_start=case when skillsurger_api_rate_limits.window_start < now()-interval '10 minutes' then now() else skillsurger_api_rate_limits.window_start end
  returning attempts into v_attempts;
  return v_attempts <= least(greatest(p_limit,1),120);
end $$;
revoke all on function public.skillsurger_api_rate_limit(text,integer) from public,anon,authenticated;
grant execute on function public.skillsurger_api_rate_limit(text,integer) to service_role;
