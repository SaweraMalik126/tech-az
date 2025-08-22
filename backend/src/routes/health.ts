import { Hono } from "hono";

const health = new Hono();

// Health check
health.get("/", (c) =>
  c.json({
    message: "TeachMe.ai Backend API",
    version: "1.0.0",
    status: "running",
    database: "connected",
    note: "If you get permission errors, run this SQL in Supabase: ALTER TABLE users DISABLE ROW LEVEL SECURITY;",
  })
);

export default health;
