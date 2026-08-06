import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Sparkles, CheckCircle2, Bell, Building2, Rocket, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function ExpansionWaitlistModal({
  isOpen,
  onClose,
  cityName = "Bangalore",
  categoryName = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  cityName?: string;
  categoryName?: string;
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = categoryName
    ? `${categoryName} — Launching Soon with 0% Brokerage`
    : `${cityName} Launch — Get Early Access to 0% Brokerage Homes`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setJoined(true);
      toast.success(`You're #1,428 on the ${cityName || categoryName} early access waitlist!`);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Rocket className="h-3.5 w-3.5" /> Launching Q3 2026
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              MVP: Hyderabad Live
            </span>
          </div>

          <DialogTitle className="mt-3 text-xl font-extrabold text-foreground sm:text-2xl">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground leading-relaxed">
            We are expanding our 100% verified, 0% brokerage direct owner network from Hyderabad to {cityName || categoryName}. Be the first to unlock listings!
          </DialogDescription>
        </DialogHeader>

        {joined ? (
          <div className="mt-4 rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-6 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">You're on the VIP Waitlist!</h3>
            <p className="text-xs text-muted-foreground">
              We'll send an instant SMS alert to <span className="font-bold text-foreground">{phone}</span> as soon as verified listings drop in {cityName || categoryName}.
            </p>
            <button
              onClick={() => {
                setJoined(false);
                onClose();
              }}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
            >
              Done & Continue Browsing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" /> Waitlist Benefits:
              </div>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-none" />
                  <span>Early 48-hour priority access to zero brokerage flats</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-none" />
                  <span>Free Telangana/State Digital E-Stamp Rental Agreement</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-none" />
                  <span>₹2,000 moving discount voucher upon launch</span>
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Mobile Number (for SMS Priority Alert)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="w-full rounded-xl border border-border bg-background pl-12 pr-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary py-3 text-xs font-extrabold text-primary-foreground shadow-md transition hover:brightness-110 flex items-center justify-center gap-2"
            >
              {loading ? "Joining Waitlist…" : "Join Early Access Waitlist"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
