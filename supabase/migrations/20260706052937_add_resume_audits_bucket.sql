/*
  # Anonymous resume-audit uploads

  1. Storage Setup
    - Create a public storage bucket `resume-audits` for the Free Resume Audit
      lead-capture form (anonymous, unauthenticated visitors).
    - Add an insert-only policy for the `anon` role so a visitor can upload
      their resume without signing in, but can never list or read back any
      file (including their own or anyone else's) via the client — there is
      intentionally no `select` policy for `anon` here.

  2. Notes
    - This mirrors the existing `cvs` bucket pattern (see
      20250309080330_broken_waterfall.sql) which is scoped to authenticated
      users; this migration is the anonymous-visitor equivalent used only by
      the new /free-resume-audit form.
    - This migration file is additive and does not modify the `cvs` bucket,
      its policies, or any other existing storage configuration.
*/

-- Safely create the storage bucket
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('resume-audits', 'resume-audits', false)
  on conflict (id) do nothing;
end $$;

-- Note: RLS is already enabled on storage.objects by default in every
-- Supabase project, and that table is owned by the internal storage role
-- (not the project owner), so running `alter table storage.objects enable
-- row level security` here fails with "must be owner of table objects".
-- It isn't needed — only policy management below is required.

-- Drop existing policy if it exists, then recreate
drop policy if exists "Allow anon uploads to resume-audits" on storage.objects;

-- Anonymous visitors may upload (insert) only — no read/list/update/delete
create policy "Allow anon uploads to resume-audits"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'resume-audits'
);
