import { supabase } from "../../supabase";
import { Context } from "hono";

export async function studentSearchHandler(c: Context) {
  try {
    const query = c.req.query("q")?.toLowerCase();
    if (!query) {
      return c.json(
        { success: false, message: "Search query is required" },
        400
      );
    }
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
      .or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%,bio.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });
    if (studentsError) {
      console.error("Error searching students:", studentsError);
      return c.json(
        { success: false, message: "Failed to search students" },
        500
      );
    }
    const studentsWithCourses = await Promise.all(
      students.map(async (student) => {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id, status")
          .eq("user_id", student.id)
          .eq("role", "student")
          .eq("status", "active");
        const courses =
          enrollments?.map((enrollment) => ({
            id: enrollment.course_id,
            title: `Course ${enrollment.course_id}`,
            progress: 0,
            status: enrollment.status,
          })) || [];
        return { ...student, courses };
      })
    );
    return c.json({
      success: true,
      data: studentsWithCourses,
      count: studentsWithCourses.length,
    });
  } catch (error) {
    console.error("Error in /api/students/search:", error);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }
}
