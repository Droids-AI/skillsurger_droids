-- Service-role-only registration RPC. Public clients never read registration data.
create policy "Webinar leads require registration endpoint" on public.leads as restrictive
  for insert to anon, authenticated with check (form_type <> 'webinar_registration');
create table public.webinar_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  email text not null,
  lead_id uuid not null references public.leads(id),
  created_at timestamptz not null default now(),
  unique(session_id, email)
);
create table public.webinar_notifications (
  registration_id uuid primary key references public.webinar_registrations(id),
  status text not null default 'pending' check (status in ('pending','sending','accepted','delivered','read','failed','unconfigured')),
  provider_message_id text unique,
  error_code text,
  request_id uuid,
  updated_at timestamptz not null default now()
);
alter table public.webinar_registrations enable row level security;
alter table public.webinar_notifications enable row level security;
revoke all on public.webinar_registrations, public.webinar_notifications from anon, authenticated;

create or replace function public.register_webinar(p_session_id text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid;
  v_lead uuid;
  v_email text := lower(trim(p_payload->>'email'));
begin
  -- This endpoint accepts only the owner-approved session.
  if p_session_id <> 'job-switch-2026-10-17' or now() >= '2026-10-17 15:00:00+05:30'::timestamptz then
    raise exception 'Registration closed';
  end if;
  if v_email is null or length(v_email) > 254 then raise exception 'Invalid email'; end if;
  -- Serialize the same email/session, including concurrent first submissions.
  perform pg_advisory_xact_lock(hashtextextended(p_session_id || ':' || v_email, 0));
  select id into v_id from public.webinar_registrations where session_id=p_session_id and email=v_email;
  if v_id is not null then
    return jsonb_build_object('registrationId',v_id,'alreadyRegistered',true);
  end if;
  insert into public.leads(form_type,payload)
    values('webinar_registration',p_payload || jsonb_build_object('email',v_email,'sessionId',p_session_id)) returning id into v_lead;
  insert into public.webinar_registrations(session_id,email,lead_id)
    values(p_session_id,v_email,v_lead) returning id into v_id;
  insert into public.webinar_notifications(registration_id) values(v_id);
  return jsonb_build_object('registrationId',v_id,'alreadyRegistered',false);
end $$;
revoke all on function public.register_webinar(text,jsonb) from public, anon, authenticated;
grant execute on function public.register_webinar(text,jsonb) to service_role;

-- Shared per-IP rate limits (hashed IP only, no raw address persisted).
create table public.webinar_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 1
);
alter table public.webinar_rate_limits enable row level security;
revoke all on public.webinar_rate_limits from anon, authenticated;
create or replace function public.webinar_rate_limit(p_key text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare v_attempts integer;
begin
  insert into public.webinar_rate_limits(key) values(p_key)
  on conflict(key) do update set
    attempts=case when webinar_rate_limits.window_start < now()-interval '10 minutes' then 1 else webinar_rate_limits.attempts+1 end,
    window_start=case when webinar_rate_limits.window_start < now()-interval '10 minutes' then now() else webinar_rate_limits.window_start end
  returning attempts into v_attempts;
  return v_attempts <= 10;
end $$;
revoke all on function public.webinar_rate_limit(text) from public,anon,authenticated;
grant execute on function public.webinar_rate_limit(text) to service_role;
