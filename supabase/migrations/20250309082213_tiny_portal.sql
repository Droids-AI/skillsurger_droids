/*
  # Fix RLS and Storage Configuration

  1. Security Changes
    - Enable RLS on profiles table (if not already enabled)
    - Add RLS policies for profiles table (if they don't exist)
    - Configure storage bucket and policies

  2. Storage Configuration
    - Create storage bucket for CVs
    - Set up storage policies for CV management
*/

-- Enable RLS on profiles table if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create storage bucket for CVs if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('cvs', 'cvs')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create storage policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can upload their own CVs'
  ) THEN
    CREATE POLICY "Users can upload their own CVs"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'cvs' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can view their own CVs'
  ) THEN
    CREATE POLICY "Users can view their own CVs"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'cvs' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can update their own CVs'
  ) THEN
    CREATE POLICY "Users can update their own CVs"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'cvs' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can delete their own CVs'
  ) THEN
    CREATE POLICY "Users can delete their own CVs"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'cvs' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;