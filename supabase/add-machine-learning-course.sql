-- =====================================================
-- Add Machine Learning Course to Completed
-- =====================================================

-- 1. Insert the Machine Learning course
INSERT INTO courses (id,  title, description, short_description, language, difficulty_level, estimated_duration_hours, thumbnail_url, status, is_featured, max_students, created_by, published_at) VALUES
(7, 'Machine Learning', 
'A comprehensive course covering the fundamentals of machine learning, including supervised and unsupervised learning, neural networks, and practical applications. Students will learn about algorithms, data structures, and real-world implementations.',
'Master machine learning fundamentals and algorithms',
'en', 'intermediate', 60, 'https://ui-avatars.com/api/?name=ML&background=10B981&color=FFFFFF&size=150', 'published', true, 100, '550e8400-e29b-41d4-a716-446655440002', now());

-- 2. Add course tags
INSERT INTO course_tags (course_id, tag) VALUES
(7, 'machine-learning'),
(7, 'algorithms'),
(7, 'data-science'),
(7, 'python'),
(7, 'scikit-learn'),
(7, 'statistics');

-- 3. Assign the teacher to the course
INSERT INTO course_teachers (course_id, teacher_id, is_primary) VALUES
(7, '550e8400-e29b-41d4-a716-446655440002', true);

-- 7. Create chapters for the course
INSERT INTO chapters (id, course_id, title, description, position, estimated_duration_minutes, is_required) VALUES
(16, 7, 'Introduction to Machine Learning', 'Overview of machine learning concepts, types, and applications', 1, 120, true),
(17, 7, 'Supervised Learning', 'Understanding classification and regression algorithms', 2, 180, true),
(18, 7, 'Unsupervised Learning', 'Clustering, dimensionality reduction, and association rules', 3, 150, true),
(19, 7, 'Neural Networks and Deep Learning', 'Building and training neural networks for complex problems', 7, 240, true);

-- 5. Create content items for each chapter
INSERT INTO content_items (id, chapter_id, type, title, content, duration_estimate_seconds, position, is_required, metadata) VALUES
(20, 16, 'text', 'What is Machine Learning?', '{"text": "Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed."}', 3600, 1, true, '{"difficulty": "beginner"}'),
(21, 16, 'video', 'ML Overview and Applications', '{"video_url": "https://example.com/ml-overview.mp4", "transcript": "Welcome to Machine Learning course..."}', 7200, 2, true, '{"difficulty": "beginner"}'),
(22, 17, 'text', 'Classification Algorithms', '{"text": "Classification algorithms help predict categorical outcomes. Common algorithms include Logistic Regression, Decision Trees, and Support Vector Machines."}', 5400, 1, true, '{"difficulty": "intermediate"}'),
(23, 17, 'video', 'Regression Techniques', '{"video_url": "https://example.com/regression.mp4", "transcript": "Let''s explore regression techniques..."}', 9000, 2, true, '{"difficulty": "intermediate"}'),
(24, 18, 'text', 'Clustering Algorithms', '{"text": "Clustering algorithms group similar data points together. Popular methods include K-means, Hierarchical clustering, and DBSCAN."}', 4800, 1, true, '{"difficulty": "intermediate"}'),
(25, 19, 'text', 'Neural Network Basics', '{"text": "Neural networks are inspired by biological neurons and consist of layers of interconnected nodes that process information."}', 6000, 1, true, '{"difficulty": "intermediate"}'),
(26, 19, 'assignment', 'Build a Neural Network', '{"instructions": "Create a neural network using TensorFlow or PyTorch to solve a classification problem."}', 14400, 2, true, '{"difficulty": "advanced"}');

-- 6. Enroll the student in the course as completed
INSERT INTO enrollments (user_id, course_id, role, enrollment_type, status, enrolled_at, completed_at, completion_certificate_url, grade, feedback) VALUES
('550e8400-e29b-41d4-a716-446655440001', 7, 'student', 'self_enrolled', 'completed', now() - interval '30 days', now(), 'https://example.com/certificates/machine-learning.pdf', 'A', 'Excellent work! Student demonstrated strong understanding of ML concepts and successfully completed all projects.');

-- 7. Add user progress for all content items as completed
INSERT INTO user_progress (user_id, course_id, chapter_id, content_item_id, status, time_spent_seconds, completion_percentage, last_position, attempt_count, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 7, 16, 20, 'completed', 3600, 100, 'end', 1, 'Great introduction to ML concepts'),
('550e8400-e29b-41d4-a716-446655440001', 7, 16, 21, 'completed', 7200, 100, 'end', 1, 'Comprehensive overview of ML applications'),
('550e8400-e29b-41d4-a716-446655440001', 7, 17, 22, 'completed', 5400, 100, 'end', 1, 'Classification algorithms well explained'),
('550e8400-e29b-41d4-a716-446655440001', 7, 17, 23, 'completed', 9000, 100, 'end', 1, 'Regression techniques comprehensive'),
('550e8400-e29b-41d4-a716-446655440001', 7, 18, 24, 'completed', 4800, 100, 'end', 1, 'Clustering concepts clear'),
('550e8400-e29b-41d4-a716-446655440001', 7, 19, 25, 'completed', 6000, 100, 'end', 1, 'Neural network fundamentals solid'),
('550e8400-e29b-41d4-a716-446655440001', 7, 19, 26, 'completed', 14400, 100, 'end', 1, 'Neural network project completed successfully');

-- 8. Add a review for the course
INSERT INTO reviews (user_id, course_id, rating, review_text, review_type, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440001', 7, 5, 'Outstanding course! The content was well-structured and the practical projects really helped solidify the machine learning concepts. The instructor was knowledgeable and the course materials were comprehensive. Highly recommend for anyone wanting to learn ML!', 'course', true);

-- 9. Verify the setup
SELECT 'Machine Learning course added successfully!' as status;
SELECT 
  c.title as course_title,
  c.status as course_status,
  e.status as enrollment_status,
  e.completed_at,
  e.grade,
  COUNT(up.id) as completed_content_items
FROM courses c
JOIN enrollments e ON c.id = e.course_id
LEFT JOIN user_progress up ON e.user_id = up.user_id AND e.course_id = up.course_id AND up.status = 'completed'
WHERE c.title = 'Machine Learning'
GROUP BY c.title, c.status, e.status, e.completed_at, e.grade;
