/*
  # Add Feedback Loop System Tables

  1. New Tables
    - `interview_feedback_metrics`
      - `id` (uuid, primary key)
      - `interview_id` (uuid, references mock_interviews)
      - `technical_score` (integer)
      - `communication_score` (integer)
      - `problem_solving_score` (integer)
      - `improvement_areas` (text[])
      - `created_at` (timestamptz)

    - `learning_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `skill_area` (text)
      - `resource_type` (text)
      - `resource_url` (text)
      - `priority` (integer)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Interview Feedback Metrics Table
CREATE TABLE IF NOT EXISTS interview_feedback_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES mock_interviews(id) ON DELETE CASCADE,
  technical_score integer CHECK (technical_score BETWEEN 1 AND 5),
  communication_score integer CHECK (communication_score BETWEEN 1 AND 5),
  problem_solving_score integer CHECK (problem_solving_score BETWEEN 1 AND 5),
  improvement_areas text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_feedback_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview feedback"
  ON interview_feedback_metrics
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id 
      FROM mock_interviews 
      WHERE id = interview_feedback_metrics.interview_id
    )
  );

-- Learning Recommendations Table
CREATE TABLE IF NOT EXISTS learning_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill_area text NOT NULL,
  resource_type text NOT NULL,
  resource_url text NOT NULL,
  priority integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own learning recommendations"
  ON learning_recommendations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);