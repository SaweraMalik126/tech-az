import { createSupabaseForRequestAsync, auditEventForRequest, type Student, type StudentCourse } from "../../supabase";
import { Context } from "hono";

export async function studentsListHandler(c: Context) {
  try {
    const { supabase } = await createSupabaseForRequestAsync(c);
    const { data: students, error: studentsError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        gender,
        phone_number,
        profile_picture_url,
        bio,
        language_preference,
        created_at
      `
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (studentsError) {
      console.error("Error fetching students:", studentsError);
      return c.json(
        { success: false, message: "Failed to fetch students" },
        500
      );
    }

    const studentsWithCourses = await Promise.all(
      students.map(async (student) => {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select(`course_id, status, enrolled_at`)
          .eq("user_id", student.id)
          .eq("role", "student")
          .eq("status", "active");

        if (enrollmentsError) {
          console.error("Error fetching enrollments:", enrollmentsError);
          return { ...student, courses: [] };
        }

        const courses = await Promise.all(
          enrollments.map(async (enrollment) => {
            const { data: course, error: courseError } = await supabase
              .from("courses")
              .select("id, title, description, status")
              .eq("id", enrollment.course_id)
              .single();
            if (courseError || !course) return null;
            const { data: progressData, error: progressError } = await supabase
              .from("user_progress")
              .select("completion_percentage")
              .eq("user_id", student.id)
              .eq("course_id", enrollment.course_id);
            if (progressError) {
              console.error("Error fetching progress:", progressError);
              return {
                id: course.id,
                title: course.title,
                progress: 0,
                status: enrollment.status,
              };
            }
            const totalProgress = progressData.reduce(
              (sum, item) => sum + (item.completion_percentage || 0),
              0
            );
            const averageProgress =
              progressData.length > 0
                ? Math.round(totalProgress / progressData.length)
                : 0;
            return {
              id: course.id,
              title: course.title,
              progress: averageProgress,
              status: enrollment.status,
            };
          })
        );
        return {
          ...student,
          courses: courses.filter(Boolean) as StudentCourse[],
        };
      })
    );
    await auditEventForRequest(c, "list_students", "public.users", "all", {
      count: studentsWithCourses.length,
    });
    return c.json({
      success: true,
      data: studentsWithCourses,
      count: studentsWithCourses.length,
    });
  } catch (error) {
    console.error("Error in /api/students:", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
}
