import { createFileRoute } from "@tanstack/react-router";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { sql } from "@/server/db";
import {
  type AuthUser,
  hashPassword,
  verifyPassword,
  verifyToken,
  extractBearerToken,
  refreshTokenTtlSeconds,
} from "@/server/auth";
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllSessions,
  type TokenPair,
} from "@/server/tokenLifecycle";
import { postgresTokenStore } from "@/server/tokenStore";

/**
 * Native auth for the web backend: login, signup, refresh, logout, logout-all.
 *
 * Two rules this file exists to enforce:
 *
 * 1. A password is VERIFIED on login. The previous version looked the profile
 *    up by email and issued a token — any email, any password, any role,
 *    admin included. Credentials now live in `users.password_hash` (bcrypt),
 *    the same column the Java backend verifies, so both backends agree on
 *    what a valid login is.
 *
 * 2. A caller does not choose their own authority. Self-service signup can
 *    create a customer or an owner; every other requested role — "admin",
 *    "staff", anything invented — is recorded in the audit log and downgraded.
 *
 * Session lifecycle is the shared `refresh_tokens` authority (rotation, reuse
 * detection, family revocation) — see tokenLifecycle.ts. For browsers the
 * refresh token also travels as an HttpOnly SameSite=Strict cookie scoped to
 * this route, so web clients never need to put it in script-readable storage;
 * Flutter keeps sending it in the JSON body. SameSite=Strict means a
 * cross-site page cannot make the browser present the cookie at all, which is
 * the CSRF story for the one cookie this API uses.
 */

const REFRESH_COOKIE = "seedha_refresh";

/** Roles a caller may claim for themselves. Everything else becomes customer. */
const SELF_SERVICE_ROLES = new Set(["customer", "seeker", "owner"]);

/** Sliding-window limits enforced by counting audit rows — shared across instances. */
const LOGIN_WINDOW_SECONDS = 600;
const MAX_FAILURES_PER_IP = 20;
const MAX_FAILURES_PER_EMAIL = 10;

function refreshCookie(value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return (
    `${REFRESH_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/api/v2/auth` +
    `; Max-Age=${maxAgeSeconds}${secure}`
  );
}

function readRefreshCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === REFRESH_COOKIE) return rest.join("=") || null;
  }
  return null;
}

/** Best-effort security audit row. Auth never fails because auditing did. */
async function audit(
  eventType: string,
  userId: string | null,
  request: Request,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    await sql`
      INSERT INTO security_audit_logs (event_type, user_id, ip_address, user_agent, details)
      VALUES (${eventType}, ${userId}, ${getClientIp(request)},
              ${getUserAgent(request)}, ${JSON.stringify(details)})
    `;
  } catch {
    // Audit storage being down is itself observable elsewhere; swallowing here
    // keeps login working during an outage.
  }
}

async function failureCount(column: "ip_address" | "details", value: string): Promise<number> {
  const since = new Date(Date.now() - LOGIN_WINDOW_SECONDS * 1000).toISOString();
  const rows =
    column === "ip_address"
      ? await sql`
          SELECT count(*)::int AS n FROM security_audit_logs
          WHERE event_type = 'LOGIN_FAILURE' AND ip_address = ${value} AND created_at > ${since}
        `
      : await sql`
          SELECT count(*)::int AS n FROM security_audit_logs
          WHERE event_type = 'LOGIN_FAILURE' AND details->>'email' = ${value} AND created_at > ${since}
        `;
  return rows[0]?.n ?? 0;
}

