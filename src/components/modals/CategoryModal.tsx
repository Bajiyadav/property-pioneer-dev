import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Search, MapPin, Sparkles, CheckCircle2, ArrowRight, Bell, ShieldCheck, Landmark, Building, Key } from "lucide-react";

export interface CategoryModalData {
  id: string;
  title: string;
  isLive: boolean;
  count?: string;
  startPrice?: string;
}

export function CategoryModal({
  data,
  onClose,
}: {
  data: CategoryModalData | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  if (!data) return null;

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setJoined(true);
    toast.success(`You're on the waitlist for Urban Properties ${data.title}!`, {
      description: "We'll notify you as soon as early access opens.",
    });
  };

  return (
    <Dialog open={Boolean(data)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              data.isLive ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
            }`}>
              {data.isLive ? "● Live in Hyderabad" : "🚀 Launching Q4 2026"}
            </span>
            {data.startPrice && (
              <span className="text-xs text-muted-foreground">Starting from <strong className="text-foreground">{data.startPrice}</strong></span>
            )}
          </div>
          <DialogTitle className="text-2xl font-semibold text-foreground mt-2 flex items-center gap-2">
            {data.title} Experience
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {data.isLive
              ? "Discover verified 0% brokerage listings across top Hyderabad locations."
              : `The ${data.title} module is currently in active development for pan-India rollout.`}
          </DialogDescription>
        </DialogHeader>

        {data.isLive ? (
          /* Live Category Discover Panel */
          <div className="mt-4 space-y-6">
            {/* Shortcuts Grid */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Top Hyderabad Hotspots</h4>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {["Gachibowli", "Madhapur", "Kondapur", "Hitech City", "Miyapur", "Financial District"].map((loc) => (
                  <Link
                    key={loc}
                    to="/properties"
                    search={{ q: loc, city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-3 text-xs font-medium text-foreground transition hover:border-primary hover:bg-card"
                  >
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {loc}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Micro Filter Shortcuts */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-foreground">Quick Filters Ready</p>
                <p className="text-[11px] text-muted-foreground">Near Metro Stations • Near IT Parks • Furnished 2 BHK</p>
              </div>
              <Link
                to="/properties"
                search={{ q: data.title, city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 shadow"
              >
                <Search className="h-4 w-4" /> Browse {data.title}
              </Link>
            </div>
          </div>
        ) : (
          /* Launching Soon Roadmap Waitlist Panel */
          <div className="mt-4 space-y-6">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground mb-3">What You Will Get</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Verified Sellers</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Bank Loan Assistance</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Legal Title Audit</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> AI Price Estimation</span>
              </div>
            </div>

            {joined ? (
              <div className="rounded-xl bg-emerald-600/10 p-4 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> You're registered for early access! We will email you once live.
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                <p className="text-xs font-semibold text-foreground">Get Notified First When {data.title} Launches</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 shadow"
                  >
                    <Bell className="h-3.5 w-3.5" /> Join Waitlist
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
