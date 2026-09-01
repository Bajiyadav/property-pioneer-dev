import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { verifyTurnstile } from "@/lib/security.server";

/**
 * Security hardening — RLS, grants, definer functions and CAPTCHA fail-closed.
 *
 * Two kinds of assertion, matching the pattern the admin step-up suite uses:
 *
 *  - Behavioural, via the exported `verifyTurnstile`, which is pure enough to
 *    drive from the environment.
 *  - Source-integrity over the migration files, so the RLS invariants can be
 *    regression-tested without a live database, real accounts, or real
 *    conversations. Policy text is the artefact under test: these holes were
 *    created by a predicate, not by application code.
 *
 * No production data is read and no customer records are touched.
 */

const MIGRATIONS = join(process.cwd(), "supabase/migrations");
const hardening = readFileSync(
  join(MIGRATIONS, "20260901000000_security_hardening_rls.sql"),
  "utf8",
);

/** Comments stripped, so prose describing a removed hole cannot satisfy a check. */
const sqlOf = (text: string) =>
  text
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("--"))
    .join("\n");

const hardeningSql = sqlOf(hardening);

describe("ai_tenant_conversations — anonymous rows are no longer world-readable", () => {
  it("removes the three policies that granted the access", () => {
    for (const policy of [
      "Allow read own ai_tenant_conversations",
      "Allow update own ai_tenant_conversations",
      "Allow anonymous insert on ai_tenant_conversations",
    ]) {
      expect(hardeningSql).toContain(`DROP POLICY IF EXISTS "${policy}"`);
    }
  });

  it("never reintroduces `user_id IS NULL` as an ownership test", () => {
    // This is the defect itself: every anonymous row matches it, so it grants
    // one visitor's conversation to every other visitor.
    const ownershipTests = hardeningSql.match(/USING\s*\([^;]*?\)/gis) ?? [];
    for (const clause of ownershipTests) {
      expect(clause).not.toMatch(/user_id\s+IS\s+NULL/i);
    }
  });

  it("grants anonymous callers INSERT but neither SELECT nor UPDATE", () => {
    expect(hardeningSql).toMatch(/GRANT INSERT[^;]*ON public\.ai_tenant_conversations TO anon;/is);
    // Any SELECT or UPDATE grant on this table must stop at authenticated.
    const grants =
      hardeningSql.match(
        /GRANT (SELECT|UPDATE)[^;]*ON public\.ai_tenant_conversations TO ([^;]+);/gis,
      ) ?? [];
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) expect(g).not.toMatch(/\banon\b/i);
  });

  it("scopes authenticated reads and writes to the caller's own rows", () => {
    for (const policy of ["ai_conversations_select_own", "ai_conversations_update_own"]) {
      const m = hardeningSql.match(new RegExp(`CREATE POLICY "${policy}"[\\s\\S]*?;`, "i"));
      expect(m, `${policy} missing`).not.toBeNull();
      expect(m![0]).toMatch(/user_id\s+IS\s+NOT\s+NULL/i);
      expect(m![0]).toMatch(/user_id\s*=\s*auth\.uid\(\)/i);
      expect(m![0]).toMatch(/TO authenticated/i);
    }
  });

  it("stops a caller inserting a row owned by somebody else", () => {
    const m = hardeningSql.match(
      /CREATE POLICY "ai_conversations_insert_self_or_anonymous"[\s\S]*?;/i,
    );
    expect(m).not.toBeNull();
    expect(m![0]).toMatch(/WITH CHECK\s*\(\s*user_id IS NULL OR user_id = auth\.uid\(\)\s*\)/i);
  });

  it("keeps user_id and session_id out of the UPDATE grant", () => {
    // Otherwise a row can be re-pointed at another owner after insert.
    const m = hardeningSql.match(/GRANT UPDATE \(([^)]*)\)\s*ON public\.ai_tenant_conversations/is);
    expect(m).not.toBeNull();
    expect(m![1]).not.toMatch(/\buser_id\b/i);
    expect(m![1]).not.toMatch(/\bsession_id\b/i);
  });
});

