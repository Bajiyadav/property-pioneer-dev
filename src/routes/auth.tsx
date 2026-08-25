import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/branding/BrandMark";
import { APP_NAME } from "@/config/app";
import { getDashboardRoute, isUserRole } from "@/config/roles";
import { EnterprisePasswordForm } from "@/modules/authentication/components/EnterprisePasswordForm";

import { GoogleSignInButton } from "@/modules/authentication/components/GoogleSignInButton";
import { ShieldCheck } from "lucide-react";

const authSearchSchema = z.object({
  /** Where to send the user after a successful sign-in. */
  redirect: fallback(z.string(), "").default(""),
});

/** Only allow same-origin, absolute in-app paths — never an external URL. */
function safeRedirect(target: string): string | null {
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  if (target.startsWith("/auth")) return null;
  return target;
}

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(authSearchSchema),
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_NAME}` },
      { name: "description", content: `Secure sign in for ${APP_NAME}.` },
      { property: "og:title", content: `Sign in — ${APP_NAME}` },
      { property: "og:type", content: "website" },
      {
        // A sign-in form is not a search result. Indexing it splits authority
        // away from the landing pages and puts a dead end in front of searchers.
        name: "robots",
        content: "noindex, follow",
      },
    ],
  }),
  component: AuthPage,
});

/**
 * The single sign-in surface. Every "sign in required" flow — including the
 * owner listing wizard — routes here, so all three methods live in one place:
 * passwordless Email-OTP (the default fast path), password, and a New Account
 * form, with Google available alongside all of them.
 */

function AuthPage() {
  const { redirect } = Route.useSearch();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const target = redirect ? safeRedirect(redirect) : null;
        window.location.href = target || "/dashboard";
      }
    });
  }, [redirect]);

  const handleSuccess = (userObj: { name: string; email: string; phone: string; role: string }) => {
    const destRole = isUserRole(userObj.role) ? userObj.role : "customer";

    toast.success(`Welcome ${userObj.name}! Signed in as ${destRole.toUpperCase()}`);

    const target = redirect ? safeRedirect(redirect) : null;
    const dest = target || `${getDashboardRoute(destRole)}?tab=overview`;
    window.location.href = dest;
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 sm:py-16">
      <BrandMark size="lg" className="justify-center" />

      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Encrypted &amp; Secure Authentication
        </span>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl">
          {isSignUp ? "Create Account" : "Sign In to Seedha Properties"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {isSignUp
            ? "Create an account to save homes, send enquiries, or list a property."
            : "Enter your credentials to access your saved homes & dashboards."}
        </p>
      </div>

      {/* Form card — the selected method, with Google alongside all of them */}
      <div className="mt-6 w-full rounded-3xl border border-border/60 bg-card p-6 shadow-xl space-y-5">
        <EnterprisePasswordForm mode={isSignUp ? "signup" : "signin"} onSuccess={handleSuccess} />

        <div className="text-center text-xs">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border"></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            or continue with
          </span>
          <span className="h-px flex-1 bg-border"></span>
        </div>
        <GoogleSignInButton redirect={redirect} />
      </div>

      <Link to="/" className="mt-6 text-xs font-bold text-muted-foreground hover:text-foreground">
        ← Return to Home
      </Link>
    </div>
  );
}
