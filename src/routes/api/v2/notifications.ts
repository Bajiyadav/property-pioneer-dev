import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { verifyToken, extractBearerToken } from "@/server/auth";
import { sql } from "@/server/db";

export const Route = createFileRoute("/api/v2/notifications")({
  server: {
    handlers: {
      // GET: Get notifications for authenticated user
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);

          if (!token) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const user = await verifyToken(token);
          if (!user) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const rows = await sql`
            SELECT id, title, body, kind, read_at, created_at
            FROM notifications
            WHERE user_id = ${user.id}
            ORDER BY created_at DESC
            LIMIT 50
          `;

          const unreadCount = rows.filter((r) => !r.read_at).length;

          return jsonResponse({ ok: true, data: rows, unreadCount }, 200);
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },

      // PATCH: Mark notification as read
      PATCH: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);

          if (!token) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const user = await verifyToken(token);
          if (!user) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const body = await request.json();
          const { notificationId, markAllRead } = body;

          if (markAllRead) {
            await sql`
              UPDATE notifications
              SET read_at = NOW()
              WHERE user_id = ${user.id} AND read_at IS NULL
            `;
            return jsonResponse({ ok: true, message: "All notifications marked as read" }, 200);
          }

          if (!notificationId) {
            return jsonResponse({ ok: false, error: "notificationId is required" }, 400);
          }

          await sql`
            UPDATE notifications
            SET read_at = NOW()
            WHERE id = ${notificationId} AND user_id = ${user.id}
          `;

          return jsonResponse({ ok: true, message: "Notification marked as read" }, 200);
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },
    },
  },
});
