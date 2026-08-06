import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, Phone } from "lucide-react";

export function RichServiceBookingForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("Deep House Cleaning");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("Morning (09:00 AM - 12:00 PM)");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Home Service Booking Confirmed! Partner assigned.");
    }, 700);
  };

  return (
    <section id="booking-form" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-teal-600/30 bg-card p-6 shadow-2xl sm:p-10">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Instant Confirmation
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
            Book Verified Home Service
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Zero advance payment required. Pay after 100% service satisfaction.</p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-emerald-600/30 bg-emerald-600/10 p-8 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground">Service Booking Confirmed!</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your service partner has been assigned. SMS & WhatsApp details have been sent to <strong>+91 {phone}</strong>.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow"
            >
              Book Another Service
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Reddy"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Mobile Number (+91)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    className="w-full rounded-xl border border-border bg-background pl-12 pr-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@domain.com"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Service Type</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="Deep House Cleaning">Deep House Cleaning</option>
                  <option value="Kitchen & Bath Sanitization">Kitchen & Bath Sanitization</option>
                  <option value="Packers & Movers Relocation">Packers & Movers Relocation</option>
                  <option value="Digital E-Stamp Rental Agreement">Digital E-Stamp Rental Agreement</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 04:00 PM)">Afternoon (12:00 PM - 04:00 PM)</option>
                  <option value="Evening (04:00 PM - 07:00 PM)">Evening (04:00 PM - 07:00 PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Full Service Address</label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat / Building Name, Locality, Landmark, City"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Special Instructions (Optional)</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Please bring extra ladder for high ceiling cleaning"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-teal-600 py-3.5 text-xs font-black text-white shadow-xl transition hover:bg-teal-500 disabled:opacity-50"
            >
              {loading ? "Confirming Booking…" : "Confirm Booking (Pay After Service)"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
