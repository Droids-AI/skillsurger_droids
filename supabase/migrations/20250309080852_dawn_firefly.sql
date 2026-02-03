/*
  # Storage and Profile Setup

  1. Storage Setup
    - Create storage bucket for CVs
    - Set up RLS policies for CV storage

  2. Profile Management
    - Create trigger for automatic profile creation
*/

-- Create storage bucket if it doesn't exist
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'cvs') then
    insert into storage.buckets (id, name, public)
    values ('cvs', 'cvs', false);
  end if;
end $$;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Create policies for CV storage management
do $$
begin
  -- Upload policy
  if not exists (select 1 from pg_policies where policyname = 'Users can upload their own CVs') then
    create policy "Users can upload their own CVs"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'cvs' 
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  -- Read policy
  if not exists (select 1 from pg_policies where policyname = 'Users can read their own CVs') then
    create policy "Users can read their own CVs"
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'cvs' 
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  -- Update policy
  if not exists (select 1 from pg_policies where policyname = 'Users can update their own CVs') then
    create policy "Users can update their own CVs"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'cvs' 
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'cvs' 
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  -- Delete policy
  if not exists (select 1 from pg_policies where policyname = 'Users can delete their own CVs') then
    create policy "Users can delete their own CVs"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'cvs' 
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

-- Create profile creation function if it doesn't exist
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger for automatic profile creation if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;
end $$;