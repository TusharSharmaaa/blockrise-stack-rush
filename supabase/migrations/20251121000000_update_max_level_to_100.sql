-- Update max level constraint from 50 to 100
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS check_current_level_range;

ALTER TABLE profiles 
  ADD CONSTRAINT check_current_level_range 
  CHECK (current_level >= 1 AND current_level <= 100);

