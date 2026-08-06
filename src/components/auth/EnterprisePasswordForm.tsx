import { useState, useMemo } from "react";
import { Check, X, ShieldCheck, Lock, Eye, EyeOff, Sparkles, CheckCircle2, Phone, AlertCircle } from "lucide-react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      if (!isValidName) return;
      if (!isValidPhone) return;
      if (!rules.isCompliant) return;
      setOtpStep(true);
    } else {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onSuccess({ name: name || "Customer User", email, phone, role });
      }, 500);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({ name, email, phone, role });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {otpStep ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4 rounded-3xl border border-emerald-600/30 bg-emerald-600/5 p-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Phone className="h-3.5 w-3.5" /> Mobile OTP Verification
            </span>
            <h3 className="mt-2 text-lg font-extrabold text-foreground">Enter 6-Digit Verification Code</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Sent to <strong className="text-foreground">+91 {phone}</strong>
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
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length < 6}
            className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Verifying OTP…" : "Verify Phone & Complete Registration"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suresh Kumar"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 ${
                  name.length > 0 && !isValidName ? "border-rose-500 focus:ring-rose-500" : "border-border focus:ring-primary"
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
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Mobile Number (+91 India)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className={`w-full rounded-xl border pl-12 pr-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 ${
                    phone.length > 0 && !isValidPhone ? "border-rose-500 focus:ring-rose-500" : "border-border focus:ring-primary"
                  } bg-background`}
                />
              </div>
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
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${rules.strengthColor}`}>
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
                <RuleItem pass={rules.hasMinLength && rules.hasMaxLength} label="12–64 characters" />
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
            disabled={loading || (mode === "signup" && (!rules.isCompliant || !isValidName || !isValidPhone))}
            className="w-full rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {loading
              ? "Processing…"
              : mode === "signup"
              ? "Create Secure Customer Account"
              : "Sign In to Urban Properties"}
          </button>
        </form>
      )}
    </div>
  );
}

function RuleItem({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${pass ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
      {pass ? <Check className="h-3.5 w-3.5 text-emerald-500 flex-none" /> : <X className="h-3.5 w-3.5 text-muted-foreground flex-none" />}
      <span>{label}</span>
    </div>
  );
}
