import { FileText, ShieldCheck, Lock, Cpu, Database, CheckCircle2 } from "lucide-react";

export function DocumentationCenter({
  productTitle = "Real Estate Platform",
}: {
  productTitle?: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xl sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <FileText className="h-3.5 w-3.5" /> Technical Documentation & Architecture
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
              {productTitle} Architecture & Compliance
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Built to enterprise security standards with PostgreSQL RLS and automated encumbrance
              audits.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-xl border border-border bg-secondary/40 px-3 py-1.5 text-xs font-bold text-foreground">
              v2.4.0 Stable
            </span>
            <span className="rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ISO 27001
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-2">
            <div className="flex items-center gap-2 font-extrabold text-xs text-foreground">
              <Lock className="h-4 w-4 text-emerald-500" /> Data Privacy & Encryption
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              AES-256 encryption at rest and TLS 1.3 in transit. Phone numbers revealed only after
              OTP verification.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-2">
            <div className="flex items-center gap-2 font-extrabold text-xs text-foreground">
              <Database className="h-4 w-4 text-blue-500" /> PostgreSQL Row-Level Security
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Row-Level Security (RLS) policies isolate tenant, owner, and agent records with 100%
              audit logging.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 space-y-2">
            <div className="flex items-center gap-2 font-extrabold text-xs text-foreground">
              <Cpu className="h-4 w-4 text-purple-500" /> AI Title Deed Verification
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Dharani & RERA portal cross-referencing algorithms verify land survey numbers and
              occupancy certificates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
