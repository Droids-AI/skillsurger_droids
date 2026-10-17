-- Webinar follow-up sequence, attendance, CRM stage tools and Google Ads offline conversions.
-- Requires 20261017000000_job_switch_payments_and_funnel.sql (public.payments).
-- Everything here is service-role / SQL-editor only.

-- WhatsApp opt-outs. Written by whatsapp-status when someone replies STOP; START removes the row.
create table if not exists public.messaging_opt_outs (
  phone text primary key,                 -- E.164, e.g. +919876543210
  channel text not null default 'whatsapp',
  created_at timestamptz not null default now()
);
alter table public.messaging_opt_outs enable row level security;
revoke all on public.messaging_opt_outs from anon, authenticated;

-- One row per registration, stage and channel: inserting it claims the send, so a
-- reminder goes out at most once even if the scheduler overlaps or retries.
create table if not exists public.webinar_reminders (
  registration_id uuid not null references public.webinar_registrations(id),
  stage text not null check (stage in ('reminder_24h','reminder_1h','post_event','next_day','final_reminder')),
  channel text not null check (channel in ('whatsapp','email')),
  status text not null default 'sending' check (status in ('sending','accepted','delivered','read','failed')),
  provider_message_id text unique,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (registration_id, stage, channel)
);
alter table public.webinar_reminders enable row level security;
revoke all on public.webinar_reminders from anon, authenticated;

-- CRM stages: New -> Qualified -> Registered -> Attended -> Sales Follow-up -> Paid -> Onboarded -> Completed/Refunded.
-- Usage: select public.set_lead_stage('someone@example.com', 'Sales Follow-up', 'Saurav');
create or replace function public.set_lead_stage(p_email text, p_stage text, p_owner text default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_count integer;
begin
  if p_stage not in ('New','Qualified','Registered','Attended','Sales Follow-up','Paid','Onboarded','Completed','Refunded') then
    raise exception 'Unknown stage: %', p_stage;
  end if;
  update public.leads
  set payload = payload
    || jsonb_build_object('stage', p_stage, 'lastContact', to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM-DD'))
    || case when nullif(trim(p_owner), '') is null then '{}'::jsonb else jsonb_build_object('owner', trim(p_owner)) end
  where lower(payload->>'email') = lower(trim(p_email));
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.set_lead_stage(text, text, text) from public, anon, authenticated;
grant execute on function public.set_lead_stage(text, text, text) to service_role;

-- Marks registrants as attended from the meeting's attendance export (list of emails).
-- Leads already further along (Sales Follow-up, Paid, ...) keep their stage.
-- Usage: select public.mark_webinar_attended('job-switch-2026-10-24', array['a@example.com','b@example.com']);
create or replace function public.mark_webinar_attended(p_session_id text, p_emails text[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_emails text[] := array(select distinct lower(trim(e)) from unnest(p_emails) e where nullif(trim(e), '') is not null);
  v_matched text[];
begin
  with updated as (
    update public.leads l
    set payload = l.payload
      || jsonb_build_object('attended', 'yes', 'attendedAt', coalesce(l.payload->>'attendedAt', to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM-DD')))
      || case when coalesce(l.payload->>'stage', 'New') in ('New','Qualified','Registered') then jsonb_build_object('stage', 'Attended') else '{}'::jsonb end
    from public.webinar_registrations r
    where r.lead_id = l.id and r.session_id = p_session_id and r.email = any(v_emails)
    returning r.email
  )
  select coalesce(array_agg(email), '{}') into v_matched from updated;
  return jsonb_build_object(
    'matched', coalesce(array_length(v_matched, 1), 0),
    'unmatched', to_jsonb(array(select e from unnest(v_emails) e where not (e = any(v_matched))))
  );
end $$;
revoke all on function public.mark_webinar_attended(text, text[]) from public, anon, authenticated;
grant execute on function public.mark_webinar_attended(text, text[]) to service_role;

-- Google Ads offline conversion import: paid, not refunded, buyers whose lead came from an ad click.
-- Export as CSV from the SQL editor and upload in Google Ads > Goals > Uploads (or schedule from a sheet).
-- "Email" is the SHA-256 of the trimmed, lower-cased address, for enhanced conversions for leads.
create or replace view public.google_ads_offline_conversions as
select
  l.payload->>'gclid' as "Google Click ID",
  'Job Switch Copilot purchase' as "Conversion Name",
  to_char(p.created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') || '+05:30' as "Conversion Time",
  round(coalesce(p.amount_minor, 0) / 100.0, 2) as "Conversion Value",
  coalesce(upper(p.currency), 'INR') as "Conversion Currency",
  encode(sha256(convert_to(p.customer_email, 'UTF8')), 'hex') as "Email",
  p.payment_id as "Order ID"
from public.payments p
join lateral (
  select payload from public.leads
  where lower(payload->>'email') = p.customer_email and coalesce(payload->>'gclid', '') <> ''
  order by created_at limit 1
) l on true
where p.event_type = 'payment.succeeded'
  and not exists (select 1 from public.payments r where r.event_type = 'refund.succeeded' and r.payment_id = p.payment_id);
revoke all on public.google_ads_offline_conversions from anon, authenticated;

-- Daily funnel, now with attendance (counted on the attendance date).
drop view if exists public.funnel_daily;
create view public.funnel_daily as
with leads as (
  select (created_at at time zone 'Asia/Kolkata')::date as day,
    count(*) filter (where form_type = 'webinar_registration') as webinar_registrations,
    count(*) filter (where form_type = 'webinar_registration' and payload->>'qualified' = 'yes') as qualified_registrations,
    count(*) filter (where form_type = 'resume_audit') as audit_requests,
    count(*) filter (where form_type = 'diagnosis_booking') as consultation_requests
  from public.leads group by 1
), att as (
  select (payload->>'attendedAt')::date as day, count(*) as webinar_attended
  from public.leads where form_type = 'webinar_registration' and payload->>'attended' = 'yes' and payload->>'attendedAt' is not null
  group by 1
), pay as (
  select (created_at at time zone 'Asia/Kolkata')::date as day,
    count(*) filter (where event_type = 'payment.succeeded') as purchases,
    coalesce(sum(amount_minor) filter (where event_type = 'payment.succeeded'), 0) / 100.0 as revenue_inr,
    count(*) filter (where event_type = 'refund.succeeded') as refunds,
    coalesce(sum(amount_minor) filter (where event_type = 'refund.succeeded'), 0) / 100.0 as refunded_inr
  from public.payments group by 1
), days as (
  select day from leads union select day from att union select day from pay
)
select days.day,
  coalesce(webinar_registrations, 0) as webinar_registrations,
  coalesce(qualified_registrations, 0) as qualified_registrations,
  coalesce(webinar_attended, 0) as webinar_attended,
  coalesce(audit_requests, 0) as audit_requests,
  coalesce(consultation_requests, 0) as consultation_requests,
  coalesce(purchases, 0) as purchases,
  coalesce(revenue_inr, 0) as revenue_inr,
  coalesce(refunds, 0) as refunds,
  coalesce(refunded_inr, 0) as refunded_inr,
  coalesce(revenue_inr, 0) - coalesce(refunded_inr, 0) as net_revenue_inr
from days
left join leads on leads.day = days.day
left join att on att.day = days.day
left join pay on pay.day = days.day;
revoke all on public.funnel_daily from anon, authenticated;
