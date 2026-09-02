import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { verifyToken, extractBearerToken } from "@/server/auth";
import { createPresignedDownloadUrl } from "@/server/storage";

export const Route = createFileRoute("/api/v2/media/presign-download")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);

          if (!token) {
            return jsonResponse(
              { ok: false, error: "Unauthorized: Missing authorization header" },
              401,
            );
          }

          const user = await verifyToken(token);
          if (!user) {
            return jsonResponse(
              { ok: false, error: "Unauthorized: Invalid or expired token" },
              401,
            );
          }

          const body = await request.json();
          const { objectKey } = body;

          if (!objectKey || typeof objectKey !== "string") {
            return jsonResponse({ ok: false, error: "objectKey is required" }, 400);
          }

          // Authorization Guard: Verify that user owns the document path or is admin
          // Keys are structured as: {folder}/{userId}/...
          const pathParts = objectKey.split("/");
          const documentOwnerId = pathParts[1];

          if (documentOwnerId !== user.id && user.role !== "admin") {
            return jsonResponse(
              {
                ok: false,
                error: "Forbidden: You are not authorized to access this private document",
              },
              403,
            );
          }

          const downloadUrl = await createPresignedDownloadUrl(objectKey, 300); // 5 minutes TTL

          return jsonResponse(
            {
              ok: true,
              downloadUrl,
              expiresInSeconds: 300,
            },
            200,
          );
        } catch (error: any) {
          return jsonResponse(
            {
              ok: false,
              error: error?.message || "Failed to generate pre-signed download URL",
            },
            400,
          );
        }
      },
    },
  },
});
