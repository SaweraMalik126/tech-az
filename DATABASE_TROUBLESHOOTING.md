# Database Connection Troubleshooting Guide

## 🚀 Quick Test
1. **Navigate to Database Test page** in your app (click "Database Test" in sidebar)
2. **Click "Run All Tests"** button
3. **Open browser console** (F12) to see detailed results
4. **Review the test summary** on the page

## 🔍 Common Issues & Solutions

### 1. **Connection Failed (Basic Connection Test)**
**Symptoms:** Cannot connect to Supabase
**Causes:**
- Wrong Supabase URL
- Invalid API key
- Network/firewall issues
- Supabase service down

**Solutions:**
```bash
# Check your .env file or environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. **Authentication Failed**
**Symptoms:** User not authenticated, RLS policies blocking access
**Causes:**
- User not logged in
- RLS policies too restrictive
- Invalid JWT token

**Solutions:**
```sql
-- Check RLS policies in Supabase
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 3. **Table Access Failed**
**Symptoms:** Tables don't exist or can't be accessed
**Causes:**
- Tables not created
- Wrong table names
- Insufficient permissions

**Solutions:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check table structure
\d users
\d courses
```

### 4. **Schema Mismatch**
**Symptoms:** TypeScript types don't match database columns
**Causes:**
- Database schema changed
- TypeScript types outdated
- Column names/types different

**Solutions:**
```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts
```

### 5. **Environment Variables Not Set**
**Symptoms:** Tests show "Not set" for URL/Key
**Causes:**
- Missing .env file
- Wrong variable names
- Build process not picking up env vars

**Solutions:**
```bash
# Create .env file in project root
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Restart dev server after changes
npm run dev
```

## 🛠️ Manual Testing Steps

### Step 1: Check Environment Variables
```javascript
// In browser console
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### Step 2: Test Basic Connection
```javascript
// In browser console
import { supabase } from './integrations/supabase/client';

// Test basic connection
const { data, error } = await supabase.from('users').select('count');
console.log('Data:', data, 'Error:', error);
```

### Step 3: Check Network Tab
1. Open DevTools → Network tab
2. Run a database query
3. Look for failed requests to Supabase
4. Check response status and error messages

## 📋 Database Setup Checklist

- [ ] Supabase project created
- [ ] Database schema executed (`supabase/schema.sql`)
- [ ] Sample data inserted (`supabase/sample_data.sql`)
- [ ] RLS policies configured
- [ ] Environment variables set
- [ ] API keys copied correctly
- [ ] User authentication working

## 🔧 Advanced Debugging

### Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Check **Database** → **Tables** for table existence
3. Check **Authentication** → **Users** for user accounts
4. Check **Logs** for any error messages

### Test with Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Check status
supabase status

# Generate types
supabase gen types typescript --local > types.ts
```

### Check RLS Policies
```sql
-- View all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies;

-- Check specific table policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## 🚨 Emergency Fixes

### If Nothing Works:
1. **Reset database:**
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   -- Re-run schema.sql
   ```

2. **Check Supabase service status:**
   - Visit https://status.supabase.com/
   - Check your project's status in dashboard

3. **Verify project settings:**
   - API keys are correct
   - Project is not paused/suspended
   - Billing is current

## 📞 Getting Help

If you're still having issues:
1. Check the browser console for specific error messages
2. Look at the Network tab for failed requests
3. Check Supabase project logs
4. Share error messages and test results

## 🎯 Quick Commands

```bash
# Build project
npm run build

# Start dev server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Run tests
npm test
```

---

**Remember:** The Database Test page will give you the most comprehensive overview of what's working and what's not. Use it as your first troubleshooting step!
