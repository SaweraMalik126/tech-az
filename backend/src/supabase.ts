import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zegmfhhxscrrjweuxleq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplZ21maGh4c2Nycmp3ZXV4bGVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNzQ0NTksImV4cCI6MjA3MDY1MDQ1OX0.LEM-Gh23C9ke9AcJcLDnTCwqm6-BSOKjdfmUOo4Giew";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client (uses service role key if provided) for backend-only operations like Storage uploads during tests
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
);

// Database types based on your schema
export interface Student {
  id: string;
  email: string;
  full_name: string;
  gender: string;
  phone_number: string;
  profile_picture_url: string;
  bio: string;
  language_preference: string;
  created_at: string;
  courses: StudentCourse[];
}

export interface StudentCourse {
  id: number;
  title: string;
  progress: number;
  status: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
}

export interface Enrollment {
  id: number;
  user_id: string;
  course_id: number;
  status: string;
  enrolled_at: string;
}
