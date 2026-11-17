-- First-party test job board for the Anchor pilot (skillsurger.com/qa/test-job).
-- 1. Boards can declare that their form needs no job-board sign-in (no identity to verify).
-- 2. Boards can run a pinned Anchor code task ("code:<task uuid>:<version>").
-- 3. A private inbox receives test applications; only an approved, submit-authorized run can post one.

alter table public.skillsurger_automation_boards add column if not exists requires_login boolean not null default true;

create or replace function public.skillsurger_check_automation_application(p_action_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a public.agent_action_ledger; b public.skillsurger_automation_boards; identity_ok boolean;
begin
  select * into a from public.agent_action_ledger where id = p_action_id;
  if not found or a.product <> 'skillsurger' or a.action_type <> 'apply_job' then raise exception 'application_not_found'; end if;
  if a.payload->>'execution_mode' <> 'anchor' or a.payload->>'execution_mode' is null then raise exception 'manual_application'; end if;
  if a.payload_hash <> public.agent_payload_hash(a.payload) then raise exception 'payload_changed'; end if;
  if not exists (select 1 from public.agent_approval ap where ap.action_id = a.id and ap.user_id = a.user_id
      and ap.decision in ('approved','edited') and ap.payload_hash = a.payload_hash and ap.revoked_at is null and ap.expires_at > now()) then
    raise exception 'approval_required';
  end if;
  if not exists (select 1 from public.skillsurger_tailored_cvs cv join public.saved_jobs j on j.id = cv.saved_job_id
      where cv.id::text = a.payload->>'cv_version_id' and cv.saved_job_id::text = a.payload->>'saved_job_id'
        and cv.user_id = a.user_id and j.user_id = a.user_id and cv.status = 'approved' and j.status = 'saved'
        and cv.content = a.payload->'cv_content') then raise exception 'cv_or_job_changed'; end if;
  select * into b from public.skillsurger_automation_boards where site = a.payload->'automation'->>'site' and enabled;
  if not found or b.revision is distinct from a.payload->'automation'->>'revision'
      or b.task_id is distinct from a.payload->'automation'->>'task_id'
      or b.max_run_credits is distinct from (a.payload->'automation'->>'max_run_credits')::numeric then raise exception 'board_changed'; end if;
  if a.payload->>'application_url' is null or a.destination is distinct from a.payload->>'application_url'
      or a.payload->>'destination' is distinct from a.payload->>'application_url'
      or split_part(split_part(a.payload->>'application_url', '://', 2), '/', 1) <> b.site
      or a.payload->>'application_url' not like 'https://%/%' then raise exception 'destination_not_allowed'; end if;
  -- Only boards whose form needs a sign-in require a verified account connection.
  if b.requires_login then
    select exists (select 1 from public.agent_external_identity i where i.user_id = a.user_id and i.product = 'skillsurger'
      and i.site = b.site and i.status = 'active' and i.ownership_verified_at is not null
      and length(trim(i.ownership_verified_by)) > 0 and length(trim(i.ownership_evidence_ref)) >= 10) into identity_ok;
    if not identity_ok then raise exception 'verified_connection_required'; end if;
  end if;
  if not exists (select 1 from public.skillsurger_automation_consent c where c.user_id = a.user_id
      and c.policy_version = '2026-11-17' and c.revoked_at is null) then raise exception 'consent_required'; end if;
  if not exists (select 1 from public.skillsurger_automation_policy p where p.user_id = a.user_id and p.enabled
      and p.max_run_credits >= b.max_run_credits and p.weekly_credits >= b.max_run_credits) then raise exception 'budget_required'; end if;
end $$;
revoke all on function public.skillsurger_check_automation_application(uuid) from public, anon, authenticated;

-- Test board inbox. Nothing here reaches an employer. Service role only.
create table if not exists public.skillsurger_test_board_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  action_id uuid not null unique references public.agent_action_ledger(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (length(full_name) <= 200),
  email text not null check (length(email) <= 320),
  phone text not null check (length(phone) <= 60),
  cover_note text not null default '' check (length(cover_note) <= 3000),
  cv_sha256 text not null check (cv_sha256 ~ '^[a-f0-9]{64}$'),
  cv_bytes int not null check (cv_bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);
alter table public.skillsurger_test_board_applications enable row level security;
revoke all on public.skillsurger_test_board_applications from anon, authenticated;
grant all on public.skillsurger_test_board_applications to service_role;

-- Accept one test application, only for a run that is in flight and has used its one-time submit permission.
create or replace function public.skillsurger_receive_test_application(
  p_action_id uuid, p_full_name text, p_email text, p_phone text, p_cover_note text, p_cv_sha256 text, p_cv_bytes int)
returns text language plpgsql security definer set search_path = public as $$
declare r public.skillsurger_application_runs; existing text; ref text;
begin
  select reference into existing from public.skillsurger_test_board_applications where action_id = p_action_id;
  if found then return existing; end if;
  select * into r from public.skillsurger_application_runs where action_id = p_action_id for update;
  if not found or r.site <> 'skillsurger.com' or r.state not in ('launching','running') or r.submit_authorized_at is null
      or r.submit_authorized_at < now() - interval '10 minutes' then raise exception 'not_an_authorized_test_application'; end if;
  ref := 'SKS-TEST-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
  insert into public.skillsurger_test_board_applications (reference, action_id, user_id, full_name, email, phone, cover_note, cv_sha256, cv_bytes)
    values (ref, p_action_id, r.user_id, p_full_name, p_email, p_phone, coalesce(p_cover_note,''), p_cv_sha256, p_cv_bytes);
  return ref;
end $$;
revoke all on function public.skillsurger_receive_test_application(uuid,text,text,text,text,text,int) from public, anon, authenticated;
grant execute on function public.skillsurger_receive_test_application(uuid,text,text,text,text,text,int) to service_role;
