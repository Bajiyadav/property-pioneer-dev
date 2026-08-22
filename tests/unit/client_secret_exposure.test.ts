import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Vite replaces `import.meta.env` in the CLIENT bundle with an object holding
 * EVERY variable whose name starts with VITE_ — whether or not any code reads
 * it. A VITE_-prefixed credential is therefore published verbatim to every
 * visitor, and no amount of care in application code can prevent it.
 *
 * This is not hypothetical. VITE_GEMINI_API_KEY was set, and a normal production
 * build embedded the working Google API key in
 * .output/public/assets/client-*.js, recoverable by anyone who opened the page.
 * The AI call now goes through /api/ai/chat, which reads the unprefixed
 * GEMINI_API_KEY on the server.
 */

/** Names that are public by design and safe to ship to a browser. */
const INTENTIONALLY_PUBLIC = new Set([
  // Supabase's publishable/anon key is meant to be public; RLS is the control.
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_ANON_KEY",
  // A Maps browser key cannot be hidden from the client. It must instead be
  // restricted by HTTP referrer in the Google Cloud console.
  "VITE_GOOGLE_MAPS_API_KEY",
  // Cloudflare Turnstile's site key is public by design; the secret is server-side.
  "VITE_TURNSTILE_SITE_KEY",
]);

const SECRET_SHAPED = /(_API_KEY|_SECRET|_TOKEN|_PASSWORD|SERVICE_ROLE|_PRIVATE)/i;

function declaredVars(file: string): string[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=")[0].trim())
    .filter(Boolean);
}

describe("no credential may be shipped to the browser", () => {
  it("declares no secret-shaped VITE_ variable in .env.example", () => {
    const offenders = declaredVars(join(process.cwd(), ".env.example")).filter(
      (name) =>
        name.startsWith("VITE_") && SECRET_SHAPED.test(name) && !INTENTIONALLY_PUBLIC.has(name),
    );
    expect(
      offenders,
      "a VITE_ prefix publishes the value in the client bundle — drop the prefix " +
        "and read it on the server, or add it to INTENTIONALLY_PUBLIC with a reason",
    ).toEqual([]);
  });

  it("keeps the Gemini key server-side and unprefixed", () => {
    const vars = declaredVars(join(process.cwd(), ".env.example"));
    expect(vars, "the server needs the unprefixed name").toContain("GEMINI_API_KEY");
    expect(vars, "the VITE_ variant leaks into every client build").not.toContain(
      "VITE_GEMINI_API_KEY",
    );
  });

  it("makes no direct Gemini call from code that reaches the browser", () => {
    const client = readFileSync(
      join(process.cwd(), "src/modules/interactions/services/geminiService.ts"),
      "utf-8",
    );
    expect(
      client,
      "the browser must call /api/ai/chat, never Google directly — a direct call " +
        "needs a credential in the client",
    ).not.toMatch(/generativelanguage\.googleapis\.com/);
    expect(client).toMatch(/["']\/api\/ai\/chat["']/);
  });
});
