import { useState, useRef } from "react";
import { Loader2, Mail, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestEmailOtp, verifyEmailOtp } from "@/modules/authentication/services/emailOtp";
import { supabase } from "@/integrations/supabase/client";

/**
 * Passwordless Email-OTP sign-in, offered ALONGSIDE password and Google — never
 * replacing them. Two steps on one surface:
 *
 *   1. email → requestEmailOtp (server-rate-limited, enumeration-safe)
 *   2. 6-digit code → verifyEmailOtp (Supabase, establishes the session)
 *
 * On success it does NOT navigate itself; it hands the resolved profile to the
 * parent's onSuccess, so redirect handling (safeRedirect + the original
 * destination) stays in one place in auth.tsx.
 */

interface EmailOtpFormProps {
  /** Preserved through the flow so the user returns to where they started. */
  redirect?: string;
  onSuccess: (user: { name: string; email: string; phone: string; role: string }) => void;
}

type Stage = "email" | "code";

export function EmailOtpForm({ redirect, onSuccess }: EmailOtpFormProps) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  // Client-side resend cooldown, purely for UX. The authoritative limit is the
  // server's per-IP/per-email rule; this just stops accidental double-taps.
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && cooldownTimer.current) clearInterval(cooldownTimer.current);
        return c - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    setLoading(true);
    const result = await requestEmailOtp(email, redirect);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    // Enumeration-safe: we advance to the code step regardless of whether the
    // address is registered. "Check your email" is true either way.
    toast.success("If that email can receive a code, it's on its way.");
    setStage("code");
    startCooldown(30);
  };

  const resolveProfile = async (): Promise<{
    name: string;
    email: string;
    phone: string;
    role: string;
  }> => {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    return {
      name: (u?.user_metadata?.full_name as string) || email.split("@")[0] || "there",
      email: u?.email || email,
      phone: (u?.user_metadata?.phone as string) || "",
      // Authoritative role comes from user_roles server-side; default customer
      // here is only a display fallback until the dashboard reloads it.
      role: "customer",
    };
  };

  const verify = async () => {
    setLoading(true);
    const result = await verifyEmailOtp(email, code);
    if (!result.ok) {
      setLoading(false);
      toast.error(result.error);
      return;
    }
    const profile = await resolveProfile();
    setLoading(false);
    onSuccess(profile);
  };

  if (stage === "code") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setStage("email")}
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
        </button>
        <div className="text-center">
          <KeyRound className="mx-auto h-6 w-6 text-emerald-600" />
          <p className="mt-2 text-sm font-semibold">Enter your sign-in code</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="••••••"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.4em] tabular-nums outline-none focus:ring-2 focus:ring-emerald-600"
          aria-label="Verification code"
        />
        <Button
          className="w-full rounded-xl"
          disabled={loading || code.length < 6}
          onClick={verify}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify &amp; sign in
        </Button>
        <button
          type="button"
          disabled={cooldown > 0 || loading}
          onClick={sendCode}
          className="w-full text-xs font-semibold text-emerald-600 disabled:text-muted-foreground"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && email.trim()) sendCode();
          }}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          aria-label="Email address"
        />
      </div>
      <Button className="w-full rounded-xl" disabled={loading || !email.trim()} onClick={sendCode}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Email me a sign-in code
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        No password needed. We&apos;ll email you a sign-in code.
      </p>
    </div>
  );
}
