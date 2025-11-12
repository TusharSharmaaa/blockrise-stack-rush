-- Add unique index on profiles.username to enforce uniqueness at database level
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx ON public.profiles (LOWER(username));

-- Add helpful comment
COMMENT ON INDEX profiles_username_unique_idx IS 'Ensures usernames are unique (case-insensitive)';