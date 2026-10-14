-- Reschedule the existing webinar while preserving registrations and notification history.
update public.webinar_registrations
set session_id = 'job-switch-2026-10-24'
where session_id = 'job-switch-2026-10-17';

update public.leads
set payload = payload || jsonb_build_object(
  'sessionId', 'job-switch-2026-10-24',
  'startsAt', '2026-10-24T15:00:00+05:30'
)
where form_type = 'webinar_registration'
  and payload->>'sessionId' = 'job-switch-2026-10-17';

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

