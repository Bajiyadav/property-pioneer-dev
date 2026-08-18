import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { isExtendedColumnUnavailable } from "@/modules/property/services/propertySchema";

/**
 * Guards the migration defects that silently cost production three tables and
 * ten columns.
 *
 * Every one of these failed invisibly. `supabase db push` reported "Remote
 * database is up to date" throughout, because the CLI cannot see a migration it
 * does not read, cannot know about a column no migration declares, and does not
 * check that a column it added is readable.
 */

const MIGRATIONS = join(process.cwd(), "supabase/migrations");

function topLevelFiles(): string[] {
  return readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".sql"))
    .map((e) => e.name);
}

function nestedFiles(): string[] {
  const out: string[] = [];
  for (const dir of readdirSync(MIGRATIONS, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const f of readdirSync(join(MIGRATIONS, dir.name))) {
      if (f.endsWith(".sql")) out.push(`${dir.name}/${f}`);
    }
  }
  return out;
}

const stamp = (name: string) => basename(name).split("_")[0];

/** Every migration in the repo, top-level and archived, concatenated. */
function allSql(): string {
  return [
    ...topLevelFiles().map((f) => join(MIGRATIONS, f)),
    ...nestedFiles().map((f) => join(MIGRATIONS, f)),
  ]
    .map((p) => readFileSync(p, "utf-8"))
    .join("\n");
}

describe("migration placement", () => {
  // The Supabase CLI only applies .sql files at the TOP LEVEL of
  // supabase/migrations. Four migrations were written into subdirectories and
  // never ran, leaving agent_applications, property_visits and agent_leads
  // absent from production while the CLI reported everything up to date.
  it("puts no new migration where the CLI cannot see it", () => {
    const oldestTopLevel = topLevelFiles().map(stamp).sort()[0];
    expect(oldestTopLevel, "expected at least one top-level migration").toBeTruthy();

    const misplaced = nestedFiles().filter((f) => stamp(f) >= oldestTopLevel);
    expect(
      misplaced,
      "these live in a subdirectory the Supabase CLI never reads, so `supabase db push` " +
        "will report success without applying them — move them to the top level",
    ).toEqual([]);
  });

  // properties/20260817140000_add_housing_fields.sql collided with the
  // top-level 20260817140000_add_critical_property_specs.sql — a different
  // migration entirely. Only one of the two could ever be applied.
  it("gives every migration a unique timestamp", () => {
    const stamps = [...topLevelFiles(), ...nestedFiles()].map(stamp);
    const dupes = stamps.filter((s, i) => stamps.indexOf(s) !== i);
    expect([...new Set(dupes)], "two migrations share a version prefix").toEqual([]);
  });
});

describe("selected columns are declared and readable", () => {
  const service = readFileSync(
    join(process.cwd(), "src/modules/property/services/propertyService.ts"),
    "utf-8",
  );

  // Strip line comments first. The declaration is preceded by a comment that
  // itself contains a quoted phrase, which the naive match picks up instead of
  // the column list.
  const withoutComments = service.replace(/^\s*\/\/.*$/gm, "");
  const match = withoutComments.match(/const EXTENDED_PROPERTY_COLUMNS\s*=\s*"([^"]+)"/);
  const extended = (match?.[1] ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const sql = allSql();
  const added = new Set(
    [...sql.matchAll(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?([a-z_]+)/gi)].map((m) =>
      m[1].toLowerCase(),
    ),
  );
  const granted = new Set(
    [...sql.matchAll(/GRANT SELECT\s*\(([^)]+)\)/gi)]
      .flatMap((m) => m[1].split(","))
      .map((c) => c.trim().toLowerCase()),
  );

  it("parses the column list it is asserting on", () => {
    expect(extended.length, "EXTENDED_PROPERTY_COLUMNS could not be parsed").toBeGreaterThan(5);
  });

  // `pincode` was selected on every public query while NO migration in the repo
  // declared it. Its comment credited "migration 20260817160000", which was
  // never written. PostgREST rejects the whole select over one absent column, so
  // this single line disabled locality, video and nine specification columns —
  // and every SEO slug lost its locality segment as a result.
  it("has a migration for every extended column the app selects", () => {
    const undeclared = extended.filter((c) => !added.has(c));
    expect(
      undeclared,
      "selected by propertyService but added by no migration — the extended query will " +
        "fail with 42703 and silently fall back to base columns",
    ).toEqual([]);
  });

  // public.properties uses COLUMN-LEVEL grants, and a column-level grant does
  // not extend to columns added later. 20260817140000 added nine columns and
  // granted none, so they existed and were still unreadable (42501).
  it("grants every extended column to anon and authenticated", () => {
    const ungranted = extended.filter((c) => !granted.has(c));
    expect(
      ungranted,
      "added by a migration but never granted — public.properties uses column-level " +
        "grants, so these exist and still read as 42501 insufficient_privilege",
    ).toEqual([]);
  });
});

describe("extended-schema fallback", () => {
  // Handling only 42703 meant an ungranted column was not caught, so the
  // obvious repair (adding pincode) would have moved the failure to 42501 and
  // broken every public property query instead of degrading to base columns.
  it("retries on a missing column and on an ungranted one alike", () => {
    expect(isExtendedColumnUnavailable({ code: "42703" })).toBe(true);
    expect(isExtendedColumnUnavailable({ code: "42501" })).toBe(true);
  });

  it("leaves unrelated failures to propagate", () => {
    expect(isExtendedColumnUnavailable({ code: "42P01" })).toBe(false);
    expect(isExtendedColumnUnavailable({ code: "PGRST205" })).toBe(false);
    expect(isExtendedColumnUnavailable(null)).toBe(false);
    expect(isExtendedColumnUnavailable(undefined)).toBe(false);
  });
});

describe("recovery migrations are present", () => {
  it("keeps the tables the app queries", () => {
    const sql = allSql();
    for (const table of ["agent_applications", "property_visits", "agent_leads"]) {
      expect(sql, `${table} is queried by the app but created by no migration`).toContain(
        `CREATE TABLE IF NOT EXISTS public.${table}`,
      );
    }
  });

  it("documents why subdirectories are a trap", () => {
    expect(existsSync(join(MIGRATIONS, "README.md"))).toBe(true);
  });
});