describe("search_sessions — no longer readable by every account", () => {
  it("drops the policy whose name claimed a check it never made", () => {
    expect(hardeningSql).toContain('DROP POLICY IF EXISTS "Admin read search sessions"');
  });

  it("gates reads behind the same employee_access lookup site_visitors uses", () => {
    const m = hardeningSql.match(/CREATE POLICY "search_sessions_staff_read"[\s\S]*?;/i);
    expect(m).not.toBeNull();
    expect(m![0]).toMatch(/employee_access/i);
    expect(m![0]).toMatch(/auth\.uid\(\)/i);
    expect(m![0]).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it("keeps anonymous capture working — that is the table's purpose", () => {
    const m = hardeningSql.match(/CREATE POLICY "search_sessions_public_capture"[\s\S]*?;/i);
    expect(m).not.toBeNull();
    expect(m![0]).toMatch(/FOR INSERT TO anon, authenticated/i);
  });
});

describe("SECURITY DEFINER functions pin their search_path", () => {
  it("invoke_automated_messaging is redefined with a pinned path", () => {
    const m = hardeningSql.match(
      /CREATE OR REPLACE FUNCTION public\.invoke_automated_messaging\(\)[\s\S]*?AS \$\$/i,
    );
    expect(m).not.toBeNull();
    expect(m![0]).toMatch(/SECURITY DEFINER/i);
    expect(m![0]).toMatch(/SET search_path = pg_catalog, public/i);
  });

  it("preserves the function's behaviour", () => {
    // Same dispatch, same payload shape — this was a hardening change, not a
    // rewrite, and the triggers still bind to it by name.
    expect(hardeningSql).toMatch(/net\.http_post/);
    expect(hardeningSql).toMatch(/'record', row_to_json\(NEW\)/);
    expect(hardeningSql).toMatch(/RETURN NEW;/);
  });

  it("leaves no SECURITY DEFINER function in the schema without a pinned path", () => {
    const offenders: string[] = [];
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? walk(join(dir, e.name))
          : e.name.endsWith(".sql")
            ? [join(dir, e.name)]
            : [],
      );

    for (const file of walk(MIGRATIONS)) {
      const body = sqlOf(readFileSync(file, "utf8"));
      const fns = body.match(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION[\s\S]*?AS\s*\$\$/gi) ?? [];
      for (const fn of fns) {
        if (/SECURITY\s+DEFINER/i.test(fn) && !/SET\s+search_path/i.test(fn)) {
          const name = fn.match(/FUNCTION\s+([\w.]+)/i)?.[1] ?? "unknown";
          offenders.push(`${name} in ${file.replace(MIGRATIONS, "")}`);
        }
      }
    }
    expect(offenders, `unpinned SECURITY DEFINER: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("audit_logs is indexed for the rate limiter's predicate", () => {
  it("indexes the exact columns checkRateLimits filters on", () => {
    expect(hardeningSql).toMatch(
      /CREATE INDEX IF NOT EXISTS audit_logs_event_ip_created_idx[\s\S]*?\(event, ip_address, created_at DESC\)/i,
    );
    expect(hardeningSql).toMatch(
      /CREATE INDEX IF NOT EXISTS audit_logs_event_created_idx[\s\S]*?\(event, created_at DESC\)/i,
    );
  });

  it("deletes no audit rows", () => {
    expect(hardeningSql).not.toMatch(/DELETE\s+FROM/i);
    expect(hardeningSql).not.toMatch(/TRUNCATE/i);
  });
});

describe("the migration is non-destructive", () => {
  it("drops no table and no column", () => {
    expect(hardeningSql).not.toMatch(/DROP\s+TABLE/i);
    expect(hardeningSql).not.toMatch(/DROP\s+COLUMN/i);
  });

  it("never disables row-level security", () => {
    expect(hardeningSql).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(hardeningSql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
  });

  it("leaves the protections the audit found working untouched", () => {
    // owner_phone, exact coordinates, and the site_visitors employee gate are
    // all correct already; this migration must not mention them at all.
    for (const guarded of ["owner_phone", "latitude", "longitude", "site_visitors"]) {
      expect(hardeningSql).not.toMatch(new RegExp(`GRANT[^;]*${guarded}`, "i"));
    }
  });

  it("runs inside a transaction", () => {
    expect(hardeningSql).toMatch(/^\s*BEGIN;/m);
    expect(hardeningSql).toMatch(/^\s*COMMIT;/m);
  });
});

describe("Turnstile fails closed in production", () => {
  const saved = { ...process.env };
  beforeEach(() => {
    delete process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.VERCEL_ENV;
    delete process.env.NODE_ENV;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("rejects when the secret is missing in production", async () => {
    // The regression: a deployment that lost this variable used to serve every
    // public form with no CAPTCHA and no error to notice it by.
    process.env.NODE_ENV = "production";
    const result = await verifyTurnstile("any-token", "1.2.3.4", "enquiry");
    expect(result.ok).toBe(false);
    expect(result.configured).toBe(false);
  });

  it("rejects when the secret is missing on a production Vercel deployment", async () => {
    process.env.VERCEL_ENV = "production";
    const result = await verifyTurnstile("any-token", "1.2.3.4", "enquiry");
    expect(result.ok).toBe(false);
  });

  it("still allows preview and development deployments through", async () => {
    process.env.VERCEL_ENV = "preview";
    await expect(verifyTurnstile(undefined, "1.2.3.4")).resolves.toMatchObject({
      ok: true,
      configured: false,
    });

    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = "development";
    await expect(verifyTurnstile(undefined, "1.2.3.4")).resolves.toMatchObject({
      ok: true,
      configured: false,
    });
  });

  it("reveals nothing about configuration to the caller's customer", async () => {
    // Callers map any !ok to a generic "Verification failed. Please try again."
    // The reason code is for the audit log, never the response body.
    process.env.NODE_ENV = "production";
    const result = await verifyTurnstile("any-token", "1.2.3.4");
    expect(result.reason).toBe("not-configured");

    const enquiries = readFileSync(
      join(process.cwd(), "src/routes/api/public/enquiries.ts"),
      "utf8",
    );
    expect(enquiries).toMatch(/error: "Verification failed\. Please try again\."/);
    expect(enquiries).not.toMatch(/captcha\.reason[^)]*jsonResponse/s);
  });
});
