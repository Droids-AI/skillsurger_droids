/*
  # Add missing columns to profiles table

  1. New Columns
    - `email` (text) - User's email address
    - `phone` (text) - User's phone number  
    - `languages` (text[]) - Array of languages the user speaks

  2. Changes
    - Add email column to store user contact information
    - Add phone column for contact details
    - Add languages array column for multilingual capabilities
    - All columns are nullable since they may not always be provided
*/

-- Add email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Add phone column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Add languages column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE profiles ADD COLUMN languages text[] DEFAULT '{}';
  END IF;
END $$;