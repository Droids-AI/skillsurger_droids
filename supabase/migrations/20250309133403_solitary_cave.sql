/*
  # Add career storage tables

  1. New Tables
    - `generated_careers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `required_skills` (text[])
      - `potential_companies` (text[])
      - `average_salary` (text)
      - `growth_potential` (text)
      - `created_at` (timestamp)

    - `saved_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `company` (text)
      - `location` (text)
      - `description` (text)
      - `requirements` (text[])
      - `type` (text)
      - `salary` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create generated_careers table
CREATE TABLE IF NOT EXISTS generated_careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  required_skills text[] DEFAULT '{}',
  potential_companies text[] DEFAULT '{}',
  average_salary text,
  growth_potential text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS and add policies for generated_careers
ALTER TABLE generated_careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own career suggestions"
  ON generated_careers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create saved_jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  requirements text[] DEFAULT '{}',
  type text NOT NULL,
  salary text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS and add policies for saved_jobs
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved jobs"
  ON saved_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);