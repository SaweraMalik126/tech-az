// =====================================================
// TeachMe.ai Database Types
// =====================================================

export interface Institution {
  id: number;
  name: string;
  address?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  subscription_plan: "basic" | "premium" | "enterprise";
  status: "active" | "suspended" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  gender: "male" | "female" | "other";
  dob?: string;
  phone_number?: string;
  profile_picture_url?: string;
  bio?: string;
  timezone: string;
  language_preference: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserSocialLink {
  id: number;
  user_id: string;
  platform: "linkedin" | "facebook" | "instagram" | "twitter" | "github";
  url: string;
  is_public: boolean;
  created_at: string;
}

export interface UserInstitution {
  id: number;
  user_id: string;
  institution_id: number;
  role: "super_admin" | "school_admin" | "teacher" | "student" | "parent";
  status: "active" | "inactive" | "suspended";
  permissions: Record<string, any>;
  joined_at: string;
  created_at: string;
}

export interface StudentParent {
  id: number;
  student_id: string;
  parent_id: string;
  relationship: "father" | "mother" | "guardian" | "other";
  has_legal_rights: boolean;
  contact_priority: number;
  created_at: string;
}

export interface Course {
  id: number;
  institution_id: number;
  title: string;
  description?: string;
  short_description?: string;
  language: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  estimated_duration_hours: number;
  thumbnail_url?: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  max_students?: number;
  created_by?: string;
  reviewed_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relations
  institution?: Institution;
  teachers?: CourseTeacher[];
  tags?: CourseTag[];
  chapters?: Chapter[];
  enrollments?: Enrollment[];
}

export interface CourseTag {
  id: number;
  course_id: number;
  tag: string;
  created_at: string;
}

export interface CourseTeacher {
  id: number;
  course_id: number;
  teacher_id: string;
  is_primary: boolean;
  assigned_at: string;

  // Relations
  teacher?: User;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  position: number;
  estimated_duration_minutes: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  course?: Course;
  content_items?: ContentItem[];
}

export interface ContentItem {
  id: number;
  chapter_id: number;
  type:
    | "text"
    | "video"
    | "quiz"
    | "assignment"
    | "slide"
    | "infographic"
    | "whiteboard"
    | "pdf";
  title: string;
  content: any; // JSONB content
  duration_estimate_seconds: number;
  position: number;
  is_required: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Relations
  chapter?: Chapter;
  quiz?: Quiz;
  versions?: ContentVersion[];
}

export interface ContentVersion {
  id: number;
  content_item_id: number;
  version: number;
  content: any; // JSONB content
  change_notes?: string;
  is_current: boolean;
  updated_by?: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  user_id: string;
  course_id: number;
  role: "student" | "teacher";
  enrollment_type: "invited" | "self_enrolled" | "admin_assigned";
  status: "active" | "completed" | "withdrawn" | "suspended";
  enrolled_at: string;
  completed_at?: string;
  completion_certificate_url?: string;
  grade?: string;
  feedback?: string;

  // Relations
  user?: User;
  course?: Course;
}

export interface UserProgress {
  id: number;
  user_id: string;
  course_id: number;
  chapter_id?: number;
  content_item_id?: number;
  status: "not_started" | "in_progress" | "completed" | "reviewed";
  time_spent_seconds: number;
  completion_percentage: number;
  last_position?: string;
  last_interaction: string;
  attempt_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  course?: Course;
  chapter?: Chapter;
  content_item?: ContentItem;
}

export interface Quiz {
  id: number;
  content_item_id: number;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  is_randomized: boolean;
  created_at: string;

  // Relations
  content_item?: ContentItem;
  questions?: QuizQuestion[];
  attempts?: QuizAttempt[];
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "fill_blank" | "essay";
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  position: number;
  created_at: string;
}

export interface QuizAttempt {
  id: number;
  user_id: string;
  quiz_id: number;
  answers: Record<string, any>; // JSONB answers
  score?: number;
  time_taken_seconds?: number;
  passed?: boolean;
  feedback?: string;
  attempted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;

