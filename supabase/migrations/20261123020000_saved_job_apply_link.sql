-- Saved jobs keep the job's own Apply link (from the search result's Apply button), so the
-- application step can pre-fill it. Users can still change it before (or after) preparing.
-- Closing a draft to change its link is also allowed after an AI agent run stopped without
-- clicking submit (state needs_you); never when a submit click may have happened.
begin;

alter table public.saved_jobs add column if not exists application_url text
  check (application_url is null or (length(application_url) <= 2000 and application_url ~ '^https://'));

create or replace function public.skillsurger_close_application(p_action_id uuid,p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare a public.agent_action_ledger;
begin
  select * into a from public.agent_action_ledger where id=p_action_id and user_id=p_user_id and product='skillsurger' and action_type='apply_job' for update;
  if not found or a.state not in ('needs_approval','queued','needs_you') then return false; end if;
  if exists(select 1 from public.skillsurger_application_runs where action_id=a.id and dispatch_started_at is not null) then return false; end if;
  if exists(select 1 from public.skillsurger_agent_runs where action_id=a.id
            and (submit_clicked_at is not null or status in ('starting','working','waiting_user','ready_to_submit','check_needed'))) then return false; end if;
  update public.agent_approval set revoked_at=now() where action_id=a.id and revoked_at is null;
  update public.agent_action_ledger set state='failed',last_error='closed_by_user' where id=a.id;
  update public.skillsurger_application_runs set state='failed',reason='closed_by_user',cost_credits=0,updated_at=now() where action_id=a.id and state='queued';
  return true;
end $$;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261123020000', 'saved_job_apply_link') on conflict do nothing;
commit;
