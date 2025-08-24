-- Helper: UUID generator (no extensions)
CREATE OR REPLACE FUNCTION rand_uuid() RETURNS uuid AS $$
SELECT (
  substr(m,1,8) || '-' || substr(m,9,4) || '-' || substr(m,13,4) || '-' || substr(m,17,4) || '-' || substr(m,21,12)
)::uuid
FROM (SELECT md5(random()::text || clock_timestamp()::text) AS m) s;
$$ LANGUAGE SQL VOLATILE;

-- Ensure all tables autogenerate IDs
ALTER TABLE IF EXISTS organization                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS app_user                      ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS user_profile                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS org_membership                ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS role_binding                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS parent_link                   ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS term                          ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS class_level                   ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS school_class                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS course                        ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS section                       ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS teacher_assignment            ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS enrollment                    ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS asset                         ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS module                        ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS lesson                        ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS lesson_asset                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS class_session                 ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS attendance                    ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS conversation                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS conversation_participant      ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS message                       ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS message_attachment            ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS vector_space                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS embedding_doc                 ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS assessment                    ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS assessment_item               ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS attempt                       ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS peer_review                   ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS grade                         ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS invite                        ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS announcement                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS notification                  ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS billing_record                ALTER COLUMN id SET DEFAULT rand_uuid();
ALTER TABLE IF EXISTS audit_log                     ALTER COLUMN id SET DEFAULT rand_uuid();

BEGIN;

