/*
  # Add Career Fields to Profile Schema

  1. Changes
    - Add location fields (city, state, country)
    - Add career-related fields (current_role, desired_role, preferred_work_type)
    - Add salary expectations
    - Add relocation preferences
    - Add remote work preferences

  2. Security
    - Maintains existing RLS policies
*/

-- Add location fields
ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "city" text,
ADD COLUMN IF NOT EXISTS "state" text,
ADD COLUMN IF NOT EXISTS "country" text;

-- Add career fields
ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "current_role" text,
ADD COLUMN IF NOT EXISTS "desired_role" text,
ADD COLUMN IF NOT EXISTS "preferred_work_type" text;

-- Add salary expectations
ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "min_salary_expectation" integer,
ADD COLUMN IF NOT EXISTS "max_salary_expectation" integer;

-- Add relocation and remote preferences
ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "willing_to_relocate" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "preferred_locations" text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "remote_preference" text DEFAULT 'no_preference';

-- Add check constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_remote_preference_check'
  ) THEN
    ALTER TABLE "profiles"
    ADD CONSTRAINT profiles_remote_preference_check
    CHECK (remote_preference IN ('remote_only', 'hybrid', 'office_only', 'no_preference'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_preferred_work_type_check'
  ) THEN
    ALTER TABLE "profiles"
    ADD CONSTRAINT profiles_preferred_work_type_check
    CHECK (preferred_work_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_salary_range_check'
  ) THEN
    ALTER TABLE "profiles"
    ADD CONSTRAINT profiles_salary_range_check
    CHECK (min_salary_expectation <= max_salary_expectation);
  END IF;
END $$;