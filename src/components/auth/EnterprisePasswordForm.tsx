import { useState, useMemo } from "react";
import {
  Check,
  X,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { evaluatePasswordRules, validateFullName, validateIndianPhone } from "@/lib/auth-security";

export function EnterprisePasswordForm({
  mode = "signup",
  role = "customer",
  onSuccess,
}: {
  mode?: "signin" | "signup";
  role?: "customer" | "owner" | "agent";
  onSuccess: (data: { name: string; email: string; phone: string; role: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

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
          data: { full_name: name, phone: `+91${phone}`, role },
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
        // Auto-confirmed — proceed directly
        toast.success(`Account created! Welcome to Urban Properties.`);
        onSuccess({ name, email, phone: `+91${phone}`, role });
      } else {
        // Email confirmation required — show OTP step as a UI cue
        setOtpStep(true);
        toast.success("Verification email sent. Enter your 6-digit code.");
      }
    } else {
      // Sign In
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          toast.error("Incorrect email or password. Please try again.");
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          toast.error("Please verify your email first, then sign in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      const user = data.user;
      const resolvedName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
      const resolvedRole = user?.user_metadata?.role || role;
      toast.success(`Welcome back, ${resolvedName}!`);
      onSuccess({ name: resolvedName, email: user?.email || email, phone, role: resolvedRole });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });

    setLoading(false);

    if (error) {
      toast.error("Invalid or expired verification code. Please try again.");
      return;
    }

    toast.success("Phone verified! Account created successfully.");
    onSuccess({ name, email, phone: `+91${phone}`, role });
  };

  return (
    <div className="space-y-6">
      {otpStep ? (
        <form
          onSubmit={handleVerifyOtp}
          className="space-y-4 rounded-3xl border border-emerald-600/30 bg-emerald-600/5 p-6"
        >
          <div className="text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Phone className="h-3.5 w-3.5" /> Email Verification
            </span>
            <h3 className="mt-2 text-lg font-extrabold text-foreground">
              Enter 6-Digit Verification Code
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Sent to <strong className="text-foreground">{email}</strong>
            </p>
          </div>

          <div>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="1 2 3 4 5 6"
              className="w-full text-center font-mono text-xl font-bold tracking-widest rounded-2xl border border-border bg-background py-3 text-foreground outline-none focus:ring-2 focus:ring-primary"
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
              </>
            ) : (
              "Verify & Complete Registration"
            )}
          </button>

          <button
            type="button"
            onClick={() => setOtpStep(false)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
          >
            ← Go back
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
