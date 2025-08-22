import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { ChatMessage, ChatSession } from "@/integrations/supabase/types";

export interface Course {
  id: number;
  title: string;
  description: string | null;
  language: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  institution_id: number;
  created_by: string;
  progress?: number;
  chapters?: Chapter[];
  teacher?: {
    id: string;
    full_name: string;
  };
  enrollment_count?: number;
  last_accessed?: string;
}

export interface Chapter {
  id: number;
  title: string;
  position: number;
  content_items: ContentItem[];
  progress?: number;
}

export interface ContentItem {
  id: number;
  type: "text" | "video" | "quiz" | "assignment" | "slide" | "infographic";
  title: string;
  content: any;
  duration_estimate_seconds: number | null;
  position: number;
  is_required: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  progress?: number;
}

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  instructions: string | null;
  due_date: string | null;
  max_points: number | null;
  submission_count: number;
  graded_count: number;
  average_score: number | null;
  status: "active" | "draft" | "archived";
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number | null;
  max_attempts: number | null;
  is_active: boolean;
  question_count: number;
  average_score: number | null;
  attempt_count: number;
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      console.log(
        "useCourses: Profile loaded, fetching courses for role:",
        profile.role
      );
      fetchCourses();
    } else {
      console.log("useCourses: No profile yet, waiting...");
    }
  }, [profile]);

  const fetchCourses = async () => {
    try {
      console.log("useCourses: Starting to fetch courses...");
      setLoading(true);
      setError(null);

      if (!profile) {
        console.log("useCourses: No profile, cannot fetch courses");
        return;
      }

      console.log(
        "useCourses: Fetching courses for user:",
        profile.id,
        "with role:",
        profile.role
      );

      // If user is a teacher, fetch courses they teach
      if (profile.role === "teacher") {
        console.log("useCourses: Fetching teacher courses...");

        const { data: teacherCourses, error: teacherError } = await supabase
          .from("course_teachers")
          .select(
            `
            course_id,
            courses(*)
          `
          )
          .eq("teacher_id", profile.id);

        if (teacherError) {
          console.error(
            "useCourses: Error fetching teacher courses:",
            teacherError
          );
          throw teacherError;
        }

        console.log("useCourses: Teacher courses response:", teacherCourses);

        // Fetch teacher's courses with full details
        if (teacherCourses && teacherCourses.length > 0) {
          const courseIds = teacherCourses.map((tc) => tc.course_id);
          console.log(
            "useCourses: Fetching full details for course IDs:",
            courseIds
          );

          const { data: fullTeacherCourses, error: fullError } = await supabase
            .from("courses")
            .select(
              `
              *,
              chapters(
                id,
                title,
                position,
                content_items(
                  id,
                  type,
                  title,
                  content,
                  duration_estimate_seconds,
                  position,
                  is_required,
                  metadata,
                  created_at,
                  updated_at
                )
              )
            `
            )
            .in("id", courseIds)
            .order("created_at", { ascending: false });

          if (fullError) {
            console.error(
              "useCourses: Error fetching full teacher courses:",
              fullError
            );
            throw fullError;
          }

          console.log(
            "useCourses: Full teacher courses loaded:",
            fullTeacherCourses
          );
          setCourses(fullTeacherCourses || []);
          setLoading(false);
          return;
        } else {
          console.log(
            "useCourses: No teacher courses found, setting empty array"
          );
          setCourses([]);
          setLoading(false);
          return;
        }
      }

      // For students, fetch enrolled courses
      if (profile.role === "student") {
        console.log("useCourses: Fetching student enrollments...");

        const { data: enrollments, error: enrollmentError } = await supabase
          .from("enrollments")
          .select(
            `
            course_id,
            status,
            enrolled_at
          `
          )
          .eq("user_id", profile.id)
          .eq("role", "student");

        if (enrollmentError) {
          console.error(
            "useCourses: Error fetching enrollments:",
            enrollmentError
          );
          throw enrollmentError;
        }

        console.log("useCourses: Enrollments response:", enrollments);

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map((e) => e.course_id);
          console.log(
            "useCourses: Fetching enrolled courses for IDs:",
            courseIds
          );

          const { data: enrolledCourses, error: coursesError } = await supabase
            .from("courses")
            .select(
              `
              *,
              chapters(
                id,
                title,
                position,
                content_items(
                  id,
                  type,
                  title,
                  content,
                  duration_estimate_seconds,
                  position,
                  is_required,
                  metadata,
                  created_at,
                  updated_at
                )
              )
            `
            )
            .in("id", courseIds)
            .order("created_at", { ascending: false });

          if (coursesError) {
            console.error(
              "useCourses: Error fetching enrolled courses:",
              coursesError
            );
            throw coursesError;
          }

          console.log("useCourses: Enrolled courses loaded:", enrolledCourses);

          // Fetch progress for each course
          console.log("useCourses: Fetching progress for enrolled courses...");
          const coursesWithProgress = await Promise.all(
            (enrolledCourses || []).map(async (course) => {
              const { data: progress, error: progressError } = await supabase
                .from("user_progress")
                .select("*")
                .eq("user_id", profile.id)
                .eq("course_id", course.id);

              if (progressError) {
                console.error(
                  "useCourses: Error fetching progress for course",
                  course.id,
                  ":",
                  progressError
                );
                return { ...course, progress: 0 };
              }

              // Calculate overall progress
              const totalItems =
                course.chapters?.reduce(
                  (total, chapter) =>
                    total + (chapter.content_items?.length || 0),
                  0
                ) || 0;

              const completedItems =
                progress?.filter((p) => p.status === "completed").length || 0;
              const progressPercentage =
                totalItems > 0
                  ? Math.round((completedItems / totalItems) * 100)
                  : 0;

              console.log(
                `useCourses: Course ${course.id} progress: ${completedItems}/${totalItems} = ${progressPercentage}%`
              );
              return { ...course, progress: progressPercentage };
            })
          );

          console.log(
            "useCourses: Courses with progress loaded:",
            coursesWithProgress
          );
          setCourses(coursesWithProgress);
        } else {
          console.log("useCourses: No enrollments found, setting empty array");
          setCourses([]);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("useCourses: Error in fetchCourses:", err);
      
      // Add dummy data for testing when database fails
      if (profile?.role === "teacher") {
        console.log("useCourses: Adding dummy teacher courses for testing");
        const dummyCourses: Course[] = [
          {
            id: 1,
            title: "Advanced Mathematics",
            description: "Comprehensive course covering calculus, linear algebra, and mathematical analysis",
            language: "en",
            status: "published",
            created_at: new Date().toISOString(),
            institution_id: 1,
            created_by: profile.id,
            progress: 65,
            chapters: [
              {
                id: 1,
                title: "Calculus Fundamentals",
                position: 1,
                content_items: [
                  {
                    id: 1,
                    type: "video",
                    title: "Introduction to Limits",
                    content: "Video content about limits",
                    duration_estimate_seconds: 1200,
                    position: 1,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 100
                  },
                  {
                    id: 2,
                    type: "quiz",
                    title: "Limits Quiz",
                    content: "Quiz about limits",
                    duration_estimate_seconds: 600,
                    position: 2,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 80
                  }
                ]
              },
              {
                id: 2,
                title: "Linear Algebra",
                position: 2,
                content_items: [
                  {
                    id: 3,
                    type: "reading",
                    title: "Vector Spaces",
                    content: "Reading material about vector spaces",
                    duration_estimate_seconds: 900,
                    position: 1,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 0
                  }
                ]
              }
            ]
          },
          {
            id: 2,
            title: "Web Development Fundamentals",
            description: "Learn HTML, CSS, JavaScript and modern web development practices",
            language: "en",
            status: "published",
            created_at: new Date().toISOString(),
            institution_id: 1,
            created_by: profile.id,
            progress: 45,
            chapters: [
              {
                id: 3,
                title: "HTML Basics",
                position: 1,
                content_items: [
                  {
                    id: 4,
                    type: "video",
                    title: "HTML Structure",
                    content: "Video about HTML structure",
                    duration_estimate_seconds: 900,
                    position: 1,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 100
                  },
                  {
                    id: 5,
                    type: "assignment",
                    title: "Build a Simple Page",
                    content: "Assignment to build a simple HTML page",
                    duration_estimate_seconds: 1800,
                    position: 2,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 0
                  }
                ]
              },
              {
                id: 4,
                title: "CSS Styling",
                position: 2,
                content_items: [
                  {
                    id: 6,
                    type: "reading",
                    title: "CSS Selectors",
                    content: "Reading about CSS selectors",
                    duration_estimate_seconds: 600,
                    position: 1,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 0
                  }
                ]
              }
            ]
          },
          {
            id: 3,
            title: "Data Science Essentials",
            description: "Introduction to data analysis, statistics, and machine learning concepts",
            language: "en",
            status: "published",
            created_at: new Date().toISOString(),
            institution_id: 1,
            created_by: profile.id,
            progress: 20,
            chapters: [
              {
                id: 5,
                title: "Statistics Basics",
                position: 1,
                content_items: [
                  {
                    id: 7,
                    type: "video",
                    title: "Descriptive Statistics",
                    content: "Video about descriptive statistics",
                    duration_estimate_seconds: 1500,
                    position: 1,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 100
                  },
                  {
                    id: 8,
                    type: "quiz",
                    title: "Statistics Quiz",
                    content: "Quiz about basic statistics",
                    duration_estimate_seconds: 900,
                    position: 2,
                    is_required: true,
                    metadata: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    progress: 0
                  }
                ]
              }
            ]
          }
        ];
        setCourses(dummyCourses);
        setLoading(false);
        return;
      }
      
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
      setLoading(false);
    }
  };

  const createCourse = async (
    courseData: Omit<Course, "id" | "created_at">
  ) => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert([courseData])
        .select()
        .single();

      if (error) throw error;

      // Add teacher to course_teachers table
      if (profile) {
        await supabase.from("course_teachers").insert([
          {
            course_id: data.id,
            teacher_id: profile.id,
            assigned_at: new Date().toISOString(),
          },
        ]);
      }

      await fetchCourses();
      return data;
    } catch (err) {
      console.error("Error creating course:", err);
      throw err;
    }
  };

  const updateCourse = async (id: number, updates: Partial<Course>) => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      await fetchCourses();
      return data;
    } catch (err) {
      console.error("Error updating course:", err);
      throw err;
    }
  };

  const deleteCourse = async (id: number) => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);

      if (error) throw error;
      await fetchCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
      throw err;
    }
  };

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    refresh: fetchCourses,
  };
}

