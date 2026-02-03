/*
  # Add CV parsing fields to profiles table

  1. Changes
    - Add new columns to profiles table:
      - years_of_experience (integer)
      - summary (text)
      - experience (jsonb)
      - projects (jsonb)
      - skills (jsonb)
      - education (jsonb)
      - cv_parsed_data (jsonb)
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS years_of_experience integer,
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS experience jsonb,
ADD COLUMN IF NOT EXISTS projects jsonb,
ADD COLUMN IF NOT EXISTS skills jsonb,
ADD COLUMN IF NOT EXISTS education jsonb,
ADD COLUMN IF NOT EXISTS cv_parsed_data jsonb;