-- Job Switch Copilot payments (Dodo webhook) and a daily funnel view.
-- Written only by the dodo-webhook edge function (service role). Not readable by clients.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'dodo',
  event_id text not null unique,          -- webhook-id header: makes redelivery idempotent
  event_type text not null,               -- payment.succeeded, payment.failed, refund.succeeded, ...
  payment_id text,
  refund_id text,
  status text,
  amount_minor bigint,                    -- paise
  currency text,
  customer_email text,
  customer_name text,
  product_ids text[],
  raw jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists payments_payment_id_idx on public.payments(payment_id);
create index if not exists payments_customer_email_idx on public.payments(lower(customer_email));
alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;

-- Records one webhook event and moves the buyer's leads to the matching CRM stage.
create or replace function public.record_payment_event(p_event jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inserted uuid;
  v_type text := p_event->>'event_type';
  v_email text := lower(nullif(trim(p_event->>'customer_email'), ''));
begin
  insert into public.payments(event_id, event_type, payment_id, refund_id, status, amount_minor, currency, customer_email, customer_name, product_ids, raw)
  values (
    p_event->>'event_id', v_type, p_event->>'payment_id', p_event->>'refund_id', p_event->>'status',
    nullif(p_event->>'amount_minor', '')::bigint, p_event->>'currency', v_email, p_event->>'customer_name',
    coalesce(array(select jsonb_array_elements_text(p_event->'product_ids')), '{}'), p_event->'raw'
  )
  on conflict (event_id) do nothing
  returning id into v_inserted;
  if v_inserted is null then
    return jsonb_build_object('duplicate', true);
  end if;

  -- Refund events carry only the payment id; find the buyer from the original payment.
  if v_email is null and p_event->>'payment_id' is not null then
    select customer_email into v_email from public.payments
    where payment_id = p_event->>'payment_id' and customer_email is not null
    order by created_at limit 1;
  end if;

  if v_email is not null and v_type in ('payment.succeeded', 'refund.succeeded') then
    update public.leads
    set payload = payload || case when v_type = 'payment.succeeded'
      then jsonb_build_object('stage', 'Paid', 'paymentStatus', 'paid', 'paymentId', p_event->>'payment_id')
      else jsonb_build_object('stage', 'Refunded', 'paymentStatus', 'refunded') end
    where lower(payload->>'email') = v_email;
  end if;
  return jsonb_build_object('duplicate', false, 'email', v_email);
end $$;
revoke all on function public.record_payment_event(jsonb) from public, anon, authenticated;
grant execute on function public.record_payment_event(jsonb) to service_role;

-- Daily lead-to-payment funnel (IST days). Query in the SQL editor:
--   select * from public.funnel_daily order by day desc limit 30;
create or replace view public.funnel_daily as
with leads as (
  select (created_at at time zone 'Asia/Kolkata')::date as day,
    count(*) filter (where form_type = 'webinar_registration') as webinar_registrations,
    count(*) filter (where form_type = 'webinar_registration' and payload->>'qualified' = 'yes') as qualified_registrations,
    count(*) filter (where form_type = 'resume_audit') as audit_requests,
    count(*) filter (where form_type = 'diagnosis_booking') as consultation_requests
  from public.leads group by 1
), pay as (
  select (created_at at time zone 'Asia/Kolkata')::date as day,
    count(*) filter (where event_type = 'payment.succeeded') as purchases,
    coalesce(sum(amount_minor) filter (where event_type = 'payment.succeeded'), 0) / 100.0 as revenue_inr,
    count(*) filter (where event_type = 'refund.succeeded') as refunds,
    coalesce(sum(amount_minor) filter (where event_type = 'refund.succeeded'), 0) / 100.0 as refunded_inr
  from public.payments group by 1
)
select coalesce(leads.day, pay.day) as day,
  coalesce(webinar_registrations, 0) as webinar_registrations,
  coalesce(qualified_registrations, 0) as qualified_registrations,
  coalesce(audit_requests, 0) as audit_requests,
  coalesce(consultation_requests, 0) as consultation_requests,
  coalesce(purchases, 0) as purchases,
  coalesce(revenue_inr, 0) as revenue_inr,
  coalesce(refunds, 0) as refunds,
  coalesce(refunded_inr, 0) as refunded_inr,
  coalesce(revenue_inr, 0) - coalesce(refunded_inr, 0) as net_revenue_inr
from leads full join pay on leads.day = pay.day;
revoke all on public.funnel_daily from anon, authenticated;
