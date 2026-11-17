-- Approved application execution. No boards, budgets, identities or feature flags are enabled here.
-- A reviewed, immutable Anchor Task implements the application_v1 input/output contract.
create table if not exists public.skillsurger_automation_boards (
  site text primary key check (site ~ '^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$'),
  application_id text not null,
  task_id text not null,
  revision text not null check (length(revision) between 1 and 100),
  enabled boolean not null default false,
  terms_url text not null check (terms_url ~ '^https://'),
  terms_verified_at timestamptz not null,
  reviewed_by text not null check (length(trim(reviewed_by)) > 0),
  max_run_credits numeric(10,4) not null check (max_run_credits > 0),
  input_contract text not null default 'application_v1' check (input_contract = 'application_v1')
);
create or replace function public.skillsurger_board_revision_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if new is distinct from old and new.revision = old.revision then
    raise exception 'change the board revision when changing reviewed configuration';
  end if;
  return new;
end $$;
drop trigger if exists skillsurger_board_revision_check on public.skillsurger_automation_boards;
create trigger skillsurger_board_revision_check before update on public.skillsurger_automation_boards
  for each row execute function public.skillsurger_board_revision_guard();

create table if not exists public.skillsurger_automation_policy (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  weekly_credits numeric(10,4) not null default 0 check (weekly_credits >= 0),
  max_run_credits numeric(10,4) not null default 0 check (max_run_credits >= 0)
);
create table if not exists public.skillsurger_automation_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  policy_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.agent_external_identity add column if not exists ownership_verified_at timestamptz;
alter table public.agent_external_identity add column if not exists ownership_verified_by text;
alter table public.agent_external_identity add column if not exists ownership_evidence_ref text;

