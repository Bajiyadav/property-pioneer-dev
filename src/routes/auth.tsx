import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME, getCanonicalUrl } from "@/config/app";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_NAME}` },
      {
        name: "description",
        content: `Sign in to ${APP_NAME} to manage listings, save favorites, and send enquiries.`,
      },
      { property: "og:title", content: `Sign in — ${APP_NAME}` },
      {
        property: "og:description",
        content: `Sign in to ${APP_NAME} to manage listings, save favorites, and send enquiries.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "forgot_password";
type AccountRole = "customer" | "owner" | "agent";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<AccountRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getCanonicalUrl("/auth"),
        });
        if (error) throw error;
        toast.success("Password reset instructions sent to your email.");
        setMode("signin");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { user_role: role },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }

        // Attach initial user role mapping if session is immediately active
        if (data.user) {
          await supabase.from("user_roles").insert({
            user_id: data.user.id,
            role: role === "owner" ? "owner" : role === "agent" ? "agent" : "customer",
          } as any);
        }

        toast.success("Account created successfully.");
        const dest = role === "owner" ? "/admin" : "/dashboard";
        navigate({ to: dest as any, replace: true });
      } else {
        const { data: signData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Determine destination by fetching user role or meta
        let targetRoute = "/dashboard";
        if (signData.user) {
          const { data: roleRow } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", signData.user.id)
            .maybeSingle();
          const userRole = roleRow?.role || signData.user.user_metadata?.user_role || "customer";
          if (userRole === "admin" || userRole === "owner") {
            targetRoute = "/admin";
          }
        }

        toast.success("Signed in successfully.");
        navigate({ to: targetRoute as any, replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:py-24">
      <BrandMark size="md" className="justify-center" />
      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-foreground">
        {mode === "signin"
          ? "Sign in"
          : mode === "signup"
          ? "Create an account"
          : "Reset password"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {mode === "forgot_password"
          ? "Enter your registered email address to receive password reset instructions."
          : "Manage listings, saved homes, enquiries, and account settings."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="role">I am a</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as AccountRole)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="customer">Tenant / Buyer</option>
              <option value="owner">Property Owner</option>
              <option value="agent">Real Estate Agent</option>
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {mode !== "forgot_password" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot_password")}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? "Create account"
            : "Send reset link"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          if (mode === "forgot_password") {
            setMode("signin");
          } else {
            setMode(mode === "signin" ? "signup" : "signin");
          }
        }}
        className="mt-6 text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
      >
        {mode === "forgot_password"
          ? "← Back to Sign in"
          : mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>

      <Link to="/" className="mt-8 text-sm text-muted-foreground hover:text-foreground">
        ← Back to listings
      </Link>
    </div>
  );
}