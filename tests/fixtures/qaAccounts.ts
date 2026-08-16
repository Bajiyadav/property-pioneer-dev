/**
 * Dedicated QA role accounts used by the authentication lifecycle suites.
 *
 * Credentials are read from the environment and are NEVER committed. Set them
 * in `.env` locally (gitignored) or in CI secrets — see `.env.example` for the
 * variable names. When a password is absent the suites skip with an explicit
 * message rather than silently passing.
 *
 * These are throwaway verification accounts on the QA project. They are not
 * production user data and must never be granted access to production records.
 */
import fs from "node:fs";
import path from "node:path";

export type QaRole = "customer" | "owner" | "agent" | "admin";

export interface QaAccount {
  role: QaRole;
  email: string;
  password: string;
  dashboard: string;
  fullName: string;
  phone: string;
}

/**
 * Merges `.env` into `process.env` for runners that do not load it themselves
 * (vitest and playwright both run outside Vite's env pipeline here).
 */
export function loadEnv(): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = { ...process.env };
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx <= 0) continue;
        const key = trimmed.slice(0, idx).trim();
        // A real process env var always wins over the file.
        if (env[key] === undefined) env[key] = trimmed.slice(idx + 1).trim();
      }
    }
  } catch {
    // `.env` is optional — CI supplies real environment variables instead.
  }
  return env;
}

const ENV = loadEnv();

const DEFAULT_DOMAIN = "urbanproperties.in";

const SPEC: Array<Omit<QaAccount, "password" | "email"> & { emailVar: string; passVar: string }> = [
  {
    role: "customer",
    dashboard: "/dashboard/customer",
    fullName: "QA Customer Test",
    phone: "+919876543210",
    emailVar: "QA_CUSTOMER_EMAIL",
    passVar: "QA_CUSTOMER_PASSWORD",
  },
  {
    role: "owner",
    dashboard: "/dashboard/owner",
    fullName: "QA Owner Test",
    phone: "+919876543211",
    emailVar: "QA_OWNER_EMAIL",
    passVar: "QA_OWNER_PASSWORD",
  },
  {
    role: "agent",
    dashboard: "/dashboard/agent",
    fullName: "QA Agent Test",
    phone: "+919876543212",
    emailVar: "QA_AGENT_EMAIL",
    passVar: "QA_AGENT_PASSWORD",
  },
  {
    role: "admin",
    dashboard: "/dashboard/admin",
    fullName: "QA Admin Test",
    phone: "+919876543213",
    emailVar: "QA_ADMIN_EMAIL",
    passVar: "QA_ADMIN_PASSWORD",
  },
];

export const QA_ACCOUNTS: QaAccount[] = SPEC.map((s) => ({
  role: s.role,
  dashboard: s.dashboard,
  fullName: s.fullName,
  phone: s.phone,
  email: ENV[s.emailVar] ?? `${s.role}.qa@${DEFAULT_DOMAIN}`,
  password: ENV[s.passVar] ?? "",
}));

export function accountFor(role: QaRole): QaAccount {
  const account = QA_ACCOUNTS.find((a) => a.role === role);
  if (!account) throw new Error(`No QA account configured for role "${role}"`);
  return account;
}

/** True only when every role has a password available. */
export const QA_CREDENTIALS_CONFIGURED = QA_ACCOUNTS.every((a) => a.password.length > 0);

export const QA_CREDENTIALS_HINT =
  "QA credentials are not configured. Set QA_{CUSTOMER,OWNER,AGENT,ADMIN}_PASSWORD " +
  "in .env or CI secrets (see .env.example).";

export const SUPABASE_URL = ENV.SUPABASE_URL ?? ENV.VITE_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  ENV.SUPABASE_PUBLISHABLE_KEY ?? ENV.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const RESEND_CONFIGURED = Boolean(ENV.RESEND_API_KEY);
