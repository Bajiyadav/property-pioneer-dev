/**
 * Runtime detection of the `properties` video/location columns.
 *
 * Migration `20260815131921_add_video_and_location_to_properties.sql` adds the
 * video tour and location-context columns. Until it is applied, naming any of
 * them makes PostgREST reject the *entire* query with a 400 — one missing
 * column silently collapsed every listing, search, detail and owner-dashboard
 * query onto fallback data or an error page.
 *
 * Rather than delete the feature, each query optimistically asks for the full
 * schema; the first `42703` latches the capability off and the query is retried
 * against the columns that do exist. When the migration lands, the first query
 * succeeds and the richer data flows again with no code change.
 *
 * The flag is per module instance (per browser tab, per server worker), so a
 * newly-migrated database is picked up by every fresh instance without a deploy.
 */

/** Columns added by migration 20260815131921. */
export const PROPERTY_LOCATION_COLUMNS = [
  "locality",
  "landmark",
  "metro_station",
  "it_park",
  "college",
  "hospital",
] as const;

/** Video columns from 20260815131921 plus properties/20260815190000. */
export const PROPERTY_VIDEO_COLUMNS = [
  "video_url",
  "video_status",
  "video_thumbnail_url",
  "video_duration",
  "video_uploaded_at",
] as const;

/** PostgreSQL `undefined_column`. */
const UNDEFINED_COLUMN = "42703";

export function isUndefinedColumn(error: { code?: string } | null | undefined): boolean {
  return error?.code === UNDEFINED_COLUMN;
}

export interface SchemaCapability {
  /** False once a query has proven the extended columns are absent. */
  shouldTry(): boolean;
  /** Latches the capability on or off after a query result. */
  record(available: boolean): void;
  /** true / false once known, null while untested. */
  state(): boolean | null;
  /** Test seam — forces the next query to probe again. */
  reset(): void;
}

export function createSchemaCapability(label: string): SchemaCapability {
  let available: boolean | null = null;
  let warned = false;

  return {
    shouldTry: () => available !== false,
    record(next: boolean) {
      if (!next && !warned) {
        warned = true;
        console.warn(
          `[${label}] video/location columns absent — serving the base schema until migration 20260815131921 is applied`,
        );
      }
      available = next;
    },
    state: () => available,
    reset() {
      available = null;
      warned = false;
    },
  };
}

/**
 * Removes keys the database does not have yet, so a write cannot fail on a
 * column that a read has already proven missing.
 */
export function stripExtendedColumns<T extends object>(
  input: T,
  extendedAvailable: boolean | null,
): T {
  if (extendedAvailable !== false) return input;
  const blocked = new Set<string>([...PROPERTY_LOCATION_COLUMNS, ...PROPERTY_VIDEO_COLUMNS]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!blocked.has(key)) out[key] = value;
  }
  return out as T;
}
