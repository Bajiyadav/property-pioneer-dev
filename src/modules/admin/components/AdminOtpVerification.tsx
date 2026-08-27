import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Loader2, KeyRound, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { requestAdminOtp, verifyAdminOtp } from "@/modules/admin/services/adminStepUpFunctions";

/**
 * Admin email-OTP step-up screen. Secondary to primary login: it appears AFTER
 * Supabase password/OAuth auth, only for admins, and gates the dashboard.
 *
 * The server owns every decision — this component only collects a 6-digit code
 * and reflects server responses. It never sees the code's source, never stores
 * a "verified" flag itself (that lives server-side), and the email is masked.
 */

const RESEND_COOLDOWN_S = 45;

/** Mask so the full admin address is never shown: b***@seedhaproperties.com */
function maskEmail(email: string | null | undefined): string {
  if (!email) return "your verified admin email";
  const [local, domain] = email.split("@");
  if (!domain) return "your verified admin email";
  return `${local.slice(0, 1)}***@${domain}`;
}

export function AdminOtpVerification({
  maskedEmail,
  onVerified,
}: {
  maskedEmail?: string;
  onVerified: () => void;
}) {
  const request = useServerFn(requestAdminOtp);
  const verify = useServerFn(verifyAdminOtp);

  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // The masked address to display. Seeded from the prop, then refreshed from the
  // server's send response (the admin's own address, masked) — never the full value.
  const [mask, setMask] = useState(maskedEmail);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_S);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && timer.current) clearInterval(timer.current);
        return c - 1;
      });
    }, 1000);
  };

  // Send a code on mount.
  useEffect(() => {
    void send();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    setSending(true);
    const r = await request(undefined);
    setSending(false);
    if (!r.ok && r.reason === "not_admin") {
      toast.error("This account is not an administrator.");
      return;
    }
    if (!r.ok && r.reason === "locked") {
      toast.error("Too many attempts. Please try again later.");
      return;
    }
    if (!r.ok && r.reason === "unconfigured") {
      toast.error("Admin verification is not available right now.");
      return;
    }
    if (r.ok && r.maskedEmail) setMask(r.maskedEmail);
    startCooldown();
    toast.success("A verification code was sent to your admin email.");
  };

  const submit = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    const r = await verify({ data: { code } });
    setVerifying(false);
    if (r.ok) {
      toast.success("Verified. Welcome, administrator.");
      onVerified();
      return;
    }
    const msg =
      r.reason === "expired"
        ? "That code has expired. Request a new one."
        : r.reason === "locked"
          ? "Too many attempts. Please try again later."
          : "That code is incorrect.";
    toast.error(msg);
    setCode("");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <ShieldCheck className="h-9 w-9 text-primary" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Administrator verification</h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MailCheck className="h-4 w-4 flex-none" aria-hidden="true" />A verification code was sent
          to <span className="font-medium text-foreground">{mask || "your admin email"}</span>
        </p>

        <label htmlFor="admin-otp" className="mt-6 block text-sm font-medium">
          Enter the 6-digit code
        </label>
        <input
          id="admin-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && code.length === 6) void submit();
          }}
          placeholder="••••••"
          aria-label="6-digit administrator verification code"
          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.5em] tabular-nums outline-none focus:ring-2 focus:ring-primary"
        />

        <Button
          className="mt-4 w-full rounded-xl"
          disabled={verifying || code.length !== 6}
          onClick={submit}
        >
          {verifying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Verify
        </Button>

        <button
          type="button"
          disabled={cooldown > 0 || sending}
          onClick={send}
          className="mt-3 w-full text-xs font-semibold text-primary disabled:text-muted-foreground"
        >
          {sending
            ? "Sending…"
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Didn't receive it? Resend code"}
        </button>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          This extra step protects privileged administrator access. It never replaces your password
          or your account&apos;s permissions.
        </p>
      </div>
    </div>
  );
}

export { maskEmail };
