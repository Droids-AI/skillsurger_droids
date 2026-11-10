-- Application pipeline without browser automation (plan 4.3, tests S2/S3/S7/S11-S14).
-- Tailored CV versions, application actions (agent_action_ledger), manual-send outreach drafts.
-- Writes go through the skillsurger-agent edge function (service role); users read their own rows.

create table if not exists public.skillsurger_tailored_cvs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  saved_job_id  uuid not null references public.saved_jobs(id) on delete cascade,
  version       int not null,
  facts         jsonb not null,             -- the profile facts this version may cite (base snapshot)
  content       jsonb not null,             -- validated tailored CV; every line carries evidence ids
  dropped       jsonb not null default '[]',-- lines the validator removed, with the reason
  questions     jsonb not null default '[]',-- requirements the profile does not show
  status        text not null default 'draft' check (status in ('draft','approved','rejected','superseded')),
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique (saved_job_id, version)
);
create index if not exists skillsurger_tailored_cvs_user_idx on public.skillsurger_tailored_cvs (user_id, saved_job_id, version desc);
create unique index if not exists skillsurger_tailored_cvs_one_approved on public.skillsurger_tailored_cvs (saved_job_id) where status = 'approved';

create table if not exists public.skillsurger_outreach_sequences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  saved_job_id  uuid not null references public.saved_jobs(id) on delete cascade,
  contact_name  text not null check (length(trim(contact_name)) between 1 and 120),
  contact_role  text not null default '' check (length(contact_role) <= 160),
  channel       text not null default 'linkedin' check (channel in ('linkedin','email')),
  status        text not null default 'active' check (status in ('active','stopped','completed')),
  stop_reason   text,
  created_at    timestamptz not null default now(),
  stopped_at    timestamptz
);
-- One sequence per job-contact pair (S13).
create unique index if not exists skillsurger_outreach_one_per_contact on public.skillsurger_outreach_sequences (saved_job_id, lower(contact_name));

create table if not exists public.skillsurger_outreach_messages (
  id            uuid primary key default gen_random_uuid(),
  sequence_id   uuid not null references public.skillsurger_outreach_sequences(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  step          text not null check (step in ('connection_note','referral_ask','follow_up_1','follow_up_2')),
  body          text not null check (length(body) <= 3000),
  status        text not null default 'draft' check (status in ('draft','sent','skipped')),
  sent_at       timestamptz,
  ledger_action_id uuid references public.agent_action_ledger(id) on delete set null,
  unique (sequence_id, step)
);

-- S11: an application action may only reference an APPROVED tailored CV of the same user and job.
create or replace function public.skillsurger_apply_requires_approved_cv() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.product = 'skillsurger' and new.action_type = 'apply_job' and not exists (
    select 1 from public.skillsurger_tailored_cvs c
     where c.id::text = new.payload->>'cv_version_id' and c.user_id = new.user_id
       and c.saved_job_id::text = new.payload->>'saved_job_id' and c.status = 'approved'
  ) then
    raise exception 'application requires an approved tailored CV for this job';
  end if;
  return new;
end $$;
drop trigger if exists skillsurger_apply_cv_check on public.agent_action_ledger;
create trigger skillsurger_apply_cv_check before insert or update of payload on public.agent_action_ledger
  for each row execute function public.skillsurger_apply_requires_approved_cv();

-- S13: a job status change (interview, offer, rejection, withdrawal) stops its outreach.
create or replace function public.skillsurger_stop_outreach_on_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('interviewing','offer','rejected','withdrawn') then
    update public.skillsurger_outreach_sequences
       set status = 'stopped', stop_reason = 'job_status_' || new.status, stopped_at = now()
     where saved_job_id = new.id and status = 'active';
    update public.skillsurger_outreach_messages m set status = 'skipped'
      from public.skillsurger_outreach_sequences s
     where m.sequence_id = s.id and s.saved_job_id = new.id and m.status = 'draft';
  end if;
  return new;
end $$;
drop trigger if exists skillsurger_saved_job_stop_outreach on public.saved_jobs;
create trigger skillsurger_saved_job_stop_outreach after update of status on public.saved_jobs
  for each row execute function public.skillsurger_stop_outreach_on_status();

alter table public.skillsurger_tailored_cvs        enable row level security;
alter table public.skillsurger_outreach_sequences  enable row level security;
alter table public.skillsurger_outreach_messages   enable row level security;
drop policy if exists skillsurger_tailored_read_own on public.skillsurger_tailored_cvs;
create policy skillsurger_tailored_read_own on public.skillsurger_tailored_cvs for select to authenticated using (user_id = auth.uid());
drop policy if exists skillsurger_outreach_seq_read_own on public.skillsurger_outreach_sequences;
create policy skillsurger_outreach_seq_read_own on public.skillsurger_outreach_sequences for select to authenticated using (user_id = auth.uid());
drop policy if exists skillsurger_outreach_msg_read_own on public.skillsurger_outreach_messages;
create policy skillsurger_outreach_msg_read_own on public.skillsurger_outreach_messages for select to authenticated using (user_id = auth.uid());

revoke all on public.skillsurger_tailored_cvs, public.skillsurger_outreach_sequences, public.skillsurger_outreach_messages from anon, authenticated;
grant select on public.skillsurger_tailored_cvs, public.skillsurger_outreach_sequences, public.skillsurger_outreach_messages to authenticated;
grant all on public.skillsurger_tailored_cvs, public.skillsurger_outreach_sequences, public.skillsurger_outreach_messages to service_role;
