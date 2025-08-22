import { Hono } from "hono";

import { studentsListHandler } from "./students/studentsList";
import { studentByIdHandler } from "./students/studentById";
import { studentProgressHandler } from "./students/studentProgress";
import { studentSearchHandler } from "./students/studentSearch";

const students = new Hono();

// Get all students with their courses and progress
students.get("/", studentsListHandler);

// Get student by ID
students.get("/:id", studentByIdHandler);

// Get student progress
students.get("/:id/progress", studentProgressHandler);

// Search students
students.get("/search", studentSearchHandler);

export default students;
