/*
  # Add learning paths and update mock interviews

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

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create learning_paths table
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

-- Enable RLS and add policies
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own learning paths"
  ON learning_paths
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add job_description column to mock_interviews
ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS job_description text;