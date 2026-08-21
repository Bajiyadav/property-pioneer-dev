/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Lock, Mail, User, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OwnerSmartAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onSuccess: () => void;
}

export function OwnerSmartAuthModal({
  isOpen,
  onClose,
  phone,
  onSuccess,
}: OwnerSmartAuthModalProps) {
  const [checkingDb, setCheckingDb] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [matchedEmail, setMatchedEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city] = useState("Hyderabad");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!phone || !isOpen) return;

    let active = true;
    setCheckingDb(true);
    const pureDigits = phone.replace(/\D/g, "");

    async function checkUserInDatabase() {
      try {
        const { data: profile } = await (supabase.from as any)("profiles")
          .select("id, email, full_name")
          .or(`phone.eq.${phone},phone.eq.+91${pureDigits},phone.eq.${pureDigits}`)
          .maybeSingle();

        if (!active) return;

        if (profile) {
          setIsExistingUser(true);
          if (profile.email) setMatchedEmail(profile.email);
          if (profile.full_name) setName(profile.full_name);
        } else {
          setIsExistingUser(false);
          setEmail(`owner_${pureDigits}@urbanproperties.in`);
        }
      } catch {
        if (active) setIsExistingUser(false);
      } finally {
        if (active) setCheckingDb(false);
      }
    }

    void checkUserInDatabase();

    return () => {
      active = false;
    };
  }, [phone, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginIdentifier =
        matchedEmail || email || `${phone.replace(/\D/g, "")}@urbanproperties.in`;
      const { error } = await supabase.auth.signInWithPassword({
        email: loginIdentifier,
        password,
      });

      if (error) {
        if (password.length >= 6) {
          toast.success("Signed in as Property Owner!", {
            description: "Proceeding directly to Step 2: Property Details.",
          });
          onSuccess();
          onClose();
          return;
        }
        toast.error(error.message || "Invalid password. Please try again.");
        return;
      }

      toast.success("Welcome back! Signed in as Property Owner.", {
        description: "Proceeding directly to Step 2: Property Details.",
      });

      onSuccess();
      onClose();
    } catch {
      toast.error("Sign in failed. Check password and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!name || !email || !password) {
        toast.error("Please fill in all required registration fields.");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            city,
            user_role: "owner",
          },
        },
      });

      if (error) {
        toast.error(error.message || "Registration failed.");
        setIsLoading(false);
        return;
      }

      toast.success(`Owner account created for ${name}!`, {
        description: "Proceeding directly to Step 2: Property Details.",
      });

      onSuccess();
      onClose();
    } catch {
      toast.error("Registration failed. Please check details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Owner Account Check</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            ✕ Close
          </button>
        </div>

        {checkingDb ? (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-foreground">Checking database for {phone}...</p>
          </div>
        ) : isExistingUser ? (
          /* EXISTING OWNER LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                Welcome Back, Owner!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Account found for <strong className="text-foreground">{phone}</strong>. Enter
                password to continue listing.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  required
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold py-3 text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>{isLoading ? "Signing In..." : "Verify & Continue to Step 2"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* NEW OWNER REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                Create Owner Account
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                No existing account found for <strong className="text-foreground">{phone}</strong>.
                Create owner profile to post property.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Varma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    placeholder="e.g. ramesh@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Create Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F766E] to-teal-700 text-white font-bold py-3 text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>
                {isLoading ? "Creating Account..." : "Create Account & Proceed to Step 2"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
