import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface GoogleSignInButtonProps {
  redirect?: string;
  label?: string;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  redirect = "",
  label = "Continue with Google",
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setOauthError(null);

      const callbackUrl = `${window.location.origin}/auth/callback${
        redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""
      }`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.error("[Google Auth Error]:", err);
      const rawMsg = err instanceof Error ? err.message : String(err);
      const isUnconfigured =
        rawMsg.toLowerCase().includes("not enabled") ||
        rawMsg.toLowerCase().includes("unsupported") ||
        rawMsg.toLowerCase().includes("validation_failed") ||
        rawMsg.toLowerCase().includes("invalid provider");

      const userNotice = isUnconfigured
        ? "Google Sign-In is unconfigured in this environment. Please sign in with Email & Password or OTP."
        : `Google Sign-In error: ${rawMsg}`;

      setOauthError(userNotice);
      toast.error(userNotice, { duration: 5000 });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {oauthError && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>{oauthError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 px-4 text-xs sm:text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.99] transition-all disabled:opacity-60 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        ) : (
          /* Official Google 'G' Multicolor SVG */
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{label}</span>
      </button>
    </div>
  );
};
