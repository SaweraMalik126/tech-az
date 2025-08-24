-- Large seed data for the enhanced schema
-- Assumes schema.sql has been applied and pgcrypto extension enabled

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Safety: clear existing data for a clean reseed (order matters due to FKs)
-- Comment these deletes if you want to append instead of replace
TRUNCATE TABLE
  content_usage,
  learning_analytics,
  content_version,
  audit_log,
  billing_record,
  notification,
  announcement,
  invite,
  grade,
  peer_review,
  attempt,
  assessment_item,
  assessment,
  embedding_doc,
  vector_space,
  message_attachment,
  message,
  conversation_participant,
  conversation,
  attendance,
  class_session,
  lesson_asset,
  lesson,
  module,
  asset,
  enrollment,
  teacher_assignment,
  section,
  course,
  school_class,
  class_level,
  term,
  parent_link,
  role_binding,
  org_membership,
  user_profile,
  app_user,
  organization
RESTART IDENTITY CASCADE;

-- Parameters
DO $$
DECLARE
  org_count integer := 5;
  users_per_org integer := 60; -- includes teachers, students, parents, admins
  classes_per_org integer := 6;
  terms_per_org integer := 2;
  courses_per_org integer := 12;
  sections_per_course integer := 3;
  modules_per_section integer := 5;
  lessons_per_module integer := 4;
  assets_per_org integer := 80;
  sessions_per_section integer := 6;
  assessments_per_course integer := 3;
  items_per_assessment integer := 6;
  vector_spaces_per_org integer := 2;
  embeddings_per_space integer := 40;

  org_idx integer;
  term_idx integer;
  i integer;
  j integer;
  k integer;

  v_org_id uuid;
  v_user_id uuid;
  v_admin_id uuid;
  v_teacher_id uuid;
  v_student_id uuid;
  v_parent_id uuid;
  v_term_id uuid;
  v_class_level_id uuid;
  v_class_id uuid;
  v_course_id uuid;
  v_section_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
  v_asset_id uuid;
  v_conv_id uuid;
  v_msg_id uuid;
  v_assessment_id uuid;
  v_attempt_id uuid;
  v_grade_id uuid;
  v_space_id uuid;
