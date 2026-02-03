/*
  # Add custom sections column to profiles table

  1. New Column
    - `custom_sections` (jsonb) - Array of custom section objects with title, content, and type

  2. Changes
    - Add custom_sections column to store user-defined CV sections
    - Column is nullable since custom sections are optional
*/

-- Add custom_sections column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'custom_sections'
  ) THEN
    ALTER TABLE profiles ADD COLUMN custom_sections jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
