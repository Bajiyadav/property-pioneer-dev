import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/shared/components/BrandMark";
import { APP_NAME } from "@/config/app";
import { getDashboardRoute, isUserRole } from "@/config/roles";
import { EnterprisePasswordForm } from "@/modules/authentication/components/EnterprisePasswordForm";
import { EmailOtpForm } from "@/modules/authentication/components/EmailOtpForm";
import { GoogleSignInButton } from "@/shared/components/auth/GoogleSignInButton";
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
      { name: "description", content: `Enterprise authentication & secure login for ${APP_NAME}.` },
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

type AuthMode = "signin" | "signup";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [method, setMethod] = useState<"password" | "otp">("password");

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
          <ShieldCheck className="h-3.5 w-3.5" /> Encrypted & Secure Authentication
        </span>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl">
          {mode === "signin" ? "Sign In to Seedha Properties" : "Create Account"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "signin"
            ? "Enter your credentials to access your saved homes & dashboards."
            : "Create an account to save homes, send enquiries, or list a property."}
        </p>
      </div>

      {/* Auth Mode Tabs */}
      <div className="mt-6 flex w-full max-w-sm gap-1 rounded-2xl border border-border/60 bg-secondary/40 p-1">
        <button
          onClick={() => {
            setMode("signin");
            setMethod("password");
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
            mode === "signin"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setMethod("password");
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
            mode === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create Account
        </button>
      </div>

      {mode === "signup" && (
        <p className="mt-4 w-full text-center text-[11px] leading-relaxed text-muted-foreground">
          Creating an account sets up your{" "}
          <strong className="text-foreground">Tenant &amp; Buyer</strong> profile. Owner and partner
          listings can be activated seamlessly anytime.
        </p>
      )}

      {/* Form & Real-time Validation */}
      <div className="mt-6 w-full rounded-3xl border border-border/60 bg-card p-6 shadow-xl space-y-5">
        {/* 1-Click Fast Sign-In */}
        <GoogleSignInButton
          redirect={redirect}
          label={mode === "signin" ? "Sign in with Google" : "Continue with Google (1-Click)"}
        />

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-border/60" />
          <span className="absolute bg-card px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            or with email
          </span>
        </div>

        {method === "password" ? (
          <>
            <EnterprisePasswordForm mode={mode} onSuccess={handleSuccess} />
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setMethod("otp")}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition underline underline-offset-4 cursor-pointer"
              >
                Prefer instant email code? Sign in with 6-digit OTP
              </button>
            </div>
          </>
        ) : (
          <>
            <EmailOtpForm redirect={redirect} onSuccess={handleSuccess} />
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setMethod("password")}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition underline underline-offset-4 cursor-pointer"
              >
                Use traditional password instead
              </button>
            </div>
          </>
        )}
      </div>

      <Link to="/" className="mt-6 text-xs font-bold text-muted-foreground hover:text-foreground">
        ← Return to Home
      </Link>
    </div>
  );
}
