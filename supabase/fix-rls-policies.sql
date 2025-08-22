-- =====================================================
-- Fix RLS Policies for UserProfile Functionality
-- =====================================================

-- Step 1: Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for users table

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid()::text = id::text);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy 3: Users can insert their own profile (if needed)
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Step 3: Enable RLS on user_social_links table
ALTER TABLE user_social_links ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for user_social_links table

-- Policy 1: Users can read their own social links
CREATE POLICY "Users can read own social links" ON user_social_links
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy 2: Users can insert their own social links
CREATE POLICY "Users can insert own social links" ON user_social_links
FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy 3: Users can update their own social links
CREATE POLICY "Users can update own social links" ON user_social_links
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policy 4: Users can delete their own social links
CREATE POLICY "Users can delete own social links" ON user_social_links
FOR DELETE USING (auth.uid()::text = user_id::text);

-- Step 5: Enable RLS on user_institutions table
ALTER TABLE user_institutions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for user_institutions table

-- Policy 1: Users can read their own institution relationships
CREATE POLICY "Users can read own institution relationships" ON user_institutions
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Step 7: Enable RLS on institutions table
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for institutions table

-- Policy 1: Users can read institutions they belong to
CREATE POLICY "Users can read their institutions" ON institutions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_institutions 
    WHERE user_institutions.institution_id = institutions.id 
    AND user_institutions.user_id::text = auth.uid()::text
  )
);

-- Step 9: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'user_social_links', 'user_institutions', 'institutions');