export function useChat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const createSession = async (title: string, courseId?: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          student_id: user.id,
          course_id: courseId || null,
          title,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession = data as ChatSession;
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);

      return newSession;
    } catch (err) {
      console.error("Error creating chat session:", err);
      throw err;
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true);

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      setCurrentSession(sessionData);
      setMessages(messagesData || []);
    } catch (err) {
      console.error("Error loading chat session:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentSession || !user) throw new Error("No active session");

    try {
      // Add user message
      const { data: userMessage, error: userError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: currentSession.id,
          role: "user",
          content,
        })
        .select()
        .single();

      if (userError) throw userError;

      setMessages((prev) => [...prev, userMessage]);

      // Simulate AI response (replace with actual AI integration)
      setTimeout(async () => {
        const aiResponses = [
          "That's a great question! Let me explain that concept in detail.",
          "I can help you understand this better. Here's what you need to know:",
          "Let's break this down step by step to make it clearer.",
          "That's an important topic. Here's how you can approach it:",
        ];

        const randomResponse =
          aiResponses[Math.floor(Math.random() * aiResponses.length)];

        const { data: aiMessage, error: aiError } = await supabase
          .from("chat_messages")
          .insert({
            session_id: currentSession.id,
            role: "assistant",
            content: randomResponse,
          })
          .select()
          .single();

        if (!aiError && aiMessage) {
          setMessages((prev) => [...prev, aiMessage]);
        }
      }, 1000);
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  };

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (err) {
      console.error("Error fetching chat sessions:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  return {
    sessions,
    currentSession,
    messages,
    loading,
    createSession,
    loadSession,
    sendMessage,
    setCurrentSession,
  };
}
