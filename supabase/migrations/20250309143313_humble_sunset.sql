/*
  # Add Learning Paths and Job Description

  1. New Tables
    - `learning_paths`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `career_path` (text)
      - `job_title` (text)
      - `skills_to_learn` (text[])
      - `resources` (jsonb)
      - `progress` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `job_description` column to `mock_interviews` table

  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create learning_paths table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS learning_paths (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    career_path text NOT NULL,
    job_title text NOT NULL,
    skills_to_learn text[] DEFAULT '{}',
    resources jsonb DEFAULT '[]',
    progress integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS and add policies for learning_paths if they don't exist
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'learning_paths' 
    AND policyname = 'Users can manage own learning paths'
  ) THEN
    CREATE POLICY "Users can manage own learning paths"
      ON learning_paths
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add job_description column to mock_interviews if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mock_interviews'
    AND column_name = 'job_description'
  ) THEN
    ALTER TABLE mock_interviews ADD COLUMN job_description text;
  END IF;
END $$;