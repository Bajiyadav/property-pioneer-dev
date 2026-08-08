import { Link } from "@tanstack/react-router";
import { Wrench, ArrowLeft, Home, RefreshCw, Terminal } from "lucide-react";
import { BrandMark } from "@/shared/components/BrandMark";
import { APP_COPYRIGHT } from "@/config/app";

export function CustomErrorBoundary({ error, reset }: { error?: Error; reset?: () => void }) {
  const requestId = `REQ-${Date.now().toString(36).toUpperCase()}-UP`;
  const isDev = Boolean(import.meta.env.DEV);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="max-w-xl space-y-6">
        <BrandMark responsiveName className="justify-center" />

        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
          <Wrench className="h-10 w-10" />
        </div>

        <div>
          <span className="rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            🚧 We're Fixing Something
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-foreground sm:text-3xl">
            The page is temporarily unavailable
          </h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Our technical team has been automatically alerted. We are resolving this short
            interruption to get you back to your property search.
          </p>
        </div>

        {/* Reference Code & Message */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 text-left font-mono text-[11px] space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Reference Code:</span>
            <span className="font-bold text-foreground">{requestId}</span>
          </div>

          {error?.message && (
            <p className="text-rose-500 dark:text-rose-400 font-semibold break-words">
              Error: {error.message}
            </p>
          )}

          {isDev && error?.stack && (
            <div className="mt-3 border-t border-border/40 pt-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                <Terminal className="h-3 w-3" /> Dev Stack Trace:
              </span>
              <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto max-h-48 whitespace-pre-wrap leading-tight">
                {error.stack}
              </pre>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {reset && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition hover:brightness-110"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          )}

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary"
          >
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>

        <p className="pt-4 text-xs text-muted-foreground">{APP_COPYRIGHT}</p>
      </div>
    </div>
  );
}
