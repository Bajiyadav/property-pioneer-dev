import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck, TriangleAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/shared/components/BrandMark";
import { getDashboardRoute } from "@/config/roles";
import { resolveRoleForSession } from "@/modules/authentication/services/session";
import { APP_NAME } from "@/config/app";

/**
 * Landing page for Supabase email links (confirm signup, magic link, recovery).
 *
 * Supabase can deliver the credential three different ways depending on how the
 * project's email templates and auth flow are configured, so all three are handled:
 *   - PKCE:     ?code=...
 *   - Token:    ?token_hash=...&type=signup
 *   - Implicit: #access_token=...  (consumed by detectSessionInUrl before we run)
 *
 * Without this route the confirmation link had nowhere to land and no account
 * could ever finish activating.
 */
export const Route = createFileRoute("/auth_/callback")({
  head: () => ({
    meta: [
      { title: `Confirming your account — ${APP_NAME}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

type CallbackState = "working" | "error";

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("working");
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    let active = true;

    const finish = async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      // Implicit flow puts everything in the fragment.
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const errorDescription = params.get("error_description") ?? hash.get("error_description");
      if (errorDescription) {
        if (!active) return;
        setState("error");
        setMessage(errorDescription);
        return;
      }

      try {
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = (params.get("type") ?? "signup") as
          "signup" | "magiclink" | "recovery" | "email_change" | "invite";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        }

        // Implicit-flow tokens are picked up automatically by detectSessionInUrl,
        // so by this point a session should exist for every supported variant.
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        if (!data.session) {
          setState("error");
          setMessage("This confirmation link has expired or was already used.");
          return;
        }

        const role = await resolveRoleForSession(data.session);
        if (!active) return;

        // Strip the credential from the address bar before moving on.
        window.history.replaceState({}, "", "/auth/callback");
        navigate({ to: getDashboardRoute(role), search: { tab: "overview" }, replace: true });
      } catch (err) {
        if (!active) return;
        setState("error");
        setMessage(
          err instanceof Error ? err.message : "We couldn't confirm this link. Please try again.",
        );
      }
    };

    void finish();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <BrandMark size="md" className="justify-center" />

      {state === "working" ? (
        <div className="mt-8 max-w-md space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
            <MailCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Confirming your account</h1>
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {message}
          </p>
        </div>
      ) : (
        <div className="mt-8 max-w-md space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
            <TriangleAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">We couldn't confirm that link</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            Confirmation links are single-use and expire. Request a fresh one from the sign-in page.
          </p>
          <Link
            to="/auth"
            search={{ redirect: "" }}
            className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
