-- Reset legacy public access, including permissive policies from old migrations.
update storage.buckets set public=false where id='cvs';
do $$
declare p record;
begin
  -- Only policies scoped to cvs are removed. Other buckets retain their policies.
  for p in select policyname from pg_policies where schemaname='storage' and tablename='objects'
    and (coalesce(qual,'') || coalesce(with_check,'')) like '%''cvs''%'
  loop execute format('drop policy %I on storage.objects',p.policyname); end loop;
end $$;
-- Restrictive policies additionally fence off cvs even if a broad legacy policy exists.
create policy "CV owner read fence" on storage.objects as restrictive for select to public
  using (bucket_id <> 'cvs' or (auth.uid() is not null and (storage.foldername(name))[1]=auth.uid()::text));
create policy "CV owner insert fence" on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'cvs' or (auth.uid() is not null and (storage.foldername(name))[1]=auth.uid()::text));
create policy "CV owner update fence" on storage.objects as restrictive for update to public
  using (bucket_id <> 'cvs' or (auth.uid() is not null and (storage.foldername(name))[1]=auth.uid()::text))
  with check (bucket_id <> 'cvs' or (auth.uid() is not null and (storage.foldername(name))[1]=auth.uid()::text));
create policy "CV owner delete fence" on storage.objects as restrictive for delete to public
  using (bucket_id <> 'cvs' or (auth.uid() is not null and (storage.foldername(name))[1]=auth.uid()::text));
create policy "CV owner access" on storage.objects for all to authenticated
  using(bucket_id='cvs' and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id='cvs' and (storage.foldername(name))[1]=auth.uid()::text);
-- Rewrite only matching storage URLs. The object owner prefix remains intact.
update public.profiles set cv_url=split_part(regexp_replace(cv_url,'^https://[^/]+/storage/v1/object/(public|sign|authenticated)/cvs/',''),'?',1)
where cv_url ~ '^https://[^/]+/storage/v1/object/(public|sign|authenticated)/cvs/';
