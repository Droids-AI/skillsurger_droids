/*
  # Create user profiles and related tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `linkedin_url` (text)
      - `cv_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_skills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `skill` (text)
      - `created_at` (timestamp)
    
    - `user_interests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `interest` (text)
      - `created_at` (timestamp)
    
    - `career_suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `suggestion` (text)
      - `created_at` (timestamp)
    
    - `learning_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `plan_content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their own data
*/

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name text,
    linkedin_url text,
    cv_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create user_skills table
CREATE TABLE public.user_skills (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    skill text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create user_interests table
CREATE TABLE public.user_interests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    interest text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create career_suggestions table
CREATE TABLE public.career_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    suggestion text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create learning_plans table
CREATE TABLE public.learning_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
    plan_content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can view own skills"
    ON public.user_skills FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own skills"
    ON public.user_skills FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interests"
    ON public.user_interests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interests"
    ON public.user_interests FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own career suggestions"
    ON public.career_suggestions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own career suggestions"
    ON public.career_suggestions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning plans"
    ON public.learning_plans FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learning plans"
    ON public.learning_plans FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);