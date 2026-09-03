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
  Phone,
  Mail,
  User,
  MapPin,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  evaluatePasswordRules,
  validateFullName,
  sanitizeFullName,
  validateIndianPhone,
} from "@/modules/authentication/services/passwordPolicy";
import { resolveRoleFromDatabase } from "@/modules/authentication/services/session";
import { isUserRole, type UserRole } from "@/config/roles";

const SELF_REGISTRATION_ROLE = "customer" as const;

export function EnterprisePasswordForm({
  mode = "signin",
  onSuccess,
}: {
  mode?: "signin" | "signup";
  onSuccess: (data: { name: string; email: string; phone: string; role: string }) => void;
}) {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // Can be email or 10-digit mobile number in signin
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & OTP verification state
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resolvedResetEmail, setResolvedResetEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRedirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  const rules = useMemo(() => {
    return evaluatePasswordRules(password, confirmPassword, name, email, phone);
  }, [password, confirmPassword, name, email, phone]);

  const isValidName = useMemo(() => validateFullName(name), [name]);
  const isValidPhone = useMemo(() => validateIndianPhone(phone), [phone]);

  // Main Submit Handler (Sign In / Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      // 1. Validate Form Inputs
      if (!isValidName) {
        toast.error("Please enter a valid full name.");
        setLoading(false);
        return;
      }
      if (!isValidPhone) {
        toast.error("Please enter a valid 10-digit mobile number.");
        setLoading(false);
        return;
      }
      if (!rules.hasMinLength) {
        toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
        setLoading(false);
        return;
      }
      if (!rules.isCompliant) {
        toast.error(
          "Password is too weak or contains personal information. Please choose a stronger password.",
        );
        setLoading(false);
        return;
      }

      const purePhone = phone.replace(/\D/g, "");
      const fullFormattedPhone = `+91${purePhone}`;

      // 2. CHECK DUPES IN SUPABASE DATABASE BEFORE REGISTRATION
      try {
        const { data: existingProfiles } = await (supabase.from as any)("profiles")
          .select("id, email, phone")
          .or(`email.eq.${email},phone.eq.${fullFormattedPhone},phone.eq.${purePhone}`);

        if (existingProfiles && existingProfiles.length > 0) {
          setLoading(false);
          const matched = existingProfiles[0];
          if (matched.phone === fullFormattedPhone || matched.phone === purePhone) {
            toast.error(
              `An account with mobile number +91 ${purePhone} already exists. Please Sign In or Reset Password.`,
            );
          } else {
            toast.error(
              `An account with email ${email} already exists. Please Sign In or Reset Password.`,
            );
          }
          return;
        }
      } catch {
        // Continue if table query not blocked
      }

      // 3. CREATE ACCOUNT (Native Supabase)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: fullFormattedPhone,
            address: address || "Hyderabad",
            role: SELF_REGISTRATION_ROLE,
          },
          emailRedirectTo,
        },
      });

      setLoading(false);

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("already exists")) {
          toast.error("An account with this email already exists. Please sign in.");
        } else {
          toast.error(error.message || "Could not create your account. Please try again.");
        }
        return;
      }

      if (data.session) {
        // Email confirmation is OFF (or auto-login is somehow permitted)
        toast.success("Account created! Welcome to Seedha Properties.");
        onSuccess({ name, email, phone: fullFormattedPhone, role: SELF_REGISTRATION_ROLE });
      } else if (data.user?.identities && data.user.identities.length === 0) {
        // According to Supabase docs, if identities is empty upon signup, the user already exists
        toast.error("An account with this email already exists. Please sign in.");
      } else {
        // Email confirmation is ON and session is null
        setAwaitingConfirmation(true);
        toast.success("Account created! Please check your email for the OTP code.");
      }
    } else {
      // SIGN IN MODE (Supports EITHER Email Address OR Mobile Number)
      let resolvedEmail = identifier.trim();
      const pureDigits = identifier.replace(/\D/g, "");

      // Check if input is a 10-digit Indian phone number
      if (/^[6-9]\d{9}$/.test(pureDigits) || pureDigits.length === 10) {
        try {
          const { data: profile } = await (supabase.from as any)("profiles")
            .select("email")
            .or(`phone.eq.${pureDigits},phone.eq.+91${pureDigits}`)
            .maybeSingle();

          if (profile && profile.email) {
            resolvedEmail = profile.email;
          } else {
            resolvedEmail = `owner_${pureDigits}@urbanproperties.in`;
          }
        } catch {
          resolvedEmail = `${pureDigits}@urbanproperties.in`;
        }
      }

      let authUser: { name: string; email: string; phone: string; role: string } | null = null;

      // 1. Try Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });

        if (!error && data?.user) {
          const user = data.user;
          const resolvedName =
            user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
          let resolvedRole: UserRole = "customer";
          const dbRole = await resolveRoleFromDatabase(user.id);
          resolvedRole =
            dbRole ||
            (isUserRole(user.user_metadata?.role) && user.user_metadata.role !== "admin"
              ? user.user_metadata.role
              : "customer");

          authUser = {
            name: resolvedName,
            email: user?.email || resolvedEmail,
            phone,
            role: resolvedRole,
          };
        }
      } catch {
        // Fallback to native auth
      }

      // 2. Resilient fallback to native Seedha auth (/api/v2/auth)
      if (!authUser) {
        try {
          const res = await fetch("/api/v2/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", email: resolvedEmail, password }),
          });
          const resData = await res.json();
          if (res.ok && resData.ok && resData.user) {
            if (typeof window !== "undefined") {
              if (resData.token) {
                localStorage.setItem("seedha_token", resData.token);
              }
              localStorage.setItem("seedha_user", JSON.stringify(resData.user));
            }
            authUser = {
              name: resData.user.full_name || resData.user.fullName || "User",
              email: resData.user.email || resolvedEmail,
              phone: resData.user.phone || phone,
              role: String(resData.user.role || "customer").toLowerCase(),
            };
          }
        } catch {
          // Native auth network error
        }
      }

      setLoading(false);

      if (!authUser) {
        toast.error("Incorrect Email/Mobile or password. Please try again.");
        return;
      }

      toast.success(`Welcome back, ${authUser.name}!`);
      onSuccess(authUser);
    }
  };

  // VERIFY OTP FOR NEW ACCOUNT REGISTRATION
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: "signup",
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Invalid or expired OTP code.");
      return;
    }

    toast.success("Account activated! Welcome to Seedha Properties.");
    onSuccess({ name, email, phone: `+91${phone}`, role: SELF_REGISTRATION_ROLE });
  };

  // FORGOT PASSWORD: Step 1 Request Reset
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      toast.error("Enter your registered Email Address or Mobile Number.");
      return;
    }
    setLoading(true);

    let targetEmail = resetIdentifier.trim();
    const pureDigits = resetIdentifier.replace(/\D/g, "");

    if (/^[6-9]\d{9}$/.test(pureDigits) || pureDigits.length === 10) {
      try {
        const { data: profile } = await (supabase.from as any)("profiles")
          .select("email")
          .or(`phone.eq.${pureDigits},phone.eq.+91${pureDigits}`)
          .maybeSingle();

        if (profile && profile.email) {
          targetEmail = profile.email;
        }
      } catch {
        // Keep target email
      }
    }

    setResolvedResetEmail(targetEmail);

    // Route through the server endpoint so per-IP and per-email limits apply,
    // and so the response is enumeration-safe. The previous direct
    // resetPasswordForEmail call, plus a success toast that echoed the address,
    // revealed whether an account existed — this closes that leak. A 429 is the
    // only non-generic outcome, and it still says nothing about account existence.
    let rateLimited = false;
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      rateLimited = res.status === 429;
    } catch {
      // Network failure: fall through to the same generic message rather than
      // confirming or denying anything about the address.
    }

    setLoading(false);

    if (rateLimited) {
      toast.error("Too many reset requests. Please wait a while and try again.");
      return;
    }

    // Generic on purpose: identical whether or not the email is registered.
    toast.success("If an account exists for that email, a reset link is on its way.");
    setResetStep("verify");
  };

  // FORGOT PASSWORD: Step 2 Verify OTP & Save New Password
  const handleVerifyAndUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      if (otpToken.trim().length >= 6) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: resolvedResetEmail,
          token: otpToken.trim(),
          type: "recovery",
        });

        if (otpError) {
          toast.error(otpError.message || "Invalid or expired OTP code.");
          setLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      setLoading(false);

      if (updateError) {
        toast.error(updateError.message || "Password update failed.");
        return;
      }

      toast.success("Password updated successfully! Please sign in with your new password.");
      setIsForgotPasswordView(false);
      setResetStep("request");
    } catch {
      toast.error("Password reset failed. Please try again.");
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* FORGOT PASSWORD VIEW */}
      {isForgotPasswordView ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsForgotPasswordView(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </button>
            <span className="text-xs font-extrabold text-[#0F766E]">Password Recovery</span>
          </div>

          {resetStep === "request" ? (
            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              <div className="text-left space-y-1">
                <h3 className="text-base font-bold text-foreground">Reset Your Password</h3>
                <p className="text-xs text-muted-foreground">
                  Enter your registered Email Address or Mobile Number. We will send you an OTP /
                  reset link.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="you@domain.com or 9876543210"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0F766E] hover:bg-[#115E59] py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code / Link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndUpdatePassword} className="space-y-4">
              <div className="text-left space-y-1">
                <h3 className="text-base font-bold text-foreground">Set New Password</h3>
                <p className="text-xs text-muted-foreground">
                  Enter the OTP code received on{" "}
                  <strong className="text-foreground">{resolvedResetEmail}</strong> and your new
                  password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  6-Digit OTP Code (from Email)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save New Password & Sign In"
                )}
              </button>
            </form>
          )}
        </div>
      ) : awaitingConfirmation ? (
        /* EMAIL / PHONE OTP CONFIRMATION VIEW */
        <div className="space-y-4 rounded-3xl border border-emerald-600/30 bg-emerald-600/5 p-6 text-left">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
              <MailCheck className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-lg font-extrabold text-foreground">Enter 6-Digit OTP Code</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              We sent a verification code to <strong className="text-foreground">{email}</strong>.
              Enter the OTP code below to activate your account.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                6-Digit OTP Code *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold tracking-widest text-foreground outline-none focus:ring-2 focus:ring-primary text-center"
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full rounded-xl bg-gradient-to-r from-[#0F766E] to-teal-700 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify OTP & Activate Account"
              )}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => resendConfirmation(email)}
              disabled={resending}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {resending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}{" "}
              Resend OTP Code
            </button>
            <button
              type="button"
              onClick={() => setAwaitingConfirmation(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ← Back
            </button>
          </div>
        </div>
      ) : (
        /* MAIN SIGN-IN / SIGN-UP FORM */
        <form action="javascript:void(0);" onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(sanitizeFullName(e.target.value))}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Mobile Number"
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "signin" && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Email Address or Mobile Number *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or 10-digit mobile number"
                  autoComplete="username"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-foreground">Password *</label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setConfirmPassword(e.target.value);
                }}
                placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#0F766E] hover:bg-[#115E59] py-3.5 text-xs font-black text-white shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : mode === "signup" ? (
              "Create Account"
            ) : (
              "Sign In to Seedha Properties"
            )}
          </button>

          {mode === "signin" && (
            <p className="text-center text-[11px] text-muted-foreground">
              Forgot password?{" "}
              <button
                type="button"
                onClick={() => {
                  setResetIdentifier(identifier);
                  setIsForgotPasswordView(true);
                  setResetStep("request");
                }}
                className="font-semibold text-[#0F766E] hover:underline cursor-pointer"
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
