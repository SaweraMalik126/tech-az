import { createSupabaseForRequest, auditEventForRequest, type Student } from "../../supabase";
import { Context } from "hono";

export async function courseStudentsHandler(c: Context) {
  try {
    const courseId = parseInt(c.req.param("courseId"));
    const { supabase } = createSupabaseForRequest(c);
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select(`user_id, status, enrolled_at`)
      .eq("course_id", courseId)
      .eq("role", "student")
      .eq("status", "active");
    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return c.json(
        { success: false, message: "Failed to fetch course students" },
        500
      );
    }
    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        const { data: student, error: studentError } = await supabase
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
          .eq("id", enrollment.user_id)
          .is("deleted_at", null)
          .single();
        if (studentError || !student) return null;
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("completion_percentage")
          .eq("user_id", enrollment.user_id)
          .eq("course_id", courseId);
        const totalProgress =
          progressData?.reduce(
            (sum, item) => sum + (item.completion_percentage || 0),
            0
          ) || 0;
        const averageProgress =
          progressData && progressData.length > 0
            ? Math.round(totalProgress / progressData.length)
            : 0;
        return {
          ...student,
          courses: [
            {
              id: courseId,
              title: "Current Course",
              progress: averageProgress,
              status: enrollment.status,
            },
          ],
        };
      })
    );
    const validStudents = students.filter(Boolean) as Student[];
    await auditEventForRequest(c, "view_course_students", "public.courses", String(courseId), {
      count: validStudents.length,
    });
    return c.json({
      success: true,
      data: validStudents,
      count: validStudents.length,
    });
  } catch (error) {
    console.error("Error in /api/courses/:courseId/students:", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
}
