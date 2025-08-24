-- Seed data for TeachMe.ai finalized schema
-- Assumes schema_teachme_final.sql has been applied

BEGIN;

WITH org AS (
  INSERT INTO organization (name, slug, status, plan, settings, address, logo_url, website, contact_email, contact_phone, timezone, locale, data_retention_policy, privacy_settings, compliance_logging_enabled)
  VALUES ('Falcon School', 'falcon', 'active', 'standard', '{"ai_limits": {"tokens": 100000}}', '{"line1": "123 Main St", "city": "Lahore"}', 'https://cdn.example.com/logo.png', 'https://falcon.teachme.ai', 'admin@falcon.edu', '+92-300-0000000', 'Asia/Karachi', 'en-US', '{"days": 365}', '{"gdpr_compliant": true}', true)
  RETURNING id
),
users AS (
  INSERT INTO app_user (email, name, avatar_url, phone, status, auth_provider)
  VALUES 
    ('superadmin@teachme.ai', 'TeachMe Super Admin', 'https://cdn.example.com/sa.png', '+1-555-1111', 'active', 'password'),
    ('orgadmin@falcon.edu', 'Falcon Org Admin', 'https://cdn.example.com/oa.png', '+92-300-1111111', 'active', 'google'),
    ('teacher@falcon.edu', 'Falcon Teacher', 'https://cdn.example.com/t.png', '+92-300-2222222', 'active', 'google'),
    ('student@falcon.edu', 'Falcon Student', 'https://cdn.example.com/s.png', '+92-300-3333333', 'active', 'google'),
    ('parent@falcon.edu', 'Falcon Parent', 'https://cdn.example.com/p.png', '+92-300-4444444', 'active', 'google')
  RETURNING id, email
),
profiles AS (
  INSERT INTO user_profile (user_id, institute_name, dp_url, phone, socials, prefs, learning_goals, preferred_languages, accessibility_settings, notification_preferences, content_preferences, learning_analytics, last_activity_at, total_learning_minutes)
  SELECT id, 'Falcon School', 'https://cdn.example.com/dp.png', '+92-300-5555555', '{"linkedin": "https://lnkd.in/example"}', '{}', '{"Pass Grade 10"}', '{"en","ur"}', '{}', '{"email": true}', '{}', '{}', now(), 0
  FROM app_user
  WHERE email IN ('orgadmin@falcon.edu','teacher@falcon.edu','student@falcon.edu','parent@falcon.edu')
  RETURNING user_id
),
memberships AS (
  INSERT INTO org_membership (org_id, user_id, role, status)
  SELECT o.id, u.id, r.role, 'active'
  FROM org AS o
  JOIN (
    SELECT id, 'super_admin'::membership_role AS role FROM app_user WHERE email = 'superadmin@teachme.ai'
    UNION ALL SELECT id, 'org_admin' FROM app_user WHERE email = 'orgadmin@falcon.edu'
    UNION ALL SELECT id, 'teacher' FROM app_user WHERE email = 'teacher@falcon.edu'
    UNION ALL SELECT id, 'student' FROM app_user WHERE email = 'student@falcon.edu'
    UNION ALL SELECT id, 'parent' FROM app_user WHERE email = 'parent@falcon.edu'
  ) r ON true
  JOIN app_user u ON u.id = r.id
  RETURNING org_id, user_id
),
parent_link AS (
  INSERT INTO parent_link (org_id, parent_user_id, student_user_id, relationship, verified_at)
  SELECT m1.org_id, m1.user_id, m2.user_id, 'guardian', now()
  FROM memberships m1
  JOIN memberships m2 ON m1.org_id = m2.org_id
  JOIN app_user p ON p.id = m1.user_id AND p.email = 'parent@falcon.edu'
  JOIN app_user s ON s.id = m2.user_id AND s.email = 'student@falcon.edu'
  RETURNING id
),
term AS (
  INSERT INTO term (org_id, name, start_date, end_date, is_current, registration_start, registration_end, drop_deadline, grading_deadline, holidays)
  SELECT o.id, 'Spring 2025', '2025-02-01', '2025-06-01', true, '2025-01-10', '2025-02-15', '2025-03-01', '2025-06-15', '[]'::jsonb
  FROM org o
  RETURNING id, org_id
),
class_level AS (
  INSERT INTO class_level (org_id, name, category)
  SELECT t.org_id, 'Secondary', 'secondary'::class_level_category FROM term t
  RETURNING id, org_id
),
school_class AS (
  INSERT INTO school_class (org_id, class_level_id, name, description)
  SELECT cl.org_id, cl.id, 'Grade 10', 'Grade 10 Science' FROM class_level cl
  RETURNING id, org_id
),
course AS (
  INSERT INTO course (org_id, class_id, term_id, code, title, description, language_defaults, subject_tags, credit_hours, prerequisites, learning_objectives, grading_policy, difficulty_level, max_students, is_featured, created_by, reviewed_by, published_at)
  SELECT sc.org_id, sc.id, t.id, 'PHY-101', 'Physics I', 'Mechanics and Energy', '{"en"}', '{"physics","grade-10"}', 3, '[]', '{"Understand Newtonian Mechanics"}', '{"weights": {"quiz": 0.4, "final": 0.6}}', 'intermediate', 60, true,
         (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=sc.org_id AND u.email='teacher@falcon.edu' LIMIT 1),
         (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=sc.org_id AND u.email='orgadmin@falcon.edu' LIMIT 1),
         now()
  FROM school_class sc
  JOIN term t ON t.org_id = sc.org_id
  RETURNING id, org_id
),
section AS (
  INSERT INTO section (org_id, course_id, term_id, name, schedule, capacity, credit_hours, prerequisites, learning_objectives, grading_policy, difficulty_level, is_featured, created_by, reviewed_by, published_at)
  SELECT c.org_id, c.id, t.id, 'Section A', '{"days": ["Mon","Wed"], "time": "10:00"}', 30, 3, '[]', '{"Master kinematics"}', '{"weights": {"quiz": 0.4, "final": 0.6}}', 'intermediate', true,
         (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=c.org_id AND u.email='teacher@falcon.edu' LIMIT 1),
         (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=c.org_id AND u.email='orgadmin@falcon.edu' LIMIT 1),
         now()
  FROM course c
  JOIN term t ON t.org_id = c.org_id
  RETURNING id, org_id, course_id
),
teacher_assignment AS (
  INSERT INTO teacher_assignment (org_id, section_id, teacher_user_id, role)
  SELECT s.org_id, s.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=s.org_id AND u.email='teacher@falcon.edu'), 'primary'
  FROM section s
  RETURNING id
),
enrollment AS (
  INSERT INTO enrollment (org_id, section_id, student_user_id, status, enrollment_type, enrolled_at, completed_at, completion_certificate_url, grade, feedback)
  SELECT s.org_id, s.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=s.org_id AND u.email='student@falcon.edu'), 'active', 'regular', now(), NULL, NULL, NULL, NULL
  FROM section s
  RETURNING id
),
assets AS (
  INSERT INTO asset (org_id, owner_user_id, kind, url, mime, size, visibility, metadata, version, parent_asset_id, is_latest_version, access_count, last_accessed_at, expires_at, content_moderation_status, moderated_by, moderated_at)
  SELECT s.org_id,
         (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=s.org_id AND u.email='teacher@falcon.edu'),
         'slide','https://cdn.example.com/physics/intro.pdf','application/pdf', 1048576, 'org','{}',1,NULL,true,0,NULL,NULL,'approved',NULL,NULL
  FROM section s LIMIT 1
  RETURNING id, org_id
),
module AS (
  INSERT INTO module (org_id, section_id, title, sort_order)
  SELECT s.org_id, s.id, 'Mechanics', 1 FROM section s
  RETURNING id, org_id, section_id
),
lesson AS (
  INSERT INTO lesson (org_id, module_id, section_id, title, content_rich, whiteboard_json, objectives, duration_minutes, difficulty_level, prerequisites, version, is_published, published_at, reviewed_by, reviewed_at)
  SELECT m.org_id, m.id, m.section_id, 'Newton''s Laws', 'Intro text', '{"shapes": []}', '{"Define forces"}', 45, 'intermediate', '[]', 1, true, now(),
         (SELECT user_id FROM memberships mm JOIN app_user u ON u.id=mm.user_id WHERE mm.org_id=m.org_id AND u.email='teacher@falcon.edu'), now()
  FROM module m
  RETURNING id, org_id
),
lesson_asset AS (
  INSERT INTO lesson_asset (org_id, lesson_id, asset_id, sort_order)
  SELECT l.org_id, l.id, a.id, 1 FROM lesson l JOIN assets a ON a.org_id = l.org_id
  RETURNING id
),
class_session AS (
  INSERT INTO class_session (org_id, section_id, start_at, end_at, mode, recording_asset_id)
  SELECT s.org_id, s.id, now() + interval '1 day', now() + interval '1 day' + interval '1 hour', 'live', NULL FROM section s
  RETURNING id, org_id
),
attendance AS (
  INSERT INTO attendance (org_id, session_id, student_user_id, status)
  SELECT cs.org_id, cs.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=cs.org_id AND u.email='student@falcon.edu'), 'present'
  FROM class_session cs
  RETURNING id
),
conversation AS (
  INSERT INTO conversation (org_id, scope_type, scope_id, title, description, is_archived, archived_at, last_message_at, message_count, is_moderated, moderation_settings)
  SELECT s.org_id, 'section', s.id, 'Physics Q&A', 'Help thread', false, NULL, now(), 0, false, '{}' FROM section s
  RETURNING id, org_id
),
conversation_participant AS (
  INSERT INTO conversation_participant (org_id, conversation_id, user_id)
  SELECT c.org_id, c.id, m.user_id FROM conversation c JOIN memberships m ON m.org_id=c.org_id
  WHERE m.user_id IN (
    SELECT user_id FROM memberships mm JOIN app_user u ON u.id=mm.user_id WHERE mm.org_id=c.org_id AND u.email IN ('teacher@falcon.edu','student@falcon.edu')
  )
  RETURNING id
),
message AS (
  INSERT INTO message (org_id, conversation_id, sender_type, sender_user_id, body, lang, edited_at, edit_count, reaction_count, reactions, is_pinned, pinned_at, pinned_by)
  SELECT c.org_id, c.id, 'user', (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=c.org_id AND u.email='student@falcon.edu'), 'What is inertia?', 'en', NULL, 0, 0, '{}', false, NULL, NULL FROM conversation c
  RETURNING id, org_id
),
message_attachment AS (
  INSERT INTO message_attachment (org_id, message_id, asset_id)
  SELECT m.org_id, m.id, a.id FROM message m JOIN assets a ON a.org_id=m.org_id
  RETURNING id
),
vector_space AS (
  INSERT INTO vector_space (org_id, name, purpose, backend, index_name)
  SELECT o.id, 'Falcon Tutor Space', 'tutor', 'pgv', 'falcon_tutor_index' FROM org o
  RETURNING id, org_id
),
embedding_doc AS (
  INSERT INTO embedding_doc (org_id, vector_space_id, source_type, source_id, chunk_id, hash, metadata)
  SELECT vs.org_id, vs.id, 'lesson', (SELECT id FROM lesson l WHERE l.org_id=vs.org_id LIMIT 1), 'chunk-001', 'hash-abc', '{"tags": ["kinematics"]}' FROM vector_space vs
  RETURNING id
),
assessment AS (
  INSERT INTO assessment (org_id, course_id, section_id, type, prompt_seed, policy_json, visibility, generated_by, time_limit_minutes, max_attempts, passing_score, feedback_mode, availability_window, published_at)
  SELECT s.org_id, c.id, s.id, 'quiz', 'Seed prompt', '{"blueprint": {"mcq": 5}}', 'org', 'ai', 30, 2, 70, 'immediate', '{"start": null, "end": null}', now()
  FROM section s JOIN course c ON c.id=s.course_id
  RETURNING id, org_id
),
assessment_item AS (
  INSERT INTO assessment_item (org_id, assessment_id, item_type, stem, options, answer_key, rubric_json, metadata)
  SELECT a.org_id, a.id, 'mcq', 'Force unit is?', '{"choices": ["N","J","W","Pa"]}', '{"correct": "N"}', '{"explain": "SI unit of force is Newton"}', '{}' FROM assessment a
  RETURNING id
),
attempt AS (
  INSERT INTO attempt (org_id, assessment_id, student_user_id, answers_json, ai_score, ai_feedback, explanations, review_status, time_spent_seconds, user_agent, ip_address, device_info, proctoring_events, flagged_reason, reviewed_by, reviewed_at)
  SELECT a.org_id, a.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=a.org_id AND u.email='student@falcon.edu'), '{"q1": "N"}', 95, 'Great job', '{"q1": "Correct"}', 'auto_final', 120, 'Mozilla', '127.0.0.1', '{}', '[]', NULL, NULL, NULL
  FROM assessment a
  RETURNING id, org_id
),
peer_review AS (
  INSERT INTO peer_review (org_id, attempt_id, reviewer_user_id, comments, suggested_adjustment, finalized_at)
  SELECT at.org_id, at.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=at.org_id AND u.email='teacher@falcon.edu'), 'Well explained', 0, now()
  FROM attempt at
  RETURNING id
),
grade AS (
  INSERT INTO grade (org_id, attempt_id, score_raw, percentile, tier, finalized_at)
  SELECT at.org_id, at.id, 95, 98, 'top_5', now() FROM attempt at
  RETURNING id
),
invite AS (
  INSERT INTO invite (org_id, email, role, payload_json, token, expires_at, accepted_at)
  SELECT o.id, 'newstudent@falcon.edu', 'student', '{}', 'token-123', now() + interval '7 days', NULL FROM org o
  RETURNING id
),
announcement AS (
  INSERT INTO announcement (org_id, audience, title, body, publish_at)
  SELECT o.id, 'org', 'Welcome to Falcon', 'New term begins!', now() FROM org o
  RETURNING id
),
notification AS (
  INSERT INTO notification (org_id, user_id, type, payload)
  SELECT o.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=o.id AND u.email='student@falcon.edu'), 'announcement', '{"title": "Welcome"}' FROM org o
  RETURNING id
),
billing_record AS (
  INSERT INTO billing_record (org_id, plan, usage_metrics, amount, currency, status, billing_period_start, billing_period_end, invoice_url, billing_address, tax_amount, discount_amount, payment_method_id, payment_gateway_response, refunded_amount, refunded_at, amount_verification)
  SELECT o.id, 'standard', '{"ai_tokens": 12345}', 199.99, 'USD', 'paid', date_trunc('month', now())::timestamptz, (date_trunc('month', now()) + interval '1 month')::timestamptz, 'https://billing.example.com/invoice/1', '{"line1": "123 Main"}', 0, 0, 'pm_123', '{}', 0, NULL, true FROM org o
  RETURNING id
),
audit_log AS (
  INSERT INTO audit_log (org_id, actor_user_id, action, entity_type, entity_id, diff, ip, ua, correlation_id, session_id, entity_previous_state, entity_new_state, risk_level, compliance_flags)
  SELECT o.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=o.id AND u.email='orgadmin@falcon.edu'), 'create', 'course', (SELECT id FROM course c WHERE c.org_id=o.id LIMIT 1), '{"title": [null, "Physics I"]}', '127.0.0.1'::inet, 'Mozilla', gen_random_uuid(), gen_random_uuid(), NULL, '{"title": "Physics I"}', 'low', '{"gdpr"}'
  FROM org o
  RETURNING id
),
learning_analytics AS (
  INSERT INTO learning_analytics (org_id, user_id, section_id, metric_type, metric_value, recorded_at, context)
  SELECT o.id, (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=o.id AND u.email='student@falcon.edu'), (SELECT id FROM section s WHERE s.org_id=o.id LIMIT 1), 'minutes', 47, now(), '{"modules_viewed": 3}'
  FROM org o
  RETURNING id
),
content_version AS (
  INSERT INTO content_version (org_id, content_type, content_id, version, changes, created_by)
  SELECT o.id, 'lesson', (SELECT id FROM lesson l WHERE l.org_id=o.id LIMIT 1), 1, '{"initial": true}', (SELECT om.user_id FROM org_membership om JOIN app_user u ON u.id=om.user_id WHERE om.org_id=o.id AND u.email='teacher@falcon.edu' LIMIT 1)
  FROM org o
  RETURNING id
),
content_usage AS (
  INSERT INTO content_usage (org_id, content_type, content_id, user_id, action, duration_seconds, engagement_score, metadata)
  SELECT o.id, 'lesson', (SELECT id FROM lesson l WHERE l.org_id=o.id LIMIT 1), (SELECT user_id FROM memberships m JOIN app_user u ON u.id=m.user_id WHERE m.org_id=o.id AND u.email='student@falcon.edu'), 'view', 600, 0.85, '{}'
  FROM org o
  RETURNING id
)
SELECT 1;

COMMIT;