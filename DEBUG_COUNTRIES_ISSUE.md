# Debug Countries Issue

## Problem
Only 5 countries showing in app, even though Supabase has 249 countries and RLS policy looks correct.

## Logs Show
```
[useCountries] Query error: [object Object]
[useCountries] Error loading countries: [object Object]
[useCountries] Using fallback country list
[ProfileSetup] Showing all countries: 5
```

## The Query is Failing!

The Supabase query is returning an error, which causes the app to use the fallback list of 5 countries.

## Next Steps to Debug:

### 1. Check the Error Details
After rebuilding with the improved error logging, check the logs again:

```bash
adb logcat -d | grep -i "useCountries" | tail -50
```

Look for:
- `[useCountries] Error message:` - What is the error message?
- `[useCountries] Error code:` - What is the error code?
- `[useCountries] Error details:` - What are the details?

### 2. Common Issues:

#### Issue A: RLS Policy Not Applied Correctly
Even though the policy shows in the dashboard, it might not be active.

**Fix:**
1. Go to Supabase Dashboard → Table Editor → countries → Policies
2. Click on "Countries are viewable by everyone"
3. Make sure "Target roles" includes "public" or "anon"
4. Make sure "USING expression" is: `true`
5. Click "Save policy"

#### Issue B: Anonymous Auth Not Enabled
The app needs anonymous authentication enabled.

**Fix:**
1. Go to Authentication → Providers → Email
2. Enable "Enable anonymous sign-ins"
3. Save

#### Issue C: Supabase Client Config Issue
The Supabase client might not be configured correctly.

**Check:**
- Make sure `.env` file has:
  ```
  VITE_SUPABASE_URL=your-project-url
  VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
  ```

#### Issue D: Query Syntax Issue
The query might have an issue with the syntax.

**Test in Supabase SQL Editor:**
```sql
-- Test as anonymous user
SET LOCAL role anon;
SELECT code, name FROM countries ORDER BY name LIMIT 10;
```

If this fails, the RLS policy is the issue.

### 3. Temporary Workaround
If you need to test immediately, you can temporarily disable RLS:

```sql
ALTER TABLE countries DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** Only do this for testing! Re-enable it after:
```sql
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
```

### 4. Check Current Status
Run these queries in Supabase SQL Editor:

```sql
-- Check if data exists
SELECT COUNT(*) FROM countries;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'countries';

-- Check policies
SELECT policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'countries';

-- Test query as anon user
SET LOCAL role anon;
SELECT COUNT(*) FROM countries;
RESET role;
```

## After Getting Error Details:

Once you have the actual error message/code from the logs, I can help fix it specifically.