-- The run is a durable queue entry, reservation and dispatch tombstone, unique per action.
-- launching is never automatically retried: a crash may have happened after the external submit.
create table if not exists public.skillsurger_application_runs (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null unique references public.agent_action_ledger(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null,
  board_revision text not null,
  task_id text not null,
  state text not null default 'queued' check (state in ('queued','launching','running','needs_you','reconciling','done','failed')),
  anchor_run_id text unique,
  reserved_credits numeric(10,4) not null check (reserved_credits > 0),
  cost_credits numeric(10,4) check (cost_credits >= 0),
  reason text,
  result jsonb,
  lock_owner text,
  lock_gen bigint not null default 0,
  locked_at timestamptz,
  next_check_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.skillsurger_application_runs add column if not exists submit_token_hash text;
alter table public.skillsurger_application_runs add column if not exists submit_token_expires_at timestamptz;
alter table public.skillsurger_application_runs add column if not exists submit_authorized_at timestamptz;
alter table public.skillsurger_application_runs add column if not exists dispatch_started_at timestamptz;
alter table public.skillsurger_application_runs add column if not exists status_checks int not null default 0;
create index if not exists skillsurger_application_runs_due on public.skillsurger_application_runs (next_check_at)
  where state in ('queued','launching','running','reconciling');

-- Called again at dispatch, not just when the draft/approval was created.
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
  -- Exact HTTPS host; ports, userinfo and alternate hosts cannot be smuggled into a task.
  if a.payload->>'application_url' is null or a.destination is distinct from a.payload->>'application_url'
      or a.payload->>'destination' is distinct from a.payload->>'application_url'
      or split_part(split_part(a.payload->>'application_url', '://', 2), '/', 1) <> b.site
      or a.payload->>'application_url' not like 'https://%/%' then raise exception 'destination_not_allowed'; end if;
  select exists (select 1 from public.agent_external_identity i where i.user_id = a.user_id and i.product = 'skillsurger'
    and i.site = b.site and i.status = 'active' and i.ownership_verified_at is not null
    and length(trim(i.ownership_verified_by)) > 0 and length(trim(i.ownership_evidence_ref)) >= 10) into identity_ok;
  if not identity_ok then raise exception 'verified_connection_required'; end if;
  if not exists (select 1 from public.skillsurger_automation_consent c where c.user_id = a.user_id
      and c.policy_version = '2026-11-17' and c.revoked_at is null) then raise exception 'consent_required'; end if;
  if not exists (select 1 from public.skillsurger_automation_policy p where p.user_id = a.user_id and p.enabled
      and p.max_run_credits >= b.max_run_credits and p.weekly_credits >= b.max_run_credits) then raise exception 'budget_required'; end if;
end $$;

create or replace function public.skillsurger_enqueue_application(p_action_id uuid, p_user_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare a public.agent_action_ledger; p public.skillsurger_automation_policy; run_id uuid; cap numeric; spent numeric;
begin
  select * into a from public.agent_action_ledger where id = p_action_id and user_id = p_user_id for update;
  if not found then raise exception 'application_not_found'; end if;
  select id into run_id from public.skillsurger_application_runs where action_id = a.id;
  if found then return run_id; end if; -- duplicate clicks never reserve twice
  if a.state <> 'queued' then raise exception 'approval_required'; end if;
  perform public.skillsurger_check_automation_application(a.id);
  select * into p from public.skillsurger_automation_policy where user_id = a.user_id for update;
  cap := (select max_run_credits from public.skillsurger_automation_boards where site = a.payload->'automation'->>'site');
  -- Serialize the per-user reservation. Unknown costs keep their full reservation, even across weeks.
  select coalesce(sum(greatest(coalesce(r.cost_credits, r.reserved_credits), r.reserved_credits)),0) into spent
    from public.skillsurger_application_runs r where r.user_id = a.user_id
      and (r.created_at >= date_trunc('week',now()) or r.cost_credits is null or r.state not in ('done','failed'));
  if spent + cap > p.weekly_credits then raise exception 'weekly_budget_exhausted'; end if;
  -- A second CV/action for the same saved job must not create a second external submission.
  if exists (select 1 from public.skillsurger_application_runs r join public.agent_action_ledger other on other.id = r.action_id
      where r.user_id = a.user_id and other.payload->>'saved_job_id' = a.payload->>'saved_job_id'
        and (r.dispatch_started_at is not null or r.state<>'failed')) then raise exception 'job_already_dispatched'; end if;
  insert into public.skillsurger_application_runs (action_id,user_id,site,board_revision,task_id,reserved_credits)
    values (a.id,a.user_id,a.payload->'automation'->>'site',a.payload->'automation'->>'revision',a.payload->'automation'->>'task_id',cap)
    returning id into run_id;
  return run_id;
end $$;

-- Lease one run. Only a queued run can launch. A stale launch becomes reconciliation, never queued.
create or replace function public.skillsurger_lease_application(p_run_id uuid, p_worker text)
returns setof public.skillsurger_application_runs language plpgsql security definer set search_path = public as $$
declare r public.skillsurger_application_runs;
begin
  select * into r from public.skillsurger_application_runs where id = p_run_id for update skip locked;
  if not found or r.state not in ('queued','launching','running','reconciling') or r.next_check_at > now()
      or (r.locked_at is not null and r.locked_at > now() - interval '5 minutes') then return; end if;
  if r.status_checks>=60 then
    update public.skillsurger_application_runs set state='needs_you',reason='reconciliation_limit_reached',updated_at=now() where id=r.id;
    update public.agent_action_ledger set state='needs_you',last_error='reconciliation_limit_reached' where id=r.action_id and state in ('running','reconciling');
    return;
  end if;
  if r.state = 'launching' then
    update public.skillsurger_application_runs set state='reconciling', reason='dispatch_outcome_unknown' where id=r.id;
    update public.agent_action_ledger set state='reconciling',last_error='dispatch_outcome_unknown' where id=r.action_id and state='running';
  end if;
  return query update public.skillsurger_application_runs set lock_owner=p_worker, lock_gen=lock_gen+1, locked_at=now(),updated_at=now(),
    status_checks=status_checks+case when state='queued' then 0 else 1 end
    where id=r.id returning *;
end $$;

create or replace function public.skillsurger_begin_application(p_run_id uuid, p_worker text, p_gen bigint, p_submit_token_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.skillsurger_application_runs;
begin
  select * into r from public.skillsurger_application_runs where id=p_run_id for update;
  if not found or r.state <> 'queued' or r.lock_owner is distinct from p_worker or r.lock_gen is distinct from p_gen
      or r.locked_at is null or r.locked_at < now() - interval '5 minutes' then return false; end if;
  if p_submit_token_hash is null or p_submit_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'submit_capability_required'; end if;
  perform 1 from public.agent_action_ledger where id=r.action_id for update;
  perform public.skillsurger_check_automation_application(r.action_id);
  if public.agent_claim_action(r.action_id) is null then return false; end if;
  update public.skillsurger_application_runs set state='launching',updated_at=now(),submit_token_hash=p_submit_token_hash,
    submit_token_expires_at=now()+interval '10 minutes',dispatch_started_at=now() where id=r.id;
  return true;
end $$;

-- A reviewed task must call this immediately before its ONE submit click. The raw capability
-- is supplied only to that task. Replays, withdrawn consent and approval revocation fail closed.
create or replace function public.skillsurger_authorize_submit(p_run_id uuid,p_token_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.skillsurger_application_runs;
begin
  select * into r from public.skillsurger_application_runs where id=p_run_id for update;
  if not found or r.state not in ('launching','running') or r.submit_token_hash is distinct from p_token_hash
      or r.submit_token_hash is null or r.submit_token_expires_at is null or r.submit_token_expires_at <= now() or r.submit_authorized_at is not null then return false; end if;
  perform public.skillsurger_check_automation_application(r.action_id);
  update public.skillsurger_application_runs set submit_authorized_at=now(),submit_token_hash=null where id=r.id;
  return true;
end $$;

-- All post-dispatch writes are fenced; stale workers cannot replace evidence or attach a run.
create or replace function public.skillsurger_update_application_run(
  p_run_id uuid, p_worker text, p_gen bigint, p_state text, p_anchor_run_id text default null,
  p_reason text default null, p_result jsonb default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.skillsurger_application_runs; ledger_state public.agent_action_state;
begin
  select * into r from public.skillsurger_application_runs where id=p_run_id for update;
  if not found or r.lock_owner is distinct from p_worker or r.lock_gen is distinct from p_gen
      or r.locked_at is null or r.locked_at < now() - interval '5 minutes' or r.state in ('done','failed') then return false; end if;
  if p_state not in ('running','needs_you','reconciling','done','failed') then raise exception 'invalid_run_state'; end if;
  if r.anchor_run_id is not null and p_anchor_run_id is distinct from r.anchor_run_id then raise exception 'provider_run_changed'; end if;
  if p_state='done' and (r.submit_authorized_at is null or p_anchor_run_id is null or p_result->>'confirmation_reference' is null
      or length(trim(p_result->>'confirmation_reference'))=0) then raise exception 'submission_evidence_required'; end if;
  ledger_state := case p_state when 'running' then 'running'::public.agent_action_state
    when 'needs_you' then 'needs_you'::public.agent_action_state when 'reconciling' then 'reconciling'::public.agent_action_state
    when 'done' then 'done'::public.agent_action_state else 'failed'::public.agent_action_state end;
  -- queued -> failed is valid for a revoked approval / withdrawn consent before any dispatch.
  update public.agent_action_ledger set state=ledger_state, anchor_run_id=coalesce(p_anchor_run_id,anchor_run_id),
    last_error=p_reason, evidence=case when p_state='done' then jsonb_build_object('method','anchor_task','receipt',p_result,'verified_at',now()) else evidence end
    where id=r.action_id;
  update public.skillsurger_application_runs set state=p_state,anchor_run_id=coalesce(p_anchor_run_id,anchor_run_id),reason=p_reason,
    result=p_result,locked_at=null,lock_owner=null,updated_at=now(),next_check_at=now()+case
      when p_state='reconciling' and p_anchor_run_id is null then interval '24 hours' else interval '30 seconds' end where id=r.id;
  if p_state='done' then
    update public.saved_jobs set status='applied' where id::text=(select payload->>'saved_job_id' from public.agent_action_ledger where id=r.action_id)
      and user_id=r.user_id and status='saved';
    insert into public.agent_memory_record (user_id,product,record_type,body,source)
      values (r.user_id,'skillsurger','outcome',jsonb_build_object('action_id',r.action_id,'outcome','application_submitted','evidence',p_result),'observed');
  end if;
  return true;
end $$;

-- Trusted operator records an independently checked site outcome. It never retries a submit.
create or replace function public.skillsurger_resolve_application(p_run_id uuid,p_outcome text,p_evidence_ref text,p_operator text)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.skillsurger_application_runs; final_state public.agent_action_state; proof jsonb;
begin
  if p_outcome not in ('submitted','not_submitted') or p_outcome is null
      or length(trim(p_evidence_ref))<10 or p_evidence_ref is null or length(trim(p_operator))<3 or p_operator is null
    then raise exception 'independent_outcome_evidence_required'; end if;
  select * into r from public.skillsurger_application_runs where id=p_run_id for update;
  if not found or r.state not in ('needs_you','reconciling') then return false; end if;
  final_state:=case when p_outcome='submitted' then 'done'::public.agent_action_state else 'failed'::public.agent_action_state end;
  proof:=jsonb_build_object('method','operator_reconciliation','outcome',p_outcome,'evidence_reference',p_evidence_ref,'checked_by',p_operator,'checked_at',now());
  update public.agent_action_ledger set state=final_state,evidence=proof,last_error=null where id=r.action_id;
  update public.skillsurger_application_runs set state=final_state::text,result=proof,reason=null,locked_at=null,lock_owner=null,updated_at=now() where id=r.id;
  if p_outcome='submitted' then
    update public.saved_jobs set status='applied' where id::text=(select payload->>'saved_job_id' from public.agent_action_ledger where id=r.action_id) and user_id=r.user_id and status='saved';
  end if;
  insert into public.agent_memory_record(user_id,product,record_type,body,source)
    values(r.user_id,'skillsurger','outcome',proof||jsonb_build_object('action_id',r.action_id),'observed');
  return true;
end $$;

-- Actual charges are imported by an operator from provider usage, never inferred from task success.
create or replace function public.skillsurger_record_application_cost(p_run_id uuid,p_cost numeric,p_usage_reference text)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.skillsurger_application_runs;
begin
  if p_cost is null or p_cost < 0 or length(trim(p_usage_reference)) < 10 then raise exception 'measured_usage_required'; end if;
  select * into r from public.skillsurger_application_runs where id=p_run_id for update;
  if not found then return false; end if;
  update public.skillsurger_application_runs set cost_credits=p_cost,updated_at=now() where id=r.id;
  update public.agent_action_ledger set cost_credits=p_cost,
    evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('usage_reference',p_usage_reference) where id=r.action_id;
  if p_cost > r.reserved_credits then update public.skillsurger_automation_policy set enabled=false where user_id=r.user_id; end if;
  return true;
end $$;

-- Polling an unknown outcome may discover a still-running task or a login challenge.
create or replace function public.agent_ledger_transition_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.state in ('done','failed') and new.state is distinct from old.state then
    raise exception 'action % is in terminal state % and cannot move to %',old.id,old.state,new.state;
  end if;
  if not ((old.state='queued' and new.state in ('needs_approval','running','failed'))
    or (old.state='needs_approval' and new.state in ('queued','failed'))
    or (old.state='running' and new.state in ('done','failed','needs_you','reconciling'))
    or (old.state='needs_you' and new.state in ('running','failed','done','reconciling'))
    or (old.state='reconciling' and new.state in ('running','needs_you','done','failed'))
    or old.state=new.state) then raise exception 'illegal ledger transition % -> %',old.state,new.state; end if;
  new.updated_at=now(); return new;
end $$;

-- A manual operator check is explicit, audited and never inferred from callback metadata.
create or replace function public.skillsurger_verify_connection(p_connection_id uuid,p_user_id uuid,p_site text,p_operator text,p_evidence_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if length(trim(p_operator)) < 3 or length(trim(p_evidence_ref)) < 10 then raise exception 'authenticated_ownership_evidence_required'; end if;
  update public.agent_external_identity set status='active',ownership_verified_at=now(),ownership_verified_by=p_operator,
    ownership_evidence_ref=p_evidence_ref,last_validated_at=now()
    where id=p_connection_id and user_id=p_user_id and site=p_site and product='skillsurger' and status='pending_verification';
  return found;
end $$;

-- Block future submit permissions before attempting vendor cleanup. If vendor deletion fails,
-- the active row remains for a deletion retry, but its ownership proof is no longer executable.
create or replace function public.skillsurger_prepare_disconnect(p_user_id uuid,p_site text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.agent_connect_state set consumed_at=now() where user_id=p_user_id and product='skillsurger' and site=p_site and consumed_at is null;
  update public.agent_external_identity set ownership_verified_at=null where user_id=p_user_id and product='skillsurger' and site=p_site;
  update public.agent_action_ledger a set state='failed',last_error='account_disconnected'
    from public.skillsurger_application_runs r where r.action_id=a.id and r.user_id=p_user_id and r.site=p_site and r.state='queued' and a.state='queued';
  update public.skillsurger_application_runs set state='failed',reason='account_disconnected',cost_credits=0,updated_at=now()
    where user_id=p_user_id and site=p_site and state='queued';
end $$;

-- Closing an unstarted draft allows a fresh review. Dispatched attempts require reconciliation.
create or replace function public.skillsurger_close_application(p_action_id uuid,p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare a public.agent_action_ledger;
begin
  select * into a from public.agent_action_ledger where id=p_action_id and user_id=p_user_id and product='skillsurger' and action_type='apply_job' for update;
  if not found or a.state not in ('needs_approval','queued') then return false; end if;
  if exists(select 1 from public.skillsurger_application_runs where action_id=a.id and dispatch_started_at is not null) then return false; end if;
  update public.agent_approval set revoked_at=now() where action_id=a.id and revoked_at is null;
  update public.agent_action_ledger set state='failed',last_error='closed_by_user' where id=a.id;
  update public.skillsurger_application_runs set state='failed',reason='closed_by_user',cost_credits=0,updated_at=now() where action_id=a.id and state='queued';
  return true;
end $$;

alter table public.skillsurger_automation_boards enable row level security;
alter table public.skillsurger_automation_policy enable row level security;
alter table public.skillsurger_automation_consent enable row level security;
alter table public.skillsurger_application_runs enable row level security;
drop policy if exists skillsurger_runs_own on public.skillsurger_application_runs;
create policy skillsurger_runs_own on public.skillsurger_application_runs for select to authenticated using (user_id=auth.uid());
revoke all on public.skillsurger_automation_boards,public.skillsurger_automation_policy,public.skillsurger_automation_consent,public.skillsurger_application_runs from anon,authenticated;
grant select (id,action_id,user_id,site,state,reserved_credits,cost_credits,reason,result,created_at,updated_at) on public.skillsurger_application_runs to authenticated;
grant all on public.skillsurger_automation_boards,public.skillsurger_automation_policy,public.skillsurger_automation_consent,public.skillsurger_application_runs to service_role;

revoke all on function public.skillsurger_check_automation_application(uuid),public.skillsurger_enqueue_application(uuid,uuid),
  public.skillsurger_lease_application(uuid,text),public.skillsurger_begin_application(uuid,text,bigint,text),public.skillsurger_authorize_submit(uuid,text),
  public.skillsurger_update_application_run(uuid,text,bigint,text,text,text,jsonb),public.skillsurger_verify_connection(uuid,uuid,text,text,text),
  public.skillsurger_record_application_cost(uuid,numeric,text),public.skillsurger_prepare_disconnect(uuid,text),public.skillsurger_close_application(uuid,uuid),
  public.skillsurger_resolve_application(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.skillsurger_check_automation_application(uuid),public.skillsurger_enqueue_application(uuid,uuid),
  public.skillsurger_lease_application(uuid,text),public.skillsurger_begin_application(uuid,text,bigint,text),public.skillsurger_authorize_submit(uuid,text),
  public.skillsurger_update_application_run(uuid,text,bigint,text,text,text,jsonb),public.skillsurger_verify_connection(uuid,uuid,text,text,text),
  public.skillsurger_record_application_cost(uuid,numeric,text),public.skillsurger_prepare_disconnect(uuid,text),public.skillsurger_close_application(uuid,uuid),
  public.skillsurger_resolve_application(uuid,text,text,text) to service_role;
