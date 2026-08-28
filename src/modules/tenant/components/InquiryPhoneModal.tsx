import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, User, CheckCircle2 } from "lucide-react";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { enquiryInputSchema, TURNSTILE_SITE_KEY } from "@/modules/enquiry/services/enquiryService";

interface InquiryPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

export function InquiryPhoneModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
}: InquiryPhoneModalProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real Turnstile token from the Cloudflare widget. Undefined until the
  // visitor passes the challenge, and cleared again when it expires or the
  // server rejects it — a token is single-use.
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  // Remounting the widget is how it gets reset: a rejected token can never be
  // replayed, so a retry needs a freshly rendered challenge.
  const [captchaKey, setCaptchaKey] = useState(0);

  // When the form became visible. The server rejects anything submitted in
  // under MIN_SUBMIT_MS as bot-like, so this has to be a genuine measurement —
  // the previous hardcoded 1500 was both fabricated and below that floor, so
  // every submission was rejected as "too quick" before the captcha even ran.
  const openedAtRef = useRef<number>(Date.now());
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now();
      setError(null);
      setWhatsappUrl(null);
    }
  }, [isOpen]);

  const captchaRequired = Boolean(TURNSTILE_SITE_KEY);
  const awaitingCaptcha = captchaRequired && !turnstileToken;

  const resetCaptcha = () => {
    setTurnstileToken(undefined);
    setCaptchaKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone) {
      setError("Please provide both name and phone number");
      return;
    }

    // Never submit without a real token when the challenge is configured.
    if (awaitingCaptcha) {
      setError("Please complete the verification below before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        propertyId,
        name,
        phone,
        message: `I'm interested in ${propertyTitle}. Please contact me.`,
        // Undefined when Turnstile is not provisioned. The server mirrors this:
        // verifyTurnstile() reports `configured: false` and allows the request,
        // so the two sides stay in step instead of silently disagreeing.
        turnstileToken,
        elapsedMs: Date.now() - openedAtRef.current,
        company: "", // honeypot — must stay empty
      };

      const validation = enquiryInputSchema.safeParse(payload);
      if (!validation.success) {
        throw new Error(
          validation.error.issues[0]?.message ?? "Please check the details you entered.",
        );
      }

      const res = await fetch("/api/public/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        whatsappUrl?: string;
      };

      if (!res.ok) {
        // 403 is a failed or expired challenge. The token is spent either way,
        // so issue a fresh one rather than leaving a dead token in state.
        if (res.status === 403) {
          resetCaptcha();
          throw new Error("Verification failed. Please complete the check and try again.");
        }
        resetCaptcha();
        throw new Error(data.error || "Unable to send your enquiry. Please try again.");
      }

      if (data.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
      }
      setIsSuccess(true);

      // Save minimal profile to localStorage for future interactions
      try {
        localStorage.setItem("sp_tenant_profile", JSON.stringify({ name, phone }));
      } catch {
        // Private browsing or blocked storage — not worth surfacing.
      }
    } catch (err: unknown) {
      if (err instanceof TypeError) {
        // fetch() rejects with TypeError when the network is unreachable.
        resetCaptcha();
        setError("Couldn't reach the server. Check your connection and try again.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="sm:max-w-md text-center py-8">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-black mb-1">Direct Connection Sent!</DialogTitle>

          {/* Brokerage Saved Pill */}
          <div className="my-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-extrabold text-amber-700 dark:text-amber-300">
            <span>🎉 You saved ~₹15,000+ in broker commissions</span>
          </div>

          <DialogDescription className="text-sm leading-relaxed px-2">
            The owner of <strong>{propertyTitle}</strong> has received your inquiry directly.
          </DialogDescription>

          <div className="mt-6 space-y-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>Chat Instantly on WhatsApp</span>
              </a>
            )}

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full h-11 rounded-xl text-sm font-bold"
            >
              Continue Browsing Verified Homes
            </Button>
          </div>

          <div className="mt-5 pt-4 border-t border-border/60 text-xs text-muted-foreground">
            <span>Need dedicated personal help finding a home? </span>
            <a href="/plans" className="font-bold text-teal-600 hover:underline">
              Explore Assisted Seeker Plans
            </a>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Contact Owner Directly</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Enter your details below to get the owner's contact info instantly for{" "}
            <strong>{propertyTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/80 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-border/80 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* Renders nothing when VITE_TURNSTILE_SITE_KEY is unset, matching the
              server, which then treats a missing token as acceptable. */}
          <TurnstileWidget
            key={captchaKey}
            action="enquiry"
            onToken={setTurnstileToken}
            className="[&>*]:max-w-full"
          />

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || awaitingCaptcha}
              aria-describedby={awaitingCaptcha ? "enquiry-captcha-hint" : undefined}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#115E59] hover:from-[#115E59] hover:to-[#134E4A] text-white font-extrabold text-base shadow-lg transition-all"
            >
              {isSubmitting ? "Sending Request..." : "Get Owner Details"}
            </Button>
            {awaitingCaptcha && (
              <p
                id="enquiry-captcha-hint"
                className="text-xs text-center text-muted-foreground mt-2"
              >
                Complete the verification above to continue.
              </p>
            )}
            <p className="text-xs text-center text-muted-foreground mt-4">
              By continuing, you agree to our Terms of Service & Privacy Policy. No brokerage will
              be charged.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
