/**
 * Environment validation.
 *
 * Fails loudly and early on a misconfigured deployment instead of surfacing as
 * a confusing 401 or an empty listing page hours later.
 *
 * Two rules this file exists to enforce:
 *  1. `VITE_*` is inlined into the client bundle — it is public by construction.
 *     A secret behind that prefix is a published secret.
 *  2. Server-only values are read via `process.env` and must never be imported
 *     into a client component.
 */

export interface EnvIssue {
  variable: string;
  problem: string;
  severity: "error" | "warning";
}

const SECRET_PATTERN = /(SECRET|SERVICE_ROLE|PRIVATE|PASSWORD)/i;

/** Client config. Safe to read in the browser — these values are public. */
export function readClientEnv() {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
    appUrl: import.meta.env.VITE_APP_URL as string | undefined,
  };
}

export function validateClientEnv(): EnvIssue[] {
  const env = readClientEnv();
  const issues: EnvIssue[] = [];

  if (!env.supabaseUrl) {
    issues.push({
      variable: "VITE_SUPABASE_URL",
      problem: "missing — the browser cannot reach Supabase",
      severity: "error",
    });
  } else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(env.supabaseUrl)) {
    issues.push({
      variable: "VITE_SUPABASE_URL",
      problem: `does not look like a Supabase URL: ${env.supabaseUrl}`,
      severity: "warning",
    });
  }

  if (!env.supabaseKey) {
    issues.push({
      variable: "VITE_SUPABASE_PUBLISHABLE_KEY",
      problem: "missing — every client query will be unauthorised",
      severity: "error",
    });
  } else if (/^sb_secret_/.test(env.supabaseKey) || /service_role/i.test(env.supabaseKey)) {
    // The single worst misconfiguration possible: it publishes an RLS-bypassing
    // key to every visitor.
    issues.push({
      variable: "VITE_SUPABASE_PUBLISHABLE_KEY",
      problem: "looks like a SECRET key — this would be published to every visitor",
      severity: "error",
    });
  }

  if (!env.appUrl) {
    issues.push({
      variable: "VITE_APP_URL",
      problem: "missing — canonical URLs and sitemap will fall back to a default origin",
      severity: "warning",
    });
  }

  // Nothing secret may hide behind the public prefix.
  for (const key of Object.keys(import.meta.env)) {
    if (key.startsWith("VITE_") && SECRET_PATTERN.test(key)) {
      issues.push({
        variable: key,
        problem: "a secret-looking value behind the public VITE_ prefix",
        severity: "error",
      });
    }
  }

  return issues;
}

/**
 * Server config. Import only from `*.server.ts` modules or server functions —
 * never from a component.
 */
export function validateServerEnv(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"] as const;

  for (const key of required) {
    if (!process.env[key]) {
      issues.push({ variable: key, problem: "missing", severity: "error" });
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push({
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      problem: "missing — admin moderation and enquiry submission will return 503",
      severity: "warning",
    });
  }

  const site = process.env.TURNSTILE_SECRET_KEY;
  const hasSiteKey = Boolean(import.meta.env?.VITE_TURNSTILE_SITE_KEY);
  if (hasSiteKey !== Boolean(site)) {
    issues.push({
      variable: "TURNSTILE_SECRET_KEY / VITE_TURNSTILE_SITE_KEY",
      problem: "only one half of the Turnstile pair is configured; CAPTCHA is inert",
      severity: "warning",
    });
  }

  return issues;
}

/** Logs issues once at startup. Errors throw in dev so they cannot be ignored. */
export function reportEnvIssues(issues: EnvIssue[], scope: "client" | "server"): void {
  if (issues.length === 0) return;

  const errors = issues.filter((i) => i.severity === "error");
  for (const i of issues) {
    const line = `[env:${scope}] ${i.variable} — ${i.problem}`;
    if (i.severity === "error") console.error(line);
    else console.warn(line);
  }

  // In production a hard throw would take the whole site down over a warning-
  // level misconfiguration, so surface loudly and keep serving.
  if (errors.length > 0 && import.meta.env?.DEV) {
    throw new Error(
      `Invalid ${scope} environment:\n` +
        errors.map((e) => `  ${e.variable}: ${e.problem}`).join("\n"),
    );
  }
}
