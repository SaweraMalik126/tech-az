-- =====================================================
-- TeachMe.ai Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. Institutions and Multitenancy
-- =====================================================
CREATE TABLE institutions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  subscription_plan TEXT DEFAULT 'basic',
  status TEXT CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 2. Users and Authentication
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) DEFAULT 'other',
  dob DATE,
  phone_number TEXT,
  profile_picture_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  language_preference TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- User social media links
CREATE TABLE user_social_links (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'twitter', 'github')),
  url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- =====================================================
-- 3. User Institution Relationships and Roles
-- =====================================================
CREATE TABLE user_institutions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'student', 'parent')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, institution_id)
);

-- Student-Parent relationships
CREATE TABLE student_parents (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('father', 'mother', 'guardian', 'other')) NOT NULL,
  has_legal_rights BOOLEAN DEFAULT false,
  contact_priority INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, parent_id)
);

-- =====================================================
-- 4. Courses and Content Management
-- =====================================================
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  language TEXT DEFAULT 'en',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_duration_hours INT DEFAULT 1,
  thumbnail_url TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  max_students INT,
  created_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Course metadata and tags
CREATE TABLE course_tags (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(course_id, tag)
);

-- Course teachers assignment
CREATE TABLE course_teachers (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP DEFAULT now(),
  UNIQUE(course_id, teacher_id)
);

-- =====================================================
-- 5. Course Structure and Content
-- =====================================================
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL,
  estimated_duration_minutes INT DEFAULT 30,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(course_id, position)
);

CREATE TABLE content_items (
  id SERIAL PRIMARY KEY,
  chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('text', 'video', 'quiz', 'assignment', 'slide', 'infographic', 'whiteboard', 'pdf')) NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  duration_estimate_seconds INT DEFAULT 0,
  position INT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(chapter_id, position)
);

-- Content versions for tracking changes
CREATE TABLE content_versions (
  id SERIAL PRIMARY KEY,
  content_item_id INT REFERENCES content_items(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content JSONB NOT NULL,
  change_notes TEXT,
  is_current BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 6. Enrollments and Progress Tracking
-- =====================================================
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'teacher')) NOT NULL,
  enrollment_type TEXT CHECK (enrollment_type IN ('invited', 'self_enrolled', 'admin_assigned')) DEFAULT 'invited',
  status TEXT CHECK (status IN ('active', 'completed', 'withdrawn', 'suspended')) DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  completion_certificate_url TEXT,
  grade TEXT,
  feedback TEXT,
  UNIQUE(user_id, course_id)
);

-- User progress tracking
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
  content_item_id INT REFERENCES content_items(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'reviewed')) DEFAULT 'not_started',
  time_spent_seconds INT DEFAULT 0,
  completion_percentage INT DEFAULT 0,
  last_position TEXT,
  last_interaction TIMESTAMP DEFAULT now(),
  attempt_count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, content_item_id)
);

-- =====================================================
-- 7. Assessments and Quizzes
-- =====================================================
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  content_item_id INT REFERENCES content_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INT,
  passing_score INT DEFAULT 70,
  max_attempts INT DEFAULT 3,
  is_randomized BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'essay')) NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  points INT DEFAULT 1,
  position INT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(quiz_id, position)
);

CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score DECIMAL(5,2),
  time_taken_seconds INT,
  passed BOOLEAN,
  feedback TEXT,
  attempted_at TIMESTAMP DEFAULT now(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP
);

-- =====================================================
-- 8. Assignments and Submissions
-- =====================================================
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  due_date TIMESTAMP,
  max_points INT DEFAULT 100,
  submission_type TEXT CHECK (submission_type IN ('file', 'text', 'link', 'mixed')) DEFAULT 'file',
  allowed_file_types TEXT[],
  max_file_size_mb INT DEFAULT 10,
  is_group_assignment BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  files JSONB,
  submitted_at TIMESTAMP DEFAULT now(),
  grade DECIMAL(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMP,
  status TEXT CHECK (status IN ('submitted', 'graded', 'late', 'resubmitted')) DEFAULT 'submitted'
);

-- =====================================================
-- 9. AI Chat and Interactions
-- =====================================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN ('general', 'course_specific', 'assignment_help', 'teach_back')) DEFAULT 'general',
  title TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  last_activity TIMESTAMP DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INT,
  model_used TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- AI interaction analytics
CREATE TABLE ai_interactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('chat', 'content_gen', 'feedback_analysis', 'teach_back_assessment')) NOT NULL,
  model_used TEXT,
  prompt TEXT,
  response TEXT,
  tokens_used INT,
  cost_estimate DECIMAL(10,4),
  context JSONB,
  user_feedback INT CHECK (user_feedback BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 10. Reviews and Feedback
-- =====================================================
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  content_item_id INT REFERENCES content_items(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  review_type TEXT CHECK (review_type IN ('course', 'content', 'teacher', 'peer')) DEFAULT 'course',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Peer review assignments
CREATE TABLE peer_reviews (
  id SERIAL PRIMARY KEY,
  assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submission_id INT REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  rubric_scores JSONB NOT NULL,
  feedback TEXT,
  is_completed BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  UNIQUE(reviewer_id, submission_id)
);

-- =====================================================
-- 11. Notifications and Announcements
-- =====================================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('announcement', 'assignment_due', 'grade_received', 'course_update', 'peer_review', 'system')) NOT NULL,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT now(),
  read_at TIMESTAMP
);

-- =====================================================
-- 12. Learning Analytics and Insights
-- =====================================================
CREATE TABLE learning_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  recorded_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 13. Audit Logs and Security
-- =====================================================
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- =====================================================
-- 14. Indexes for Performance
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_institution ON user_institutions(institution_id);
CREATE INDEX idx_courses_institution ON courses(institution_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_progress_user_course ON user_progress(user_id, course_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_analytics_user_course ON learning_analytics(user_id, course_id);

-- =====================================================
-- 15. Row Level Security (RLS) Policies
-- =====================================================
-- For development: Disable RLS to allow API access
-- In production, you should enable RLS with proper policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_institutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 15.1. Production RLS Policies (Uncomment for production)
-- =====================================================
-- Enable RLS on all tables (for production)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_institutions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (commented out for development)
-- Uncomment these when you enable RLS for production
-- CREATE POLICY "Users can view their own profile" ON users
--   FOR SELECT USING (auth.uid() = id);

-- CREATE POLICY "Users can update their own profile" ON users
--   FOR UPDATE USING (auth.uid() = id);

-- -- Allow API access to users table (for backend)
-- CREATE POLICY "API can view all users" ON users
--   FOR SELECT USING (true);

-- -- Allow API access to enrollments
-- CREATE POLICY "API can view enrollments" ON enrollments
--   FOR SELECT USING (true);

-- -- Allow API access to courses
-- CREATE POLICY "API can view courses" ON courses
--   FOR SELECT USING (true);

-- -- Allow API access to user_progress
-- CREATE POLICY "API can view user_progress" ON user_progress
--   FOR SELECT USING (true);

-- -- Allow users to view courses in their institution
-- CREATE POLICY "Users can view courses in their institution" ON courses
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM user_institutions ui
--       WHERE ui.user_id = auth.uid()
--       AND ui.institution_id = courses.institution_id
--     )
--   );

-- =====================================================
-- 16. Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  notification_id INTEGER;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_entity_type, p_related_entity_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql; 