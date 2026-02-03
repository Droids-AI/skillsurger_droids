/*
  # Add Career and Jobs Tables

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
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create generated_careers table if it doesn't exist
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS and add policies for generated_careers if they don't exist
ALTER TABLE generated_careers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'generated_careers' 
    AND policyname = 'Users can manage own career suggestions'
  ) THEN
    CREATE POLICY "Users can manage own career suggestions"
      ON generated_careers
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create saved_jobs table if it doesn't exist
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS and add policies for saved_jobs if they don't exist
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_jobs' 
    AND policyname = 'Users can manage own saved jobs'
  ) THEN
    CREATE POLICY "Users can manage own saved jobs"
      ON saved_jobs
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;