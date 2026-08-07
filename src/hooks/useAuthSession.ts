import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GUEST_SESSION, resolveRoleForSession, type ResolvedSession } from "@/lib/auth-session";

export type AuthStatus = "loading" | "authenticated" | "guest";

export interface UseAuthSession extends ResolvedSession {
  status: AuthStatus;
}

/**
 * Single source of truth for "who is signed in and what may they see".
 *
 * Subscribes once to Supabase auth changes and re-resolves the role whenever the
 * session changes, so a role granted in another tab is picked up without a reload.
 */
export function useAuthSession(): UseAuthSession {
  const [state, setState] = useState<UseAuthSession>({ ...GUEST_SESSION, status: "loading" });

  useEffect(() => {
    let active = true;

    const apply = async (
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"],
    ) => {
      if (!active) return;
      if (!session) {
        setState({ ...GUEST_SESSION, status: "guest" });
        return;
      }
      // Show the dashboard shell immediately; the role lookup is a network call.
      setState((prev) => ({
        ...prev,
        session,
        user: session.user,
        status: "authenticated",
      }));
      const role = await resolveRoleForSession(session);
      if (!active) return;
      setState({ session, user: session.user, role, roleVerified: true, status: "authenticated" });
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      // Never strand the caller in "loading" if Supabase is unreachable.
      .catch(() => active && setState({ ...GUEST_SESSION, status: "guest" }));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
