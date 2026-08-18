# Migrations

**The Supabase CLI only applies `.sql` files at the top level of this directory.**

Anything nested in a subdirectory (`properties/`, `users/`, `authentication/`,
`enquiries/`, `analytics/`) is invisible to `supabase db push`. The CLI does not
warn about them — it reports "Remote database is up to date" while they sit
unapplied.

This is not a theoretical risk. It already happened: four migrations written
under `properties/` and `users/` were never applied, which left production
missing three tables and six columns for weeks:

| Missing                                                      | Broke                                     |
| ------------------------------------------------------------ | ----------------------------------------- |
| `agent_applications`                                         | every "become an agent" submission        |
| `property_visits`, `agent_leads`                             | agent visit scheduling and lead tracking  |
| `video_thumbnail_url`, `video_duration`, `video_uploaded_at` | disabled `locality` in every SEO slug     |
| `project_name`, `bhk_type`, `area_unit`                      | columns declared in `types.ts` but absent |

They were recovered by `20260818140000` and `20260818140100`.

## Rules

1. **New migrations go at the top level of `supabase/migrations/`.** Never in a
   subdirectory.
2. **Timestamp must be later than every applied migration.** Otherwise the CLI
   refuses the push and asks for `--include-all`, which sweeps in more than you
   intended. Note `20260817140000` already exists twice in this repo's history
   for exactly this reason.
3. **Make every statement idempotent** — `ADD COLUMN IF NOT EXISTS`,
   `CREATE TABLE IF NOT EXISTS`, and `DROP POLICY IF EXISTS` before every
   `CREATE POLICY`. A migration that cannot be re-run cannot be repaired.
4. **Grant new columns explicitly.** `public.properties` uses COLUMN-LEVEL
   grants (`owner_phone` is deliberately withheld from `anon`), and a
   column-level grant does not extend to columns added later. A migration that
   adds a column without granting it lands the schema but not the feature.
5. **Grants are not policies.** Enabling RLS and writing a policy is not enough;
   the role still needs the table privilege.

## The subdirectories

They are retained as the historical record of the Lovable-era schema, and those
migrations _are_ applied in production. Do not add to them, and do not assume a
file there has run — verify against the live database.
