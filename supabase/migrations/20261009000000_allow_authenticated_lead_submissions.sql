-- Webinar registration is available both to visitors and signed-in users.
-- The existing anon-only insert policy does not cover authenticated sessions.
drop policy if exists "Allow authenticated insert on leads" on public.leads;
create policy "Allow authenticated insert on leads"
on public.leads
for insert
to authenticated
with check (true);
