-- Email receipts are written and claimed by service-role handlers only.
create table public.lead_email_notifications (
  lead_id uuid primary key references public.leads(id),
  status text not null default 'pending' check (status in ('pending','sending','accepted','failed','unconfigured')),
  updated_at timestamptz not null default now()
);
alter table public.lead_email_notifications enable row level security;
revoke all on public.lead_email_notifications from public, anon, authenticated;
grant all on public.lead_email_notifications to service_role;

create table public.resume_audit_requests (
  request_id uuid primary key,
  lead_id uuid not null references public.leads(id)
);
alter table public.resume_audit_requests enable row level security;
revoke all on public.resume_audit_requests from public, anon, authenticated;
create policy "Resume audits require validated endpoint" on public.leads as restrictive
  for insert to anon, authenticated with check (form_type <> 'resume_audit');

create or replace function public.register_resume_audit(p_request_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_lead uuid;
begin
  if p_request_id is null then raise exception 'Invalid request'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select lead_id into v_lead from public.resume_audit_requests where request_id=p_request_id;
  if v_lead is not null then return jsonb_build_object('leadId',v_lead,'alreadyRegistered',true); end if;
  insert into public.leads(form_type,payload) values('resume_audit',p_payload) returning id into v_lead;
  insert into public.resume_audit_requests(request_id,lead_id) values(p_request_id,v_lead);
  return jsonb_build_object('leadId',v_lead,'alreadyRegistered',false);
end $$;
revoke all on function public.register_resume_audit(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.register_resume_audit(uuid,jsonb) to service_role;

create or replace function public.register_webinar(p_session_id text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid;
  v_lead uuid;
  v_email text := lower(trim(p_payload->>'email'));
begin
  -- This endpoint accepts only the owner-approved session.
  if p_session_id <> 'job-switch-2026-10-24' or now() >= '2026-10-24 15:00:00+05:30'::timestamptz then
    raise exception 'Registration closed';
  end if;
  if v_email is null or length(v_email) > 254 then raise exception 'Invalid email'; end if;
  -- Serialize the same email/session, including concurrent first submissions.
  perform pg_advisory_xact_lock(hashtextextended(p_session_id || ':' || v_email, 0));
  select id into v_id from public.webinar_registrations where session_id=p_session_id and email=v_email;
  if v_id is not null then
    return jsonb_build_object('registrationId',v_id,'leadId',(select lead_id from public.webinar_registrations where id=v_id),'alreadyRegistered',true);
  end if;
  insert into public.leads(form_type,payload)
    values('webinar_registration',p_payload || jsonb_build_object('email',v_email,'sessionId',p_session_id)) returning id into v_lead;
  insert into public.webinar_registrations(session_id,email,lead_id)
    values(p_session_id,v_email,v_lead) returning id into v_id;
  insert into public.webinar_notifications(registration_id) values(v_id);
  return jsonb_build_object('registrationId',v_id,'leadId',v_lead,'alreadyRegistered',false);
end $$;
revoke all on function public.register_webinar(text,jsonb) from public, anon, authenticated;
grant execute on function public.register_webinar(text,jsonb) to service_role;


-- Recover preferred location for accounts completed with the old onboarding form.
update public.profiles
set city = preferred_locations[1]
where (city is null or trim(city) = '')
  and array_length(preferred_locations, 1) > 0
  and lower(trim(preferred_locations[1])) <> 'remote';
