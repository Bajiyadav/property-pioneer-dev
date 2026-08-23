import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { recordAdminMfaAudit } from "@/modules/admin/services/adminFunctions";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

interface AdminMfaSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export function AdminMfaSecurityModal({ isOpen, onClose, onVerified }: AdminMfaSecurityModalProps) {
  const recordAudit = useServerFn(recordAdminMfaAudit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status
  const [aalLevel, setAalLevel] = useState<"aal1" | "aal2">("aal1");
  const [enrolledFactors, setEnrolledFactors] = useState<
    Array<{ id: string; factor_type: string; status: string }>
  >([]);

  // Enrollment state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secretUri, setSecretUri] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const refreshMfaStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData) {
        setAalLevel(aalData.currentLevel as "aal1" | "aal2");
      }

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpList = (factorsData?.totp || []).map((f) => ({
        id: f.id,
        factor_type: f.factor_type,
        status: f.status,
      }));
      setEnrolledFactors(totpList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load MFA status";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshMfaStatus();
    }
  }, [isOpen]);

  const handleStartEnrollment = async () => {
    try {
      setLoading(true);
      setError(null);
      await recordAudit({ data: { event: "admin_mfa_enrollment_started" } });

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Seedha Properties",
        friendlyName: "Seedha Admin Portal",
      });

      if (enrollError) throw enrollError;

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecretUri(data.totp.secret);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start MFA enrollment";
      setError(msg);
      await recordAudit({ data: { event: "admin_mfa_verification_failed", outcome: "error" } });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !totpCode || totpCode.length < 6) return;

    try {
      setLoading(true);
      setError(null);

      // Challenge and verify TOTP code
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode.trim(),
      });

      if (verifyError) {
        await recordAudit({
          data: { event: "admin_mfa_verification_failed", outcome: "rejected" },
        });
        throw verifyError;
      }

      await recordAudit({ data: { event: "admin_mfa_enrollment_completed", outcome: "success" } });
      setSuccess("MFA successfully enrolled and verified! Administrator privileges activated.");
      setQrCode(null);
      setSecretUri(null);
      setTotpCode("");
      await refreshMfaStatus();
      if (onVerified) onVerified();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid MFA verification code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySession = async (e: React.FormEvent) => {
    e.preventDefault();
    const verifiedFactor = enrolledFactors.find((f) => f.status === "verified");
    if (!verifiedFactor || !totpCode || totpCode.length < 6) return;

    try {
      setLoading(true);
      setError(null);

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: challengeData.id,
        code: totpCode.trim(),
      });

      if (verifyError) {
        await recordAudit({
          data: { event: "admin_mfa_verification_failed", outcome: "rejected" },
        });
        throw verifyError;
      }

      await recordAudit({ data: { event: "admin_mfa_verification_success", outcome: "success" } });
      setSuccess("Session elevated to AAL2 with full administrator assurance.");
      setTotpCode("");
      await refreshMfaStatus();
      if (onVerified) onVerified();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid verification code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasVerifiedFactor = enrolledFactors.some((f) => f.status === "verified");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-neutral-100 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Admin Security & MFA</h2>
              <p className="text-xs text-neutral-400">Two-Factor Authentication (TOTP) Assurance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current MFA Status Badge */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Assurance Level
            </span>
            {aalLevel === "aal2" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                MFA Verified (AAL2)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                MFA Required (AAL1)
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {aalLevel === "aal2"
              ? "Your current admin session holds authenticated AAL2 assurance. Privileged administrator and moderation endpoints are unlocked."
              : "Administrator accounts require Multi-Factor Authentication (MFA) with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password)."}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Enrollment Flow: QR Code */}
        {qrCode && (
          <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-center">
            <h3 className="text-sm font-semibold text-white">Scan with Authenticator App</h3>
            <div className="mx-auto w-44 h-44 bg-white p-2 rounded-lg flex items-center justify-center">
              <img src={qrCode} alt="TOTP QR Code" className="w-full h-full object-contain" />
            </div>
            {secretUri && (
              <div className="space-y-1.5 text-left">
                <span className="text-[11px] text-neutral-400 font-medium">
                  Manual setup secret key:
                </span>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-mono text-xs text-neutral-200 bg-neutral-900 py-2 px-2.5 rounded-lg select-all break-all border border-neutral-800">
                    {secretUri}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(secretUri);
                      setSuccess("Secret key copied to clipboard!");
                      setTimeout(() => setSuccess(null), 3000);
                    }}
                    className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition shrink-0 border border-neutral-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Supported apps: Google Authenticator, Microsoft Authenticator, 1Password, Authy.
                </p>
              </div>
            )}
            <form onSubmit={handleVerifyEnrollment} className="space-y-3 pt-2">
              <input
                type="text"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code (e.g. 123456)"
                className="w-full text-center tracking-widest font-mono text-lg py-2.5 px-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Confirm & Enable MFA"}
              </button>
            </form>
          </div>
        )}

        {/* Verify Existing Factor if at AAL1 */}
        {!qrCode && hasVerifiedFactor && aalLevel === "aal1" && (
          <form
            onSubmit={handleVerifySession}
            className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Enter Authenticator Code
            </div>
            <input
              type="text"
              pattern="[0-9]{6}"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center tracking-widest font-mono text-lg py-2.5 px-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              required
            />
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? "Verifying Code…" : "Verify MFA for Session"}
            </button>
          </form>
        )}

        {/* Action button if no factors registered */}
        {!qrCode && !hasVerifiedFactor && (
          <button
            type="button"
            onClick={handleStartEnrollment}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Set Up Two-Factor Authentication (TOTP)
          </button>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
