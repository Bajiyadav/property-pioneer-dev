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
import { ShieldCheck, Globe, MessageCircle, Github } from "lucide-react";

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
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<AuthMode>("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = "/dashboard";
      }
    });
  }, []);

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
          {mode === "signin" ? "Sign In to Urban Properties" : "Create Account"}
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
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
            mode === "signin"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition ${
            mode === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Register Account
        </button>
      </div>

      {/*
        No persona picker.

        Registering here always creates a tenant/buyer account. The picker that
        used to sit at this spot fed its value straight into `auth.signUp`'s
        user_metadata, and the database trigger wrote that value into
        `user_roles` verbatim — so the choice was not a preference, it was a
        self-issued grant. Owner and agent access is granted deliberately, by an
        admin, to an account that already exists.
      */}
      {mode === "signup" && (
        <p className="mt-4 w-full text-center text-[11px] leading-relaxed text-muted-foreground">
          Registering creates a <strong className="text-foreground">Tenant &amp; Buyer</strong>{" "}
          account. Listing a property or joining as a partner agent is arranged with our team after
          your account is verified.
        </p>
      )}

      {/* Form & Real-time Validation */}
      <div className="mt-6 w-full rounded-3xl border border-border/60 bg-card p-6 shadow-xl">
        <EnterprisePasswordForm mode={mode} onSuccess={handleSuccess} />

        {/*
          Social sign-in bar.

          No OAuth provider is enabled on the Supabase project yet, so these are
          presented as "coming soon" rather than claiming to be active — a button
          that says SSO works and then does nothing is worse than no button.
          Enable the provider in Supabase → Auth → Providers, then swap the
          handler for supabase.auth.signInWithOAuth({ provider }).
        */}
        <div className="mt-6 border-t border-border/40 pt-6">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Social sign-in — coming soon
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "google", label: "Google", icon: <Globe className="h-4 w-4 text-rose-500" /> },
              {
                id: "whatsapp",
                label: "WhatsApp",
                icon: <MessageCircle className="h-4 w-4 text-emerald-500" />,
              },
              {
                id: "github",
                label: "GitHub",
                icon: <Github className="h-4 w-4 text-foreground" />,
              },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                disabled
                aria-disabled="true"
                title={`${p.label} sign-in is not enabled yet`}
                className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 py-2.5 text-xs font-semibold text-foreground opacity-50"
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Use your email and password above to sign in.
          </p>
        </div>
      </div>

      <Link to="/" className="mt-6 text-xs font-bold text-muted-foreground hover:text-foreground">
        ← Return to Home
      </Link>
    </div>
  );
}
