/*
  # Lead capture storage for Job Switch Copilot forms

  1. Storage Setup
    - Create a `leads` table to store submissions from the new anonymous
      lead-capture forms (Free Resume Audit, Career Diagnosis Booking).
    - `form_type` distinguishes which form a row came from (e.g.
      'resume_audit', 'diagnosis_booking').
    - `payload` holds the arbitrary form fields as JSON, since each form
      type has a different field set.
    - Add an insert-only policy for the `anon` role so a visitor can submit
      a lead without signing in, but can never read back any row (their own
      or anyone else's) via the client — there is intentionally no `select`
      policy for `anon` here. Reading leads back is an admin/dashboard
      concern, not a public one.

  2. Notes
    - This is additive and does not modify any existing table.
    - This is the persistence path used by src/lib/googleSheets.ts's
      submitLead() as the reliable fallback when no Google Sheets webhook
      is configured and the external backend has no matching route.
*/

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "Allow anon insert on leads" on public.leads;

create policy "Allow anon insert on leads"
on public.leads
for insert
to anon
with check (true);
