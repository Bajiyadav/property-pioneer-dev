#!/usr/bin/env node
/**
 * Applies a versioned migration from scripts/migrations/ to the database named
 * by STAGING_DATABASE_URL (or DATABASE_URL).
 *
 * The connection string comes from the environment only — never a literal in
 * this file — and the target host is printed before anything runs so it is
 * obvious which database is about to change.
 *
 *   node scripts/run-migration.mjs 005_document_file_security.sql
 *   node scripts/run-migration.mjs --inspect            # print schema, change nothing
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const connectionString = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("STAGING_DATABASE_URL (or DATABASE_URL) must be set. Never commit it.");
  process.exit(1);
}

const host = new URL(connectionString.replace(/^postgres(ql)?:/, "http:")).host;
const arg = process.argv[2];

const sql = postgres(connectionString, { ssl: "require", max: 1, onnotice: () => {} });

async function inspect() {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;
  console.log(`Tables in public on ${host}:`);
  console.log(tables.map((r) => "  " + r.table_name).join("\n"));
}

async function main() {
  console.log(`Target host: ${host}`);

  if (!arg || arg === "--inspect") {
    await inspect();
    return;
  }

  const file = path.join("scripts", "migrations", arg);
  if (!fs.existsSync(file)) {
    console.error(`No such migration: ${file}`);
    process.exit(1);
  }

  console.log(`Applying ${arg} ...`);
  await sql.unsafe(fs.readFileSync(file, "utf8"));
  console.log(`Applied ${arg}`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => sql.end({ timeout: 5 }));
