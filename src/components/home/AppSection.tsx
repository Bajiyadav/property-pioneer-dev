import { Smartphone, QrCode, Sparkles } from "lucide-react";

export function AppSection() {
  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Mobile Experience Coming Soon
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
              Search & Manage Homes On The Go
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Download the Urban Properties mobile app for instant push notifications, native map view, and offline saved searches.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                <Smartphone className="h-4 w-4 text-primary" /> Android (APK) — Coming Soon
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground">
                <Smartphone className="h-4 w-4 text-primary" /> iOS App — Coming Soon
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-secondary/50 border border-border">
            <QrCode className="h-20 w-20 text-foreground" />
            <p className="mt-2 text-xs font-semibold text-foreground">Scan QR Code to Download</p>
            <p className="text-[10px] text-muted-foreground">Expo React Native App Build</p>
          </div>
        </div>
      </div>
    </section>
  );
}
