-- =====================================================
-- Sample Data for TeachMe.ai Platform
-- =====================================================

-- Insert test institutions
INSERT INTO institutions (id, name, address, logo_url, website, contact_email, contact_phone, subscription_plan, status) VALUES
(1, 'Tech Academy International', '123 Innovation Drive, Tech City, TC 12345', 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=TAI', 'https://techacademy.edu', 'admin@techacademy.edu', '+1-555-0123', 'premium', 'active'),
(2, 'Global Learning Institute', '456 Education Blvd, Learning City, LC 67890', 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=GLI', 'https://globallearning.edu', 'info@globallearning.edu', '+1-555-0456', 'enterprise', 'active'),
(3, 'Digital Skills Academy', '789 Knowledge Street, Digital City, DC 11111', 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=DSA', 'https://digitalskills.edu', 'hello@digitalskills.edu', '+1-555-0789', 'basic', 'active');

-- Insert test users (these will be used for test login buttons)
INSERT INTO users (id, email, full_name, gender, phone_number, profile_picture_url, bio, language_preference) VALUES
-- Test Student
('550e8400-e29b-41d4-a716-446655440001', 'student@test.com', 'Alex Johnson', 'other', '+1-555-0001', 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=AJ', 'Passionate learner interested in technology and innovation', 'en'),
-- Test Teacher
('550e8400-e29b-41d4-a716-446655440002', 'teacher@test.com', 'Dr. Sarah Chen', 'female', '+1-555-0002', 'https://via.placeholder.com/150x150/10B981/FFFFFF?text=SC', 'Experienced educator with expertise in computer science and AI', 'en'),
-- Test School Admin
('550e8400-e29b-41d4-a716-446655440003', 'admin@test.com', 'Michael Rodriguez', 'male', '+1-555-0003', 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=MR', 'School administrator focused on educational excellence', 'en'),
-- Test Super Admin
('550e8400-e29b-41d4-a716-446655440004', 'superadmin@test.com', 'Emily Watson', 'female', '+1-555-0004', 'https://via.placeholder.com/150x150/8B5CF6/FFFFFF?text=EW', 'Platform administrator ensuring quality education delivery', 'en');

-- Insert user social media links
INSERT INTO user_social_links (user_id, platform, url, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'linkedin', 'https://linkedin.com/in/alexjohnson', true),
('550e8400-e29b-41d4-a716-446655440001', 'github', 'https://github.com/alexjohnson', true),
('550e8400-e29b-41d4-a716-446655440002', 'linkedin', 'https://linkedin.com/in/sarahchen', true),
('550e8400-e29b-41d4-a716-446655440002', 'twitter', 'https://twitter.com/sarahchen', true),
('550e8400-e29b-41d4-a716-446655440003', 'linkedin', 'https://linkedin.com/in/michaelrodriguez', true),
('550e8400-e29b-41d4-a716-446655440004', 'linkedin', 'https://linkedin.com/in/emilywatson', true);

-- Insert user institution relationships
INSERT INTO user_institutions (user_id, institution_id, role, status, permissions) VALUES
-- Student at Tech Academy
('550e8400-e29b-41d4-a716-446655440001', 1, 'student', 'active', '{"view_courses": true, "submit_assignments": true, "access_chat": true}'),
-- Teacher at Tech Academy
('550e8400-e29b-41d4-a716-446655440002', 1, 'teacher', 'active', '{"create_courses": true, "grade_assignments": true, "manage_students": true, "access_analytics": true}'),
-- School Admin at Tech Academy
('550e8400-e29b-41d4-a716-446655440003', 1, 'school_admin', 'active', '{"manage_teachers": true, "manage_students": true, "view_reports": true, "manage_courses": true}'),
-- Super Admin (can access all institutions)
('550e8400-e29b-41d4-a716-446655440004', 1, 'super_admin', 'active', '{"all_permissions": true}'),
('550e8400-e29b-41d4-a716-446655440004', 2, 'super_admin', 'active', '{"all_permissions": true}'),
('550e8400-e29b-41d4-a716-446655440004', 3, 'super_admin', 'active', '{"all_permissions": true}');

-- Insert test courses
INSERT INTO courses (id, institution_id, title, description, short_description, language, difficulty_level, estimated_duration_hours, thumbnail_url, status, is_featured, max_students, created_by, published_at) VALUES
(1, 1, 'Introduction to Artificial Intelligence', 'A comprehensive course covering the fundamentals of AI, machine learning, and neural networks. Students will learn about algorithms, data structures, and practical applications.', 'Learn AI fundamentals and applications', 'en', 'beginner', 40, 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=AI+Course', 'published', true, 50, '550e8400-e29b-41d4-a716-446655440002', now()),
(2, 1, 'Web Development Fundamentals', 'Master the basics of web development including HTML, CSS, JavaScript, and modern frameworks. Build responsive websites and web applications.', 'Build modern websites and web apps', 'en', 'beginner', 35, 'https://via.placeholder.com/400x250/10B981/FFFFFF?text=Web+Dev', 'published', true, 40, '550e8400-e29b-41d4-a716-446655440002', now()),
(3, 1, 'Data Science Essentials', 'Learn data analysis, visualization, and statistical methods. Work with real datasets and gain practical experience in data science.', 'Analyze data and create insights', 'en', 'intermediate', 45, 'https://via.placeholder.com/400x250/F59E0B/FFFFFF?text=Data+Science', 'published', false, 30, '550e8400-e29b-41d4-a716-446655440002', now()),
(4, 2, 'Digital Marketing Strategy', 'Comprehensive digital marketing course covering SEO, social media, content marketing, and analytics.', 'Master digital marketing techniques', 'en', 'intermediate', 30, 'https://via.placeholder.com/400x250/8B5CF6/FFFFFF?text=Marketing', 'published', true, 35, '550e8400-e29b-41d4-a716-446655440002', now()),
(5, 3, 'Cybersecurity Fundamentals', 'Learn about network security, cryptography, ethical hacking, and security best practices.', 'Protect systems and data', 'en', 'beginner', 25, 'https://via.placeholder.com/400x250/EF4444/FFFFFF?text=Security', 'published', true, 45, '550e8400-e29b-41d4-a716-446655440002', now());

-- Insert course tags
INSERT INTO course_tags (course_id, tag) VALUES
(1, 'artificial-intelligence'),
(1, 'machine-learning'),
(1, 'neural-networks'),
(2, 'web-development'),
(2, 'html-css'),
(2, 'javascript'),
(3, 'data-science'),
(3, 'statistics'),
(3, 'python'),
(4, 'digital-marketing'),
(4, 'seo'),
(4, 'social-media'),
(5, 'cybersecurity'),
(5, 'networking'),
(5, 'ethical-hacking');

-- Insert course teachers
INSERT INTO course_teachers (course_id, teacher_id, is_primary) VALUES
(1, '550e8400-e29b-41d4-a716-446655440002', true),
(2, '550e8400-e29b-41d4-a716-446655440002', true),
(3, '550e8400-e29b-41d4-a716-446655440002', true),
(4, '550e8400-e29b-41d4-a716-446655440002', true),
(5, '550e8400-e29b-41d4-a716-446655440002', true);

-- Insert chapters for AI course
INSERT INTO chapters (id, course_id, title, description, position, estimated_duration_minutes) VALUES
(1, 1, 'Introduction to AI', 'Overview of artificial intelligence and its applications', 1, 45),
(2, 1, 'Machine Learning Basics', 'Fundamentals of machine learning algorithms', 2, 60),
(3, 1, 'Neural Networks', 'Understanding neural networks and deep learning', 3, 75),
(4, 1, 'AI Applications', 'Real-world applications and case studies', 4, 60);

-- Insert chapters for Web Development course
INSERT INTO chapters (id, course_id, title, description, position, estimated_duration_minutes) VALUES
(5, 2, 'HTML Fundamentals', 'Learn HTML structure and semantic markup', 1, 40),
(6, 2, 'CSS Styling', 'Master CSS for beautiful web design', 2, 50),
(7, 2, 'JavaScript Basics', 'Introduction to JavaScript programming', 3, 60),
(8, 2, 'Responsive Design', 'Create mobile-friendly websites', 4, 45);

-- Insert content items
INSERT INTO content_items (id, chapter_id, type, title, content, duration_estimate_seconds, position) VALUES
-- AI Course Content
(1, 1, 'text', 'What is Artificial Intelligence?', '{"text": "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. AI encompasses machine learning, natural language processing, robotics, and more.", "key_points": ["Definition of AI", "Types of AI", "Applications"], "resources": ["video_intro.mp4", "ai_overview.pdf"]}', 1800, 1),
(2, 1, 'video', 'AI in Everyday Life', '{"video_url": "https://example.com/ai_everyday.mp4", "duration": 1200, "transcript": "AI is already part of our daily lives...", "subtitles": true}', 1200, 2),
(3, 1, 'quiz', 'AI Fundamentals Quiz', '{"quiz_id": 1, "time_limit": 900, "passing_score": 70}', 900, 3),

(4, 2, 'text', 'Machine Learning Introduction', '{"text": "Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed.", "key_points": ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning"]}', 2400, 1),
(5, 2, 'infographic', 'ML Algorithm Types', '{"image_url": "https://example.com/ml_types.png", "description": "Visual representation of different machine learning algorithms", "interactive": true}', 600, 2),

(6, 3, 'text', 'Neural Network Architecture', '{"text": "Neural networks are computing systems inspired by biological neural networks.", "diagrams": ["nn_structure.png"], "examples": ["Simple NN", "Deep NN"]}', 2700, 1),
(7, 3, 'whiteboard', 'Building a Neural Network', '{"whiteboard_data": "step_by_step_guide", "interactive": true, "tools": ["pen", "eraser", "shapes"]}', 1800, 2),

-- Web Development Content
(8, 5, 'text', 'HTML Document Structure', '{"text": "HTML documents have a specific structure including DOCTYPE, html, head, and body elements.", "code_examples": ["<!DOCTYPE html>", "<html>", "<head>", "<body>"]}', 1800, 1),
(9, 5, 'slide', 'HTML Elements Overview', '{"slides": ["basic_elements.pdf"], "notes": "Comprehensive overview of HTML elements and their usage"}', 1200, 2),

(10, 6, 'text', 'CSS Selectors and Properties', '{"text": "CSS selectors allow you to target specific HTML elements for styling.", "examples": [".class", "#id", "element"]}', 2400, 1),
(11, 6, 'video', 'CSS Layout Techniques', '{"video_url": "https://example.com/css_layout.mp4", "duration": 1800, "topics": ["Flexbox", "Grid", "Positioning"]}', 1800, 2);

-- Insert enrollments
INSERT INTO enrollments (user_id, course_id, role, enrollment_type, status, enrolled_at) VALUES
-- Student enrolled in AI and Web Development courses
('550e8400-e29b-41d4-a716-446655440001', 1, 'student', 'invited', 'active', now() - interval '30 days'),
('550e8400-e29b-41d4-a716-446655440001', 2, 'student', 'invited', 'active', now() - interval '15 days'),
('550e8400-e29b-41d4-a716-446655440001', 3, 'student', 'invited', 'active', now() - interval '7 days');

-- Insert user progress
INSERT INTO user_progress (user_id, course_id, chapter_id, content_item_id, status, time_spent_seconds, completion_percentage, last_interaction) VALUES
-- AI Course Progress
('550e8400-e29b-41d4-a716-446655440001', 1, 1, 1, 'completed', 1800, 100, now() - interval '25 days'),
('550e8400-e29b-41d4-a716-446655440001', 1, 1, 2, 'completed', 1200, 100, now() - interval '24 days'),
('550e8400-e29b-41d4-a716-446655440001', 1, 1, 3, 'completed', 900, 100, now() - interval '23 days'),
('550e8400-e29b-41d4-a716-446655440001', 1, 2, 4, 'completed', 2400, 100, now() - interval '20 days'),
('550e8400-e29b-41d4-a716-446655440001', 1, 2, 5, 'completed', 600, 100, now() - interval '19 days'),
('550e8400-e29b-41d4-a716-446655440001', 1, 3, 6, 'in_progress', 1800, 60, now() - interval '5 days'),
('550e8400-e29b-41d4-a716-446655440001', 1, 3, 7, 'not_started', 0, 0, now() - interval '30 days'),
('550e8400-e29b-41d4-a716-446655440001', 1, 4, NULL, 'not_started', 0, 0, now() - interval '30 days'),

-- Web Development Progress
('550e8400-e29b-41d4-a716-446655440001', 2, 5, 8, 'completed', 1800, 100, now() - interval '12 days'),
('550e8400-e29b-41d4-a716-446655440001', 2, 5, 9, 'completed', 1200, 100, now() - interval '11 days'),
('550e8400-e29b-41d4-a716-446655440001', 2, 6, 10, 'in_progress', 1200, 50, now() - interval '3 days'),
('550e8400-e29b-41d4-a716-446655440001', 2, 6, 11, 'not_started', 0, 0, now() - interval '15 days'),
('550e8400-e29b-41d4-a716-446655440001', 2, 7, NULL, 'not_started', 0, 0, now() - interval '15 days'),
('550e8400-e29b-41d4-a716-446655440001', 2, 8, NULL, 'not_started', 0, 0, now() - interval '15 days'),

-- Data Science Progress (just started)
('550e8400-e29b-41d4-a716-446655440001', 3, NULL, NULL, 'not_started', 0, 0, now() - interval '7 days');

-- Insert quizzes
INSERT INTO quizzes (id, content_item_id, title, description, time_limit_minutes, passing_score, max_attempts) VALUES
(1, 3, 'AI Fundamentals Quiz', 'Test your understanding of AI basics', 15, 70, 3);

-- Insert quiz questions
INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, options, correct_answer, explanation, points, position) VALUES
(1, 1, 'What does AI stand for?', 'multiple_choice', '["Artificial Intelligence", "Automated Information", "Advanced Integration", "Applied Intelligence"]', 'Artificial Intelligence', 'AI stands for Artificial Intelligence, which is the simulation of human intelligence in machines.', 1, 1),
(2, 1, 'Which of the following is NOT a type of AI?', 'multiple_choice', '["Narrow AI", "General AI", "Super AI", "Natural AI"]', 'Natural AI', 'Natural AI is not a recognized type of AI. The main types are Narrow AI, General AI, and Super AI.', 1, 2),
(3, 1, 'Machine learning is a subset of AI.', 'true_false', '["True", "False"]', 'True', 'Machine learning is indeed a subset of artificial intelligence that focuses on algorithms and statistical models.', 1, 3);

-- Insert quiz attempts
INSERT INTO quiz_attempts (id, user_id, quiz_id, answers, score, time_taken_seconds, passed, attempted_at) VALUES
(1, '550e8400-e29b-41d4-a716-446655440001', 1, '{"1": "Artificial Intelligence", "2": "Natural AI", "3": "True"}', 66.67, 720, false, now() - interval '23 days'),
(2, '550e8400-e29b-41d4-a716-446655440001', 1, '{"1": "Artificial Intelligence", "2": "Natural AI", "3": "True"}', 66.67, 680, false, now() - interval '22 days'),
(3, '550e8400-e29b-41d4-a716-446655440001', 1, '{"1": "Artificial Intelligence", "2": "Natural AI", "3": "True"}', 100.00, 600, true, now() - interval '21 days');

-- Insert assignments
INSERT INTO assignments (
    id, course_id, title, description, instructions, due_date,
    max_points, submission_type, allowed_file_types, max_file_size_mb, created_by
) VALUES
(
    1, 1,
    'AI Application Research Paper',
    'Research and write a paper about a real-world AI application',
    'Write a 5-7 page research paper about an AI application in healthcare, finance, or education. Include examples, benefits, and challenges.',
    now() + interval '7 days',
    100,
    'file',
    ARRAY['pdf', 'docx'],
    5,
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    2, 2,
    'Personal Portfolio Website',
    'Create a personal portfolio website using HTML, CSS, and JavaScript',
    'Build a responsive portfolio website with at least 3 sections: About, Projects, and Contact. Use modern CSS techniques.',
    now() + interval '14 days',
    100,
    'link',
    ARRAY[]::text[],
    0,
    '550e8400-e29b-41d4-a716-446655440002'
);


-- Insert assignment submissions
INSERT INTO assignment_submissions (id, assignment_id, student_id, content, files, submitted_at, status) VALUES
(1, 1, '550e8400-e29b-41d4-a716-446655440001', '{"title": "AI in Healthcare: Diagnosis and Treatment", "abstract": "This paper explores how AI is revolutionizing healthcare...", "word_count": 2500}', '{"files": ["ai_healthcare_paper.pdf"]}', now() - interval '2 days', 'submitted');

-- Insert reviews
INSERT INTO reviews (id, user_id, course_id, content_item_id, rating, review_text, review_type, created_at) VALUES
(1, '550e8400-e29b-41d4-a716-446655440001', 1, NULL, 5, 'Excellent course! The content is well-structured and the AI tutor is very helpful.', 'course', now() - interval '20 days'),
(2, '550e8400-e29b-41d4-a716-446655440001', 2, NULL, 4, 'Great web development course with practical examples.', 'course', now() - interval '10 days');

-- Insert notifications
INSERT INTO notifications (id, user_id, title, message, type, related_entity_type, related_entity_id, priority, created_at) VALUES
(1, '550e8400-e29b-41d4-a716-446655440001', 'Assignment Due Soon', 'Your AI Application Research Paper is due in 5 days', 'assignment_due', 'assignment', '1', 'high', now() - interval '2 days'),
(2, '550e8400-e29b-41d4-a716-446655440001', 'New Course Available', 'Data Science Essentials is now available for enrollment', 'course_update', 'course', '3', 'medium', now() - interval '7 days'),
(3, '550e8400-e29b-41d4-a716-446655440001', 'Quiz Completed', 'Congratulations! You passed the AI Fundamentals Quiz', 'grade_received', 'quiz', '1', 'low', now() - interval '21 days');

-- Insert chat sessions
INSERT INTO chat_sessions (id, user_id, course_id, session_type, title, context, created_at, last_activity) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 1, 'course_specific', 'AI Course Help', '{"course_id": 1, "chapter": "Neural Networks", "topic": "Backpropagation"}', now() - interval '5 days', now() - interval '5 days'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', NULL, 'general', 'General Learning Questions', '{"topics": ["study techniques", "time management"]}', now() - interval '10 days', now() - interval '8 days');

-- Insert chat messages
INSERT INTO chat_messages (
    id, session_id, role, content, metadata, created_at
) VALUES
(
    1,
    '550e8400-e29b-41d4-a716-446655440010',
    'user',
    'I''m having trouble understanding backpropagation in neural networks. Can you explain it in simple terms?',
    '{"tokens": 25, "model": "gpt-4"}',
    now() - interval '5 days'
),
(
    2,
    '550e8400-e29b-41d4-a716-446655440010',
    'assistant',
    'Backpropagation is like learning from mistakes. Imagine you''re learning to throw a ball at a target. Each time you miss, you adjust your aim based on how far off you were. In neural networks, we do the same thing - we adjust the weights based on the error between our prediction and the actual result.',
    '{"tokens": 85, "model": "gpt-4"}',
    now() - interval '5 days'
),
(
    3,
    '550e8400-e29b-41d4-a716-446655440010',
    'user',
    'That makes sense! Can you give me a practical example?',
    '{"tokens": 15, "model": "gpt-4"}',
    now() - interval '5 days'
),
(
    4,
    '550e8400-e29b-41d4-a716-446655440010',
    'assistant',
    'Sure! Let''s say you''re training a neural network to recognize handwritten digits. If it predicts "5" when the actual digit is "6", the error is 1. Backpropagation calculates how much each weight contributed to this error and adjusts them proportionally. It''s like saying "this connection was too strong, let''s weaken it a bit."',
    '{"tokens": 95, "model": "gpt-4"}',
    now() - interval '5 days'
),
(
    5,
    '550e8400-e29b-41d4-a716-446655440011',
    'user',
    'What''s the best way to study for technical courses like this?',
    '{"tokens": 20, "model": "gpt-4"}',
    now() - interval '10 days'
),
(
    6,
    '550e8400-e29b-41d4-a716-446655440011',
    'assistant',
    'For technical courses, I recommend: 1) Active learning - don''t just read, implement concepts in code, 2) Spaced repetition - review material over time, 3) Practice problems - work through exercises regularly, 4) Teach others - explaining concepts helps solidify understanding, 5) Take breaks - your brain needs time to process information.',
    '{"tokens": 75, "model": "gpt-4"}',
    now() - interval '10 days'
);


-- Insert AI interactions for analytics
INSERT INTO ai_interactions (id, user_id, course_id, interaction_type, model_used, prompt, response, tokens_used, cost_estimate, context, user_feedback, created_at) VALUES
(1, '550e8400-e29b-41d4-a716-446655440001', 1, 'chat', 'gpt-4', 'Explain backpropagation in neural networks', 'Backpropagation is like learning from mistakes...', 110, 0.0033, '{"course_id": 1, "chapter": "Neural Networks"}', 5, now() - interval '5 days'),
(2, '550e8400-e29b-41d4-a716-446655440001', NULL, 'chat', 'gpt-4', 'Best study techniques for technical courses', 'For technical courses, I recommend...', 95, 0.0029, '{"topic": "study techniques"}', 4, now() - interval '10 days');

-- Insert learning analytics
INSERT INTO learning_analytics (id, user_id, course_id, event_type, event_data, session_id, recorded_at) VALUES
(1, '550e8400-e29b-41d4-a716-446655440001', 1, 'content_viewed', '{"content_id": 1, "content_type": "text", "time_spent": 1800}', 'session_001', now() - interval '25 days'),
(2, '550e8400-e29b-41d4-a716-446655440001', 1, 'quiz_completed', '{"quiz_id": 1, "score": 100, "attempts": 3}', 'session_002', now() - interval '21 days'),
(3, '550e8400-e29b-41d4-a716-446655440001', 1, 'ai_chat_used', '{"session_id": "550e8400-e29b-41d4-a716-446655440010", "messages": 4, "tokens": 110}', 'session_003', now() - interval '5 days'),
(4, '550e8400-e29b-41d4-a716-446655440001', 2, 'content_viewed', '{"content_id": 8, "content_type": "text", "time_spent": 1800}', 'session_004', now() - interval '12 days'),
(5, '550e8400-e29b-41d4-a716-446655440001', 2, 'assignment_submitted', '{"assignment_id": 2, "status": "submitted"}', 'session_005', now() - interval '2 days'); 