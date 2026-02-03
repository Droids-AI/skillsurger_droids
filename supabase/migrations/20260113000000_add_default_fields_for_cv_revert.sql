/*
  # Add default fields for CV revert functionality

  1. New Columns
    - Add `_default` fields for all profile columns that get modified during CV enhancement
    - These fields will store the original values before enhancement
    - Users can revert to these default values at any time

  2. Fields Added
    - `summary_default` (text) - Original summary before enhancement
    - `experience_default` (jsonb) - Original experience data before enhancement
    - `projects_default` (jsonb) - Original projects data before enhancement
    - `education_default` (jsonb) - Original education data before enhancement
    - `certifications_default` (jsonb) - Original certifications before enhancement
    - `cv_parsed_data_default` (jsonb) - Original parsed CV data before enhancement
    - `languages_default` (text[]) - Original languages list before enhancement
    - `full_name_default` (text) - Original full name before enhancement
    - `email_default` (text) - Original email before enhancement
    - `phone_default` (text) - Original phone before enhancement
    - `city_default` (text) - Original city before enhancement
    - `state_default` (text) - Original state before enhancement
    - `country_default` (text) - Original country before enhancement
    - `current_role_default` (text) - Original current role before enhancement
    - `years_of_experience_default` (integer) - Original years of experience before enhancement
    - `skills_default` (jsonb) - Original skills data before enhancement
    - `custom_sections_default` (jsonb) - Original custom sections before enhancement
*/

-- Add summary_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'summary_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN summary_default text;
  END IF;
END $$;

-- Add experience_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'experience_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN experience_default jsonb;
  END IF;
END $$;

-- Add projects_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'projects_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN projects_default jsonb;
  END IF;
END $$;

-- Add education_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'education_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN education_default jsonb;
  END IF;
END $$;

-- Add certifications_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'certifications_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN certifications_default jsonb;
  END IF;
END $$;

-- Add cv_parsed_data_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cv_parsed_data_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cv_parsed_data_default jsonb;
  END IF;
END $$;

-- Add languages_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'languages_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages_default text[];
  END IF;
END $$;

-- Add full_name_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name_default text;
  END IF;
END $$;

-- Add email_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_default text;
  END IF;
END $$;

-- Add phone_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_default text;
  END IF;
END $$;

-- Add city_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city_default text;
  END IF;
END $$;

-- Add state_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'state_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN state_default text;
  END IF;
END $$;

-- Add country_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country_default text;
  END IF;
END $$;

-- Add current_role_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_role_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_role_default text;
  END IF;
END $$;

-- Add years_of_experience_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'years_of_experience_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN years_of_experience_default integer;
  END IF;
END $$;

-- Add skills_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skills_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills_default jsonb;
  END IF;
END $$;

-- Add custom_sections_default column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'custom_sections_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN custom_sections_default jsonb;
  END IF;
END $$;
