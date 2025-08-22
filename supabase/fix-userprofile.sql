-- =====================================================
-- Fix UserProfile Setup - Works with existing schema
-- =====================================================

-- 1. Create storage bucket for avatars (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for avatars
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Public read access to profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
  
  -- Create new policies
  CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Public read access to profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

  CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

  CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
END $$;

-- 3. Insert sample data for testing (if not exists)
INSERT INTO institutions (id, name, address, logo_url, website, contact_email, contact_phone, subscription_plan, status) VALUES
(1, 'Tech Academy International', '123 Innovation Drive, Tech City, TC 12345', 'https://ui-avatars.com/api/?name=TAI&background=3B82F6&color=FFFFFF&size=150', 'https://techacademy.edu', 'admin@techacademy.edu', '+1-555-0123', 'premium', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, full_name, gender, phone_number, profile_picture_url, bio, language_preference, notification_preferences) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'student@test.com', 'Alex Johnson', 'other', '+1-555-0001', 'https://ui-avatars.com/api/?name=Alex+Johnson&background=3B82F6&color=FFFFFF&size=150', 'Passionate learner interested in technology and innovation', 'en', '{"email": true, "push": true, "sms": false}'),
('550e8400-e29b-41d4-a716-446655440002', 'teacher@test.com', 'Dr. Sarah Chen', 'female', '+1-555-0002', 'https://ui-avatars.com/api/?name=Dr.+Sarah+Chen&background=10B981&color=FFFFFF&size=150', 'Experienced educator with expertise in computer science and AI', 'en', '{"email": true, "push": true, "sms": false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_social_links (user_id, platform, url, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'linkedin', 'https://linkedin.com/in/alexjohnson', true),
('550e8400-e29b-41d4-a716-446655440001', 'github', 'https://github.com/alexjohnson', true),
('550e8400-e29b-41d4-a716-446655440002', 'linkedin', 'https://linkedin.com/in/sarahchen', true),
('550e8400-e29b-41d4-a716-446655440002', 'twitter', 'https://twitter.com/sarahchen', true)
ON CONFLICT (user_id, platform) DO NOTHING;

INSERT INTO user_institutions (user_id, institution_id, role, status, permissions) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1, 'student', 'active', '{"view_courses": true, "submit_assignments": true, "access_chat": true}'),
('550e8400-e29b-41d4-a716-446655440002', 1, 'teacher', 'active', '{"create_courses": true, "grade_assignments": true, "manage_students": true, "access_analytics": true}')
ON CONFLICT (user_id, institution_id) DO NOTHING;

-- 4. Verify setup
SELECT 'UserProfile setup completed successfully!' as status;
