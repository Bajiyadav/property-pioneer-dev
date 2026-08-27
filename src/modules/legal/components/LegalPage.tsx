import { Link } from "@tanstack/react-router";
import { APP_NAME } from "@/config/app";

export const LEGAL_CONTACT = "support@seedhaproperties.com";

/** Every legal page states the date it took effect, so revisions are auditable. */
export const LEGAL_EFFECTIVE_DATE = "28 August 2026";

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

/**
 * Shared shell for the policy pages.
 *
 * These pages describe what the platform actually does today. Anything not yet
 * built is stated as not built rather than promised — an unearned guarantee in
 * a privacy policy is a liability, and `smoke.spec.ts` fails any page making a
 * claim the platform cannot back.
 */
export function LegalPage({
  title,
  summary,
  sections,
}: {
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground">
        <Link to="/" className="transition hover:text-foreground">
          Home
        </Link>
        <span className="px-1.5">/</span>
        <span className="font-semibold text-foreground">{title}</span>
      </nav>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        Effective {LEGAL_EFFECTIVE_DATE} · {APP_NAME}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-foreground">{summary}</p>

      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-extrabold text-foreground">{section.heading}</h2>
            <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border/60 bg-secondary/30 p-5">
        <h2 className="text-sm font-extrabold text-foreground">Questions about this policy</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Write to{" "}
          <a
            href={`mailto:${LEGAL_CONTACT}`}
            className="font-semibold text-primary hover:underline"
          >
            {LEGAL_CONTACT}
          </a>
          . We reply to privacy requests within 30 days.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
          <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground">
            Terms of Service
          </Link>
          <Link to="/cookie-policy" className="text-muted-foreground hover:text-foreground">
            Cookie Policy
          </Link>
          <Link to="/refund-policy" className="text-muted-foreground hover:text-foreground">
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Small helper so pages read as prose rather than markup. */
export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
