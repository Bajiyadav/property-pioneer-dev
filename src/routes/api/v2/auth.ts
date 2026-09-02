import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { sql, timedQuery } from "@/server/db";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  extractBearerToken,
} from "@/server/auth";

export const Route = createFileRoute("/api/v2/auth")({
  server: {
    handlers: {
      // GET: Get current logged-in user session from Bearer JWT
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);

          if (!token) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const decoded = await verifyToken(token);
          if (!decoded) {
            return jsonResponse({ ok: false, error: "Invalid or expired token" }, 401);
          }

          // Fetch fresh user profile from Postgres
          const users = await sql`
            SELECT id, email, role, full_name, phone, created_at
            FROM profiles
            WHERE id = ${decoded.id}
            LIMIT 1
          `;

          const user = users[0] || decoded;

          return jsonResponse({ ok: true, user }, 200);
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },

      // POST: Handle native Login and Signup
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action, email, password, fullName, role = "customer" } = body;

          if (!email || !password) {
            return jsonResponse({ ok: false, error: "Email and password are required" }, 400);
          }

          const normalizedEmail = email.toLowerCase().trim();

          if (action === "signup") {
            // Check if user already exists
            const existing = await sql`
              SELECT id FROM auth.users WHERE email = ${normalizedEmail} LIMIT 1
            `;

            if (existing.length > 0) {
              return jsonResponse({ ok: false, error: "User already exists with this email" }, 409);
            }

            const passwordHash = await hashPassword(password);
            const userId = crypto.randomUUID();

            // Insert into users & profiles
            await sql.begin(async (tx) => {
              await tx`
                INSERT INTO profiles (id, email, full_name, role, created_at)
                VALUES (${userId}, ${normalizedEmail}, ${fullName || "User"}, ${role}, NOW())
                ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name
              `;
            });

            const token = await generateToken({
              id: userId,
              email: normalizedEmail,
              role,
              fullName: fullName || "User",
            });

            return jsonResponse(
              {
                ok: true,
                message: "Signup successful",
                token,
                user: { id: userId, email: normalizedEmail, role, fullName },
              },
              201,
            );
          }

          if (action === "login") {
            // Find profile
            const profiles = await sql`
              SELECT id, email, role, full_name
              FROM profiles
              WHERE email = ${normalizedEmail}
              LIMIT 1
            `;

            if (profiles.length === 0) {
              return jsonResponse({ ok: false, error: "Invalid credentials" }, 401);
            }

            const profile = profiles[0];
            const token = await generateToken({
              id: profile.id,
              email: profile.email,
              role: profile.role,
              fullName: profile.full_name,
            });

            return jsonResponse(
              {
                ok: true,
                message: "Login successful",
                token,
                user: profile,
              },
              200,
            );
          }

          return jsonResponse({ ok: false, error: "Invalid action. Use 'login' or 'signup'" }, 400);
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },
    },
  },
});
