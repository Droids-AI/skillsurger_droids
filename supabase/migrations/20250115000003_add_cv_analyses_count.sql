-- Add cv_analyses_count column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cv_analyses_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cv_analyses_count integer DEFAULT 0;
  END IF;
END $$;
