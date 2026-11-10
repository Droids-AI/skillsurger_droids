-- Agent platform core (master plan Part B section 4 / Part D 0001_init), adapted to Supabase.
--
-- Mapping from the plan:
--   app_user                 -> auth.users (rows cascade-delete with the account)
--   current_setting(app.user_id) -> auth.uid()
--   app_worker (BYPASSRLS)   -> service_role (edge functions)
--   app_api                  -> NOT the browser. In Supabase `authenticated` is reachable directly
--                               from the browser, so it gets READ access to its own rows only.
--                               Ledger/approval writes go through the security-definer functions
--                               below, which take the user from auth.uid(), never from input.
--   webhook_inbox            -> public.anchor_webhook_events (20261110010000)
-- Table names carry an `agent_` prefix to stay clear of existing Skillsurger tables.
-- Uses core sha256() and gen_random_uuid(); no extension required.

-- ---------- per-user memory with provenance ----------
create table if not exists public.agent_memory_record (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product           text not null check (product in ('skillsurger','transformbuddy','gencon')),
  brand_id          uuid,
  record_type       text not null check (record_type in ('profile_fact','goal','action','feedback','outcome','style_profile','brand_rule')),
  body              jsonb not null,
  source            text not null check (source in ('user_statement','import','observed','inference','correction')),
  confidence        numeric(3,2) not null default 1.0 check (confidence between 0 and 1),
  status            text not null default 'active' check (status in ('active','superseded','deleted')),
  supersedes_id     uuid references public.agent_memory_record(id) on delete set null,
  consent_scope     text not null default 'product_only' check (consent_scope in ('product_only','external_llm_ok')),
  captured_at       timestamptz not null default now(),
  last_confirmed_at timestamptz,
  deleted_at        timestamptz
);
create index if not exists agent_memory_active_idx on public.agent_memory_record (user_id, product, record_type) where status = 'active';

create table if not exists public.agent_brand_member (
  brand_id uuid not null,
  user_id  uuid not null references auth.users(id) on delete cascade,
  primary key (brand_id, user_id)
);

create or replace function public.agent_check_supersede_same_owner() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.supersedes_id is not null and not exists (
    select 1 from public.agent_memory_record m
    where m.id = new.supersedes_id and m.user_id = new.user_id and m.product = new.product
  ) then
    raise exception 'supersede target must belong to the same user and product';
  end if;
  return new;
end $$;
drop trigger if exists agent_memory_supersede_chk on public.agent_memory_record;
create trigger agent_memory_supersede_chk before insert or update on public.agent_memory_record
  for each row execute function public.agent_check_supersede_same_owner();

-- ---------- external identity (Anchor) ----------
create table if not exists public.agent_external_identity (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  product            text not null,
  site               text not null,
  anchor_identity_id text not null unique,
  -- Must stay pending_verification until the identity-ownership gate (plan section 6) is resolved.
  status             text not null default 'pending_verification' check (status in ('pending_verification','active','failed','deleted')),
  connected_at       timestamptz not null default now(),
  last_validated_at  timestamptz,
  deleted_at         timestamptz,
  unique (user_id, product, site)
);

-- ---------- connect-flow state (server-only) ----------
create table if not exists public.agent_connect_state (
  state         text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  product       text not null,
  site          text not null,
  anchor_app_id text not null,
  anchor_token  text not null,
  expires_at    timestamptz not null,
  consumed_at   timestamptz
);

