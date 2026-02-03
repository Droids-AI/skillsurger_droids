/*
  # Add certifications column to profiles table

  1. New Column
    - `certifications` (jsonb) - Array of certification objects with name, issuer, and date

  2. Changes
    - Add certifications column to store user certifications
    - Column is nullable since certifications may not always be provided
*/

-- Add certifications column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN certifications jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
