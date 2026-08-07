import { Smartphone, QrCode, Sparkles, CheckCircle2, Apple, Play } from "lucide-react";
import { toast } from "sonner";

export function MobileAppPreview() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-6 shadow-2xl sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-primary">
            <Smartphone className="h-3.5 w-3.5" /> Mobile Experience
          </span>
          <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            Search Homes on the Go with Urban Mobile App
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get instant push notifications for direct owner listings, schedule 1-click video
            walkthroughs, and sign digital rental agreements directly from your phone.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-foreground pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live GPS Map Search
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> WhatsApp Owner Direct
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant EMI Calculator
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Digital E-Stamp Agreements
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => toast.info("iOS App Download Link sent to your phone")}
              className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-xs font-extrabold text-background shadow transition hover:opacity-90"
            >
              <Apple className="h-4 w-4" /> Download for iOS
            </button>
            <button
              onClick={() => toast.info("Android APK / Play Store Link sent to your phone")}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-xs font-extrabold text-foreground shadow transition hover:bg-secondary"
            >
              <Play className="h-4 w-4 text-emerald-500" /> Download for Android
            </button>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 text-center shadow-xl space-y-3 flex-none w-64">
          <div className="mx-auto grid h-32 w-32 place-items-center rounded-2xl bg-secondary text-foreground p-3 border border-border">
            <QrCode className="h-24 w-24 text-primary" />
          </div>
          <p className="text-xs font-bold text-foreground">Scan QR Code to Download</p>
          <p className="text-[10px] text-muted-foreground">Compatible with iOS 15+ & Android 9+</p>
        </div>
      </div>
    </section>
  );
}
