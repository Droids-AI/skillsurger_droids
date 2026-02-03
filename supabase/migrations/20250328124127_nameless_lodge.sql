/*
  # Setup CV storage and profile automation

  1. Storage Setup
    - Create storage bucket for CV files
    - Add storage policies for authenticated users
  
  2. Profile Automation
    - Add function for automatic profile creation
    - Add trigger to create profile on user signup
*/

-- Safely create the storage bucket
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('cvs', 'cvs', false)
  on conflict (id) do nothing;
end $$;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Allow authenticated users to upload CVs" on storage.objects;
drop policy if exists "Allow users to read own CVs" on storage.objects;

-- Create upload policy
create policy "Allow authenticated users to upload CVs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cvs' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Create read policy
create policy "Allow users to read own CVs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cvs' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Create profile creation function
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

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger for automatic profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();