async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const rows = await sql`
    SELECT p.id, p.email, p.role, p.full_name
    FROM profiles p WHERE p.id = ${userId} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    email: rows[0].email,
    role: rows[0].role || "customer",
    fullName: rows[0].full_name || "",
  };
}

function pairResponse(
  pair: TokenPair,
  user: { id: string; email: string; full_name: string; role: string },
  status: number,
  message: string,
) {
  return jsonResponse(
    {
      ok: true,
      message,
      token: pair.token,
      refresh_token: pair.refreshToken,
      expires_in: pair.expiresIn,
      user,
    },
    status,
    { "Set-Cookie": refreshCookie(pair.refreshToken, refreshTokenTtlSeconds()) },
  );
}

export const Route = createFileRoute("/api/v2/auth")({
  server: {
    handlers: {
      // GET: Get current logged-in user session from Bearer JWT
      GET: async ({ request }) => {
        try {
          const token = extractBearerToken(request.headers.get("Authorization"));
          if (!token) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const decoded = await verifyToken(token);
          if (!decoded) {
            return jsonResponse({ ok: false, error: "Invalid or expired token" }, 401);
          }

          const users = await sql`
            SELECT id, email, role, full_name, phone, created_at
            FROM profiles
            WHERE id = ${decoded.id}
            LIMIT 1
          `;

          return jsonResponse({ ok: true, user: users[0] || decoded }, 200);
        } catch {
          return jsonResponse({ ok: false, error: "Session lookup failed" }, 500);
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const action = String(body.action || "login").toLowerCase();
          const deviceInfo = getUserAgent(request).slice(0, 255);

          // ---- refresh -------------------------------------------------
          if (action === "refresh") {
            const raw = body.refreshToken || body.refresh_token || readRefreshCookie(request);
            if (!raw || typeof raw !== "string") {
              return jsonResponse({ ok: false, error: "Refresh token is required" }, 400);
            }

            const result = await rotateRefreshToken(
              postgresTokenStore,
              raw,
              loadAuthUser,
              deviceInfo,
            );

            if (!result.ok) {
              if (result.reason === "reuse_detected") {
                await audit("TOKEN_REUSE_DETECTED", null, request, {});
                return jsonResponse(
                  {
                    ok: false,
                    error: "Token reuse detected. All sessions in this family have been revoked.",
                  },
                  401,
                  { "Set-Cookie": refreshCookie("", 0) },
                );
              }
              await audit("REFRESH_FAILED", null, request, { reason: result.reason });
              return jsonResponse(
                { ok: false, error: "Invalid or expired refresh token. Please log in again." },
                401,
                { "Set-Cookie": refreshCookie("", 0) },
              );
            }

            await audit("TOKEN_REFRESH_SUCCESS", result.user.id, request, {
              family_id: result.familyId,
            });
            return pairResponse(
              result.pair,
              {
                id: result.user.id,
                email: result.user.email,
                full_name: result.user.fullName,
                role: result.user.role,
              },
              200,
              "Token refreshed",
            );
          }

          // ---- logout --------------------------------------------------
          if (action === "logout") {
            const raw = body.refreshToken || body.refresh_token || readRefreshCookie(request);
            if (raw && typeof raw === "string") {
              await revokeRefreshToken(postgresTokenStore, raw);
            }
            return jsonResponse({ ok: true, message: "Logged out" }, 200, {
              "Set-Cookie": refreshCookie("", 0),
            });
          }

          if (action === "logout-all" || action === "logout_all") {
            const token = extractBearerToken(request.headers.get("Authorization"));
            const decoded = token ? await verifyToken(token) : null;
            if (!decoded) {
              // Revoking every session is a bigger action than ending one, so it
              // requires a live access token, not just a refresh token.
              return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
            }
            await revokeAllSessions(postgresTokenStore, decoded.id);
            await audit("LOGOUT_ALL", decoded.id, request, {});
            return jsonResponse({ ok: true, message: "All sessions revoked" }, 200, {
              "Set-Cookie": refreshCookie("", 0),
            });
          }

          // ---- credentials required below ------------------------------
          const { email, password, fullName, phone } = body;
          if (!email || !password) {
            return jsonResponse({ ok: false, error: "Email and password are required" }, 400);
          }
          const normalizedEmail = String(email).toLowerCase().trim();

          if (action === "signup") {
            // The caller's requested role is honoured only from the allowlist.
            const requestedRole = String(body.role || "customer").toLowerCase();
            const role = SELF_SERVICE_ROLES.has(requestedRole)
              ? requestedRole === "seeker"
                ? "customer"
                : requestedRole
              : "customer";
            if (role !== requestedRole) {
              await audit("SIGNUP_ROLE_DOWNGRADED", null, request, {
                requested: requestedRole.slice(0, 32),
              });
            }

            if (String(password).length < 8) {
              return jsonResponse(
                { ok: false, error: "Password must be at least 8 characters" },
                400,
              );
            }

            const existing = await sql`
              SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1
            `;
            if (existing.length > 0) {
              return jsonResponse(
                { ok: false, error: "An account with this email already exists" },
                409,
              );
            }

            const passwordHash = await hashPassword(String(password));
            const userId = crypto.randomUUID();
            const name = String(fullName || "User").slice(0, 200);

            // users carries the credential, profiles the public identity — one
            // transaction so neither exists without the other.
            await sql.begin(async (tx) => {
              await tx`
                INSERT INTO users (id, email, password_hash, full_name, phone, role)
                VALUES (${userId}, ${normalizedEmail}, ${passwordHash}, ${name},
                        ${phone || null}, ${role.toUpperCase()})
              `;
              await tx`
                INSERT INTO profiles (id, email, full_name, role, created_at)
                VALUES (${userId}, ${normalizedEmail}, ${name}, ${role}, NOW())
                ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name
              `;
            });

            const user: AuthUser = { id: userId, email: normalizedEmail, role, fullName: name };
            const pair = await issueTokenPair(postgresTokenStore, user, { deviceInfo });

            await audit("SIGNUP_SUCCESS", userId, request, { role });
            return pairResponse(
              pair,
              { id: userId, email: normalizedEmail, full_name: name, role },
              201,
              "Signup successful",
            );
          }

          if (action === "login") {
            const ip = getClientIp(request);
            if (
              (await failureCount("ip_address", ip)) >= MAX_FAILURES_PER_IP ||
              (await failureCount("details", normalizedEmail)) >= MAX_FAILURES_PER_EMAIL
            ) {
              await audit("LOGIN_RATE_LIMITED", null, request, {});
              return jsonResponse(
                { ok: false, error: "Too many failed attempts. Please try again later." },
                429,
                { "Retry-After": String(LOGIN_WINDOW_SECONDS) },
              );
            }

            const users = await sql`
              SELECT u.id, u.email, u.password_hash, u.full_name,
                     COALESCE(p.role, u.role) AS role
              FROM users u
              LEFT JOIN profiles p ON p.id = u.id
              WHERE u.email = ${normalizedEmail}
              LIMIT 1
            `;

            // A miss still burns a bcrypt comparison so response time does not
            // reveal whether the email has an account.
            const record = users[0];
            const passwordOk = await verifyPassword(
              String(password),
              record?.password_hash ||
                "$2a$10$C6UzMDM.H6dfI/f/IKcEeO7ZDLQwRSk5uPjegLEXslJ7EmnjPJXXX",
            );

            if (!record || !passwordOk) {
              await audit("LOGIN_FAILURE", null, request, { email: normalizedEmail });
              return jsonResponse({ ok: false, error: "Invalid email or password" }, 401);
            }

            const role = String(record.role || "customer").toLowerCase();
            const user: AuthUser = {
              id: record.id,
              email: record.email,
              role,
              fullName: record.full_name || "",
            };
            const pair = await issueTokenPair(postgresTokenStore, user, { deviceInfo });

            await audit("LOGIN_SUCCESS", record.id, request, { role });
            return pairResponse(
              pair,
              { id: record.id, email: record.email, full_name: user.fullName, role },
              200,
              "Login successful",
            );
          }

          return jsonResponse(
            {
              ok: false,
              error: "Invalid action. Use login, signup, refresh, logout or logout-all",
            },
            400,
          );
        } catch {
          // No raw error message: driver errors can carry connection details.
          return jsonResponse({ ok: false, error: "Authentication request failed" }, 500);
        }
      },
    },
  },
});
