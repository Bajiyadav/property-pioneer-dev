import React, { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { EmailOtpForm } from "@/modules/authentication/components/EmailOtpForm";
import { GoogleSignInButton } from "@/shared/components/auth/GoogleSignInButton";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { APP_NAME } from "@/config/app";

interface Step0AuthGateProps {
  onSuccess: (profile: { name: string; email: string; phone: string }) => void;
}

type AuthMode = "otp" | "password" | "signup_password";

export function Step0AuthGate({ onSuccess }: Step0AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup_password") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim() || undefined,
              phone: phone.trim() || undefined,
              role: "customer",
            },
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Account created successfully! Starting listing wizard...");
        onSuccess({
          name: fullName.trim() || data.user?.user_metadata?.full_name || email.split("@")[0],
          email: data.user?.email || email.trim(),
          phone: phone.trim() || (data.user?.user_metadata?.phone as string) || "",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          toast.error(error.message || "Invalid email or password.");
          return;
        }

        const user = data.user;
        toast.success("Welcome back! Continuing to listing wizard...");
        onSuccess({
          name:
            (user?.user_metadata?.full_name as string) ||
            (user?.user_metadata?.name as string) ||
            email.split("@")[0],
          email: user?.email || email.trim(),
          phone: (user?.user_metadata?.phone as string) || (user?.phone as string) || "",
        });
      }
    } catch {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card rounded-3xl border border-border/80 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>0% Brokerage · Direct Owner Post</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {mode === "signup_password"
              ? "Create your owner account"
              : "Sign in to post your property"}
          </h1>

          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Create your account first so we can save your property listing and contact you about
            enquiries.
          </p>
        </div>

        {/* Value Pillars */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50 text-center">
          <div className="p-2 space-y-0.5">
            <span className="text-xs font-bold text-foreground block">100% Free</span>
            <span className="text-[11px] text-muted-foreground block">Zero commission</span>
          </div>
          <div className="p-2 space-y-0.5 border-x border-border/50">
            <span className="text-xs font-bold text-foreground block">Auto-Saved</span>
            <span className="text-[11px] text-muted-foreground block">Draft protection</span>
          </div>
          <div className="p-2 space-y-0.5">
            <span className="text-xs font-bold text-foreground block">Direct Leads</span>
            <span className="text-[11px] text-muted-foreground block">Instant WhatsApp</span>
          </div>
        </div>

        {/* Auth Method Selector */}
        <div className="flex rounded-xl bg-secondary/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("otp")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "otp"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email OTP (Code)
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "password"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup_password")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "signup_password"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            New Account
          </button>
        </div>

        {/* 1. Email OTP Flow */}
        {mode === "otp" && (
          <div className="space-y-4">
            <EmailOtpForm
              redirect="/list-property/wizard"
              onSuccess={(user) => {
                toast.success("Signed in successfully! Starting listing wizard...");
                onSuccess({
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                });
              }}
            />
          </div>
        )}

        {/* 2. Password Sign In / Sign Up Flow */}
        {(mode === "password" || mode === "signup_password") && (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            {mode === "signup_password" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold text-foreground">
                    Your Full Name
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="e.g. Ramesh Reddy"
                    className="h-11 rounded-xl"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    className="h-11 rounded-xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="h-11 rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                required
                placeholder={
                  mode === "signup_password"
                    ? "Choose a secure password (min 6 chars)"
                    : "Enter your password"
                }
                className="h-11 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer"
            >
              {loading
                ? "Verifying..."
                : mode === "signup_password"
                  ? "Create Account & Continue"
                  : "Sign In & Continue"}
            </Button>
          </form>
        )}

        {/* Divider & Google OAuth Option */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-semibold">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleSignInButton redirect="/list-property/wizard" label="Continue with Google" />

        <p className="text-center text-[11px] text-muted-foreground leading-relaxed pt-1">
          By continuing, you agree to {APP_NAME}'s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
