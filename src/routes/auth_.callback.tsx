/**
 * Seedha Properties — Email Confirmation & Auth Callback Handler
 */

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { MailCheck, TriangleAlert, Loader2, LogIn, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/branding/BrandMark";
import { getDashboardRoute } from "@/config/roles";
import { resolveRoleForSession } from "@/modules/authentication/services/session";
import { APP_NAME } from "@/config/app";
import { toast } from "sonner";

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
  const [errorMessage, setErrorMessage] = useState(
    "This link has expired or has already been used.",
  );
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    let active = true;

    const finish = async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      // Implicit flow puts everything in the fragment.
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const errorDescription = params.get("error_description") ?? hash.get("error_description");
      if (errorDescription) {
        if (!active) return;
        const { data: existing } = await supabase.auth.getSession();
        if (existing?.session) {
          const role = await resolveRoleForSession(existing.session);
          if (!active) return;
          toast.info("You are already signed in!");
          window.history.replaceState({}, "", "/auth/callback");
          navigate({ to: getDashboardRoute(role), search: { tab: "overview" }, replace: true });
          return;
        }
        setState("error");
        setErrorMessage("This link has expired or has already been used.");
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

        const { data } = await supabase.auth.getSession();
        if (!active) return;

        if (!data.session) {
          setState("error");
          setErrorMessage("This link has expired or has already been used.");
          return;
        }

        const role = await resolveRoleForSession(data.session);
        if (!active) return;

        toast.success("Account confirmed successfully! Welcome to Seedha Properties.");

        // If this is a password recovery link, direct to auth page to enter new password
        if (type === "recovery") {
          window.history.replaceState({}, "", "/auth");
          navigate({ to: "/auth", search: { redirect: "" }, replace: true });
          return;
        }

        // Strip the credential from the address bar before moving on.
        window.history.replaceState({}, "", "/auth/callback");
        navigate({ to: getDashboardRoute(role), search: { tab: "overview" }, replace: true });
      } catch (_err) {
        if (!active) return;
        const { data: existing } = await supabase.auth.getSession();
        if (existing?.session) {
          const role = await resolveRoleForSession(existing.session);
          if (!active) return;
          toast.info("You are already signed in!");
          window.history.replaceState({}, "", "/auth/callback");
          navigate({ to: getDashboardRoute(role), search: { tab: "overview" }, replace: true });
          return;
        }
        setState("error");
        setErrorMessage("This link has expired or has already been used.");
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
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying your credentials with Seedha
            Properties…
          </p>
        </div>
      ) : (
        <div className="mt-8 max-w-md space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
            <TriangleAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Confirmation link unavailable</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">{errorMessage}</p>
          <p className="text-xs text-muted-foreground">
            Confirmation links are single-use and expire for security. You can sign in directly or
            request a fresh confirmation link.
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ redirect: "" }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/auth"
              search={{ redirect: "" }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition active:scale-95"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Send New Confirmation Email</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
