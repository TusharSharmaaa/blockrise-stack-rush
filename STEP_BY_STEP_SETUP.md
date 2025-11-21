# 🔧 Step-by-Step Supabase Setup Guide

## What We're Fixing:
1. ✅ Countries showing only 3-4 → Will show ALL 250+ countries
2. ✅ RLS policies blocking → Will allow public access
3. ✅ User session creation failing → Will enable anonymous auth
4. ✅ Username validation → Will work properly

---

## 📝 STEP 1: Open Supabase Dashboard

1. Open your web browser
2. Go to: **https://supabase.com/dashboard**
3. Sign in to your account
4. Click on your project (the one for BlockRise)

---

## 📝 STEP 2: Open SQL Editor

1. In the left sidebar, find **"SQL Editor"** (it has a code icon `</>`)
2. Click on **"SQL Editor"**
3. Click the **"+ New Query"** button (green button at the top)

---

## 📝 STEP 3: Copy the Migration SQL

1. Open the file: `supabase/migrations/20251120000000_fix_all_setup.sql`
   - You can find it in your project folder
   - Or I'll show you the content below ⬇️

2. **Copy ALL the SQL code** from that file
   - Select all (Ctrl+A or Cmd+A)
   - Copy (Ctrl+C or Cmd+C)

3. **Paste it** into the SQL Editor in Supabase
   - Click in the empty text area in SQL Editor
   - Paste (Ctrl+V or Cmd+V)

---

## 📝 STEP 4: Run the Migration

1. Look at the bottom right of the SQL Editor
2. Click the **"Run"** button (green button)
   - OR press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)

3. Wait for it to complete (should take a few seconds)
4. You should see a success message like "Success. No rows returned"

**If you see an error:** Don't worry! Some errors are okay if tables/policies already exist. The important part is that it completes.

---

## 📝 STEP 5: Enable Anonymous Authentication (IMPORTANT!)

This is **REQUIRED** - without this, users can't create profiles!

1. In the left sidebar, click **"Authentication"**
2. Click **"Providers"** (under Authentication)
3. Find **"Email"** in the list of providers
4. Click on **"Email"** to expand it
5. Scroll down and find the option:
   - **"Enable anonymous sign-ins"** 
   - OR **"Enable Anonymous Authentication"**
   - OR a checkbox/toggle for "Anonymous"

6. **Turn it ON** (enable it / check the box)
7. Click **"Save"** button

**NOTE:** The exact name/location might vary slightly depending on your Supabase version, but look for anything related to "Anonymous" or "Anonymous auth" in the Email provider settings.

---

## 📝 STEP 6: Verify Everything Works

### Check Countries Count:

1. Go back to **"SQL Editor"**
2. Type this query:
   ```sql
   SELECT COUNT(*) FROM countries;
   ```
3. Click **"Run"**
4. You should see a number around **250** (like 249 or 251)
   - ✅ If you see ~250 = SUCCESS!
   - ❌ If you see 0 or small number = Migration didn't run correctly

### Check Policies:

1. In SQL Editor, run:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('countries', 'profiles');
   ```
2. You should see policies listed for both tables

---

## 📝 STEP 7: Test in Your App

1. **Build your app:**
   ```bash
   npm run build
   ```

2. **Clear app data in emulator:**
   ```bash
   adb shell pm clear com.blockrise.stackrush
   ```

3. **Launch the app:**
   ```bash
   adb shell am start -n com.blockrise.stackrush/.MainActivity
   ```

4. **What you should see:**
   - ✅ Profile setup dialog asking for username
   - ✅ Full country list (250+ countries when you search)
   - ✅ Username validation works
   - ✅ Profile creation succeeds

---

## ❌ Troubleshooting

### If countries still showing only 3-4:
- Go to SQL Editor and run: `SELECT COUNT(*) FROM countries;`
- If it shows 0 or small number, re-run STEP 3 and STEP 4

### If you get "Failed to create user session" error:
- Make sure you completed **STEP 5** (Enable Anonymous Authentication)
- Go back and check Authentication → Providers → Email
- Make sure anonymous sign-ins is enabled

### If you get permission errors:
- Re-run the migration from STEP 3 and STEP 4
- Make sure you're the project owner/admin

---

## ✅ Summary Checklist

- [ ] Opened Supabase Dashboard
- [ ] Opened SQL Editor
- [ ] Copied migration SQL code
- [ ] Pasted and ran migration
- [ ] Enabled Anonymous Authentication
- [ ] Verified countries count (~250)
- [ ] Tested app and it works

---

**Once all steps are done, your app should work perfectly! 🎉**


