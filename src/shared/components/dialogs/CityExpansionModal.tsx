import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AVAILABILITY_LABEL,
  BANGALORE_CORRIDORS,
  EXPANSION_FEATURE_IDS,
  FEATURE_DETAILS,
} from "@/modules/marketing/content/featureDetails";
import { FeatureDetailModal } from "./FeatureDetailModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Bell, CheckCircle2, Rocket, Building, Compass } from "lucide-react";

export interface CityModalData {
  name: string;
  tag: string;
  status: "live" | "upcoming";
  badge: string;
}

export function CityExpansionModal({
  data,
  onClose,
}: {
  data: CityModalData | null;
  onClose: () => void;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  if (!data) return null;

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setJoined(true);
    toast.success(`Registered for ${data.name} launch notifications!`, {
      description: "You'll receive priority early access as soon as property onboarding begins.",
    });
  };

  return (
    <>
      <Dialog open={Boolean(data)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-xl bg-card border-border p-6 rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  data.status === "live"
                    ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {data.badge}
              </span>
              <span className="text-xs text-muted-foreground">Pan-India Expansion</span>
            </div>
            <DialogTitle className="text-2xl font-semibold text-foreground mt-2 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" /> {data.name} Expansion Roadmap
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {data.tag}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {data.name === "Bangalore" && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                  Target corridors
                </h4>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Each runs a real search. Where we have nothing yet, the results page says so
                  plainly.
                </p>
                <div className="flex flex-wrap gap-2">
                  {BANGALORE_CORRIDORS.map((c) => (
                    <Link
                      key={c.name}
                      to="/properties"
                      search={{
                        q: c.name,
                        city: "",
                        listing: "",
                        minPrice: 0,
                        maxPrice: 0,
                        beds: 0,
                      }}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary"
                    >
                      {c.name}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          c.hasListings
                            ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.hasListings ? "Live" : "Soon"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                Roadmap &amp; Target Corridors
              </h4>
              <p className="mb-3 text-[11px] text-muted-foreground">
                Tap any card for what it means, how it works, and where it stands today.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {EXPANSION_FEATURE_IDS.map((id) => {
                  const feature = FEATURE_DETAILS[id];
                  const Icon = feature.icon;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDetailId(id)}
                      aria-label={`${feature.title} — open details`}
                      className="group flex items-start gap-2 rounded-xl border border-border/60 bg-card p-2.5 text-left transition hover:border-primary hover:shadow-sm"
                    >
                      <Icon className="mt-0.5 h-4 w-4 flex-none text-primary" />
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] font-bold text-foreground">
                          {feature.title}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {AVAILABILITY_LABEL[feature.availability]}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {joined ? (
              <div className="rounded-xl bg-emerald-600/10 p-4 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> You're on the launch list for {data.name}!
                We'll notify you on day one.
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="space-y-3">
                <p className="text-xs font-semibold text-foreground">
                  Get Notified When Urban Properties Launches in {data.name}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-xs outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 shadow"
                  >
                    <Bell className="h-3.5 w-3.5" /> Notify Me
                  </button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FeatureDetailModal
        detail={detailId ? FEATURE_DETAILS[detailId] : null}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
