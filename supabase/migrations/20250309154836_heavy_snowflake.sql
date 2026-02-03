/*
  # Update mock interviews schema

  1. Changes
    - Add conversation column to store interview transcript
    - Add scoring columns for technical and communication skills
    - Add detailed feedback structure
    - Ensure RLS policies exist without conflicts

  2. Security
    - Check for existing RLS policies before creating new ones
*/

-- Add new columns to mock_interviews table
ALTER TABLE mock_interviews 
ADD COLUMN IF NOT EXISTS conversation JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS technical_score INTEGER CHECK (technical_score >= 1 AND technical_score <= 5),
ADD COLUMN IF NOT EXISTS communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
ADD COLUMN IF NOT EXISTS overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
ADD COLUMN IF NOT EXISTS detailed_feedback JSONB DEFAULT '{}'::jsonb;

-- Enable RLS if not already enabled
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage own mock interviews" ON mock_interviews;
    
    CREATE POLICY "Users can manage own mock interviews"
    ON mock_interviews
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, create it
        CREATE POLICY "Users can manage own mock interviews"
        ON mock_interviews
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
END $$;