create or replace function public.agent_consume_connect_state(p_state text)
returns table (user_id uuid, product text, site text, anchor_app_id text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.agent_connect_state cs
     set consumed_at = now()
   where cs.state = p_state and cs.consumed_at is null and cs.expires_at > now()
  returning cs.user_id, cs.product, cs.site, cs.anchor_app_id;
end $$;

-- ---------- action ledger with atomic idempotency ----------
do $$ begin
  create type public.agent_action_state as enum ('queued','needs_approval','running','needs_you','reconciling','done','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.agent_action_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  product       text not null,
  action_type   text not null check (action_type in ('apply_job','send_message','post','comment','like','report')),
  intent_key    text not null unique,
  destination   text not null,
  payload       jsonb not null,
  payload_hash  text not null,
  state         public.agent_action_state not null default 'needs_approval',
  attempts      int not null default 0,
  last_error    text,
  anchor_run_id text unique,
  evidence      jsonb,
  cost_credits  numeric(10,4),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists agent_ledger_user_idx on public.agent_action_ledger (user_id, created_at desc);

create or replace function public.agent_ledger_transition_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.state in ('done','failed') and new.state is distinct from old.state then
    raise exception 'action % is in terminal state % and cannot move to %', old.id, old.state, new.state;
  end if;
  if not ( (old.state = 'queued'         and new.state in ('needs_approval','running','failed'))
        or (old.state = 'needs_approval' and new.state in ('queued','failed'))
        or (old.state = 'running'        and new.state in ('done','failed','needs_you','reconciling'))
        or (old.state = 'needs_you'      and new.state in ('running','failed'))
        or (old.state = 'reconciling'    and new.state in ('queued','done','failed'))
        or (old.state = new.state) ) then
    raise exception 'illegal ledger transition % -> %', old.state, new.state;
  end if;
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists agent_ledger_transition on public.agent_action_ledger;
create trigger agent_ledger_transition before update on public.agent_action_ledger
  for each row execute function public.agent_ledger_transition_guard();

-- ---------- approvals bound to exact payload hash, expiry and revocation ----------
create table if not exists public.agent_approval (
  id             uuid primary key default gen_random_uuid(),
  action_id      uuid not null references public.agent_action_ledger(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  payload_hash   text not null,
  expires_at     timestamptz not null,
  decision       text check (decision in ('approved','rejected','edited')),
  edited_payload jsonb,
  revoked_at     timestamptz,
  decided_at     timestamptz
);

create or replace function public.agent_approval_owner_chk() returns trigger
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from public.agent_action_ledger a where a.id = new.action_id and a.user_id = new.user_id) then
    raise exception 'approval must reference an action owned by the same user';
  end if;
  return new;
end $$;
drop trigger if exists agent_approval_owner on public.agent_approval;
create trigger agent_approval_owner before insert or update on public.agent_approval
  for each row execute function public.agent_approval_owner_chk();

-- sha256 of the canonical jsonb text (jsonb output is key-normalised, so it is deterministic)
create or replace function public.agent_payload_hash(p jsonb) returns text
language sql immutable as $$ select encode(sha256(convert_to(p::text, 'UTF8')), 'hex') $$;

-- Idempotent creation for the signed-in user. created=false => duplicate/retry, never execute twice.
create or replace function public.agent_create_action(
  p_product text, p_action_type text, p_intent_key text, p_destination text, p_payload jsonb)
returns table (action_id uuid, created boolean)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return query
  with ins as (
    insert into public.agent_action_ledger (user_id, product, action_type, intent_key, destination, payload, payload_hash)
    values (uid, p_product, p_action_type, p_intent_key, p_destination, p_payload, public.agent_payload_hash(p_payload))
    on conflict (intent_key) do nothing
    returning id)
  select ins.id, true from ins
  union all
  select a.id, false from public.agent_action_ledger a
   where a.intent_key = p_intent_key and a.user_id = uid and not exists (select 1 from ins);
end $$;

-- Approve / reject / edit. The client must send the hash of the payload it was shown;
-- a mismatch means the payload changed after display and the decision is refused.
create or replace function public.agent_decide_approval(
  p_action_id uuid, p_decision text, p_payload_hash text, p_edited_payload jsonb default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); a public.agent_action_ledger; new_hash text; approval_id uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_decision not in ('approved','rejected','edited') then raise exception 'invalid decision'; end if;
  select * into a from public.agent_action_ledger where id = p_action_id and user_id = uid for update;
  if not found then raise exception 'action not found'; end if;
  if a.state <> 'needs_approval' then raise exception 'action is not awaiting approval'; end if;
  if a.payload_hash <> p_payload_hash then raise exception 'approval_payload_mismatch'; end if;
  new_hash := a.payload_hash;
  if p_decision = 'edited' then
    if p_edited_payload is null then raise exception 'edited payload required'; end if;
    new_hash := public.agent_payload_hash(p_edited_payload);
    update public.agent_action_ledger set payload = p_edited_payload, payload_hash = new_hash where id = a.id;
  end if;
  insert into public.agent_approval (action_id, user_id, payload_hash, expires_at, decision, edited_payload, decided_at)
  values (a.id, uid, new_hash, now() + interval '24 hours', p_decision, p_edited_payload, now())
  returning id into approval_id;
  update public.agent_action_ledger
     set state = case when p_decision = 'rejected' then 'failed'::public.agent_action_state else 'queued'::public.agent_action_state end,
         last_error = case when p_decision = 'rejected' then 'rejected_by_user' else last_error end
   where id = a.id;
  return approval_id;
end $$;

create or replace function public.agent_revoke_approval(p_approval_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.agent_approval set revoked_at = now()
   where id = p_approval_id and user_id = auth.uid() and revoked_at is null;
  return found;
end $$;

-- Execution precondition (service role only): flips queued -> running only while a matching,
-- unexpired, unrevoked approval exists for the CURRENT payload hash. NULL => do not execute.
create or replace function public.agent_claim_action(p_action_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare claimed uuid;
begin
  update public.agent_action_ledger a
     set state = 'running', attempts = a.attempts + 1
   where a.id = p_action_id and a.state = 'queued'
     and exists (select 1 from public.agent_approval ap
                  where ap.action_id = a.id and ap.decision in ('approved','edited')
                    and ap.payload_hash = a.payload_hash and ap.expires_at > now() and ap.revoked_at is null)
  returning a.id into claimed;
  return claimed;
end $$;

-- ---------- job queue with leasing and fencing (server-only) ----------
create table if not exists public.agent_job_queue (
  id         bigint generated always as identity primary key,
  kind       text not null,
  payload    jsonb not null,
  run_at     timestamptz not null default now(),
  locked_at  timestamptz,
  lock_owner text,
  lock_gen   bigint not null default 0,
  done_at    timestamptz,
  attempts   int not null default 0
);
create index if not exists agent_job_due_idx on public.agent_job_queue (run_at) where done_at is null;

-- ---------- row level security ----------
alter table public.agent_memory_record     enable row level security;
alter table public.agent_brand_member      enable row level security;
alter table public.agent_external_identity enable row level security;
alter table public.agent_connect_state     enable row level security;
alter table public.agent_action_ledger     enable row level security;
alter table public.agent_approval          enable row level security;
alter table public.agent_job_queue         enable row level security;

drop policy if exists agent_mem_own on public.agent_memory_record;
create policy agent_mem_own on public.agent_memory_record for all to authenticated
  using ( user_id = auth.uid() and ( brand_id is null or exists (
          select 1 from public.agent_brand_member bm where bm.brand_id = agent_memory_record.brand_id and bm.user_id = auth.uid()) ) )
  with check ( user_id = auth.uid() and ( brand_id is null or exists (
          select 1 from public.agent_brand_member bm where bm.brand_id = agent_memory_record.brand_id and bm.user_id = auth.uid()) ) );
drop policy if exists agent_brand_read_own on public.agent_brand_member;
create policy agent_brand_read_own on public.agent_brand_member for select to authenticated using (user_id = auth.uid());
drop policy if exists agent_ident_read_own on public.agent_external_identity;
create policy agent_ident_read_own on public.agent_external_identity for select to authenticated using (user_id = auth.uid());
drop policy if exists agent_ledger_read_own on public.agent_action_ledger;
create policy agent_ledger_read_own on public.agent_action_ledger for select to authenticated using (user_id = auth.uid());
drop policy if exists agent_approval_read_own on public.agent_approval;
create policy agent_approval_read_own on public.agent_approval for select to authenticated using (user_id = auth.uid());

-- ---------- grants ----------
revoke all on public.agent_memory_record, public.agent_brand_member, public.agent_external_identity,
  public.agent_connect_state, public.agent_action_ledger, public.agent_approval, public.agent_job_queue from anon, authenticated;
-- Memory is user-owned data: users may read, add and correct their own facts (RLS + supersede trigger apply).
grant select, insert, update on public.agent_memory_record to authenticated;
grant select on public.agent_brand_member, public.agent_external_identity, public.agent_action_ledger, public.agent_approval to authenticated;
grant all on public.agent_memory_record, public.agent_brand_member, public.agent_external_identity,
  public.agent_connect_state, public.agent_action_ledger, public.agent_approval, public.agent_job_queue to service_role;

revoke all on function public.agent_consume_connect_state(text), public.agent_claim_action(uuid),
  public.agent_create_action(text, text, text, text, jsonb),
  public.agent_decide_approval(uuid, text, text, jsonb),
  public.agent_revoke_approval(uuid) from public, anon;
grant execute on function public.agent_create_action(text, text, text, text, jsonb),
  public.agent_decide_approval(uuid, text, text, jsonb),
  public.agent_revoke_approval(uuid) to authenticated, service_role;
grant execute on function public.agent_consume_connect_state(text), public.agent_claim_action(uuid) to service_role;
revoke execute on function public.agent_consume_connect_state(text), public.agent_claim_action(uuid) from authenticated;
