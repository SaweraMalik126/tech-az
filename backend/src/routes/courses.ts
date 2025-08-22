import { Hono } from "hono";

import { courseStudentsHandler } from "./courses/courseStudents";

const courses = new Hono();

// Get students by course
courses.get("/:courseId/students", courseStudentsHandler);

export default courses;
