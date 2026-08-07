import { Sparkles } from "lucide-react";

const STAGES = [
  { step: "01", label: "Instant Booking", desc: "Select date & time slot in 30 seconds." },
  {
    step: "02",
    label: "Automated Confirmation",
    desc: "SMS & WhatsApp confirmation sent instantly.",
  },
  { step: "03", label: "Expert Assigned", desc: "Background-checked professional assigned." },
  { step: "04", label: "Live GPS Tracking", desc: "Track technician arrival on live map." },
  { step: "05", label: "Service Starts", desc: "Certified professional begins on-site work." },
  { step: "06", label: "Quality Audit", desc: "Supervisor inspects all checklist points." },
  { step: "07", label: "Post-Service Pay", desc: "Pay via UPI/Card after 100% satisfaction." },
  { step: "08", label: "Rate Experience", desc: "Share feedback & unlock referral reward." },
];

export function ServiceProcessTimeline() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          <Sparkles className="h-3.5 w-3.5" /> End-to-End Service Flow
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
          8-Step Seamless Home Service Journey
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          From instant booking to live GPS tracking & post-service payment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((s, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-2"
          >
            <span className="text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-600/10 px-2.5 py-1 rounded-full">
              STEP {s.step}
            </span>
            <h3 className="text-sm font-extrabold text-foreground mt-2">{s.label}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
