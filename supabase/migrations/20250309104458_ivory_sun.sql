/*
  # Add Interview and Mentorship Tables

  1. New Tables
    - `mock_interviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `job_role` (text)
      - `scheduled_at` (timestamptz)
      - `feedback` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `ai_mentorship_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `topic` (text)
      - `conversation` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `mentor_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `specialization` (text)
      - `experience_years` (integer)
      - `hourly_rate` (numeric)
      - `availability` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `mentorship_sessions`
      - `id` (uuid, primary key)
      - `mentee_id` (uuid, references profiles)
      - `mentor_id` (uuid, references mentor_profiles)
      - `scheduled_at` (timestamptz)
      - `duration_minutes` (integer)
      - `status` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Mock Interviews Table
CREATE TABLE IF NOT EXISTS mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_role text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  feedback text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mock interviews"
  ON mock_interviews
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI Mentorship Sessions Table
CREATE TABLE IF NOT EXISTS ai_mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_mentorship_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI mentorship sessions"
  ON ai_mentorship_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mentor Profiles Table
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  specialization text NOT NULL,
  experience_years integer NOT NULL,
  hourly_rate numeric NOT NULL,
  availability jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor profiles"
  ON mentor_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors can manage own profiles"
  ON mentor_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mentorship Sessions Table
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentees can view and manage own sessions"
  ON mentorship_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can view and manage assigned sessions"
  ON mentorship_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id));