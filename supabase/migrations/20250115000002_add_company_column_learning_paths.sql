-- Add company column to learning_paths table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_paths' AND column_name = 'company'
  ) THEN
    ALTER TABLE learning_paths ADD COLUMN company text;
  END IF;
END $$;
