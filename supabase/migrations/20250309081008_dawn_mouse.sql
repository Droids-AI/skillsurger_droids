/*
  # Fix Profile Constraints and Dependencies

  1. Profile Table Updates
    - Ensure profile table exists
    - Add missing columns
    - Set up proper constraints

  2. Related Tables
    - Update foreign key constraints
    - Add proper cascading
*/

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  linkedin_url text,
  cv_url text,
  years_of_experience integer,
  summary text,
  experience jsonb,
  projects jsonb,
  skills jsonb,
  education jsonb,
  cv_parsed_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create or replace profile policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own profile') then
    create policy "Users can view own profile"
      on profiles for select
      to authenticated
      using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can update own profile') then
    create policy "Users can update own profile"
      on profiles for update
      to authenticated
      using (auth.uid() = id);
  end if;
end $$;

-- Create profile trigger function
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

-- Create or replace the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ensure user_skills table exists with proper constraints
create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  skill text not null,
  created_at timestamptz default now()
);

-- Enable RLS on user_skills
alter table public.user_skills enable row level security;

-- Create or replace user_skills policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own skills') then
    create policy "Users can manage own skills"
      on user_skills for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Ensure user_interests table exists with proper constraints
create table if not exists public.user_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  interest text not null,
  created_at timestamptz default now()
);

-- Enable RLS on user_interests
alter table public.user_interests enable row level security;

-- Create or replace user_interests policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own interests') then
    create policy "Users can manage own interests"
      on user_interests for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Ensure career_suggestions table exists with proper constraints
create table if not exists public.career_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  suggestion text not null,
  created_at timestamptz default now()
);

-- Enable RLS on career_suggestions
alter table public.career_suggestions enable row level security;

-- Create or replace career_suggestions policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own career suggestions') then
    create policy "Users can manage own career suggestions"
      on career_suggestions for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Ensure learning_plans table exists with proper constraints
create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  plan_content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on learning_plans
alter table public.learning_plans enable row level security;

-- Create or replace learning_plans policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own learning plans') then
    create policy "Users can manage own learning plans"
      on learning_plans for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;