BEGIN

  -- Create organizations
  FOR org_idx IN 1..org_count LOOP
    INSERT INTO organization (name, slug, plan, settings, address, timezone, locale)
    VALUES (
      format('Acme Academy %s', org_idx),
      format('acme-%s', org_idx),
      CASE WHEN org_idx % 3 = 0 THEN 'enterprise' WHEN org_idx % 2 = 0 THEN 'standard' ELSE 'free' END::plan_tier,
      jsonb_build_object('ai_enabled', (org_idx % 2 = 0), 'max_storage_gb', 50 + org_idx),
      jsonb_build_object('city','Metropolis','country','US'),
      'UTC',
      'en-US'
    ) RETURNING id INTO v_org_id;

    -- Create term(s)
    FOR term_idx IN 1..terms_per_org LOOP
      INSERT INTO term (org_id, name, start_date, end_date, is_current)
      VALUES (
        v_org_id,
        format('Term %s', term_idx),
        (now()::date - (term_idx*120))::date,
        (now()::date - (term_idx*120) + 100)::date,
        term_idx = 1
      ) RETURNING id INTO v_term_id;
    END LOOP;

    -- Create class levels
    FOR i IN 1..classes_per_org LOOP
      INSERT INTO class_level (org_id, name, category)
      VALUES (
        v_org_id,
        format('Level %s', i),
        CASE
          WHEN i <= 2 THEN 'primary'
          WHEN i <= 4 THEN 'secondary'
          ELSE 'college'
        END::classlevel_category
      ) RETURNING id INTO v_class_level_id;

      -- Create classes under each level
      INSERT INTO school_class (org_id, class_level_id, name, description)
      VALUES (v_org_id, v_class_level_id, format('Class %sA', i), 'Homeroom A') RETURNING id INTO v_class_id;

      -- Create courses in first term
      FOR j IN 1..(courses_per_org / classes_per_org) LOOP
        INSERT INTO course (
          org_id, class_id, term_id, code, title, description,
          language_defaults, subject_tags, credit_hours, learning_objectives,
          difficulty_level, is_featured
        )
        SELECT v_org_id, v_class_id, t.id,
               format('C%02s-%02s', i, j),
               format('Course %s-%s', i, j),
               'Auto generated course',
               ARRAY['en','es'],
               ARRAY[(ARRAY['math','science','language'])[(1 + (i + j) % 3)]],
               3.0,
               ARRAY['Understand basics','Apply concepts'],
               CASE WHEN (i + j) % 5 = 0 THEN 'advanced'
                    WHEN (i + j) % 3 = 0 THEN 'intermediate'
                    ELSE 'easy' END::difficulty_level,
               (i + j) % 4 = 0
        FROM term t
        WHERE t.org_id = v_org_id
        ORDER BY is_current DESC, start_date ASC
        LIMIT 1
        RETURNING id INTO v_course_id;

        -- Sections per course
        FOR k IN 1..sections_per_course LOOP
          INSERT INTO section (org_id, course_id, term_id, name, schedule, capacity, difficulty_level)
          SELECT v_org_id, v_course_id, t.id, format('Section %s', k),
                 jsonb_build_object('days', ARRAY['Mon','Wed','Fri'], 'time', '10:00'),
                 30 + k,
                 'easy'::difficulty_level
          FROM term t
          WHERE t.org_id = v_org_id
          ORDER BY is_current DESC, start_date ASC
          LIMIT 1
          RETURNING id INTO v_section_id;

          -- Modules per section
          FOR i IN 1..modules_per_section LOOP
            INSERT INTO module (org_id, section_id, title, sort_order)
            VALUES (v_org_id, v_section_id, format('Module %s', i), i)
            RETURNING id INTO v_module_id;

            -- Lessons per module
            FOR j IN 1..lessons_per_module LOOP
              INSERT INTO lesson (org_id, module_id, title, content_rich, whiteboard_json, objectives, duration_minutes, difficulty_level, is_published)
              VALUES (
                v_org_id,
                v_module_id,
                format('Lesson %s.%s', i, j),
                'Rich text content for lesson',
                jsonb_build_object('shapes', jsonb_build_array()),
                ARRAY['Goal A','Goal B'],
                30 + j,
                'beginner',
                j % 2 = 0
              ) RETURNING id INTO v_lesson_id;
            END LOOP;
          END LOOP;

          -- Sessions per section
          FOR i IN 1..sessions_per_section LOOP
            INSERT INTO class_session (org_id, section_id, start_at, end_at, mode)
            VALUES (v_org_id, v_section_id, now() - (i||' days')::interval, now() - (i||' days')::interval + interval '1 hour',
                    CASE WHEN i % 2 = 0 THEN 'live' ELSE 'async' END::session_mode);
          END LOOP;
        END LOOP;
      END FOR;
    END LOOP;

    -- Users for org: create admins, teachers, students, parents
    -- First create a super admin per org
    INSERT INTO app_user (email, name, status, auth_provider)
    VALUES (format('admin+%s@acme.test', org_idx), format('Admin %s', org_idx), 'active', 'password')
    RETURNING id INTO v_admin_id;
    INSERT INTO org_membership (org_id, user_id, role, status)
    VALUES (v_org_id, v_admin_id, 'org_admin', 'active');

    -- Teachers (10)
    FOR i IN 1..10 LOOP
      INSERT INTO app_user (email, name, status, auth_provider)
      VALUES (format('teacher%02s+%s@acme.test', i, org_idx), format('Teacher %s-%s', org_idx, i), 'active', 'password')
      RETURNING id INTO v_teacher_id;
      INSERT INTO org_membership (org_id, user_id, role, status)
      VALUES (v_org_id, v_teacher_id, 'teacher', 'active');
    END LOOP;

    -- Students (40)
    FOR i IN 1..40 LOOP
      INSERT INTO app_user (email, name, status, auth_provider)
      VALUES (format('student%02s+%s@acme.test', i, org_idx), format('Student %s-%s', org_idx, i), 'active', 'password')
      RETURNING id INTO v_student_id;
      INSERT INTO org_membership (org_id, user_id, role, status)
      VALUES (v_org_id, v_student_id, 'student', 'active');
    END LOOP;

    -- Parents (10) with parent links to students
    FOR i IN 1..10 LOOP
      INSERT INTO app_user (email, name, status, auth_provider)
      VALUES (format('parent%02s+%s@acme.test', i, org_idx), format('Parent %s-%s', org_idx, i), 'active', 'password')
      RETURNING id INTO v_parent_id;
      INSERT INTO org_membership (org_id, user_id, role, status)
      VALUES (v_org_id, v_parent_id, 'parent', 'active');

      -- Link parent to 2 students
      INSERT INTO parent_link (org_id, parent_user_id, student_user_id, relationship, verified_at)
      SELECT v_org_id, v_parent_id, om.user_id, 'guardian', now()
      FROM org_membership om
      WHERE om.org_id = v_org_id AND om.role = 'student'
      ORDER BY om.user_id
      LIMIT 2;
    END LOOP;

    -- Assign teachers to sections
    FOR v_section_id IN SELECT id FROM section WHERE org_id = v_org_id LOOP
      SELECT user_id INTO v_teacher_id FROM org_membership
      WHERE org_id = v_org_id AND role = 'teacher'
      ORDER BY random() LIMIT 1;
      INSERT INTO teacher_assignment (org_id, section_id, teacher_user_id, role)
      VALUES (v_org_id, v_section_id, v_teacher_id, 'primary')
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Enroll students to sections
    FOR v_section_id IN SELECT id FROM section WHERE org_id = v_org_id LOOP
      FOR v_student_id IN SELECT user_id FROM org_membership WHERE org_id = v_org_id AND role = 'student' ORDER BY random() LIMIT 15 LOOP
        INSERT INTO enrollment (org_id, section_id, student_user_id, status)
        VALUES (v_org_id, v_section_id, v_student_id, 'active')
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

    -- Assets
    FOR i IN 1..assets_per_org LOOP
      SELECT user_id INTO v_user_id FROM org_membership WHERE org_id = v_org_id ORDER BY random() LIMIT 1;
      INSERT INTO asset (org_id, owner_user_id, kind, url, mime, size, visibility, metadata, is_latest_version)
      VALUES (v_org_id, v_user_id, 'file', format('https://files.example.com/%s/%s', v_org_id, i), 'application/pdf', 100000 + i*10,
              CASE WHEN i % 5 = 0 THEN 'public' WHEN i % 3 = 0 THEN 'section' ELSE 'org' END::visibility_scope,
              jsonb_build_object('topic','auto','idx', i), true)
      RETURNING id INTO v_asset_id;
    END LOOP;

    -- Conversations and messages
    FOR i IN 1..5 LOOP
      INSERT INTO conversation (org_id, scope_type, title, description)
      VALUES (v_org_id, 'group', format('General %s', i), 'Auto conversation')
      RETURNING id INTO v_conv_id;

      -- participants
      FOR v_user_id IN SELECT user_id FROM org_membership WHERE org_id = v_org_id ORDER BY random() LIMIT 8 LOOP
        INSERT INTO conversation_participant (org_id, conversation_id, user_id)
        VALUES (v_org_id, v_conv_id, v_user_id) ON CONFLICT DO NOTHING;
      END LOOP;

      -- messages
      FOR j IN 1..20 LOOP
        SELECT user_id INTO v_user_id FROM conversation_participant WHERE org_id = v_org_id AND conversation_id = v_conv_id ORDER BY random() LIMIT 1;
        INSERT INTO message (org_id, conversation_id, sender_type, sender_user_id, body, lang)
        VALUES (v_org_id, v_conv_id, 'user', v_user_id, format('Message %s in conv %s', j, i), 'en');
      END LOOP;
    END LOOP;

    -- Vector spaces and embeddings
    FOR i IN 1..vector_spaces_per_org LOOP
      INSERT INTO vector_space (org_id, name, purpose, backend, index_name)
      VALUES (v_org_id, format('VS %s', i), 'tutor', 'pgv', format('vs_%s_%s', org_idx, i))
      RETURNING id INTO v_space_id;

      FOR j IN 1..embeddings_per_space LOOP
        INSERT INTO embedding_doc (org_id, vector_space_id, source_type, source_id, chunk_id, hash, metadata)
        VALUES (v_org_id, v_space_id, 'lesson', (SELECT id FROM lesson WHERE org_id = v_org_id ORDER BY random() LIMIT 1),
                format('chunk-%s', j), encode(digest(format('seed-%s-%s', i, j), 'sha256'), 'hex'), jsonb_build_object('len', 512));
      END LOOP;
    END LOOP;

    -- Assessments, items, attempts, grades
    FOR v_course_id IN SELECT id FROM course WHERE org_id = v_org_id LOOP
      FOR i IN 1..assessments_per_course LOOP
        INSERT INTO assessment (org_id, course_id, type, policy_json, visibility, generated_by, time_limit_minutes, max_attempts, passing_score, feedback_mode)
        VALUES (v_org_id, v_course_id, 'quiz', jsonb_build_object('shuffle', true), 'org', 'ai', 30, 1, 70, 'immediate')
        RETURNING id INTO v_assessment_id;

        FOR j IN 1..items_per_assessment LOOP
          INSERT INTO assessment_item (org_id, assessment_id, item_type, stem, options, answer_key, rubric_json)
          VALUES (
            v_org_id, v_assessment_id, 'mcq', format('What is %s + %s?', j, j),
            jsonb_build_array('1','2','3','4'), jsonb_build_object('answer','2'), jsonb_build_object('points', 1)
          );
        END LOOP;

        -- Create attempts for 10 random students
        FOR v_student_id IN SELECT user_id FROM org_membership WHERE org_id = v_org_id AND role = 'student' ORDER BY random() LIMIT 10 LOOP
          INSERT INTO attempt (org_id, assessment_id, student_user_id, answers_json, ai_score, review_status, time_spent_seconds)
          VALUES (v_org_id, v_assessment_id, v_student_id, jsonb_build_object('q1','2'), 60 + (random()*40)::int, 'auto_final', 1200)
          RETURNING id INTO v_attempt_id;

          INSERT INTO grade (org_id, attempt_id, score_raw, percentile, tier, finalized_at)
          VALUES (v_org_id, v_attempt_id, 60 + (random()*40)::int, 50 + (random()*50)::int,
                  (ARRAY['normal','top_20','top_10','below','fail'])[1 + (random()*4)::int]::grade_tier, now());
        END LOOP;
      END LOOP;
    END LOOP;

    -- Learning analytics and content usage
    FOR i IN 1..200 LOOP
      SELECT user_id INTO v_user_id FROM org_membership WHERE org_id = v_org_id ORDER BY random() LIMIT 1;
      INSERT INTO learning_analytics (org_id, user_id, section_id, metric_type, metric_value, context)
      VALUES (v_org_id, v_user_id, (SELECT id FROM section WHERE org_id = v_org_id ORDER BY random() LIMIT 1),
              (ARRAY['time_spent','problems_solved','videos_watched'])[1 + (random()*2)::int],
              1 + (random()*100)::int,
              jsonb_build_object('source','seed'))
      ON CONFLICT DO NOTHING;
    END LOOP;

    FOR i IN 1..200 LOOP
      INSERT INTO content_usage (org_id, content_type, content_id, user_id, action, duration_seconds, engagement_score, metadata)
      VALUES (
        v_org_id,
        (ARRAY['lesson','asset'])[1 + (random()*1)::int],
        COALESCE((SELECT id FROM lesson WHERE org_id = v_org_id ORDER BY random() LIMIT 1), (SELECT id FROM asset WHERE org_id = v_org_id ORDER BY random() LIMIT 1)),
        (SELECT user_id FROM org_membership WHERE org_id = v_org_id ORDER BY random() LIMIT 1),
        (ARRAY['view','edit','download','share','complete'])[1 + (random()*4)::int],
        30 + (random()*600)::int,
        0.1 + random()*0.9,
        jsonb_build_object('via','seed')
      );
    END LOOP;

    -- Notifications and announcements
    INSERT INTO announcement (org_id, audience, title, body)
    VALUES (v_org_id, 'org', 'Welcome to the new term', 'Good luck to everyone!');

    FOR i IN 1..50 LOOP
      INSERT INTO notification (org_id, user_id, type, payload)
      VALUES (v_org_id,
              (SELECT user_id FROM org_membership WHERE org_id = v_org_id ORDER BY random() LIMIT 1),
              (ARRAY['info','warning','assignment','grade'])[1 + (random()*3)::int],
              jsonb_build_object('msg', 'Auto notification'));
    END LOOP;

    -- Billing and audit logs
    INSERT INTO billing_record (org_id, plan, usage_metrics, amount, currency, status, billing_period_start, billing_period_end)
    VALUES (v_org_id, 'standard', jsonb_build_object('storage_gb', 10, 'messages', 1000), 199.00, 'USD', 'paid', now()-interval '30 days', now());

    FOR i IN 1..30 LOOP
      INSERT INTO audit_log (org_id, actor_user_id, action, entity_type, entity_id, diff, ip, ua, risk_level, created_at)
      VALUES (v_org_id,
              (SELECT user_id FROM org_membership WHERE org_id = v_org_id ORDER BY random() LIMIT 1),
              'update', 'lesson', (SELECT id FROM lesson WHERE org_id = v_org_id ORDER BY random() LIMIT 1),
              jsonb_build_object('field','title','from','Old','to','New'),
              '127.0.0.1', 'seed-agent', 'low', now() - (i||' hours')::interval);
    END LOOP;

  END LOOP; -- org loop

END $$;

COMMIT;

ANALYZE;