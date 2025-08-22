# 🚨 Quick Database Setup to Fix Data Fetching Issues

## The Problem
Your frontend is not displaying data because the Supabase database hasn't been properly set up yet. This guide will fix it in 5 minutes.

## ⚡ Quick Fix Steps

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Open your project: `zegmfhhxscrrjweuxleq`

### Step 2: Create Database Schema
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the **ENTIRE** contents of `supabase/schema.sql`
4. Click **Run** button
5. Wait for it to complete (should take 10-30 seconds)

### Step 3: Insert Sample Data
1. Click **New Query** again
2. Copy and paste the **ENTIRE** contents of `supabase/sample_data.sql`
3. Click **Run** button
4. Wait for it to complete (should take 5-10 seconds)

### Step 4: Verify Setup
1. Click **New Query** again
2. Run this verification query:
```sql
SELECT 
  'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Courses', COUNT(*) FROM courses
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Assignments', COUNT(*) FROM assignments;
```

**Expected Results:**
- Users: 4
- Courses: 5
- Enrollments: 3
- Assignments: 2

### Step 5: Test Your App
1. Go back to your React app
2. Refresh the page
3. Click **Test Student** or **Test Teacher** button
4. Data should now appear in the dashboard!

## 🔍 If Still No Data

### Check RLS Policies
Run this query to verify security policies:
```sql
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'public';
```

You should see policies for: `users`, `courses`, `enrollments`, `assignments`

### Test Data Access
```sql
-- Test as test student
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001';
SELECT * FROM enrollments WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';
```

## 🚨 Emergency Reset (If Everything is Broken)

If the above doesn't work, reset everything:

```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then repeat Steps 2-3 above
```

## ✅ Success Checklist

After setup, you should see:
- [ ] Student dashboard shows enrolled courses
- [ ] Teacher dashboard shows assigned courses
- [ ] Course cards display with progress bars
- [ ] Assignments tab shows course assignments
- [ ] Students tab shows enrolled students (for teachers)
- [ ] No more "No courses yet" messages

## 🆘 Still Having Issues?

1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for failed API requests
3. **Verify Supabase URL/Key** in `src/integrations/supabase/client.ts`
4. **Clear Browser Storage** and refresh

## 📞 Need Help?

The issue is almost certainly that the database schema and data haven't been created yet. Follow the steps above and your data should appear!

---

**Time to Complete**: 5-10 minutes  
**Difficulty**: Easy  
**Prerequisites**: Supabase project access 