/*
  # Delete AI-generated career data for specific user

  1. Changes
    - Delete all generated careers for specific user
    - Delete all saved jobs for specific user
    - Delete all learning paths for specific user
    - Delete all career suggestions for specific user
    - Delete all learning recommendations for specific user

  2. Safety
    - Uses DO block for atomic execution
    - Only affects specified user's data
    - Preserves user profile and core data
*/

DO $$ 
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user ID for 'saurav'
  SELECT id INTO target_user_id
  FROM auth.users 
  WHERE email LIKE '%saurav%'
  LIMIT 1;

  -- Only proceed if user exists
  IF target_user_id IS NOT NULL THEN
    -- Delete records in correct order (respecting foreign key constraints)
    DELETE FROM learning_recommendations 
    WHERE user_id = target_user_id;

    DELETE FROM career_suggestions 
    WHERE user_id = target_user_id;

    DELETE FROM learning_paths 
    WHERE user_id = target_user_id;

    DELETE FROM saved_jobs 
    WHERE user_id = target_user_id;

    DELETE FROM generated_careers 
    WHERE user_id = target_user_id;
  END IF;
END $$;