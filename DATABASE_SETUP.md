# Database Setup Guide for TeachMe.ai

This guide provides step-by-step instructions for setting up the Supabase database with the complete schema and sample data for TeachMe.ai.

## 🗄️ Overview

TeachMe.ai uses Supabase (PostgreSQL) as its primary database with the following architecture:
- **Core Tables**: Users, institutions, courses, content, enrollments
- **Assessment Tables**: Quizzes, assignments, submissions
- **AI Integration**: Chat sessions, messages, interactions
- **Analytics**: User progress, learning analytics, audit logs
- **Security**: Row Level Security (RLS) policies

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Choose your organization
4. Enter project details:
   - **Name**: `teachme-ai` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click **Create new project**
6. Wait for project setup (2-3 minutes)

### 2. Get Project Credentials

Once setup is complete:
1. Go to **Settings** > **API**
2. Note your:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🔧 Database Schema Setup

### 1. Enable Required Extensions

First, enable PostgreSQL extensions:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2. Run Complete Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** to execute

**Important**: The schema includes:
- 25+ tables with proper relationships
- Indexes for performance optimization
- Row Level Security policies
- Triggers for automatic updates
- Functions for notifications

### 3. Verify Schema Creation

Check that all tables were created:

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- institutions, users, user_institutions, user_social_links,
-- student_parents, courses, course_tags, course_teachers,
-- chapters, content_items, content_versions, enrollments,
-- user_progress, quizzes, quiz_questions, quiz_attempts,
-- assignments, assignment_submissions, chat_sessions,
-- chat_messages, ai_interactions, reviews, peer_reviews,
-- notifications, learning_analytics, audit_log
```

## 🌱 Seed Data Setup

### 1. Insert Sample Data

1. In **SQL Editor**, create a new query
2. Copy and paste the entire contents of `supabase/sample_data.sql`
3. Click **Run** to populate with sample data

**Sample Data Includes**:
- **Institutions**: Tech Academy International
- **Users**: Test student, teacher, admin, super admin
- **Courses**: AI Fundamentals, Machine Learning Basics
- **Content**: Chapters, slides, videos, quizzes
- **Enrollments**: Student-course relationships
- **Progress**: Learning analytics and completion data

### 2. Verify Data Insertion

```sql
-- Check institutions
SELECT * FROM institutions;

-- Check users
SELECT id, full_name, email FROM users LIMIT 5;

-- Check courses
SELECT id, title, description FROM courses;

-- Check enrollments
SELECT 
  u.full_name,
  c.title,
  ui.role
FROM user_institutions ui
JOIN users u ON ui.user_id = u.id
JOIN institutions i ON ui.institution_id = i.id
JOIN courses c ON c.institution_id = i.id
LIMIT 10;
```

## 🔒 Row Level Security (RLS)

### 1. Verify RLS Policies

The schema automatically creates RLS policies. Verify they're enabled:

```sql
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE table_schema = 'public' 
  AND tablename IN ('users', 'courses', 'enrollments');
```

### 2. Test RLS Policies

```sql
-- Test user isolation (run as authenticated user)
SELECT * FROM users WHERE id = auth.uid();

-- Test institution isolation
SELECT * FROM courses 
WHERE institution_id IN (
  SELECT institution_id 
  FROM user_institutions 
  WHERE user_id = auth.uid()
);
```

## 📊 Database Functions

### 1. Notification Function

The schema includes a function for creating notifications:

```sql
-- Test notification creation
SELECT create_notification(
  'user_123'::uuid,
  'course_enrolled',
  '{"course_id": 1, "course_title": "AI Fundamentals"}'::jsonb
);
```

### 2. Updated At Trigger

All tables have automatic `updated_at` timestamps:

```sql
-- Test trigger
UPDATE users 
SET full_name = 'Updated Name' 
WHERE id = (SELECT id FROM users LIMIT 1);

-- Check updated_at was updated
SELECT full_name, updated_at 
FROM users 
WHERE full_name = 'Updated Name';
```

## 🔍 Database Monitoring

### 1. Enable Logging

In Supabase dashboard:
1. Go to **Settings** > **Database**
2. Enable **Logs** for:
   - Queries
   - Errors
   - Performance

### 2. Monitor RLS Policies

```sql
-- Check RLS policy execution
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🚨 Troubleshooting Data Fetching Issues

