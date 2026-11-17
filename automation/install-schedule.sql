-- Apply only after reviewing/deploying the worker. This is deliberately NOT a migration.
-- Add the service-role key to Supabase Vault as skillsurger_automation_service_role through
-- the operator dashboard; never put its value in this file or in shell/SQL output.
-- Change the public project URL below when using a staging project.
do $$
begin
  if (select count(*) from pg_extension where extname in ('pg_cron','pg_net','supabase_vault'))<>3 then
    raise exception 'pg_cron, pg_net and Supabase Vault are required';
  end if;
  if not exists(select 1 from vault.decrypted_secrets where name='skillsurger_automation_service_role' and length(decrypted_secret)>0) then
    raise exception 'configure the automation operator credential in Vault first';
  end if;
end $$;

select cron.schedule('skillsurger-automation-tick','* * * * *',$job$
  select net.http_post(
    url:='https://jpnunlbnthcfvstyymdl.supabase.co/functions/v1/skillsurger-automation/tick',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||
      (select decrypted_secret from vault.decrypted_secrets where name='skillsurger_automation_service_role' limit 1)),
    body:='{}'::jsonb,
    timeout_milliseconds:=55000
  ) where exists(
    select 1 from public.skillsurger_application_runs where state in ('queued','launching','running','reconciling')
      and next_check_at<=now() and (locked_at is null or locked_at<now()-interval '5 minutes')
  );
$job$);

-- Roll back this schedule only (keeps ledger/evidence):
-- select cron.unschedule('skillsurger-automation-tick');
