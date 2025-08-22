# UserProfile Setup Guide

This guide will help you set up the complete UserProfile functionality from frontend to backend to database.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with your credentials
2. **Environment Variables**: Your `.env` file should contain Supabase URL and Key
3. **Node.js**: Make sure you have Node.js installed

## Step-by-Step Setup

### Step 1: Database Setup

**Location**: Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire content from `supabase/fix-userprofile.sql`
4. Paste it in the SQL Editor
5. Click "Run"

This will:
- Create the `avatars` storage bucket
- Set up storage policies
- Insert sample data (institutions, users, social links)
- Configure everything needed for UserProfile

### Step 2: Test the Setup

**Location**: Project root directory

Run the test script to verify everything is working:

```bash
node test-userprofile.js
```

You should see:
- ✅ Environment variables found
- ✅ Found test users
- ✅ Found social links
- ✅ Found institutions
- ✅ Found user-institution relationships
- ✅ Avatars storage bucket found
- ✅ User data accessible

### Step 2.5: Test Real-time Updates

**Location**: Project root directory

Run the real-time test script to verify database-to-frontend sync:

```bash
node test-realtime-updates.js
```

This will:
- Set up real-time subscriptions
- Update data in the database
- Show real-time update messages
- Verify that changes are detected automatically

### Step 2.6: Add Machine Learning Course

**Location**: Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire content from `supabase/add-machine-learning-course.sql`
4. Paste it in the SQL Editor
5. Click "Run"

This will:
- Create the "Machine Learning" course
- Add 4 chapters with content items
- Enroll the test student as completed
- Mark all content as 100% completed
- Add a 5-star review
- Assign the teacher to the course

### Step 2.7: Test the Course Setup

**Location**: Project root directory

Run the course test script to verify everything is working:

```bash
node test-machine-learning-course.js
```

You should see:
- ✅ Course found with all details
- ✅ Course tags (machine-learning, algorithms, data-science, etc.)
- ✅ 4 chapters created
- ✅ 7 content items created
- ✅ Student enrollment as completed
- ✅ All progress marked as completed
- ✅ 5-star course review
- ✅ Teacher assigned to course

### Step 3: Start the Development Server

**Location**: Project root directory

```bash
npm run dev
```

### Step 4: Test the UserProfile Component

1. Open your browser and go to `http://localhost:5173`
2. Navigate to the UserProfile page
3. Click "Edit Profile" to test editing functionality
4. Try uploading a profile picture
5. Add/edit social media links
6. Update notification preferences
7. Save changes

## What's Fixed

### ✅ Database Issues
- Fixed the relationship query between `users` and `institutions`
- Properly fetches user data and institution data separately
- Combines data correctly for the frontend

### ✅ Storage Issues
- Created `avatars` storage bucket
- Set up proper storage policies
- Fixed profile picture upload functionality

### ✅ Frontend Issues
- Updated `useAuth` hook to work with existing schema
- Created `useUserProfile` hook for better organization
- Completely rewrote `UserProfile` component
- Fixed all form handling and data management

### ✅ Image Issues
- Replaced broken placeholder images with working ones
- Used `ui-avatars.com` for reliable placeholder images

## File Structure

```
src/
├── hooks/
│   ├── useAuth.tsx              # Updated authentication hook
│   ├── useUserProfile.tsx       # New UserProfile hook
│   └── useCompletedCourses.tsx  # New completed courses hook
├── components/
│   ├── Profile/
│   │   └── UserProfile.tsx      # Completely rewritten component
│   └── Dashboard/
│       └── CompletedCourses.tsx # New completed courses component
supabase/
├── fix-userprofile.sql                    # Database setup script
└── add-machine-learning-course.sql        # Course setup script
test-userprofile.js                        # Test script
test-machine-learning-course.js            # Course test script
```

## Features Working

✅ **Profile Data Loading**: User information loads from database
✅ **Profile Editing**: All fields are editable
✅ **Profile Picture Upload**: File upload to Supabase storage
✅ **Social Media Links**: Add, edit, delete social links
✅ **Notification Preferences**: Toggle email, push, SMS notifications
✅ **Real-time Updates**: All changes save to database immediately
✅ **Database to Frontend Sync**: Changes made in database reflect on frontend automatically
✅ **Error Handling**: Proper error messages and fallbacks
✅ **Loading States**: Loading spinners and disabled states

## Troubleshooting

### If you see errors:

1. **"Missing environment variables"**
   - Check your `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

2. **"Table not accessible"**
   - Run the SQL script in Supabase SQL Editor

3. **"Storage bucket not found"**
   - The SQL script creates the bucket, make sure it ran successfully

4. **"Profile not loading"**
   - Check the test script output for specific errors
   - Verify your Supabase project is active

### Common Issues:

- **RLS Policies**: The setup uses your existing schema with RLS disabled for development
- **Image Upload**: Make sure files are under 5MB and are valid image types
- **Social Links**: Each platform can only have one link per user

## Next Steps

After setup is complete:

1. Test all functionality thoroughly
2. Customize the UI as needed
3. Add additional fields if required
4. Set up proper RLS policies for production

## Support

If you encounter any issues:

1. Run the test script first: `node test-userprofile.js`
2. Check the browser console for errors
3. Verify your Supabase project settings
4. Ensure all SQL scripts ran successfully

The UserProfile should now work perfectly with your existing database schema! 🎉
