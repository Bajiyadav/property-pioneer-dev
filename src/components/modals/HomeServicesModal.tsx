import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Truck, Sparkles, Paintbrush, Landmark, CheckCircle2, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export type ServiceType = "agreement" | "movers" | "cleaning" | "painting" | "loan";

const SERVICES_DATA: Record<ServiceType, { title: string; price: string; desc: string; icon: any }> = {
  agreement: {
    title: "Digital E-Stamp Rental Agreement",
    price: "₹499 (State Stamped)",
    desc: "100% Legally valid digital rental agreement with Govt E-Stamp, biometric e-signature, and instant PDF delivery.",
    icon: FileText,
  },
  movers: {
    title: "Packers & Movers Booking",
    price: "From ₹2,499",
    desc: "Verified local & intercity packing, loading, and damage-free transit in Hyderabad & pan-India.",
    icon: Truck,
  },
  cleaning: {
    title: "Deep House Cleaning & Polish",
    price: "From ₹1,199",
    desc: "Full home deep cleaning, bathroom sanitization, marble floor polishing, and kitchen degreasing.",
    icon: Sparkles,
  },
  painting: {
    title: "Wall Painting & Waterproofing",
    price: "From ₹3,999",
    desc: "Asian Paints & Berger certified painters with dust-free sanding and 1-day execution.",
    icon: Paintbrush,
  },
  loan: {
    title: "Home Loan & Mortgage Assistance",
    price: "0% Service Fee",
    desc: "Get pre-approved home loans starting at 8.35% p.a. interest from HDFC, SBI, ICICI, and Axis Bank.",
    icon: Landmark,
  },
};

export function HomeServicesModal({
  isOpen,
  onClose,
  initialService = "agreement",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialService?: ServiceType;
}) {
  const [selectedService, setSelectedService] = useState<ServiceType>(initialService);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeData = SERVICES_DATA[selectedService];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success(`Request received for ${activeData.title}!`);
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-foreground sm:text-2xl">
            Urban Properties Home Services
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            End-to-end tenant & owner services guaranteed at the lowest prices.
          </DialogDescription>
        </DialogHeader>

        {/* Service Switcher Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-border/40">
          {(Object.keys(SERVICES_DATA) as ServiceType[]).map((key) => {
            const item = SERVICES_DATA[key];
            const IconComp = item.icon;
            const active = selectedService === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedService(key);
                  setSubmitted(false);
                }}
                className={`flex flex-none items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <IconComp className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{key === "agreement" ? "Rental Agreement" : item.title.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {submitted ? (
          <div className="mt-4 rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-6 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-foreground">Service Request Confirmed!</h3>
            <p className="text-xs text-muted-foreground">
              Our service coordinator will call <span className="font-bold text-foreground">{phone}</span> within 15 minutes to finalize details for <span className="font-bold text-foreground">{activeData.title}</span>.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">{activeData.title}</h4>
                <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {activeData.price}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{activeData.desc}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Mobile Number for Callback</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-500 flex items-center justify-center gap-2"
            >
              {loading ? "Submitting Request…" : `Book ${activeData.title}`} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
