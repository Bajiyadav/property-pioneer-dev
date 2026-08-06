import { Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Building2, MapPin, BadgeCheck } from "lucide-react";

export function ProductHero({
  badge,
  title,
  subtitle,
  productType,
  bgGradient = "from-emerald-900/20 via-background to-background",
}: {
  badge: string;
  title: string;
  subtitle: string;
  productType: string;
  bgGradient?: string;
}) {
  return (
    <div className={`relative overflow-hidden border-b border-border/40 bg-gradient-to-b ${bgGradient} py-16 sm:py-24`}>
      {/* Background Glow Overlay */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 text-center">
        {/* Launch Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>{badge}</span>
        </div>

        {/* Title */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold text-foreground sm:text-5xl lg:text-6xl tracking-tight leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          {subtitle}
        </p>

        {/* Value Prop Pill Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1 text-xs font-semibold text-foreground border border-border/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 100% Verified Title Deeds
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1 text-xs font-semibold text-foreground border border-border/40">
            <BadgeCheck className="h-3.5 w-3.5 text-blue-500" /> Direct Seller Contact
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1 text-xs font-semibold text-foreground border border-border/40">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-500" /> 0% Brokerage & Zero Hidden Fee
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#early-access"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-xs font-extrabold text-primary-foreground shadow-lg transition hover:brightness-110 hover:scale-[1.02]"
          >
            Join Priority VIP Access <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#roadmap"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-xs font-bold text-foreground transition hover:bg-secondary"
          >
            View Expansion Roadmap
          </a>
        </div>

        {/* Launch City Banner */}
        <div className="mt-10 inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md px-4 py-2 text-xs font-medium text-muted-foreground">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <span>Launching First in <strong className="text-foreground">Hyderabad</strong> — Expanding to Bangalore, Mumbai, Chennai & Pan-India.</span>
        </div>
      </div>
    </div>
  );
}
