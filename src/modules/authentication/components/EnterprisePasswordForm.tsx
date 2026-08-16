import { useState, useMemo } from "react";
import {
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  MailCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  evaluatePasswordRules,
  validateFullName,
  validateIndianPhone,
} from "@/modules/authentication/services/passwordPolicy";
import { resolveRoleFromDatabase } from "@/modules/authentication/services/session";
import { isUserRole, type UserRole } from "@/config/roles";

/** Self-registration always produces a tenant/buyer account. */
const SELF_REGISTRATION_ROLE = "customer" as const;

/**
 * Sign-in / sign-up form.
 *
 * Registration deliberately takes no role parameter. It used to accept one and
 * pass it to `auth.signUp`, where a database trigger copied it straight into
 * `user_roles` — so the caller chose their own authority. Every account created
 * here is a customer; elevation is an admin action.
 */
export function EnterprisePasswordForm({
  mode = "signup",
  onSuccess,
}: {
  mode?: "signin" | "signup";
  onSuccess: (data: { name: string; email: string; phone: string; role: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Where Supabase should send the user after they click the email link. */
  const emailRedirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  const resendConfirmation = async (targetEmail: string) => {
    if (!targetEmail) {
      toast.error("Enter your email address first.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo },
    });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success(`Confirmation email sent to ${targetEmail}.`);
  };

  const rules = useMemo(() => {
    return evaluatePasswordRules(password, confirmPassword, name, email, phone);
  }, [password, confirmPassword, name, email, phone]);

  const isValidName = useMemo(() => validateFullName(name), [name]);
  const isValidPhone = useMemo(() => validateIndianPhone(phone), [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      if (!isValidName || !isValidPhone || !rules.isCompliant) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Persona only — never an authority. The database assigns the
          // role, and it always assigns "customer" for a self-registration.
          data: { full_name: name, phone: `+91${phone}`, role: SELF_REGISTRATION_ROLE },
          emailRedirectTo,
        },
      });

      setLoading(false);

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          toast.error("An account with this email already exists. Please sign in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.session) {
        // Project has email confirmation disabled — the account is live now.
        toast.success(`Account created! Welcome to Urban Properties.`);
        onSuccess({ name, email, phone: `+91${phone}`, role: SELF_REGISTRATION_ROLE });
      } else {
        // Confirmation required. Supabase sends a LINK by default, so we must not
        // demand a code the user was never given — show the check-your-inbox state.
        setAwaitingConfirmation(true);
        toast.success(`Confirmation email sent to ${email}.`);
      }
    } else {
      // Sign In
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid login credentials")) {
          toast.error("Incorrect email or password. Please try again.");
        } else if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
          // Previously a dead end: the user could never get past this.
          setAwaitingConfirmation(true);
          toast.error("Your email isn't confirmed yet — we can resend the link.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      const user = data.user;
      const resolvedName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
      let resolvedRole: UserRole = "customer";
      if (user) {
        const dbRole = await resolveRoleFromDatabase(user.id);
        resolvedRole =
          dbRole ||
          (isUserRole(user.user_metadata?.role) && user.user_metadata.role !== "admin"
            ? user.user_metadata.role
            : "customer");
      }
      toast.success(`Welcome back, ${resolvedName}!`);
      onSuccess({ name: resolvedName, email: user?.email || email, phone, role: resolvedRole });
    }
  };

  /** Optional path for projects whose email template embeds a 6-digit token. */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });

    setLoading(false);

    if (error) {
      toast.error("Invalid or expired code. Use the link in your email instead.");
      return;
    }

    toast.success("Email verified! Account activated.");
    onSuccess({ name, email, phone: `+91${phone}`, role: SELF_REGISTRATION_ROLE });
  };

  return (
    <div className="space-y-6">
      {awaitingConfirmation ? (
        <div className="space-y-4 rounded-3xl border border-emerald-600/30 bg-emerald-600/5 p-6">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
              <MailCheck className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-lg font-extrabold text-foreground">Confirm your email</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
              Open it and you'll be signed straight into your dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/60 p-3 text-left">
            <p className="text-[11px] font-bold text-foreground">Didn't get it?</p>
            <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              <li>• Check your spam or promotions folder</li>
              <li>• Links expire — request a fresh one below</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => resendConfirmation(email)}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {resending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" /> Resend confirmation email
              </>
            )}
          </button>

          {showCodeEntry ? (
            <form onSubmit={handleVerifyOtp} className="space-y-2 border-t border-border/40 pt-4">
              <label className="block text-[11px] font-bold text-foreground">
                Enter the 6-digit code from your email
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="1 2 3 4 5 6"
                className="w-full rounded-2xl border border-border bg-background py-3 text-center font-mono text-xl font-bold tracking-widest text-foreground outline-none focus:ring-2 focus:ring-primary"
                autoComplete="one-time-code"
              />
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Verify code
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCodeEntry(true)}
              className="w-full text-center text-[11px] text-muted-foreground transition hover:text-foreground"
            >
              My email contains a 6-digit code instead
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setAwaitingConfirmation(false);
              setShowCodeEntry(false);
            }}
            className="w-full text-center text-xs text-muted-foreground transition hover:text-foreground"
          >
            ← Go back
          </button>
        </div>
      ) : (
        <form action="javascript:void(0);" onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suresh Kumar"
                autoComplete="name"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 ${
                  name.length > 0 && !isValidName
                    ? "border-rose-500 focus:ring-rose-500"
                    : "border-border focus:ring-primary"
                } bg-background`}
              />
              {name.length > 0 && !isValidName && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Name must be 3-80 letters only.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Mobile Number (+91 India)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  autoComplete="tel"
                  className={`w-full rounded-xl border pl-12 pr-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 ${
                    phone.length > 0 && !isValidPhone
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-border focus:ring-primary"
                  } bg-background`}
                />
              </div>
              {phone.length > 0 && !isValidPhone && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Enter a valid 10-digit Indian mobile number.
                </p>
              )}
            </div>
          )}

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-foreground">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter strong password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* REAL-TIME ENTERPRISE PASSWORD SECURITY CHECKLIST */}
          {mode === "signup" && (
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" /> Create a Strong Password
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${rules.strengthColor}`}
                >
                  {rules.strengthLabel}
                </span>
              </div>

              {/* Password Strength Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    rules.strengthScore === 1
                      ? "w-1/4 bg-rose-500"
                      : rules.strengthScore === 2
                        ? "w-2/4 bg-amber-500"
                        : rules.strengthScore === 3
                          ? "w-3/4 bg-emerald-500"
                          : rules.strengthScore >= 4
                            ? "w-full bg-blue-500"
                            : "w-0"
                  }`}
                />
              </div>

              {/* Rules Checklist */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <RuleItem
                  pass={rules.hasMinLength && rules.hasMaxLength}
                  label="12–64 characters"
                />
                <RuleItem pass={rules.hasUppercase} label="Uppercase letter (A–Z)" />
                <RuleItem pass={rules.hasLowercase} label="Lowercase letter (a–z)" />
                <RuleItem pass={rules.hasNumber} label="Number (0–9)" />
                <RuleItem pass={rules.hasSpecialChar} label="Special char (!@#$%^&*)" />
                <RuleItem pass={rules.noNameMatch} label="Must not contain name" />
                <RuleItem pass={rules.noEmailMatch} label="Must not contain email" />
                <RuleItem pass={rules.noPhoneMatch} label="Must not contain phone" />
                <RuleItem pass={rules.noCommonPassword} label="Not common password" />
                <RuleItem pass={rules.passwordsMatch} label="Passwords match" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (mode === "signup" && (!rules.isCompliant || !isValidName || !isValidPhone))
            }
            className="w-full rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-lg transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : mode === "signup" ? (
              "Create Secure Account"
            ) : (
              "Sign In to Urban Properties"
            )}
          </button>

          {mode === "signin" && (
            <p className="text-center text-[11px] text-muted-foreground">
              Forgot password?{" "}
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error("Enter your email address first.");
                    return;
                  }
                  const { error } = await supabase.auth.resetPasswordForEmail(email);
                  if (error) toast.error(error.message);
                  else toast.success("Password reset email sent! Check your inbox.");
                }}
                className="font-semibold text-primary hover:underline"
              >
                Reset it
              </button>
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function RuleItem({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 ${pass ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}
    >
      {pass ? (
        <Check className="h-3.5 w-3.5 text-emerald-500 flex-none" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground flex-none" />
      )}
      <span>{label}</span>
    </div>
  );
}
