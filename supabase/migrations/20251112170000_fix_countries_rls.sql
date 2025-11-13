-- Fix RLS policy for countries table to allow public read access
-- This is needed so users can select countries during profile setup before authentication

DROP POLICY IF EXISTS "Countries are viewable by everyone" ON public.countries;

CREATE POLICY "Countries are viewable by everyone"
  ON public.countries FOR SELECT
  USING (true);



