import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    <Dialog open={Boolean(data)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-card border-border p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              data.status === "live" ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"
            }`}>
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
          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground mb-3">Roadmap & Target Corridors</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-foreground">
              <span className="flex items-center gap-1.5"><Building className="h-4 w-4 text-primary" /> IT & Commercial Parks</span>
              <span className="flex items-center gap-1.5"><Compass className="h-4 w-4 text-primary" /> High-Demand Residential</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Direct Owner Verification</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 0% Brokerage Guarantee</span>
            </div>
          </div>

          {joined ? (
            <div className="rounded-xl bg-emerald-600/10 p-4 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> You're on the launch list for {data.name}! We'll notify you on day one.
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Get Notified When Urban Properties Launches in {data.name}</p>
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
  );
}
