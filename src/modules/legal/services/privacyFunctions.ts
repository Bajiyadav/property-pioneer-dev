import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Data-subject rights endpoints.
 *
 * `requireSupabaseAuth` verifies the bearer token's signature *and* that the
 * session is still live, then hands us `context.userId` from the verified
 * claims. Neither function accepts a user id as input, so there is no parameter
 * an attacker could point at somebody else's account.
 */
type AuthContext = { userId: string };

/**
 * Returns the export already serialised. A server function's return type has to
 * be provably serialisable, and the payload is an open-ended bag of rows — so
 * it crosses the boundary as a JSON string, which is also exactly the shape the
 * browser needs to hand the visitor a file.
 */
export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ filename: string; json: string }> => {
    const { userId } = context as AuthContext;
    const { exportUserData } = await import("./privacyRights.server");
    const payload = await exportUserData(userId);
    const stamp = payload.exportedAt.slice(0, 10);
    return {
      filename: `urban-properties-data-${stamp}.json`,
      json: JSON.stringify(payload, null, 2),
    };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as AuthContext;
    const { deleteUserData } = await import("./privacyRights.server");
    const result = await deleteUserData(userId);
    return {
      accountRemoved: result.accountRemoved,
      notes: result.notes,
      summary: JSON.stringify(result.deleted),
    };
  });