  // Relations
  user?: User;
  quiz?: Quiz;
  reviewer?: User;
}

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  instructions?: string;
  due_date?: string;
  max_points: number;
  submission_type: "file" | "text" | "link" | "mixed";
  allowed_file_types: string[];
  max_file_size_mb: number;
  is_group_assignment: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Relations
  course?: Course;
  creator?: User;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: string;
  content: Record<string, any>; // JSONB content
  files?: Record<string, any>; // JSONB files
  submitted_at: string;
  grade?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  status: "submitted" | "graded" | "late" | "resubmitted";

  // Relations
  assignment?: Assignment;
  student?: User;
  grader?: User;
}

export interface ChatSession {
  id: string;
  user_id: string;
  course_id?: number;
  session_type:
    | "general"
    | "course_specific"
    | "assignment_help"
    | "teach_back";
  title?: string;
  context: Record<string, any>; // JSONB context
  created_at: string;
  last_activity: string;
  is_active: boolean;

  // Relations
  user?: User;
  course?: Course;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, any>; // JSONB metadata
  tokens_used?: number;
  model_used?: string;
  created_at: string;

  // Relations
  session?: ChatSession;
}

export interface AIInteraction {
  id: number;
  user_id: string;
  course_id?: number;
  interaction_type:
    | "chat"
    | "content_gen"
    | "feedback_analysis"
    | "teach_back_assessment";
  model_used?: string;
  prompt: string;
  response: string;
  tokens_used?: number;
  cost_estimate?: number;
  context: Record<string, any>; // JSONB context
  user_feedback?: number;
  created_at: string;

  // Relations
  user?: User;
  course?: Course;
}

export interface Review {
  id: number;
  user_id: string;
  course_id?: number;
  content_item_id?: number;
  rating: number;
  review_text?: string;
  review_type: "course" | "content" | "teacher" | "peer";
  is_public: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  course?: Course;
  content_item?: ContentItem;
}

export interface PeerReview {
  id: number;
  assignment_id: number;
  reviewer_id: string;
  submission_id: number;
  rubric_scores: Record<string, any>; // JSONB scores
  feedback?: string;
  is_completed: boolean;
  assigned_at: string;
  completed_at?: string;

  // Relations
  assignment?: Assignment;
  reviewer?: User;
  submission?: AssignmentSubmission;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type:
    | "announcement"
    | "assignment_due"
    | "grade_received"
    | "course_update"
    | "peer_review"
    | "system";
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  read_at?: string;

  // Relations
  user?: User;
}

export interface LearningAnalytics {
  id: number;
  user_id: string;
  course_id?: number;
  event_type: string;
  event_data: Record<string, any>; // JSONB event data
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  recorded_at: string;

  // Relations
  user?: User;
  course?: Course;
}

export interface AuditLog {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  old_values?: Record<string, any>; // JSONB old values
  new_values?: Record<string, any>; // JSONB new values
  changed_by?: string;
  changed_at: string;
  ip_address?: string;
  user_agent?: string;

  // Relations
  user?: User;
}

// Extended types for the application
export interface UserProfile extends User {
  institutions: (UserInstitution & { institution: Institution })[];
  social_links: UserSocialLink[];
  student_parents?: StudentParent[];
  parent_students?: StudentParent[];
}

export interface CourseWithDetails extends Course {
  institution: Institution;
  teachers: (CourseTeacher & { teacher: User })[];
  tags: CourseTag[];
  chapters: (Chapter & { content_items: ContentItem[] })[];
  enrollments: (Enrollment & { user: User })[];
  student_count: number;
  average_rating: number;
  total_reviews: number;
}

