/*
  # Add RLS policies for interview feedback metrics

  1. Security
    - Enable RLS on interview_feedback_metrics table
    - Add policy for authenticated users to insert feedback metrics for their own interviews
    - Add policy for authenticated users to view feedback metrics for their own interviews
*/

-- Enable RLS
ALTER TABLE interview_feedback_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for inserting feedback metrics
CREATE POLICY "Users can insert feedback metrics for their own interviews"
ON interview_feedback_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mock_interviews
    WHERE mock_interviews.id = interview_id
    AND mock_interviews.user_id = auth.uid()
  )
);

-- Policy for viewing feedback metrics
CREATE POLICY "Users can view feedback metrics for their own interviews"
ON interview_feedback_metrics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mock_interviews
    WHERE mock_interviews.id = interview_id
    AND mock_interviews.user_id = auth.uid()
  )
);