-- Temp staging (for cross-references)
CREATE TEMP TABLE tmp_orgs (org_id uuid, slug text) ON COMMIT DROP;
CREATE TEMP TABLE tmp_teachers (org_id uuid, user_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_students (org_id uuid, user_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_parents  (org_id uuid, user_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_terms (org_id uuid, term_id uuid, name text) ON COMMIT DROP;
CREATE TEMP TABLE tmp_class_levels (org_id uuid, class_level_id uuid, name text, category classlevel_category) ON COMMIT DROP;
CREATE TEMP TABLE tmp_classes (org_id uuid, class_id uuid, name text, class_level_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_courses (org_id uuid, course_id uuid, class_id uuid, title text, term_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_sections (org_id uuid, section_id uuid, course_id uuid, term_id uuid, name text) ON COMMIT DROP;
CREATE TEMP TABLE tmp_assets (org_id uuid, asset_id uuid, owner_user_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_lessons (org_id uuid, lesson_id uuid, module_id uuid) ON COMMIT DROP;
CREATE TEMP TABLE tmp_assessments (org_id uuid, assessment_id uuid, course_id uuid) ON COMMIT DROP;

DO $seed$
DECLARE
  -- org loop
  r_org RECORD;

  -- common vars
  i int;
  u_id uuid;
  v_email text;

  -- terms
  r_term RECORD;

  -- levels/classes
  r_lvl RECORD;
  nm text;

  -- courses/sections
  r_class RECORD;
  r_crs RECORD;
  r_sec RECORD;
  t_id uuid; -- teacher id

  -- assets/modules/lessons
  r_t RECORD;
  m1 uuid;
  m2 uuid;
  l_id uuid;
  a_id uuid;

  -- enrollments
  r_stu RECORD;

  -- sessions/attendance
  sess uuid;
  r_enr RECORD;
  st attendance_status;

  -- conversations
  c_id2 uuid;
  t_user uuid;
  s_user uuid;
  m_id uuid;
  att_asset uuid;

  -- vectors/docs
  vs1 uuid;
  vs2 uuid;

  -- assessments
  a_id2 uuid;

  -- attempts/grades
  r_ass RECORD;
  atry uuid;
  reviewer uuid;
  score numeric;
BEGIN
  -- Organizations
  INSERT INTO organization (name, slug, plan, settings)
  VALUES
    ('Falcon Academy', 'falcon', 'standard', '{}'::jsonb),
    ('Orion Institute', 'orion', 'enterprise', '{}'::jsonb),
    ('Nova School', 'nova', 'free', '{}'::jsonb)
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO tmp_orgs
  SELECT id, slug FROM organization WHERE slug IN ('falcon','orion','nova');

  -- Users
  FOR r_org IN SELECT * FROM tmp_orgs LOOP
    -- Admin
    v_email := 'admin+'||r_org.slug||'@seed.local';
    INSERT INTO app_user (email, name, status, auth_provider)
    VALUES (v_email, initcap(r_org.slug)||' Admin', 'active', 'password')
    ON CONFLICT DO NOTHING;
    SELECT id INTO u_id FROM app_user WHERE lower(email)=lower(v_email);
    INSERT INTO user_profile (user_id, institute_name, prefs)
    VALUES (u_id, initcap(r_org.slug), '{"notifications":true}'::jsonb)
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO org_membership (org_id, user_id, role, status)
    VALUES (r_org.org_id, u_id, 'org_admin', 'active')
    ON CONFLICT (org_id, user_id) DO NOTHING;

    -- Teachers (5)
    FOR i IN 1..5 LOOP
      v_email := 'teacher'||lpad(i::text,2,'0')||'+'||r_org.slug||'@seed.local';
      INSERT INTO app_user (email, name, status, auth_provider)
      VALUES (v_email, 'Teacher '||i||' '||initcap(r_org.slug), 'active', 'password')
      ON CONFLICT DO NOTHING;
      SELECT id INTO u_id FROM app_user WHERE lower(email)=lower(v_email);
      INSERT INTO user_profile (user_id, institute_name)
      VALUES (u_id, initcap(r_org.slug))
      ON CONFLICT (user_id) DO NOTHING;
      INSERT INTO org_membership (org_id, user_id, role, status)
      VALUES (r_org.org_id, u_id, 'teacher', 'active')
      ON CONFLICT (org_id, user_id) DO NOTHING;
      INSERT INTO tmp_teachers VALUES (r_org.org_id, u_id);
    END LOOP;

    -- Students (40)
    FOR i IN 1..40 LOOP
      v_email := 'student'||lpad(i::text,3,'0')||'+'||r_org.slug||'@seed.local';
      INSERT INTO app_user (email, name, status, auth_provider)
      VALUES (v_email, 'Student '||i||' '||initcap(r_org.slug), 'active', 'password')
      ON CONFLICT DO NOTHING;
      SELECT id INTO u_id FROM app_user WHERE lower(email)=lower(v_email);
      INSERT INTO user_profile (user_id, institute_name, prefs)
      VALUES (u_id, initcap(r_org.slug), '{"languages":["en"]}'::jsonb)
      ON CONFLICT (user_id) DO NOTHING;
      INSERT INTO org_membership (org_id, user_id, role, status)
      VALUES (r_org.org_id, u_id, 'student', 'active')
      ON CONFLICT (org_id, user_id) DO NOTHING;
      INSERT INTO tmp_students VALUES (r_org.org_id, u_id);
    END LOOP;

    -- Parents (12)
    FOR i IN 1..12 LOOP
      v_email := 'parent'||lpad(i::text,2,'0')||'+'||r_org.slug||'@seed.local';
      INSERT INTO app_user (email, name, status, auth_provider)
      VALUES (v_email, 'Parent '||i||' '||initcap(r_org.slug), 'active', 'password')
      ON CONFLICT DO NOTHING;
      SELECT id INTO u_id FROM app_user WHERE lower(email)=lower(v_email);
      INSERT INTO user_profile (user_id, institute_name)
      VALUES (u_id, initcap(r_org.slug))
      ON CONFLICT (user_id) DO NOTHING;
      INSERT INTO org_membership (org_id, user_id, role, status)
      VALUES (r_org.org_id, u_id, 'parent', 'active')
      ON CONFLICT (org_id, user_id) DO NOTHING;
      INSERT INTO tmp_parents VALUES (r_org.org_id, u_id);
    END LOOP;
  END LOOP;

  -- Parent links
  FOR r_org IN SELECT DISTINCT org_id FROM tmp_parents LOOP
    FOR u_id IN SELECT user_id FROM tmp_parents WHERE org_id = r_org.org_id LOOP
      INSERT INTO parent_link (org_id, parent_user_id, student_user_id, relationship, verified_at)
      SELECT r_org.org_id, u_id, s.user_id, 'guardian', now()
      FROM (SELECT user_id FROM tmp_students WHERE org_id = r_org.org_id ORDER BY user_id LIMIT 3) s
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Terms
  FOR r_org IN SELECT * FROM tmp_orgs LOOP
    INSERT INTO term (org_id, name, start_date, end_date)
    VALUES
      (r_org.org_id, '2024-2025', '2024-08-15', '2025-06-15'),
      (r_org.org_id, '2025-2026', '2025-08-15', '2026-06-15')
    ON CONFLICT DO NOTHING;

    INSERT INTO tmp_terms
    SELECT org_id, id, name FROM term WHERE org_id = r_org.org_id AND name IN ('2024-2025','2025-2026');
  END LOOP;

  -- Class levels
  FOR r_org IN SELECT * FROM tmp_orgs LOOP
    INSERT INTO class_level (org_id, name, category)
    VALUES
      (r_org.org_id, 'Primary', 'primary'),
      (r_org.org_id, 'Secondary', 'secondary'),
      (r_org.org_id, 'Bachelors', 'bachelors')
    ON CONFLICT DO NOTHING;

    INSERT INTO tmp_class_levels
    SELECT org_id, id, name, category FROM class_level WHERE org_id = r_org.org_id;
  END LOOP;

  -- Classes
  FOR r_org IN SELECT DISTINCT org_id FROM tmp_class_levels LOOP
    FOR r_lvl IN SELECT * FROM tmp_class_levels WHERE org_id = r_org.org_id LOOP
      IF r_lvl.name = 'Primary' THEN
        FOREACH nm IN ARRAY ARRAY['Grade 1','Grade 2','Grade 3'] LOOP
          INSERT INTO school_class (org_id, class_level_id, name, description)
          VALUES (r_org.org_id, r_lvl.class_level_id, nm, 'Primary class '||nm)
          ON CONFLICT DO NOTHING;
        END LOOP;
      ELSIF r_lvl.name = 'Secondary' THEN
        FOREACH nm IN ARRAY ARRAY['Grade 9','Grade 10'] LOOP
          INSERT INTO school_class (org_id, class_level_id, name)
          VALUES (r_org.org_id, r_lvl.class_level_id, nm)
          ON CONFLICT DO NOTHING;
        END LOOP;
      ELSE
        FOREACH nm IN ARRAY ARRAY['BSCS-Y1','BSCS-Y2'] LOOP
          INSERT INTO school_class (org_id, class_level_id, name)
          VALUES (r_org.org_id, r_lvl.class_level_id, nm)
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;

    INSERT INTO tmp_classes
    SELECT org_id, id, name, class_level_id FROM school_class WHERE org_id = r_org.org_id;
  END LOOP;

  -- Courses
  FOR r_org IN SELECT DISTINCT org_id FROM tmp_classes LOOP
    SELECT term_id, name INTO r_term FROM tmp_terms WHERE org_id = r_org.org_id ORDER BY name LIMIT 1;

    FOR r_class IN SELECT * FROM tmp_classes WHERE org_id = r_org.org_id LOOP
      INSERT INTO course (org_id, class_id, term_id, code, title, description, language_defaults, subject_tags)
      VALUES (r_org.org_id, r_class.class_id, r_term.term_id, 'MTH'||substr(r_class.name,1,1), 'Mathematics', 'Core math', ARRAY['en']::text[], ARRAY['math']::text[])
      ON CONFLICT DO NOTHING;

      INSERT INTO course (org_id, class_id, term_id, code, title, description, language_defaults, subject_tags)
      VALUES (r_org.org_id, r_class.class_id, r_term.term_id, 'SCI'||substr(r_class.name,1,1), 'Science', 'Core science', ARRAY['en']::text[], ARRAY['science']::text[])
      ON CONFLICT DO NOTHING;
    END LOOP;

    INSERT INTO tmp_courses
    SELECT org_id, id, class_id, title, term_id FROM course WHERE org_id = r_org.org_id;
  END LOOP;

  -- Sections
  FOR r_crs IN SELECT * FROM tmp_courses LOOP
    INSERT INTO section (org_id, course_id, term_id, name, schedule, capacity)
    VALUES (r_crs.org_id, r_crs.course_id, r_crs.term_id, 'A', '{"days":["Mon","Wed"],"start":"09:00","end":"10:00"}'::jsonb, 40)
    ON CONFLICT DO NOTHING;

    INSERT INTO section (org_id, course_id, term_id, name, schedule, capacity)
    VALUES (r_crs.org_id, r_crs.course_id, r_crs.term_id, 'B', '{"days":["Tue","Thu"],"start":"11:00","end":"12:00"}'::jsonb, 40)
    ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO tmp_sections
  SELECT org_id, id, course_id, term_id, name FROM section;

  -- Teacher assignments
  FOR r_sec IN SELECT * FROM tmp_sections ORDER BY org_id, course_id, name LOOP
    SELECT user_id INTO t_id FROM tmp_teachers WHERE org_id = r_sec.org_id ORDER BY random() LIMIT 1;
    IF t_id IS NOT NULL THEN
      INSERT INTO teacher_assignment (org_id, section_id, teacher_user_id, role)
      VALUES (r_sec.org_id, r_sec.section_id, t_id, 'primary'::teacher_role)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Enrollments
  FOR r_sec IN SELECT * FROM tmp_sections LOOP
    i := 0;
    FOR r_stu IN SELECT user_id FROM tmp_students WHERE org_id = r_sec.org_id ORDER BY user_id LOOP
      EXIT WHEN i >= 12;
      INSERT INTO enrollment (org_id, section_id, student_user_id, status, enrolled_at)
      VALUES (r_sec.org_id, r_sec.section_id, r_stu.user_id, 'active', now())
      ON CONFLICT DO NOTHING;
      i := i + 1;
    END LOOP;
  END LOOP;

  -- Assets (2 per teacher)
  FOR r_t IN SELECT * FROM tmp_teachers LOOP
    INSERT INTO asset (org_id, owner_user_id, kind, url, mime, size, visibility, metadata)
    VALUES (r_t.org_id, r_t.user_id, 'file', 'https://cdn.local/files/'||rand_uuid(), 'application/pdf', 102400, 'org'::visibility_scope, '{"title":"Syllabus"}'::jsonb)
    ON CONFLICT DO NOTHING;

    INSERT INTO asset (org_id, owner_user_id, kind, url, mime, size, visibility, metadata)
    VALUES (r_t.org_id, r_t.user_id, 'video', 'https://cdn.local/videos/'||rand_uuid(), 'video/mp4', 20480000, 'section'::visibility_scope, '{"title":"Intro Lecture"}'::jsonb)
    ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO tmp_assets
  SELECT org_id, id, owner_user_id FROM asset;

  -- Modules, lessons, lesson assets
  FOR r_sec IN SELECT * FROM tmp_sections LOOP
    -- Module 1
    INSERT INTO module (org_id, section_id, title, sort_order)
    VALUES (r_sec.org_id, r_sec.section_id, 'Module 1', 1)
    ON CONFLICT DO NOTHING
    RETURNING id INTO m1;
    IF m1 IS NULL THEN
      SELECT id INTO m1 FROM module WHERE org_id=r_sec.org_id AND section_id=r_sec.section_id AND sort_order=1;
    END IF;

    -- Module 2
    INSERT INTO module (org_id, section_id, title, sort_order)
    VALUES (r_sec.org_id, r_sec.section_id, 'Module 2', 2)
    ON CONFLICT DO NOTHING
    RETURNING id INTO m2;
    IF m2 IS NULL THEN
      SELECT id INTO m2 FROM module WHERE org_id=r_sec.org_id AND section_id=r_sec.section_id AND sort_order=2;
    END IF;

    -- Lessons (include section_id to satisfy NOT NULL in your schema)
    INSERT INTO lesson (org_id, module_id, section_id, title, content_rich) VALUES (r_sec.org_id, m1, r_sec.section_id, 'Lesson 1.1', 'Intro content') ON CONFLICT DO NOTHING;
    INSERT INTO lesson (org_id, module_id, section_id, title, content_rich) VALUES (r_sec.org_id, m1, r_sec.section_id, 'Lesson 1.2', 'More content') ON CONFLICT DO NOTHING;
    INSERT INTO lesson (org_id, module_id, section_id, title, content_rich) VALUES (r_sec.org_id, m2, r_sec.section_id, 'Lesson 2.1', 'Advanced content') ON CONFLICT DO NOTHING;
    INSERT INTO lesson (org_id, module_id, section_id, title, content_rich) VALUES (r_sec.org_id, m2, r_sec.section_id, 'Lesson 2.2', 'Wrap-up') ON CONFLICT DO NOTHING;

    INSERT INTO tmp_lessons
    SELECT r_sec.org_id, id, module_id FROM lesson WHERE org_id=r_sec.org_id AND module_id IN (m1,m2);

    -- Link a random asset to one lesson
    SELECT asset_id INTO a_id FROM tmp_assets WHERE org_id = r_sec.org_id ORDER BY random() LIMIT 1;
    IF a_id IS NOT NULL THEN
      SELECT id INTO l_id FROM lesson WHERE org_id=r_sec.org_id AND module_id IN (m1,m2) ORDER BY id LIMIT 1;
      IF l_id IS NOT NULL THEN
        INSERT INTO lesson_asset (org_id, lesson_id, asset_id, sort_order)
        VALUES (r_sec.org_id, l_id, a_id, 1)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  -- Sessions and attendance
  FOR r_sec IN SELECT * FROM tmp_sections LOOP
    FOR i IN 0..1 LOOP
      INSERT INTO class_session (org_id, section_id, start_at, end_at, mode)
      VALUES (r_sec.org_id, r_sec.section_id, now() + (i||' day')::interval, now() + (i||' day')::interval + interval '1 hour', 'live'::session_mode)
      ON CONFLICT DO NOTHING
      RETURNING id INTO sess;
      IF sess IS NULL THEN
        SELECT id INTO sess FROM class_session WHERE org_id=r_sec.org_id AND section_id=r_sec.section_id ORDER BY start_at DESC LIMIT 1;
      END IF;

      FOR r_enr IN SELECT student_user_id FROM enrollment WHERE org_id = r_sec.org_id AND section_id = r_sec.section_id LOOP
        st := CASE WHEN random() < 0.9 THEN 'present'::attendance_status ELSE 'absent'::attendance_status END;
        INSERT INTO attendance (org_id, session_id, student_user_id, status)
        VALUES (r_sec.org_id, sess, r_enr.student_user_id, st)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;

  -- Conversations & messages
  FOR r_sec IN SELECT * FROM tmp_sections LOOP
    INSERT INTO conversation (org_id, scope_type, scope_id)
    VALUES (r_sec.org_id, 'section', r_sec.section_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO c_id2;
    IF c_id2 IS NULL THEN
      SELECT id INTO c_id2 FROM conversation WHERE org_id=r_sec.org_id AND scope_type='section' AND scope_id=r_sec.section_id;
    END IF;

    SELECT user_id INTO t_user FROM tmp_teachers WHERE org_id = r_sec.org_id ORDER BY random() LIMIT 1;
    IF t_user IS NOT NULL THEN
      INSERT INTO conversation_participant (org_id, conversation_id, user_id, joined_at)
      VALUES (r_sec.org_id, c_id2, t_user, now())
      ON CONFLICT DO NOTHING;
    END IF;

    FOR s_user IN SELECT user_id FROM tmp_students WHERE org_id = r_sec.org_id ORDER BY random() LIMIT 3 LOOP
      INSERT INTO conversation_participant (org_id, conversation_id, user_id, joined_at)
      VALUES (r_sec.org_id, c_id2, s_user, now())
      ON CONFLICT DO NOTHING;
    END LOOP;

    IF t_user IS NOT NULL THEN
      INSERT INTO message (org_id, conversation_id, sender_type, sender_user_id, body, lang)
      VALUES (r_sec.org_id, c_id2, 'user', t_user, 'Welcome to the section chat!', 'en')
      ON CONFLICT DO NOTHING
      RETURNING id INTO m_id;

      SELECT asset_id INTO att_asset FROM tmp_assets WHERE org_id = r_sec.org_id ORDER BY random() LIMIT 1;
      IF att_asset IS NOT NULL AND m_id IS NOT NULL THEN
        INSERT INTO message_attachment (org_id, message_id, asset_id)
        VALUES (r_sec.org_id, m_id, att_asset)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

    INSERT INTO message (org_id, conversation_id, sender_type, sender_user_id, body, lang)
    VALUES (r_sec.org_id, c_id2, 'ai', NULL, 'How can I help with today''s topic?', 'en')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Vector spaces and docs
  FOR r_org IN SELECT * FROM tmp_orgs LOOP
    -- Tutor space
    vs1 := NULL;
    INSERT INTO vector_space (org_id, name, purpose, backend, index_name)
    VALUES (r_org.org_id, 'Tutor Space', 'tutor', 'pgv', r_org.slug||'_tutor')
    ON CONFLICT DO NOTHING
    RETURNING id INTO vs1;
    IF vs1 IS NULL THEN
      SELECT id INTO vs1 FROM vector_space WHERE org_id=r_org.org_id AND name='Tutor Space';
    END IF;

    -- Content space
    vs2 := NULL;
    INSERT INTO vector_space (org_id, name, purpose, backend, index_name)
    VALUES (r_org.org_id, 'Content Space', 'content', 'pgv', r_org.slug||'_content')
    ON CONFLICT DO NOTHING
    RETURNING id INTO vs2;
    IF vs2 IS NULL THEN
      SELECT id INTO vs2 FROM vector_space WHERE org_id=r_org.org_id AND name='Content Space';
    END IF;

    -- Docs
    FOR i IN 1..8 LOOP
      INSERT INTO embedding_doc (org_id, vector_space_id, source_type, source_id, chunk_id, hash, metadata)
      VALUES (r_org.org_id, vs2, 'lesson', rand_uuid(), 'chunk_'||i, md5(random()::text), '{"section":"intro"}'::jsonb)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Assessments and items
  FOR r_crs IN SELECT * FROM tmp_courses LOOP
    a_id2 := NULL;
    INSERT INTO assessment (org_id, course_id, section_id, type, prompt_seed, policy_json, visibility, generated_by, published_at)
    VALUES (r_crs.org_id, r_crs.course_id, NULL, 'quiz'::assessment_type, 'Seeded quiz', '{"difficulty":"medium"}'::jsonb, 'org'::visibility_scope, 'ai'::generated_by, now())
    ON CONFLICT DO NOTHING
    RETURNING id INTO a_id2;
    IF a_id2 IS NULL THEN
      SELECT id INTO a_id2 FROM assessment WHERE org_id=r_crs.org_id AND course_id=r_crs.course_id LIMIT 1;
    END IF;

    FOR i IN 1..5 LOOP
      INSERT INTO assessment_item (org_id, assessment_id, item_type, stem, options, answer_key, rubric_json, metadata)
      VALUES (
        r_crs.org_id, a_id2, 'mcq', 'Q'||i||': Sample question?',
        '["A","B","C","D"]'::jsonb, '{"correct":"A"}'::jsonb, '{"points":1}'::jsonb, '{"topic":"seed"}'::jsonb
      ) ON CONFLICT DO NOTHING;
    END LOOP;

    INSERT INTO tmp_assessments VALUES (r_crs.org_id, a_id2, r_crs.course_id);
  END LOOP;

  -- Attempts, peer reviews, grades
  FOR r_ass IN SELECT * FROM tmp_assessments LOOP
    FOR r_stu IN SELECT user_id FROM tmp_students WHERE org_id = r_ass.org_id ORDER BY random() LIMIT 3 LOOP
      score := round((70 + random()*30)::numeric, 2);

      atry := NULL;
      INSERT INTO attempt (org_id, assessment_id, student_user_id, started_at, submitted_at, answers_json, ai_score, ai_feedback, review_status)
      VALUES (r_ass.org_id, r_ass.assessment_id, r_stu.user_id, now(), now(), '{"answers":{}}'::jsonb, score, 'Auto evaluated', 'auto_final')
      ON CONFLICT DO NOTHING
      RETURNING id INTO atry;
      IF atry IS NULL THEN
        SELECT id INTO atry FROM attempt WHERE org_id=r_ass.org_id AND assessment_id=r_ass.assessment_id AND student_user_id=r_stu.user_id LIMIT 1;
      END IF;

      SELECT user_id INTO reviewer
      FROM tmp_students WHERE org_id = r_ass.org_id AND user_id <> r_stu.user_id
      ORDER BY random() LIMIT 1;

      IF reviewer IS NOT NULL THEN
        INSERT INTO peer_review (org_id, attempt_id, reviewer_user_id, comments, suggested_adjustment, finalized_at)
        VALUES (r_ass.org_id, atry, reviewer, 'Looks good!', NULL, now())
        ON CONFLICT DO NOTHING;
      END IF;

      INSERT INTO grade (org_id, attempt_id, score_raw, percentile, tier, finalized_at)
      VALUES (
        r_ass.org_id, atry, score, 75,
        CASE
          WHEN score >= 95 THEN 'top_1'::grade_tier
          WHEN score >= 90 THEN 'top_5'::grade_tier
          WHEN score >= 85 THEN 'top_10'::grade_tier
          WHEN score >= 80 THEN 'top_20'::grade_tier
          WHEN score >= 70 THEN 'normal'::grade_tier
          WHEN score >= 60 THEN 'below'::grade_tier
          ELSE 'fail'::grade_tier
        END,
        now()
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Invites, announcements, notifications, billing, audit
  FOR r_org IN SELECT * FROM tmp_orgs LOOP
    -- Invites
    FOR i IN 1..3 LOOP
      INSERT INTO invite (org_id, email, role, payload_json, token, expires_at, accepted_at)
      VALUES (
        r_org.org_id, 'invite'||i||'+'||r_org.slug||'@seed.local',
        'student', '{"notes":"seed"}'::jsonb, md5(random()::text), now() + interval '14 days', NULL
      ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Announcements
    INSERT INTO announcement (org_id, audience, title, body, publish_at)
    VALUES
      (r_org.org_id, 'org'::announcement_audience, 'Welcome', 'Welcome to '||initcap(r_org.slug), now()),
      (r_org.org_id, 'role:student'::announcement_audience, 'Orientation', 'Please read the handbook.', now())
    ON CONFLICT DO NOTHING;

    -- Notifications (teachers)
    FOR u_id IN SELECT user_id FROM tmp_teachers WHERE org_id = r_org.org_id LOOP
      INSERT INTO notification (org_id, user_id, type, payload, read_at, created_at)
      VALUES (r_org.org_id, u_id, 'info', '{"msg":"Schedule updated"}'::jsonb, NULL, now())
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Billing
    INSERT INTO billing_record (org_id, plan, usage_metrics, amount, currency, status, billing_period_start, billing_period_end, invoice_url)
    VALUES (
      r_org.org_id,
      (SELECT plan FROM organization WHERE id = r_org.org_id),
      '{"ai_tokens":100000,"storage_mb":5120,"minutes_video":1200,"seats":100}'::jsonb,
      499.00, 'USD', 'paid', date_trunc('month', now()) - interval '1 month', date_trunc('month', now()) - interval '1 day',
      'https://billing.local/invoices/'||r_org.slug||'/'||extract(epoch from now())
    ) ON CONFLICT DO NOTHING;

    -- Audit logs
    FOR i IN 1..10 LOOP
      INSERT INTO audit_log (org_id, actor_user_id, action, entity_type, entity_id, diff, ip, ua, created_at)
      VALUES (
        r_org.org_id,
        (SELECT user_id FROM tmp_teachers WHERE org_id = r_org.org_id ORDER BY random() LIMIT 1),
        'seed_event_'||i, 'seed_entity', rand_uuid(), '{"change":"seed"}'::jsonb, '127.0.0.1', 'seed-agent', now() - ((i||' hours')::interval)
      );
    END LOOP;
  END LOOP;
END;
$seed$;

COMMIT;

