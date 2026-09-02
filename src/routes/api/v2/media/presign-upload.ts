import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { verifyToken, extractBearerToken } from "@/server/auth";
import { sql } from "@/server/db";
import { createPresignedUploadUrl, type UploadFolder } from "@/server/storage";

export const Route = createFileRoute("/api/v2/media/presign-upload")({
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
          const { folder, fileName, contentType, fileSizeBytes, entityId } = body;

          if (!folder || !fileName || !contentType || typeof fileSizeBytes !== "number") {
            return jsonResponse(
              {
                ok: false,
                error: "folder, fileName, contentType, and fileSizeBytes are required",
              },
              400,
            );
          }

          // Authorization Guard: Check entity ownership if an entityId is provided
          if (folder === "property-photos" || folder === "property-videos") {
            if (entityId) {
              const properties = await sql`
                SELECT id, owner_id FROM properties WHERE id = ${entityId} LIMIT 1
              `;
              if (
                properties.length > 0 &&
                properties[0].owner_id !== user.id &&
                user.role !== "admin"
              ) {
                return jsonResponse(
                  {
                    ok: false,
                    error: "Forbidden: You do not have permission to upload media for this listing",
                  },
                  403,
                );
              }
            }
          }

          if (folder === "rental-agreements") {
            if (entityId) {
              const agreements = await sql`
                SELECT id, user_id FROM rental_agreements WHERE id = ${entityId} LIMIT 1
              `;
              if (
                agreements.length > 0 &&
                agreements[0].user_id !== user.id &&
                user.role !== "admin"
              ) {
                return jsonResponse(
                  {
                    ok: false,
                    error:
                      "Forbidden: You do not have permission to upload documents for this agreement",
                  },
                  403,
                );
              }
            }
          }

          // Generate server-controlled pre-signed upload URL
          const result = await createPresignedUploadUrl({
            folder: folder as UploadFolder,
            fileName,
            contentType,
            fileSizeBytes,
            userId: user.id,
            entityId,
          });

          return jsonResponse(
            {
              ok: true,
              data: result,
            },
            200,
          );
        } catch (error: any) {
          return jsonResponse(
            {
              ok: false,
              error: error?.message || "Failed to generate pre-signed upload URL",
            },
            400,
          );
        }
      },
    },
  },
});
