-- Application tracker: a status per saved job, set by the user.
-- The existing "Users can manage own saved jobs" policy (auth.uid() = user_id) covers updates.
alter table public.saved_jobs
  add column if not exists status text not null default 'saved',
  add column if not exists status_updated_at timestamptz;

alter table public.saved_jobs drop constraint if exists saved_jobs_status_check;
alter table public.saved_jobs add constraint saved_jobs_status_check
  check (status in ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'));

create index if not exists saved_jobs_user_status_idx on public.saved_jobs (user_id, status);
