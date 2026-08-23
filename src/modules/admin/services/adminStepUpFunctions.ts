import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Client-callable surface for admin email-OTP step-up.
 *
 * The client sends NO identity and NO email — the user id comes from the
 * verified session (requireSupabaseAuth), and the target address comes from the
 * auth system inside the server module. The only client input accepted is the
 * 6-digit code on verify. Responses are generic and never contain the code.
 */

type Ctx = {
  userId: string;
  supabase: { rpc(fn: string): Promise<{ data: unknown; error: unknown }> };
};

export const requestAdminOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { requestAdminOtp: run } = await import("./adminStepUp.server");
    const r = await run({ userId: ctx.userId, supabaseRls: ctx.supabase });
    // Enumeration-safe: "sent" whether or not a code actually went out.
    if (r.status === "not_admin") return { ok: false as const, reason: "not_admin" as const };
    if (r.status === "locked")
      return {
        ok: false as const,
        reason: "locked" as const,
        retryAfterSeconds: r.retryAfterSeconds,
      };
    if (r.status === "unconfigured") return { ok: false as const, reason: "unconfigured" as const };
    // maskedEmail is the admin's OWN masked address (never the full value), so
    // the UI can show where the code was sent.
    return { ok: true as const, maskedEmail: r.status === "sent" ? r.maskedEmail : undefined };
  });

export const verifyAdminOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        code: z
          .string()
          .trim()
          .regex(/^\d{6}$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    const { verifyAdminOtp: run } = await import("./adminStepUp.server");
    const r = await run({ userId: ctx.userId, code: data.code, supabaseRls: ctx.supabase });
    switch (r.status) {
      case "ok":
        return { ok: true as const };
      case "locked":
        return {
          ok: false as const,
          reason: "locked" as const,
          retryAfterSeconds: r.retryAfterSeconds,
        };
      case "expired":
        return { ok: false as const, reason: "expired" as const };
      case "not_admin":
        return { ok: false as const, reason: "not_admin" as const };
      case "unconfigured":
        return { ok: false as const, reason: "unconfigured" as const };
      default:
        return { ok: false as const, reason: "invalid" as const };
    }
  });

/** Whether the caller currently holds a valid step-up window (server truth). */
export const getAdminStepUpStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { isAdminStepUpValid } = await import("./adminStepUp.server");
    return { verified: await isAdminStepUpValid(ctx.userId) };
  });
