/**
 * Storage-bucket security invariants.
 *
 * WHY THIS EXISTS
 * The database perimeter (public.* RLS) was version-controlled and tested, but
 * Storage authorization drifted outside that model: three buckets were created
 * outside any migration and shipped with NO storage.objects INSERT policy, so
 * an anonymous client could upload to them. A finite red-team pass found those
 * three — this test is the systemic version, so the *class* cannot recur
 * silently. It targets the root cause (provenance drift), not the three known
 * instances, by enumerating whatever buckets exist at run time.
 *
 * TWO CHECKS, DELIBERATELY SEPARATED BY COST AND SAFETY
 *
 *   A. RECONCILIATION (read-only, runs everywhere)
 *      Every live bucket must be declared in supabase/migrations, and no bucket
 *      may be public unless explicitly allow-listed. A bucket that exists in
 *      production but in no migration IS the drift, regardless of its policy —
 *      this alone would have flagged all three vulnerable buckets, because all
 *      three are exactly the ones absent from migrations.
 *
 *   B. BEHAVIOURAL (write-probe, opt-in)
 *      Actually attempt an anonymous upload per bucket and assert it is denied.
 *      This performs a transient write to production storage, so it is gated
 *      behind STORAGE_WRITE_PROBE=1 and must never run on an ordinary push. It
 *      is self-cleaning: any object that unexpectedly uploads is deleted with
 *      the service role in a finally block. Run it against a staging project,
 *      or deliberately, never on every CI run.
 *
 * A hard-coded list of "known buckets" was rejected on purpose: it would stay
 * green the day someone adds an unprotected `agent-contracts` bucket. The check
 * has to discover buckets at run time or it cannot detect the next drift.
 */
import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} from "../fixtures/qaAccounts";

const hasService = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

/**
 * Buckets permitted to be public-read, with the reason. Anything public and not
 * here fails: public-read is a deliberate exposure, never a default.
 */
const PUBLIC_READ_ALLOWED = new Set<string>([
  "property-images", // listing photos are shown to anonymous browsers
  "property-videos", // listing tours, same
  "property_videos", // legacy duplicate of the above (flagged separately)
  "property-media", // active listing media served on public detail pages
]);

function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Bucket ids declared by any INSERT INTO storage.buckets across migrations. */
function migrationDeclaredBuckets(): Set<string> {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  const ids = new Set<string>();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    // Match the id literal in: INSERT INTO storage.buckets (id, name, public) VALUES ('id', ...)
    const re = /INSERT\s+INTO\s+storage\.buckets[^;]*?VALUES\s*\(\s*'([a-z0-9_-]+)'/gis;
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) ids.add(m[1]);
  }
  return ids;
}

const runDriftAudit = process.env.STORAGE_DRIFT_AUDIT === "1" && hasService;

describe.skipIf(!runDriftAudit)("storage bucket security — reconciliation (read-only)", () => {
  it("every live bucket is declared in a migration (no config drift)", async () => {
    const { data: buckets, error } = await serviceClient().storage.listBuckets();
    expect(error, "must be able to list buckets").toBeNull();
    const declared = migrationDeclaredBuckets();
    const drift = (buckets ?? []).map((b) => b.name).filter((n) => !declared.has(n));
    expect(
      drift,
      `these buckets exist in production but in no migration — the exact class ` +
        `of gap that left storage anon-writable: ${drift.join(", ")}`,
    ).toEqual([]);
  }, 20000);

  it("no bucket is public-read unless explicitly allow-listed", async () => {
    const { data: buckets, error } = await serviceClient().storage.listBuckets();
    expect(error).toBeNull();
    const unexpectedlyPublic = (buckets ?? [])
      .filter((b) => b.public && !PUBLIC_READ_ALLOWED.has(b.name))
      .map((b) => b.name);
    expect(
      unexpectedlyPublic,
      `public-read exposes every object by URL. Not allow-listed: ${unexpectedlyPublic.join(", ")}`,
    ).toEqual([]);
  }, 20000);
});

// ── Behavioural probe: opt-in, performs + reverts a transient production write.
const runWriteProbe = process.env.STORAGE_WRITE_PROBE === "1" && hasService;

describe.skipIf(!runWriteProbe)("storage bucket security — anon write is denied (probe)", () => {
  it("no bucket accepts an anonymous upload", async () => {
    const svc = serviceClient();
    const { data: buckets } = await svc.storage.listBuckets();
    const leaked: string[] = [];

    for (const b of buckets ?? []) {
      const probeName = `__anon-write-probe-${b.name}-${Date.now()}.bin`;
      let uploaded = false;
      try {
        // application/octet-stream is the least-privileged content type; a bucket
        // that accepts even this from anon is unambiguously misconfigured.
        const { error } = await anonClient()
          .storage.from(b.name)
          .upload(probeName, new Blob([Uint8Array.from([0])]), {
            contentType: "application/octet-stream",
          });
        if (!error) {
          uploaded = true;
          leaked.push(b.name);
        }
      } finally {
        // Self-heal: whatever anon managed to write, the service role removes.
        if (uploaded) await svc.storage.from(b.name).remove([probeName]);
      }
    }

    expect(leaked, `anonymous upload succeeded on: ${leaked.join(", ")}`).toEqual([]);
  }, 60000);
});