export interface DashboardStats {
  total_courses: number;
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_hours_learned: number;
  average_completion_rate: number;
  average_rating: number;
  recent_activities: LearningAnalytics[];
  upcoming_deadlines: Assignment[];
  unread_notifications: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
  institution_id?: number;
  role?: "student" | "teacher" | "parent";
}

export interface ProfileUpdateForm {
  full_name?: string;
  bio?: string;
  phone_number?: string;
  profile_picture_url?: string;
  language_preference?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface CourseEnrollmentForm {
  course_id: number;
  user_id: string;
  role: "student" | "teacher";
  enrollment_type: "invited" | "self_enrolled" | "admin_assigned";
}

// Chat types
export interface ChatMessageForm {
  content: string;
  session_id?: string;
  course_id?: number;
  session_type?:
    | "general"
    | "course_specific"
    | "assignment_help"
    | "teach_back";
}

export interface ChatContext {
  course_id?: number;
  chapter_id?: number;
  content_item_id?: number;
  topic?: string;
  difficulty?: string;
  learning_style?: string;
}

// Search and filter types
export interface CourseFilters {
  institution_id?: number;
  difficulty_level?: string[];
  language?: string[];
  status?: string[];
  tags?: string[];
  duration_min?: number;
  duration_max?: number;
  search_query?: string;
}

export interface UserFilters {
  institution_id?: number;
  role?: string[];
  status?: string[];
  search_query?: string;
}

// Analytics types
export interface LearningProgress {
  course_id: number;
  course_title: string;
  total_chapters: number;
  completed_chapters: number;
  total_content_items: number;
  completed_content_items: number;
  completion_percentage: number;
  time_spent_hours: number;
  last_activity: string;
  grade?: string;
}

export interface QuizAnalytics {
  quiz_id: number;
  quiz_title: string;
  total_questions: number;
  attempts: number;
  best_score: number;
  average_score: number;
  time_taken_minutes: number;
  passed: boolean;
  last_attempt: string;
}

export interface AssignmentAnalytics {
  assignment_id: number;
  assignment_title: string;
  due_date: string;
  submitted: boolean;
  submitted_at?: string;
  grade?: number;
  feedback?: string;
  status: string;
  days_until_due: number;
}

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: number;
          name: string;
          address: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          address?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          address?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          full_name: string | null;
          gender: "male" | "female" | "other" | null;
          dob: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          gender?: "male" | "female" | "other" | null;
          dob?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          gender?: "male" | "female" | "other" | null;
          dob?: string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      user_institutions: {
        Row: {
          id: number;
          user_id: string;
          institution_id: number;
          role:
            | "super_admin"
            | "school_admin"
            | "teacher"
            | "student"
            | "parent";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          institution_id: number;
          role:
            | "super_admin"
            | "school_admin"
            | "teacher"
            | "student"
            | "parent";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          institution_id?: number;
          role?:
            | "super_admin"
            | "school_admin"
            | "teacher"
            | "student"
            | "parent";
          created_at?: string;
          updated_at?: string;
        };
      };
      user_contacts: {
        Row: {
          id: number;
          user_id: string;
          type: "email" | "phone";
          value: string;
          is_primary: boolean;
          is_verified: boolean;
          contact_priority: number;
        };
        Insert: {
          id?: number;
          user_id: string;
          type: "email" | "phone";
          value: string;
          is_primary?: boolean;
          is_verified?: boolean;
          contact_priority?: number;
        };
        Update: {
          id?: number;
          user_id?: string;
          type?: "email" | "phone";
          value?: string;
          is_primary?: boolean;
          is_verified?: boolean;
          contact_priority?: number;
        };
      };
      user_social_links: {
        Row: {
          id: number;
          user_id: string;
          platform:
            | "linkedin"
            | "facebook"
            | "instagram"
            | "twitter"
            | "github";
          url: string;
          is_public: boolean;
        };
        Insert: {
          id?: number;
          user_id: string;
          platform:
            | "linkedin"
            | "facebook"
            | "instagram"
            | "twitter"
            | "github";
          url: string;
          is_public?: boolean;
        };
        Update: {
          id?: number;
          user_id?: string;
          platform?:
            | "linkedin"
            | "facebook"
            | "instagram"
            | "twitter"
            | "github";
          url?: string;
          is_public?: boolean;
        };
      };
      courses: {
        Row: {
          id: number;
          institution_id: number;
          title: string;
          description: string | null;
          language: string | null;
          created_by: string;
          status: "draft" | "published" | "archived";
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: number;
          institution_id: number;
          title: string;
          description?: string | null;
          language?: string | null;
          created_by: string;
          status?: "draft" | "published" | "archived";
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: number;
          institution_id?: number;
          title?: string;
          description?: string | null;
          language?: string | null;
          created_by?: string;
          status?: "draft" | "published" | "archived";
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      course_teachers: {
        Row: {
          id: number;
          course_id: number;
          teacher_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: number;
          course_id: number;
          teacher_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: number;
          course_id?: number;
          teacher_id?: string;
          assigned_at?: string;
        };
      };
      chapters: {
        Row: {
          id: number;
          course_id: number;
          title: string;
          position: number;
        };
        Insert: {
          id?: number;
          course_id: number;
          title: string;
          position: number;
        };
        Update: {
          id?: number;
          course_id?: number;
          title?: string;
          position?: number;
        };
      };
      content_items: {
        Row: {
          id: number;
          chapter_id: number;
          type:
            | "text"
            | "video"
            | "quiz"
            | "assignment"
            | "slide"
            | "infographic";
          title: string;
          content: any;
          duration_estimate_seconds: number | null;
          position: number;
          is_required: boolean;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          chapter_id: number;
          type:
            | "text"
            | "video"
            | "quiz"
            | "assignment"
            | "slide"
            | "infographic";
          title: string;
          content: any;
          duration_estimate_seconds?: number | null;
          position: number;
          is_required?: boolean;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          chapter_id?: number;
          type?:
            | "text"
            | "video"
            | "quiz"
            | "assignment"
            | "slide"
            | "infographic";
          title?: string;
          content?: any;
          duration_estimate_seconds?: number | null;
          position?: number;
          is_required?: boolean;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: number;
          user_id: string;
          course_id: number;
          role: "student" | "teacher";
          enrolled_at: string;
          completion_status: "in_progress" | "completed" | "withdrawn";
          completion_date: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          course_id: number;
          role: "student" | "teacher";
          enrolled_at?: string;
          completion_status?: "in_progress" | "completed" | "withdrawn";
          completion_date?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          course_id?: number;
          role?: "student" | "teacher";
          enrolled_at?: string;
          completion_status?: "in_progress" | "completed" | "withdrawn";
          completion_date?: string | null;
        };
      };
      user_progress: {
        Row: {
          id: number;
          user_id: string;
          course_id: number;
          chapter_id: number | null;
          content_item_id: number | null;
          status: "not_started" | "in_progress" | "completed";
          time_spent_seconds: number;
          completion_percentage: number;
          last_position: string | null;
          last_interaction: string;
          attempt_count: number;
        };
        Insert: {
          id?: number;
          user_id: string;
          course_id: number;
          chapter_id?: number | null;
          content_item_id?: number | null;
          status?: "not_started" | "in_progress" | "completed";
          time_spent_seconds?: number;
          completion_percentage?: number;
          last_position?: string | null;
          last_interaction?: string;
          attempt_count?: number;
        };
        Update: {
          id?: number;
          user_id?: string;
          course_id?: number;
          chapter_id?: number | null;
          content_item_id?: number | null;
          status?: "not_started" | "in_progress" | "completed";
          time_spent_seconds?: number;
          completion_percentage?: number;
          last_position?: string | null;
          last_interaction?: string;
          attempt_count?: number;
        };
      };
      assignments: {
        Row: {
          id: number;
          course_id: number;
          title: string;
          instructions: string | null;
          due_date: string | null;
          max_points: number | null;
        };
        Insert: {
          id?: number;
          course_id: number;
          title: string;
          instructions?: string | null;
          due_date?: string | null;
          max_points?: number | null;
        };
        Update: {
          id?: number;
          course_id?: number;
          title?: string;
          instructions?: string | null;
          due_date?: string | null;
          max_points?: number | null;
        };
      };
      assignment_submissions: {
        Row: {
          id: number;
          assignment_id: number;
          student_id: string;
          content: any;
          submitted_at: string;
          grade: number | null;
          feedback: string | null;
        };
        Insert: {
          id?: number;
          assignment_id: number;
          student_id: string;
          content: any;
          submitted_at?: string;
          grade?: number | null;
          feedback?: string | null;
        };
        Update: {
          id?: number;
          assignment_id?: number;
          student_id?: string;
          content?: any;
          submitted_at?: string;
          grade?: number | null;
          feedback?: string | null;
        };
      };
      quizzes: {
        Row: {
          id: number;
          course_id: number;
          title: string;
          description: string | null;
          time_limit_minutes: number | null;
          passing_score: number | null;
          max_attempts: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          course_id: number;
          title: string;
          description?: string | null;
          time_limit_minutes?: number | null;
          passing_score?: number | null;
          max_attempts?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          course_id?: number;
          title?: string;
          description?: string | null;
          time_limit_minutes?: number | null;
          passing_score?: number | null;
          max_attempts?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: number;
          quiz_id: number;
          question_text: string;
          question_type:
            | "multiple_choice"
            | "true_false"
            | "short_answer"
            | "essay";
          options: any | null;
          correct_answer: any | null;
          points: number;
          position: number;
        };
        Insert: {
          id?: number;
          quiz_id: number;
          question_text: string;
          question_type:
            | "multiple_choice"
            | "true_false"
            | "short_answer"
            | "essay";
          options?: any | null;
          correct_answer?: any | null;
          points?: number;
          position?: number;
        };
        Update: {
          id?: number;
          quiz_id?: number;
          question_text?: string;
          question_type?:
            | "multiple_choice"
            | "true_false"
            | "short_answer"
            | "essay";
          options?: any | null;
          correct_answer?: any | null;
          points?: number;
          position?: number;
        };
      };
      quiz_attempts: {
        Row: {
          id: number;
          user_id: string;
          quiz_id: number;
          answers: any;
          score: number | null;
          time_taken_minutes: number | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          quiz_id: number;
          answers: any;
          score?: number | null;
          time_taken_minutes?: number | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          quiz_id?: number;
          answers?: any;
          score?: number | null;
          time_taken_minutes?: number | null;
          started_at?: string;
          completed_at?: string | null;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          course_id: number | null;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id?: number | null;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: number | null;
          title?: string | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          metadata?: any | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          title: string;
          message: string;
          type:
            | "announcement"
            | "assignment"
            | "grade"
            | "reminder"
            | "invitation";
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          title: string;
          message: string;
          type:
            | "announcement"
            | "assignment"
            | "grade"
            | "reminder"
            | "invitation";
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          title?: string;
          message?: string;
          type?:
            | "announcement"
            | "assignment"
            | "grade"
            | "reminder"
            | "invitation";
          is_read?: boolean;
          created_at?: string;
        };
      };
      course_invitations: {
        Row: {
          id: number;
          course_id: number;
          teacher_id: string;
          invitation_token: string;
          email: string | null;
          expires_at: string | null;
          is_used: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          course_id: number;
          teacher_id: string;
          invitation_token: string;
          email?: string | null;
          expires_at?: string | null;
          is_used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          course_id?: number;
          teacher_id?: string;
          invitation_token?: string;
          email?: string | null;
          expires_at?: string | null;
          is_used?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
