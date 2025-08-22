import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Context } from "hono";
import { v4 as uuidv4 } from "uuid";

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

// ----- Audit context & helpers -----
export interface RequestAuditContext {
  actorUserId?: string;
  actorRole?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  requestId: string;
}

function base64UrlDecode(input: string): string {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4;
  if (pad) input += "=".repeat(4 - pad);
  return Buffer.from(input, "base64").toString("utf8");
}

function parseJwtClaims(authorizationHeader?: string): { sub?: string; role?: string } {
  try {
    if (!authorizationHeader) return {};
    const token = authorizationHeader.replace(/^[Bb]earer\s+/, "").trim();
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { sub: payload.sub, role: payload.role };
  } catch {
    return {};
  }
}

export function buildRequestAuditContext(c: Context): RequestAuditContext {
  const authHeader = c.req.header("authorization") || c.req.header("Authorization");
  const { sub, role } = parseJwtClaims(authHeader);
  const forwardedFor = c.req.header("x-forwarded-for") || c.req.header("X-Forwarded-For") || "";
  const ip = (c.req.header("x-real-ip") || c.req.header("X-Real-Ip") || forwardedFor.split(",")[0] || "").trim() || undefined;
  const userAgent = c.req.header("user-agent") || c.req.header("User-Agent") || undefined;
  const requestId = (c.req.header("x-request-id") || c.req.header("X-Request-Id") || uuidv4()).toString();
  const sessionId = (c.req.header("x-session-id") || c.req.header("X-Session-Id") || "").trim() || undefined;

  return {
    actorUserId: sub || undefined,
    actorRole: role || undefined,
    sessionId,
    ip,
    userAgent,
    requestId,
  };
}

export function createSupabaseForRequest(c: Context): { supabase: SupabaseClient; supabaseAdmin: SupabaseClient; ctx: RequestAuditContext } {
  const ctx = buildRequestAuditContext(c);
  const authHeader = c.req.header("authorization") || c.req.header("Authorization");

  const commonHeaders: Record<string, string> = {
    "x-request-id": ctx.requestId,
    "x-session-id": ctx.sessionId || "",
    "x-actor-user-id": ctx.actorUserId || "",
    "x-actor-role": ctx.actorRole || "",
    "x-real-ip": ctx.ip || "",
    "user-agent": ctx.userAgent || "",
  };

  const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        ...commonHeaders,
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    },
    auth: { persistSession: false, detectSessionInUrl: false },
  });

  const adminSupabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          ...commonHeaders,
          "x-service-role": "true",
        },
      },
      auth: { persistSession: false, detectSessionInUrl: false },
    }
  );

  return { supabase: userSupabase, supabaseAdmin: adminSupabase, ctx };
}

export async function auditEventForRequest(
  c: Context,
  action: string,
  targetTable: string,
  targetId: string,
  details?: Record<string, any>
): Promise<void> {
  const { supabaseAdmin, ctx } = createSupabaseForRequest(c);
  await supabaseAdmin.from("app.audit_log").insert({
    action,
    target_table: targetTable,
    target_id: String(targetId),
    actor_user_id: ctx.actorUserId || null,
    actor_role: ctx.actorRole || null,
    session_id: ctx.sessionId || null,
    ip_address: ctx.ip || null,
    user_agent: ctx.userAgent || null,
    request_id: ctx.requestId,
    details: details ? details : null,
    old_values: null,
    new_values: null,
  });
}