### Common Issues and Solutions

#### 1. "Data is not being displayed on frontend"

**Symptoms**: 
- Dashboard shows loading states indefinitely
- No courses, assignments, or students displayed
- Console shows no errors but no data

**Root Causes**:
- Database schema not created
- Sample data not inserted
- RLS policies blocking access
- Authentication issues

**Solutions**:

**Step 1: Verify Database Setup**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- If no tables, run the schema.sql file first
```

**Step 2: Check Sample Data**
```sql
-- Verify data exists
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM enrollments;

-- If counts are 0, run the sample_data.sql file
```

**Step 3: Test RLS Policies**
```sql
-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE table_schema = 'public';

-- Verify policies exist
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Step 4: Test Data Access**
```sql
-- Test as authenticated user (replace with actual user ID)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '550e8400-e29b-41d4-a716-446655440001';

-- Try to access data
SELECT * FROM courses;
SELECT * FROM enrollments WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';
```

#### 2. Authentication Issues

**Symptoms**:
- User profile not loading
- Role-based access not working
- Test login buttons not functioning

**Solutions**:

**Check User Profile Loading**:
```sql
-- Verify user exists
SELECT * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Check user institution relationship
SELECT * FROM user_institutions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';
```

**Verify Role Assignment**:
```sql
-- Check user role
SELECT 
  u.full_name,
  ui.role,
  i.name as institution
FROM users u
JOIN user_institutions ui ON u.id = ui.user_id
JOIN institutions i ON ui.institution_id = i.id
WHERE u.id = '550e8400-e29b-41d4-a716-446655440001';
```

#### 3. Course Data Not Loading

**Symptoms**:
- Student dashboard shows "No courses enrolled yet"
- Teacher dashboard shows "No courses yet"
- Course cards not displaying

**Solutions**:

**For Students**:
```sql
-- Check enrollments
SELECT 
  e.*,
  c.title,
  c.description
FROM enrollments e
JOIN courses c ON e.course_id = c.id
WHERE e.user_id = '550e8400-e29b-41d4-a716-446655440001'
  AND e.role = 'student';

-- Check user progress
SELECT * FROM user_progress 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';
```

**For Teachers**:
```sql
-- Check course assignments
SELECT 
  ct.*,
  c.title,
  c.description
FROM course_teachers ct
JOIN courses c ON ct.course_id = c.id
WHERE ct.teacher_id = '550e8400-e29b-41d4-a716-446655440002';
```

#### 4. Assignment Data Not Loading

**Symptoms**:
- Assignment tab shows "No assignments yet"
- No submissions visible
- Assignment creation not working

**Solutions**:

**Check Assignments**:
```sql
-- Verify assignments exist
SELECT * FROM assignments;

-- Check course-specific assignments
SELECT * FROM assignments WHERE course_id = 1;
```

**Check Submissions**:
```sql
-- Verify submissions exist
SELECT 
  as.*,
  a.title as assignment_title,
  u.full_name as student_name
FROM assignment_submissions as
JOIN assignments a ON as.assignment_id = a.id
JOIN users u ON as.student_id = u.id;
```

### Quick Fix Commands

If you're still having issues, run these commands in sequence:

```sql
-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Drop all tables (if schema is corrupted)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 3. Run complete schema
-- Copy and paste the entire contents of supabase/schema.sql

-- 4. Insert sample data
-- Copy and paste the entire contents of supabase/sample_data.sql

-- 5. Verify setup
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM enrollments;
```

### Testing the Fix

After running the fixes:

1. **Refresh your browser** and clear localStorage
2. **Use test login buttons** (Test Student/Test Teacher)
3. **Check browser console** for any remaining errors
4. **Verify data appears** in the dashboard

### Still Having Issues?

If problems persist:

1. **Check Supabase Logs**: Go to Settings > Database > Logs
2. **Verify API Keys**: Ensure your environment variables are correct
3. **Test RLS Policies**: Use the SQL commands above to verify access
4. **Check Network Tab**: Look for failed API requests in browser dev tools

## 📞 Support

For additional help:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the [Project Setup Guide](./PROJECT_SETUP.md)
3. Check the [Authentication Setup Guide](./AUTHENTICATION_SETUP.md) 