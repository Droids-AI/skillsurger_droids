-- AI browser agent: start (or restart) an approved, manual-mode application.
-- Same approval check as agent_claim_action, but also from needs_you: a stopped agent run leaves the action
-- in needs_you (the ledger guard forbids going back to queued), and the user may run the agent again.
begin;
create or replace function public.skillsurger_agent_claim(p_action_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare claimed uuid;
begin
  update public.agent_action_ledger a
     set state = 'running', attempts = a.attempts + 1
   where a.id = p_action_id and a.state in ('queued','needs_you')
     and a.action_type = 'apply_job' and coalesce(a.payload->>'execution_mode','manual') <> 'anchor'
     and exists (select 1 from public.agent_approval ap
                  where ap.action_id = a.id and ap.decision in ('approved','edited')
                    and ap.payload_hash = a.payload_hash and ap.expires_at > now() and ap.revoked_at is null)
  returning a.id into claimed;
  return claimed;
end $$;
revoke all on function public.skillsurger_agent_claim(uuid) from public, anon, authenticated;
grant execute on function public.skillsurger_agent_claim(uuid) to service_role;
insert into supabase_migrations.schema_migrations(version, name)
values ('20261123010000', 'browser_agent_claim') on conflict do nothing;
commit;
