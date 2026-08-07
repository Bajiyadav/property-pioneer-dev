import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { APP_NAME } from "@/config/app";
import { getDashboardRoute, isUserRole, setActiveRole } from "@/config/roles";
import { EnterprisePasswordForm } from "@/components/auth/EnterprisePasswordForm";
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
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup";
type AccountRole = "customer" | "owner" | "agent";

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<AccountRole>("customer");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSuccess = (userObj: { name: string; email: string; phone: string; role: string }) => {
    // The active role drives dashboard dispatch and the header menu, so persist
    // it in every environment — not just dev.
    const destRole = isUserRole(userObj.role) ? userObj.role : "customer";
    setActiveRole(destRole);

    toast.success(`Welcome ${userObj.name}! Signed in as ${destRole.toUpperCase()}`);

    const target = redirect ? safeRedirect(redirect) : null;
    if (target) {
      navigate({ href: target, replace: true });
      return;
    }
    navigate({ to: getDashboardRoute(destRole), search: { tab: "overview" }, replace: true });
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 sm:py-16">
      <BrandMark size="lg" className="justify-center" />

      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" /> ISO 27001 & OWASP Certified Security
        </span>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl">
          {mode === "signin" ? "Sign In to Urban Properties" : "Create Permanent Account"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "signin"
            ? "Enter your verified credentials to access your saved homes & dashboards."
            : "Register with enterprise password rules, 100% data privacy & zero brokerage."}
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

      {/* Account Role Selector */}
      {mode === "signup" && (
        <div className="mt-4 w-full">
          <label className="block text-xs font-bold text-foreground mb-1 text-center">
            Select Account Persona
          </label>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { id: "customer", label: "Tenant / Buyer" },
              { id: "owner", label: "Property Owner" },
              { id: "agent", label: "Partner Agent" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id as AccountRole)}
                className={`rounded-xl border p-2.5 font-bold transition ${
                  role === item.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form & Real-time Validation */}
      <div className="mt-6 w-full rounded-3xl border border-border/60 bg-card p-6 shadow-xl">
        <EnterprisePasswordForm mode={mode} role={role} onSuccess={handleSuccess} />

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
