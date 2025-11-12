-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix RLS policies for leaderboard table
DROP POLICY IF EXISTS "Users can insert their own scores" ON public.leaderboard;

CREATE POLICY "Users can insert their own scores"
  ON public.leaderboard FOR INSERT
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Add database constraints for data integrity
ALTER TABLE profiles 
  ADD CONSTRAINT check_highest_score_positive 
  CHECK (highest_score >= 0);

ALTER TABLE profiles 
  ADD CONSTRAINT check_current_level_range 
  CHECK (current_level >= 1 AND current_level <= 50);

ALTER TABLE profiles
  ADD CONSTRAINT check_total_coins_positive
  CHECK (total_coins >= 0);

ALTER TABLE leaderboard 
  ADD CONSTRAINT check_score_positive 
  CHECK (score >= 0);

ALTER TABLE leaderboard
  ADD CONSTRAINT check_level_positive
  CHECK (level >= 1);

-- Add unique constraint on username
ALTER TABLE profiles
  ADD CONSTRAINT unique_username UNIQUE (username);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score 
  ON public.leaderboard(score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_achieved_at 
  ON public.leaderboard(achieved_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_highest_score
  ON public.profiles(highest_score DESC);

-- Add last_active_at tracking
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();