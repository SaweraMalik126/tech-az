import { supabase, type StudentCourse } from "../../supabase";
import { Context } from "hono";

export async function studentByIdHandler(c: Context) {
  try {
    const id = c.req.param("id");
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
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    if (studentError || !student) {
      return c.json({ success: false, message: "Student not found" }, 404);
    }
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select(`course_id, status, enrolled_at`)
      .eq("user_id", id)
      .eq("role", "student")
      .eq("status", "active");
    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return c.json(
        { success: false, message: "Failed to fetch student data" },
        500
      );
    }
    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("id, title, description, status")
          .eq("id", enrollment.course_id)
          .single();
        if (courseError || !course) return null;
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("completion_percentage")
          .eq("user_id", id)
          .eq("course_id", enrollment.course_id);
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
          id: course.id,
          title: course.title,
          progress: averageProgress,
          status: enrollment.status,
        };
      })
    );
    const studentWithCourses = {
      ...student,
      courses: courses.filter(Boolean) as StudentCourse[],
    };
    return c.json({ success: true, data: studentWithCourses });
  } catch (error) {
    console.error("Error in /api/students/:id:", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
}
