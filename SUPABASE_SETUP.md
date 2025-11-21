# Supabase Setup Instructions

## Issues Fixed:

1. ✅ **Countries showing only 3-4** - Fixed with complete country list
2. ✅ **RLS policies blocking access** - Fixed to allow public read
3. ✅ **User session creation failing** - Improved error handling
4. ✅ **"Continue as Guest" bypass** - Fixed to create anonymous session properly

## Required Steps:

### 1. Run the New Migration

Run the new migration file:
```
supabase/migrations/20251120000000_fix_all_setup.sql
```

This migration will:
- Fix countries RLS to allow public read access
- Populate all 250+ countries in the database
- Fix profiles RLS to allow username checking

### 2. Enable Anonymous Authentication in Supabase Dashboard

**CRITICAL:** Anonymous authentication must be enabled:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Enable **"Enable anonymous sign-ins"** or **"Anonymous auth"**
4. Save the settings

Without this, users cannot create profiles (will get "Failed to create user session" error).

### 3. Verify RLS Policies

After running the migration, verify these policies exist:

**Countries Table:**
- Policy: "Countries are viewable by everyone" - `USING (true)` for SELECT

**Profiles Table:**
- Policy: "Profiles are readable publicly" - `USING (true)` for SELECT
- Policy: "Users can insert their profile" - for INSERT
- Policy: "Users can update their profile" - for UPDATE

### 4. Test the Setup

After running migrations:
1. Clear app data
2. Launch app
3. Should see:
   - ✅ Profile setup dialog asking for username
   - ✅ Full country list (250+ countries)
   - ✅ Username validation working
   - ✅ Profile creation succeeding

## Migration Summary

The new migration `20251120000000_fix_all_setup.sql`:
- Drops and recreates countries with full list (250+ countries)
- Fixes RLS policies to allow public read access
- Ensures profiles can be checked by anyone (for username validation)
- Works with anonymous authentication

## Troubleshooting

### Countries still showing only 3-4:
- Check if migration ran successfully
- Verify countries table has data: `SELECT COUNT(*) FROM countries;`
- Should return ~250

### "Failed to create user session" error:
- Verify anonymous authentication is enabled in Supabase Dashboard
- Check Authentication → Providers → Email settings

### Username validation not working:
- Verify "Profiles are readable publicly" policy exists
- Check Supabase logs for RLS errors

### RLS Permission Errors:
- Run the fix_all_setup migration
- Verify policies are created correctly

