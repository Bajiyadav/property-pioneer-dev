import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Truck,
  Sparkles,
  Zap,
  Wrench,
  Paintbrush,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import { HOME_SERVICES_LIST, type ServiceItem } from "@/config/services";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

function ServicesPage() {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleBookService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(`Service inquiry received for ${selectedService?.name || "Home Service"}!`, {
        description: "Our verified partner will connect with you within 30 minutes.",
      });
      setSelectedService(null);
      setPhone("");
      setLocality("");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4" />
            <span>100% Verified Partners · Zero Hidden Charges</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Seedha Home Services
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need for hassle-free home relocation, maintenance, deep cleaning, and
            legal tenancy agreements.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
          {HOME_SERVICES_LIST.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-6 shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition-all"
              >
                {srv.tag && (
                  <span className="absolute top-4 right-4 rounded-full bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 shadow-xs">
                    {srv.tag}
                  </span>
                )}

                <div>
                  <div
                    className={`h-14 w-14 rounded-2xl ${srv.iconBg} ${srv.iconColor} flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                    {srv.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {srv.description}
                  </p>

                  <ul className="mt-4 space-y-1.5 text-xs text-foreground/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Standardized upfront pricing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Background-verified professionals</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Same-day service slots</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setSelectedService(srv)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>Book Service</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Value Prop Banner */}
        <div className="mt-12 rounded-3xl bg-secondary/30 border border-border/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
              Are you a home service professional?
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Join Seedha Services Network and get direct, verified customer bookings in your city
              with 0% middleman cut.
            </p>
          </div>
          <a
            href="mailto:partners@seedhaproperties.com?subject=Partner%20Inquiry%20-%20Seedha%20Services"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-xs font-bold transition-all hover:opacity-90 shrink-0"
          >
            <PhoneCall className="h-4 w-4" />
            <span>Join as Partner</span>
          </a>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl ${selectedService.iconBg} ${selectedService.iconColor} flex items-center justify-center`}
                >
                  <selectedService.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    {selectedService.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">Doorstep Service Booking</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="h-8 w-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Mobile Number (for booking confirmation)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Locality / Landmark
                </label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Madhapur, Hyderabad"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Confirming Slot..." : "Confirm Doorstep Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
