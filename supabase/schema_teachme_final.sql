-- =========================
-- Extensions
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================
-- Enum types
-- =========================
DO $$
BEGIN
  CREATE TYPE org_status AS ENUM ('active','suspended','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE plan_tier AS ENUM ('free','standard','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE user_status AS ENUM ('active','inactive','banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE auth_provider AS ENUM ('password','google','sso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE membership_role AS ENUM ('super_admin','org_admin','teacher','student','parent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE membership_status AS ENUM ('active','pending','removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE relationship_type AS ENUM ('father','mother','guardian','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE scope_type AS ENUM ('org','class','course','section');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE class_level_category AS ENUM ('primary','secondary','college','bachelors','masters');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE teacher_role AS ENUM ('primary','assistant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE enrollment_status AS ENUM ('active','waitlisted','dropped','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE enrollment_type AS ENUM ('regular','transfer','audit','credit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE session_mode AS ENUM ('live','async');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE attendance_status AS ENUM ('present','absent','late','excused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE conversation_scope AS ENUM ('ai_tutor','section','one_to_one','group','admin_global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE sender_type AS ENUM ('user','ai');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE vector_backend AS ENUM ('pgv','pinecone','weaviate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE vector_purpose AS ENUM ('tutor','content','faq');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE source_type AS ENUM ('lesson','asset','faq');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE assessment_type AS ENUM ('quiz','problem','role_reversal','self_check');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE item_type AS ENUM ('mcq','short','code','scenario','teachback');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE visibility_scope AS ENUM ('org','section','public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE generated_by AS ENUM ('ai','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE review_status AS ENUM ('auto_final','queued_peer','peer_done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE grade_tier AS ENUM ('top_1','top_5','top_10','top_20','normal','below','fail');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE announcement_audience AS ENUM ('org','section','role:student','role:parent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE difficulty_level AS ENUM ('beginner','easy','intermediate','advanced','difficult');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE content_moderation_status AS ENUM ('pending','approved','rejected','flagged');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE feedback_mode AS ENUM ('immediate','delayed','none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE risk_level AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE asset_kind AS ENUM ('file','slide','video','whiteboard','infographic','link');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE notification_type AS ENUM ('announcement','assignment_due','grade_received','course_update','peer_review','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE billing_status AS ENUM ('paid','pending','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- Utility: short public_id allocator and triggers
-- =========================
CREATE TABLE IF NOT EXISTS entity_short_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  entity text NOT NULL,
  last_value int NOT NULL DEFAULT 999,
  UNIQUE (org_id, entity)
);

CREATE OR REPLACE FUNCTION generate_short_public_id(p_org_id uuid, p_entity text)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_next int;
BEGIN
  INSERT INTO entity_short_ids (org_id, entity, last_value)
  VALUES (p_org_id, p_entity, 999)
  ON CONFLICT (org_id, entity) DO NOTHING;

  UPDATE entity_short_ids
  SET last_value = CASE WHEN last_value >= 9999 THEN 1000 ELSE last_value + 1 END
  WHERE org_id = p_org_id AND entity = p_entity
  RETURNING last_value INTO v_next;

  IF v_next < 1000 THEN
    v_next := 1000;
    UPDATE entity_short_ids SET last_value = v_next WHERE org_id = p_org_id AND entity = p_entity;
  END IF;

  RETURN v_next;
END;
$$;

CREATE OR REPLACE FUNCTION set_public_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_public_id int;
  v_entity text;
BEGIN
  IF NEW.public_id IS NULL THEN
    v_entity := TG_ARGV[0];
    v_public_id := generate_short_public_id(NEW.org_id, v_entity);
    NEW.public_id = v_public_id;
  END IF;
  RETURN NEW;
END;
$$;

-- =========================
-- Core tenancy & users
-- =========================
CREATE TABLE IF NOT EXISTS organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status org_status NOT NULL DEFAULT 'active',
  plan plan_tier NOT NULL DEFAULT 'free',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  logo_url text,
  website text,
  contact_email text,
  contact_phone text,
  timezone text NOT NULL DEFAULT 'UTC',
  locale text NOT NULL DEFAULT 'en-US',
  data_retention_policy jsonb NOT NULL DEFAULT '{"days": 365}'::jsonb,
  privacy_settings jsonb NOT NULL DEFAULT '{"gdpr_compliant": true}'::jsonb,
  compliance_logging_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

COMMENT ON TABLE organization IS 'Stores organization/tenant information for multi-tenancy support';
COMMENT ON COLUMN organization.settings IS 'Organization-wide configuration settings';
COMMENT ON COLUMN organization.data_retention_policy IS 'Data retention policy configuration in JSON format';

CREATE TABLE IF NOT EXISTS app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text NOT NULL,
  avatar_url text,
  phone text,
  status user_status NOT NULL DEFAULT 'active',
  auth_provider auth_provider NOT NULL DEFAULT 'password',
  last_login_at timestamptz,
  login_count integer NOT NULL DEFAULT 0,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  account_locked_until timestamptz,
  password_changed_at timestamptz,
  terms_accepted_at timestamptz,
  privacy_policy_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_app_user_email_ci ON app_user (lower(email));
CREATE INDEX IF NOT EXISTS idx_app_user_status ON app_user(status) WHERE deleted_at IS NULL;

COMMENT ON TABLE app_user IS 'Base user table storing authentication and basic profile information';

CREATE TABLE IF NOT EXISTS user_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  institute_name text,
  dp_url text,
  phone text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  learning_goals text[] NOT NULL DEFAULT '{}'::text[],
  preferred_languages text[] NOT NULL DEFAULT '{}'::text[],
  accessibility_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  learning_analytics jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_activity_at timestamptz,
  total_learning_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (user_id)
);

COMMENT ON TABLE user_profile IS 'Extended user profile with preferences, settings, and analytics data';

CREATE TABLE IF NOT EXISTS org_membership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role membership_role NOT NULL,
  status membership_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_membership_user ON org_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_status ON org_membership(org_id, user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_org_membership_role ON org_membership(org_id, role) WHERE deleted_at IS NULL;

COMMENT ON TABLE org_membership IS 'Links users to organizations with specific roles and status';

CREATE TABLE IF NOT EXISTS role_binding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  scope_type scope_type NOT NULL,
  scope_id uuid NOT NULL,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, user_id, scope_type, scope_id),
  FOREIGN KEY (org_id, user_id) REFERENCES org_membership(org_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_role_binding_user ON role_binding(user_id);
CREATE INDEX IF NOT EXISTS idx_role_binding_scope ON role_binding(org_id, scope_type, scope_id);

COMMENT ON TABLE role_binding IS 'Granular permission assignments for users within specific scopes';

CREATE TABLE IF NOT EXISTS parent_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  student_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  relationship relationship_type NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, parent_user_id, student_user_id),
  FOREIGN KEY (org_id, parent_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, student_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parent_link_student ON parent_link(student_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_link_parent ON parent_link(parent_user_id);

COMMENT ON TABLE parent_link IS 'Links parents/guardians to student accounts with relationship types';

-- =========================
-- Academic hierarchy
-- =========================
CREATE TABLE IF NOT EXISTS term (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  registration_start date,
  registration_end date,
  drop_deadline date,
  grading_deadline date,
  holidays jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT term_date_range CHECK (end_date > start_date),
  UNIQUE (org_id, name, start_date),
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_term_public_id BEFORE INSERT ON term FOR EACH ROW EXECUTE FUNCTION set_public_id('term');

CREATE INDEX IF NOT EXISTS idx_term_dates ON term(org_id, start_date, end_date) WHERE deleted_at IS NULL;

COMMENT ON TABLE term IS 'Academic terms/semesters with important dates and holidays';

CREATE TABLE IF NOT EXISTS class_level (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  name text NOT NULL,
  category class_level_category NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, name),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_class_level_public_id BEFORE INSERT ON class_level FOR EACH ROW EXECUTE FUNCTION set_public_id('class_level');

COMMENT ON TABLE class_level IS 'Educational levels (e.g., primary, secondary, college)';

CREATE TABLE IF NOT EXISTS school_class (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  class_level_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, class_level_id, name),
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, class_level_id) REFERENCES class_level(org_id, id) ON DELETE RESTRICT
);
CREATE TRIGGER tr_school_class_public_id BEFORE INSERT ON school_class FOR EACH ROW EXECUTE FUNCTION set_public_id('school_class');

CREATE INDEX IF NOT EXISTS idx_school_class_level ON school_class(org_id, class_level_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE school_class IS 'Classes within educational levels (e.g., Grade 10, Freshman year)';

CREATE TABLE IF NOT EXISTS course (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  class_id uuid NOT NULL,
  term_id uuid NOT NULL,
  code text,
  title text NOT NULL,
  description text,
  language_defaults text[] NOT NULL DEFAULT '{}'::text[],
  subject_tags text[] NOT NULL DEFAULT '{}'::text[],
  credit_hours numeric DEFAULT 0,
  prerequisites jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_objectives text[] NOT NULL DEFAULT '{}'::text[],
  grading_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  difficulty_level difficulty_level,
  max_students integer,
  is_featured boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES app_user(id),
  reviewed_by uuid REFERENCES app_user(id),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  FOREIGN KEY (org_id, class_id) REFERENCES school_class(org_id, id) ON DELETE RESTRICT,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, term_id) REFERENCES term(org_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (org_id, created_by) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (org_id, reviewed_by) REFERENCES org_membership(org_id, user_id) ON DELETE SET NULL,
  CONSTRAINT chk_credit_hours CHECK (credit_hours >= 0),
  CONSTRAINT chk_max_students CHECK (max_students IS NULL OR max_students > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_course_org_code_not_null ON course(org_id, code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_course_class ON course(org_id, class_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_course_term ON course(org_id, term_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_course_subject_tags ON course USING GIN (subject_tags) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_course_language_defaults ON course USING GIN (language_defaults) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_published_courses ON course(org_id, published_at) WHERE published_at IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER tr_course_public_id BEFORE INSERT ON course FOR EACH ROW EXECUTE FUNCTION set_public_id('course');

COMMENT ON TABLE course IS 'Courses offered within classes and terms with academic metadata';
COMMENT ON COLUMN course.grading_policy IS 'JSON configuration for grading rules and weight distribution';

CREATE TABLE IF NOT EXISTS section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  course_id uuid NOT NULL,
  term_id uuid NOT NULL,
  name text NOT NULL,
  schedule jsonb NOT NULL DEFAULT '{}'::jsonb,
  capacity integer,
  credit_hours numeric DEFAULT 0,
  prerequisites jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_objectives text[] NOT NULL DEFAULT '{}'::text[],
  grading_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  difficulty_level difficulty_level,
  is_featured boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES app_user(id),
  reviewed_by uuid REFERENCES app_user(id),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, course_id, term_id, name),
  FOREIGN KEY (org_id, course_id) REFERENCES course(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, term_id) REFERENCES term(org_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (org_id, created_by) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (org_id, reviewed_by) REFERENCES org_membership(org_id, user_id) ON DELETE SET NULL,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_section_capacity CHECK (capacity IS NULL OR capacity > 0),
  CONSTRAINT chk_section_credit_hours CHECK (credit_hours >= 0)
);
CREATE TRIGGER tr_section_public_id BEFORE INSERT ON section FOR EACH ROW EXECUTE FUNCTION set_public_id('section');

CREATE INDEX IF NOT EXISTS idx_section_course ON section(org_id, course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_section_term ON section(org_id, term_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE section IS 'Specific sections/instances of courses with scheduling information';

CREATE TABLE IF NOT EXISTS teacher_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  section_id uuid NOT NULL,
  teacher_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  role teacher_role NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, section_id, teacher_user_id, role),
  FOREIGN KEY (org_id, section_id) REFERENCES section(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, teacher_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_teacher_assignment_public_id BEFORE INSERT ON teacher_assignment FOR EACH ROW EXECUTE FUNCTION set_public_id('teacher_assignment');

CREATE INDEX IF NOT EXISTS idx_teacher_assignment_teacher ON teacher_assignment(org_id, teacher_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_assignment_section ON teacher_assignment(org_id, section_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE teacher_assignment IS 'Assigns teachers to sections with specific roles';

CREATE TABLE IF NOT EXISTS enrollment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  section_id uuid NOT NULL,
  student_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  status enrollment_status NOT NULL DEFAULT 'active',
  enrollment_type enrollment_type NOT NULL DEFAULT 'regular',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completion_certificate_url text,
  grade text,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, section_id, student_user_id),
  FOREIGN KEY (org_id, section_id) REFERENCES section(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, student_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_enrollment_dates CHECK (completed_at IS NULL OR completed_at >= enrolled_at)
);
CREATE TRIGGER tr_enrollment_public_id BEFORE INSERT ON enrollment FOR EACH ROW EXECUTE FUNCTION set_public_id('enrollment');

CREATE INDEX IF NOT EXISTS idx_enrollment_student ON enrollment(org_id, student_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollment_section_status ON enrollment(org_id, section_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollment_dates ON enrollment(org_id, enrolled_at, completed_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE enrollment IS 'Student enrollments in course sections with status and completion data';

-- =========================
-- Assets, content & sessions
-- =========================
CREATE TABLE IF NOT EXISTS asset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  owner_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  kind asset_kind NOT NULL,
  url text NOT NULL,
  mime text,
  size bigint,
  visibility visibility_scope NOT NULL DEFAULT 'org',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  parent_asset_id uuid,
  is_latest_version boolean NOT NULL DEFAULT true,
  access_count integer NOT NULL DEFAULT 0,
  last_accessed_at timestamptz,
  expires_at timestamptz,
  content_moderation_status content_moderation_status NOT NULL DEFAULT 'pending',
  moderated_by uuid REFERENCES app_user(id),
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, owner_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (org_id, parent_asset_id) REFERENCES asset(org_id, id) ON DELETE SET NULL,
  FOREIGN KEY (org_id, moderated_by) REFERENCES org_membership(org_id, user_id) ON DELETE SET NULL,
  CONSTRAINT chk_asset_size CHECK (size IS NULL OR size >= 0),
  CONSTRAINT chk_asset_version CHECK (version >= 1)
);
CREATE TRIGGER tr_asset_public_id BEFORE INSERT ON asset FOR EACH ROW EXECUTE FUNCTION set_public_id('asset');

CREATE INDEX IF NOT EXISTS idx_asset_owner ON asset(org_id, owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_asset_metadata ON asset USING GIN (metadata) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_asset_kind ON asset(org_id, kind) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_asset_moderation ON asset(org_id, content_moderation_status) WHERE deleted_at IS NULL;

COMMENT ON TABLE asset IS 'Digital assets (files, videos, etc.) with versioning and moderation';

CREATE TABLE IF NOT EXISTS module (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  section_id uuid NOT NULL,
  title text NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, section_id, sort_order),
  FOREIGN KEY (org_id, section_id) REFERENCES section(org_id, id) ON DELETE CASCADE,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_module_sort_order CHECK (sort_order >= 0)
);
CREATE TRIGGER tr_module_public_id BEFORE INSERT ON module FOR EACH ROW EXECUTE FUNCTION set_public_id('module');

CREATE INDEX IF NOT EXISTS idx_module_section ON module(org_id, section_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE module IS 'Course modules organizing lessons and content';

CREATE TABLE IF NOT EXISTS lesson (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  module_id uuid NOT NULL,
  section_id uuid NOT NULL,
  title text NOT NULL,
  content_rich text,
  whiteboard_json jsonb,
  objectives text[] NOT NULL DEFAULT '{}'::text[],
  duration_minutes integer,
  difficulty_level difficulty_level,
  prerequisites jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  reviewed_by uuid REFERENCES app_user(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, module_id) REFERENCES module(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, section_id) REFERENCES section(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, reviewed_by) REFERENCES org_membership(org_id, user_id) ON DELETE SET NULL,
  CONSTRAINT chk_lesson_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  CONSTRAINT chk_lesson_version CHECK (version >= 1)
);
CREATE TRIGGER tr_lesson_public_id BEFORE INSERT ON lesson FOR EACH ROW EXECUTE FUNCTION set_public_id('lesson');

CREATE INDEX IF NOT EXISTS idx_lesson_module ON lesson(org_id, module_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_section ON lesson(org_id, section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_published ON lesson(org_id, is_published, published_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_content_search ON lesson USING GIN (to_tsvector('english', content_rich)) WHERE deleted_at IS NULL;

COMMENT ON TABLE lesson IS 'Learning lessons with content, objectives, and versioning';

CREATE TABLE IF NOT EXISTS lesson_asset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  lesson_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, lesson_id, asset_id),
  FOREIGN KEY (org_id, lesson_id) REFERENCES lesson(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, asset_id) REFERENCES asset(org_id, id) ON DELETE CASCADE
);
CREATE TRIGGER tr_lesson_asset_public_id BEFORE INSERT ON lesson_asset FOR EACH ROW EXECUTE FUNCTION set_public_id('lesson_asset');

CREATE INDEX IF NOT EXISTS idx_lesson_asset_lesson ON lesson_asset(org_id, lesson_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_asset_asset ON lesson_asset(org_id, asset_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE lesson_asset IS 'Junction table linking lessons to their associated assets';

CREATE TABLE IF NOT EXISTS class_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  section_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  mode session_mode NOT NULL,
  recording_asset_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT class_session_time_range CHECK (end_at > start_at),
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, section_id) REFERENCES section(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, recording_asset_id) REFERENCES asset(org_id, id) ON DELETE SET NULL
);
CREATE TRIGGER tr_class_session_public_id BEFORE INSERT ON class_session FOR EACH ROW EXECUTE FUNCTION set_public_id('class_session');

CREATE INDEX IF NOT EXISTS idx_session_section ON class_session(org_id, section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_dates ON class_session(org_id, start_at, end_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_mode ON class_session(org_id, mode) WHERE deleted_at IS NULL;

COMMENT ON TABLE class_session IS 'Scheduled class sessions with timing and mode information';

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  session_id uuid NOT NULL,
  student_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  status attendance_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, session_id, student_user_id),
  FOREIGN KEY (org_id, session_id) REFERENCES class_session(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, student_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_attendance_public_id BEFORE INSERT ON attendance FOR EACH ROW EXECUTE FUNCTION set_public_id('attendance');

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(org_id, session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(org_id, student_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(org_id, student_user_id, created_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE attendance IS 'Student attendance records for class sessions';

-- =========================
-- Conversations & chat
-- =========================
CREATE TABLE IF NOT EXISTS conversation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  scope_type conversation_scope NOT NULL,
  scope_id uuid,
  title text,
  description text,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  last_message_at timestamptz,
  message_count integer NOT NULL DEFAULT 0,
  is_moderated boolean NOT NULL DEFAULT false,
  moderation_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_conversation_message_count CHECK (message_count >= 0)
);
CREATE TRIGGER tr_conversation_public_id BEFORE INSERT ON conversation FOR EACH ROW EXECUTE FUNCTION set_public_id('conversation');

CREATE INDEX IF NOT EXISTS idx_conversation_scope ON conversation(org_id, scope_type, scope_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_archived ON conversation(org_id, is_archived) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_last_message ON conversation(org_id, last_message_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE conversation IS 'Chat conversations with different scopes and moderation settings';

CREATE TABLE IF NOT EXISTS conversation_participant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, conversation_id, user_id),
  FOREIGN KEY (org_id, conversation_id) REFERENCES conversation(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, user_id) REFERENCES org_membership(org_id, user_id) ON DELETE CASCADE,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_conversation_participant_public_id BEFORE INSERT ON conversation_participant FOR EACH ROW EXECUTE FUNCTION set_public_id('conversation_participant');

CREATE INDEX IF NOT EXISTS idx_conversation_participant_user ON conversation_participant(org_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_participant_conv ON conversation_participant(org_id, conversation_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE conversation_participant IS 'Participants in conversations with join timestamps';

CREATE TABLE IF NOT EXISTS message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  sender_type sender_type NOT NULL,
  sender_user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  body text NOT NULL,
  lang text,
  edited_at timestamptz,
  edit_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_pinned boolean NOT NULL DEFAULT false,
  pinned_at timestamptz,
  pinned_by uuid REFERENCES app_user(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  FOREIGN KEY (org_id, conversation_id) REFERENCES conversation(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, pinned_by) REFERENCES org_membership(org_id, user_id) ON DELETE SET NULL,
  FOREIGN KEY (org_id, sender_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE SET NULL,
  CONSTRAINT chk_message_edit_count CHECK (edit_count >= 0),
  CONSTRAINT chk_message_reaction_count CHECK (reaction_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_message_conversation_time ON message(org_id, conversation_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_conversation_sender ON message(org_id, conversation_id, sender_type, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_sender_user ON message(org_id, sender_user_id) WHERE sender_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_pinned ON message(org_id, is_pinned) WHERE deleted_at IS NULL;

COMMENT ON TABLE message IS 'Chat messages with editing, reactions, and pinning capabilities';

CREATE TABLE IF NOT EXISTS message_attachment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  message_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, message_id, asset_id),
  FOREIGN KEY (org_id, message_id) REFERENCES message(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, asset_id) REFERENCES asset(org_id, id) ON DELETE CASCADE,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_message_attachment_public_id BEFORE INSERT ON message_attachment FOR EACH ROW EXECUTE FUNCTION set_public_id('message_attachment');

CREATE INDEX IF NOT EXISTS idx_message_attachment_message ON message_attachment(org_id, message_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_attachment_asset ON message_attachment(org_id, asset_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE message_attachment IS 'Attachments linking messages to assets';

-- =========================
-- RAG vector spaces
-- =========================
CREATE TABLE IF NOT EXISTS vector_space (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  name text NOT NULL,
  purpose vector_purpose NOT NULL,
  backend vector_backend NOT NULL,
  index_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, name),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_vector_space_public_id BEFORE INSERT ON vector_space FOR EACH ROW EXECUTE FUNCTION set_public_id('vector_space');

COMMENT ON TABLE vector_space IS 'RAG vector spaces for AI tutoring and content retrieval';

CREATE TABLE IF NOT EXISTS embedding_doc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  vector_space_id uuid NOT NULL,
  source_type source_type NOT NULL,
  source_id uuid NOT NULL,
  chunk_id text NOT NULL,
  hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, vector_space_id, chunk_id),
  FOREIGN KEY (org_id, vector_space_id) REFERENCES vector_space(org_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_embedding_doc_space ON embedding_doc(org_id, vector_space_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_embedding_doc_source ON embedding_doc(org_id, source_type, source_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_embedding_doc_metadata ON embedding_doc USING GIN (metadata) WHERE deleted_at IS NULL;

COMMENT ON TABLE embedding_doc IS 'Embedded document chunks for RAG-based AI tutoring';

-- =========================
-- AI Assessments
-- =========================
CREATE TABLE IF NOT EXISTS assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  course_id uuid NOT NULL,
  section_id uuid,
  type assessment_type NOT NULL,
  prompt_seed text,
  policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility visibility_scope NOT NULL DEFAULT 'org',
  generated_by generated_by NOT NULL DEFAULT 'ai',
  time_limit_minutes integer,
  max_attempts integer DEFAULT 1,
  passing_score numeric DEFAULT 70,
  feedback_mode feedback_mode,
  availability_window jsonb NOT NULL DEFAULT '{"start": null, "end": null}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, course_id) REFERENCES course(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, section_id) REFERENCES section(org_id, id) ON DELETE SET NULL,
  CONSTRAINT chk_passing_score CHECK (passing_score >= 0 AND passing_score <= 100),
  CONSTRAINT chk_time_limit CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  CONSTRAINT chk_max_attempts CHECK (max_attempts >= 1)
);
CREATE TRIGGER tr_assessment_public_id BEFORE INSERT ON assessment FOR EACH ROW EXECUTE FUNCTION set_public_id('assessment');

CREATE INDEX IF NOT EXISTS idx_assessment_course ON assessment(org_id, course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_section ON assessment(org_id, section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_type ON assessment(org_id, type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_published ON assessment(org_id, published_at) WHERE published_at IS NOT NULL AND deleted_at IS NULL;

COMMENT ON TABLE assessment IS 'AI-generated assessments with grading policies and configuration';
COMMENT ON COLUMN assessment.policy_json IS 'JSON configuration for assessment behavior and AI grading parameters';

CREATE TABLE IF NOT EXISTS assessment_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  assessment_id uuid NOT NULL,
  item_type item_type NOT NULL,
  stem text NOT NULL,
  options jsonb,
  answer_key jsonb,
  rubric_json jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, assessment_id) REFERENCES assessment(org_id, id) ON DELETE CASCADE
);
CREATE TRIGGER tr_assessment_item_public_id BEFORE INSERT ON assessment_item FOR EACH ROW EXECUTE FUNCTION set_public_id('assessment_item');

CREATE INDEX IF NOT EXISTS idx_assessment_item_assessment ON assessment_item(org_id, assessment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_item_type ON assessment_item(org_id, item_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_item_stem_fts ON assessment_item USING GIN (to_tsvector('english', stem)) WHERE deleted_at IS NULL;

COMMENT ON TABLE assessment_item IS 'Individual assessment items/questions with scoring rubrics';

CREATE TABLE IF NOT EXISTS attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  assessment_id uuid NOT NULL,
  student_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_score numeric,
  ai_feedback text,
  explanations jsonb,
  review_status review_status NOT NULL DEFAULT 'auto_final',
  time_spent_seconds integer,
  user_agent text,
  ip_address inet,
  device_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  proctoring_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  flagged_reason text,
  reviewed_by uuid REFERENCES app_user(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, assessment_id) REFERENCES assessment(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, student_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (org_id, reviewed_by) REFERENCES org_membership(org_id, user_id) ON DELETE SET NULL,
  CONSTRAINT chk_attempt_score CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100)),
  CONSTRAINT chk_attempt_time_spent CHECK (time_spent_seconds IS NULL OR time_spent_seconds >= 0),
  CONSTRAINT chk_attempt_dates CHECK (submitted_at IS NULL OR submitted_at >= started_at)
);
CREATE TRIGGER tr_attempt_public_id BEFORE INSERT ON attempt FOR EACH ROW EXECUTE FUNCTION set_public_id('attempt');

CREATE INDEX IF NOT EXISTS idx_attempt_assessment_user ON attempt(org_id, assessment_id, student_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attempt_assessment_status ON attempt(org_id, assessment_id, review_status, submitted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attempt_student ON attempt(org_id, student_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_attempt_dates ON attempt(org_id, started_at, submitted_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE attempt IS 'Student assessment attempts with AI scoring and proctoring data';

CREATE TABLE IF NOT EXISTS peer_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  attempt_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  comments text,
  suggested_adjustment numeric,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, attempt_id, reviewer_user_id),
  FOREIGN KEY (org_id, attempt_id) REFERENCES attempt(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, reviewer_user_id) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_peer_review_adjustment CHECK (suggested_adjustment IS NULL OR (suggested_adjustment >= -100 AND suggested_adjustment <= 100))
);
CREATE TRIGGER tr_peer_review_public_id BEFORE INSERT ON peer_review FOR EACH ROW EXECUTE FUNCTION set_public_id('peer_review');

CREATE INDEX IF NOT EXISTS idx_peer_review_attempt ON peer_review(org_id, attempt_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_peer_review_reviewer ON peer_review(org_id, reviewer_user_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE peer_review IS 'Peer reviews of assessment attempts with feedback and score adjustments';

CREATE TABLE IF NOT EXISTS grade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  attempt_id uuid NOT NULL,
  score_raw numeric NOT NULL,
  percentile numeric,
  tier grade_tier NOT NULL,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, attempt_id),
  FOREIGN KEY (org_id, attempt_id) REFERENCES attempt(org_id, id) ON DELETE CASCADE,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_grade_score CHECK (score_raw >= 0 AND score_raw <= 100),
  CONSTRAINT chk_grade_percentile CHECK (percentile IS NULL OR (percentile >= 0 AND percentile <= 100))
);
CREATE TRIGGER tr_grade_public_id BEFORE INSERT ON grade FOR EACH ROW EXECUTE FUNCTION set_public_id('grade');

CREATE INDEX IF NOT EXISTS idx_grade_tier ON grade(org_id, tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grade_attempt ON grade(org_id, attempt_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_grade_score ON grade(org_id, score_raw) WHERE deleted_at IS NULL;

COMMENT ON TABLE grade IS 'Final grades for assessment attempts with percentile ranking';

-- =========================
-- Invites, notifications, billing, audit
-- =========================
CREATE TABLE IF NOT EXISTS invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  email text NOT NULL,
  role membership_role NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, token),
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_invite_expiry CHECK (expires_at > created_at)
);
CREATE TRIGGER tr_invite_public_id BEFORE INSERT ON invite FOR EACH ROW EXECUTE FUNCTION set_public_id('invite');

CREATE UNIQUE INDEX IF NOT EXISTS ux_invite_email_ci ON invite (org_id, lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invite_expires ON invite(org_id, expires_at) WHERE deleted_at IS NULL AND accepted_at IS NULL;

COMMENT ON TABLE invite IS 'Organization membership invitations with expiration and acceptance tracking';

CREATE TABLE IF NOT EXISTS announcement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  audience announcement_audience NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  publish_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id)
);
CREATE TRIGGER tr_announcement_public_id BEFORE INSERT ON announcement FOR EACH ROW EXECUTE FUNCTION set_public_id('announcement');

CREATE INDEX IF NOT EXISTS idx_announcement_publish_at ON announcement(org_id, publish_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcement_audience ON announcement(org_id, audience) WHERE deleted_at IS NULL;

COMMENT ON TABLE announcement IS 'Organization announcements targeted to specific audiences';

CREATE TABLE IF NOT EXISTS notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  FOREIGN KEY (org_id, user_id) REFERENCES org_membership(org_id, user_id) ON DELETE CASCADE
);
CREATE TRIGGER tr_notification_public_id BEFORE INSERT ON notification FOR EACH ROW EXECUTE FUNCTION set_public_id('notification');

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(org_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(org_id, type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_created ON notification(org_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_unread ON notification(org_id, user_id) WHERE read_at IS NULL AND deleted_at IS NULL;

COMMENT ON TABLE notification IS 'User notifications with read status and type categorization';

CREATE TABLE IF NOT EXISTS billing_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  plan plan_tier NOT NULL,
  usage_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  amount numeric NOT NULL,
  currency text NOT NULL,
  status billing_status NOT NULL DEFAULT 'pending',
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  invoice_url text,
  billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  payment_method_id text,
  payment_gateway_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  refunded_amount numeric NOT NULL DEFAULT 0,
  refunded_at timestamptz,
  amount_verification boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_billing_dates CHECK (billing_period_end > billing_period_start),
  CONSTRAINT chk_billing_amount CHECK (amount >= 0),
  CONSTRAINT chk_tax_amount CHECK (tax_amount >= 0),
  CONSTRAINT chk_discount_amount CHECK (discount_amount >= 0),
  CONSTRAINT chk_refunded_amount CHECK (refunded_amount >= 0 AND refunded_amount <= amount)
);
CREATE TRIGGER tr_billing_record_public_id BEFORE INSERT ON billing_record FOR EACH ROW EXECUTE FUNCTION set_public_id('billing_record');

CREATE INDEX IF NOT EXISTS idx_billing_period ON billing_record(org_id, billing_period_start, billing_period_end) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_record(org_id, status) WHERE deleted_at IS NULL;

COMMENT ON TABLE billing_record IS 'Billing records with payment status, taxes, and refund information';

-- Partitioned audit log with composite PK including partition key
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet,
  ua text,
  correlation_id uuid,
  session_id uuid,
  entity_previous_state jsonb,
  entity_new_state jsonb,
  risk_level risk_level,
  compliance_flags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_time ON audit_log(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(org_id, entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(org_id, actor_user_id, created_at) WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_risk ON audit_log(org_id, risk_level, created_at) WHERE risk_level IS NOT NULL;

COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for compliance and security monitoring';

-- Partitioned learning_analytics with composite PK including partition key
CREATE TABLE IF NOT EXISTS learning_analytics (
  id uuid DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  section_id uuid,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (id, recorded_at),
  UNIQUE (org_id, user_id, metric_type, recorded_at),
  FOREIGN KEY (org_id, user_id) REFERENCES org_membership(org_id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, section_id) REFERENCES section(org_id, id) ON DELETE SET NULL
) PARTITION BY RANGE (recorded_at);

CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_metric ON learning_analytics(org_id, user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_section ON learning_analytics(org_id, section_id, metric_type) WHERE section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_analytics_time ON learning_analytics(org_id, recorded_at);

COMMENT ON TABLE learning_analytics IS 'Learning analytics data with contextual information';

-- Monthly default partitions (safety)
CREATE TABLE IF NOT EXISTS audit_log_default PARTITION OF audit_log DEFAULT;
CREATE TABLE IF NOT EXISTS learning_analytics_default PARTITION OF learning_analytics DEFAULT;

-- =========================
-- Enhanced Features Tables
-- =========================
CREATE TABLE IF NOT EXISTS content_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  public_id int,
  content_type text NOT NULL CHECK (content_type IN ('lesson','assessment','module')),
  content_id uuid NOT NULL,
  version integer NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES app_user(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (org_id, content_type, content_id, version),
  FOREIGN KEY (org_id, created_by) REFERENCES org_membership(org_id, user_id) ON DELETE RESTRICT,
  UNIQUE (org_id, id),
  UNIQUE (org_id, public_id),
  CONSTRAINT chk_content_version CHECK (version >= 1)
);
CREATE TRIGGER tr_content_version_public_id BEFORE INSERT ON content_version FOR EACH ROW EXECUTE FUNCTION set_public_id('content_version');

CREATE INDEX IF NOT EXISTS idx_content_version_content ON content_version(org_id, content_type, content_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_version_created ON content_version(org_id, created_by, created_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE content_version IS 'Version history for content with change tracking';

CREATE TABLE IF NOT EXISTS content_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('view','edit','download','share','complete')),
  duration_seconds integer,
  engagement_score numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_content_usage_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  CONSTRAINT chk_engagement_score CHECK (engagement_score IS NULL OR (engagement_score >= 0 AND engagement_score <= 1))
);

CREATE INDEX IF NOT EXISTS idx_content_usage_org_content ON content_usage(org_id, content_type, content_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_usage_user ON content_usage(org_id, user_id) WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_usage_action ON content_usage(org_id, action, created_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE content_usage IS 'Content usage tracking with engagement metrics';

-- =========================
-- Additional Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_organization_deleted ON organization(deleted_at);
CREATE INDEX IF NOT EXISTS idx_app_user_deleted ON app_user(deleted_at);
CREATE INDEX IF NOT EXISTS idx_course_deleted ON course(deleted_at);
CREATE INDEX IF NOT EXISTS idx_section_deleted ON section(deleted_at);
CREATE INDEX IF NOT EXISTS idx_lesson_deleted ON lesson(deleted_at);
CREATE INDEX IF NOT EXISTS idx_assessment_deleted ON assessment(deleted_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_course_search ON course USING GIN (to_tsvector('english', title || ' ' || description)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lesson_search ON lesson USING GIN (to_tsvector('english', title || ' ' || content_rich)) WHERE deleted_at IS NULL;

-- Performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_org_membership_active ON org_membership(org_id, user_id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollment_active ON enrollment(org_id, student_user_id) WHERE status = 'active' AND deleted_at IS NULL;

-- =========================
-- Triggers for updated_at
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'updated_at'
      AND table_schema = 'public'
      AND table_name NOT IN ('audit_log', 'learning_analytics') -- Partitioned tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;', t, t);
    EXECUTE format('
      CREATE TRIGGER update_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    ', t, t);
  END LOOP;
END $$;

-- =========================
-- Partition rotation utilities (monthly)
-- =========================
CREATE OR REPLACE FUNCTION rotate_monthly_partitions(p_parent_table text, p_prefix text, p_retention_months int DEFAULT 12)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  start_next date := date_trunc('month', now() + interval '1 month')::date;
  end_next date := (date_trunc('month', now() + interval '2 month'))::date;
  part_name text := p_prefix || '_' || to_char(start_next, 'YYYY_MM');
  cutoff text := to_char((date_trunc('month', now()) - (p_retention_months || ' months')::interval)::date, 'YYYY_MM');
  child record;
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L);', part_name, p_parent_table, start_next, end_next);

  FOR child IN
    SELECT c.relname AS child_name
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = p_parent_table
      AND c.relname LIKE (p_prefix || '\_%')
  LOOP
    IF substring(child.child_name from '([0-9]{4}_[0-9]{2})$') < cutoff THEN
      EXECUTE format('DROP TABLE IF EXISTS %I;', child.child_name);
    END IF;
  END LOOP;
END;
$$;

-- =========================
-- Data retention policy function (partition-aware)
-- =========================
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Rotate monthly partitions; drop those older than retention window
  PERFORM rotate_monthly_partitions('audit_log', 'audit_log', 12);
  PERFORM rotate_monthly_partitions('learning_analytics', 'learning_analytics', 12);

  -- Optionally, still soft-delete old learning_analytics rows within retained partitions
  UPDATE learning_analytics
  SET deleted_at = now()
  WHERE recorded_at < now() - interval '365 days'
    AND deleted_at IS NULL;
END;
$$;

COMMENT ON FUNCTION cleanup_old_data IS 'Partition rotation and optional soft-deletes for retained analytics rows';

-- =========================
-- RLS stubs (disabled by default) - enable in production
-- =========================
-- Example:
-- ALTER TABLE course ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY org_isolation_course ON course
--   USING (org_id IN (SELECT org_id FROM org_membership WHERE user_id = auth.uid()));

-- =========================
-- Final comments
-- =========================
COMMENT ON SCHEMA public IS 'Educational platform with AI tutoring capabilities - Production Schema (finalized with short IDs and partition rotation)';