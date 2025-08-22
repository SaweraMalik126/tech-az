import { Hono } from "hono";
import { cors } from "hono/cors";
import { students, courses, health } from "./routes";
import { v4 as uuidv4 } from "uuid";
import { createSupabaseForRequestAsync, auditEventForRequest } from "./supabase";
const app = new Hono();

// CORS — include your frontend on 8080
app.use(
  "/*",
  cors({
    origin: ["http://localhost:8080"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Testing-only: Upload avatar without client session (uses service role if available)
app.post("/api/testing/upload-avatar", async (c) => {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return c.json({
        success: false,
        message:
          "Backend missing SUPABASE_SERVICE_ROLE_KEY. Set it in the backend environment to enable testing uploads without client auth.",
      }, 400);
    }
    const { supabaseAdmin } = await createSupabaseForRequestAsync(c);
    const body = await c.req.json<{ userId: string; fileBase64?: string; fileUrl?: string; filename?: string }>();
    const { userId, fileBase64, fileUrl, filename } = body || ({} as any);

    if (!userId) return c.json({ success: false, message: "userId is required" }, 400);
    if (!fileBase64 && !fileUrl) return c.json({ success: false, message: "Provide fileBase64 or fileUrl" }, 400);

    let arrayBuffer: ArrayBuffer;
    let contentType = "image/png";

    if (fileBase64) {
      const commaIdx = fileBase64.indexOf(",");
      const raw = commaIdx >= 0 ? fileBase64.slice(commaIdx + 1) : fileBase64;
      const mimeMatch = /^data:(.*?);base64/.exec(fileBase64);
      if (mimeMatch && mimeMatch[1]) contentType = mimeMatch[1];
      const buffer = Buffer.from(raw, "base64");
      arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } else {
      const resp = await fetch(fileUrl!);
      if (!resp.ok) return c.json({ success: false, message: `Fetch failed: ${resp.status}` }, 400);
      contentType = resp.headers.get("content-type") || contentType;
      arrayBuffer = await resp.arrayBuffer();
    }

    const extFromName = (filename || "").split(".").pop()?.toLowerCase();
    const extFromType = contentType.split("/").pop() || "png";
    const ext = (extFromName || extFromType || "png").replace(/[^a-z0-9]/g, "");
    const objectPath = `${userId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(objectPath, arrayBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) return c.json({ success: false, message: uploadError.message }, 400);

    const { data: publicData } = supabaseAdmin.storage.from("avatars").getPublicUrl(objectPath);
    const publicUrl = publicData.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ profile_picture_url: publicUrl })
      .eq("id", userId);
    if (updateError) return c.json({ success: false, message: updateError.message }, 400);

    await auditEventForRequest(c, "upload_avatar", "public.users", userId, { object_path: objectPath });
    return c.json({ success: true, publicUrl });
  } catch (err: any) {
    console.error("/api/testing/upload-avatar error:", err);
    return c.json({ success: false, message: err?.message || "Upload failed" }, 500);
  }
});
// Health check
app.route("/", health);

// Student routes
app.route("/api/students", students);

// Course routes
app.route("/api/courses", courses);

// Errors & 404 (unchanged)
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ success: false, message: "Internal server error" }, 500);
});

app.notFound((c) =>
  c.json({ success: false, message: "Endpoint not found" }, 404)
);

// 🔊 Logs
const port = Number(process.env.PORT || 3001);
console.log(`🚀 TeachMe.ai Backend (auto-serve) on port ${port}`);
console.log(
  `📚 API endpoints:\n   GET  /api/students\n   GET  /api/students/:id\n   GET  /api/courses/:courseId/students\n   GET  /api/students/:id/progress\n   GET  /api/students/search?q=query\n`
);

// 👇 Let Bun auto-serve in dev (no Bun.serve here)
export default {
  port,
  fetch: app.fetch,
};
