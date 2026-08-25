import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  GUEST_SESSION,
  resolveRoleForSession,
  type ResolvedSession,
} from "@/modules/authentication/services/session";
import { notifyLoginSecurityEvent } from "@/lib/notificationService";

export type AuthStatus = "loading" | "authenticated" | "guest";

export interface AuthContextType extends ResolvedSession {
  status: AuthStatus;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Keys purged on sign-out.
 *
 * `up_demo_user_role` is a LEGACY key written by a removed client-side role
 * switcher. It no longer has a writer anywhere in the codebase, but browsers
 * that loaded an older build still carry it, so sign-out purges it to leave no
 * client-writable role state behind. Never read it — it is not an authority.
 */
const LEGACY_AUTH_STORAGE_KEYS = ["up_demo_user_role", "supabase.auth.token"];

/** Marks a login as already notified, so a reload never re-sends the email. */
const LOGIN_NOTIFIED_PREFIX = "up_login_notified:";

/**
 * Extracts the Supabase `session_id` claim from an access token.
 *
 * Used only to de-duplicate the login notification: the claim is stable across
 * token refreshes and unique per sign-in, which is exactly the identity the
 * "one email per login, never on refresh" rule needs. The value is never
 * trusted for authorization — the server re-verifies the token itself.
 */
function sessionIdFromToken(accessToken: string | undefined): string | null {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { session_id?: string };
    return typeof claims.session_id === "string" ? claims.session_id : null;
  } catch {
    return null;
  }
}

/**
 * True the first time it is called for a given login; false forever after.
 *
 * Claimed *before* dispatch, and never released. Sign-in redirects to the
 * dashboard with a full page load, which tears down the in-flight notification
 * request even though the server has already received it (the request is sent
 * with `keepalive`). Releasing the claim on that apparent failure made the next
 * page load dispatch a second time and send a duplicate email, so the guarantee
 * here is deliberately at-most-once.
 */
function claimLoginNotification(sessionId: string | null): boolean {
  if (!sessionId) return false;
  if (typeof window === "undefined") return false;
  const key = `${LOGIN_NOTIFIED_PREFIX}${sessionId}`;
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
    return true;
  } catch {
    // Storage blocked (private mode): skip rather than risk duplicate emails.
    return false;
  }
}

/** Removes every Supabase and legacy auth key from both web storages. */
function purgeAuthStorage() {
  if (typeof window === "undefined") return;

  for (const store of [localStorage, sessionStorage]) {
    try {
      // Snapshot the keys first: removing while indexing forward re-indexes the
      // store and silently skips entries, which used to strand a live token.
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k) keys.push(k);
      }
      for (const k of keys) {
        if (
          k.startsWith("sb-") ||
          k.includes("auth-token") ||
          k.startsWith(LOGIN_NOTIFIED_PREFIX) ||
          LEGACY_AUTH_STORAGE_KEYS.includes(k)
        ) {
          store.removeItem(k);
        }
      }
    } catch {
      // Storage access can throw in private browsing mode.
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ResolvedSession & { status: AuthStatus }>({
    ...GUEST_SESSION,
    status: "loading",
  });

  const queryClient = useQueryClient();
  const router = useRouter();

  // Held in refs so the auth subscription below can mount exactly once. Putting
  // these in the effect's dependency array would tear down and re-create the
  // Supabase listener on every render that changes a query client or route.
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const routerRef = useRef(router);
  routerRef.current = router;

  /** Guards against the provider itself double-dispatching within one mount. */
  const notifiedSessionIds = useRef<Set<string>>(new Set());

  const applySession = useCallback(async (session: Session | null, event?: string) => {
    if (!session?.user) {
      setState({ ...GUEST_SESSION, status: "guest" });
      return;
    }

    // Show the shell immediately; the authoritative role lookup is a round trip.
    setState((prev) => ({
      ...prev,
      session,
      user: session.user,
      status: "authenticated",
    }));

    const role = await resolveRoleForSession(session);
    setState({
      session,
      user: session.user,
      role,
      roleVerified: true,
      status: "authenticated",
    });

    // A login notification is sent for a genuine sign-in only. TOKEN_REFRESHED,
    // INITIAL_SESSION (a reload of an existing session) and USER_UPDATED must
    // never trigger one, so the event is checked before the session identity.
    if (event !== "SIGNED_IN" || !session.user.email) return;

    const sessionId = sessionIdFromToken(session.access_token);
    if (!sessionId || notifiedSessionIds.current.has(sessionId)) return;
    if (!claimLoginNotification(sessionId)) return;
    notifiedSessionIds.current.add(sessionId);

    // Fire and forget: a notification failure must never block or fail a login.
    void notifyLoginSecurityEvent({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.full_name || session.user.email.split("@")[0] || "User",
      role,
      accessToken: session.access_token,
    }).catch(() => {
      /* already contained inside the dispatcher */
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session);
    } catch {
      setState({ ...GUEST_SESSION, status: "guest" });
    }
  }, [applySession]);

  const signOut = useCallback(async () => {
    // Drop cached data before the network call so no in-flight authenticated
    // query can repopulate the cache after the session is gone.
    try {
      await queryClientRef.current.cancelQueries();
    } catch {
      // Cancellation is best-effort.
    }
    queryClientRef.current.clear();

    try {
      // Revokes the refresh token server-side across every device.
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // Offline or an already-expired token: still drop the local session so
      // the client cannot keep acting as if it were signed in.
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Nothing further to do; storage is purged below regardless.
      }
    }

    purgeAuthStorage();
    notifiedSessionIds.current.clear();
    setState({ ...GUEST_SESSION, status: "guest" });

    // Force route matches to re-run their guards against the now-guest state.
    try {
      await routerRef.current.invalidate();
    } catch {
      // A router teardown mid-sign-out is not a sign-out failure.
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) void applySession(data.session, "INITIAL_SESSION");
      })
      .catch(() => {
        // Never strand the caller in "loading" if Supabase is unreachable.
        if (active) setState({ ...GUEST_SESSION, status: "guest" });
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT" || !session) {
        queryClientRef.current.clear();
        purgeAuthStorage();
        notifiedSessionIds.current.clear();
        setState({ ...GUEST_SESSION, status: "guest" });
        void routerRef.current.invalidate();
        return;
      }

      void applySession(session, event);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [applySession]);

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
