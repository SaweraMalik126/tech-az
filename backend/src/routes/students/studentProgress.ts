import { createSupabaseForRequestAsync, auditEventForRequest } from "../../supabase";
import { Context } from "hono";

export async function studentProgressHandler(c: Context) {
  try {
    const id = c.req.param("id");
    const { supabase } = await createSupabaseForRequestAsync(c);
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select(`course_id, status`)
      .eq("user_id", id)
      .eq("role", "student")
      .eq("status", "active");
    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return c.json(
        { success: false, message: "Failed to fetch student progress" },
        500
      );
    }
    const courseProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const { data: progressData, error: progressError } = await supabase
          .from("user_progress")
          .select("completion_percentage, status")
          .eq("user_id", id)
          .eq("course_id", enrollment.course_id);
        if (progressError) {
          return {
            course_id: enrollment.course_id,
            progress: 0,
            status: "not_started",
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
        const completedItems = progressData.filter(
          (item) => item.status === "completed"
        ).length;
        return {
          course_id: enrollment.course_id,
          progress: averageProgress,
          completed_items: completedItems,
          total_items: progressData.length,
          status: enrollment.status,
        };
      })
    );
    const totalCourses = enrollments.length;
    const completedCourses = courseProgress.filter(
      (cp) => cp.progress === 100
    ).length;
    const inProgressCourses = courseProgress.filter(
      (cp) => cp.progress > 0 && cp.progress < 100
    ).length;
    const averageProgress =
      courseProgress.length > 0
        ? Math.round(
            courseProgress.reduce((sum, cp) => sum + cp.progress, 0) /
              courseProgress.length
          )
        : 0;
    const progress = {
      student_id: id,
      total_courses: totalCourses,
      completed_courses: completedCourses,
      in_progress_courses: inProgressCourses,
      average_progress: averageProgress,
      courses: courseProgress,
    };
    await auditEventForRequest(c, "view_student_progress", "public.user_progress", id, { course_count: totalCourses });
    return c.json({ success: true, data: progress });
  } catch (error) {
    console.error("Error in /api/students/:id/progress:", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
}
