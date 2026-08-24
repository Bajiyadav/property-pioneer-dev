/**
 * Property queries against the real database, in both schema states.
 *
 * The video/location migration (`20260815131921`) is not applied to every
 * environment. Naming a column PostgREST does not have makes it reject the
 * whole query with a 400, which silently collapsed every listing query onto the
 * hard-coded fallback data. These tests assert the service detects that and
 * still serves real database rows — and that it prefers the full schema the
 * moment the migration lands.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  fetchPublicPropertyFeed,
  fetchPublicPropertyById,
  propertySchemaHasExtendedColumns,
  __resetPropertySchemaProbe,
  PUBLIC_PROPERTY_COLUMNS,
} from "@/modules/property/services/propertyService";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../fixtures/qaAccounts";

const canRun = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

describe("Property column set", () => {
  it("still requests the video and coarse-location fields", () => {
    // Guards against "fixing" the schema gap by deleting the feature.
    for (const column of [
      "video_url",
      "video_status",
      "locality",
      "metro_station",
      "it_park",
      "college",
      "hospital",
    ]) {
      expect(PUBLIC_PROPERTY_COLUMNS).toContain(column);
    }
  });

  it("gates the EXACT location out of the public payload (address + landmark)", () => {
    // `address` and `landmark` are SENSITIVE. They are deliberately excluded
    // from the public column grant/select (like owner_phone) and released only
    // by /api/public/properties/location-access after a matching city+locality.
    // If this ever regresses, the exact street address leaks in every public
    // property payload again.
    for (const column of ["address", "landmark"]) {
      expect(PUBLIC_PROPERTY_COLUMNS.split(",")).not.toContain(column);
    }
  });
});

describe.skipIf(!canRun)("Property queries against the live schema", () => {
  beforeEach(() => {
    __resetPropertySchemaProbe();
  });

  it("returns real database rows regardless of whether the migration is applied", async () => {
    const feed = await fetchPublicPropertyFeed({ city: "Hyderabad", listing: "rent" });

    expect(
      feed.source,
      `expected live rows, got "${feed.source}" (error: ${feed.error ?? "none"})`,
    ).toBe("database");
    expect(feed.error).toBeNull();
    expect(feed.properties.length).toBeGreaterThan(0);

    // Whatever the schema state, the mapper must produce a complete Property.
    for (const p of feed.properties) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(Array.isArray(p.images)).toBe(true);
      // Never surface an unapproved video as playable.
      if (p.video_url) expect(p.video_status).toBe("approved");
    }

    // The probe must have reached a definite answer, not stayed unknown.
    expect(typeof propertySchemaHasExtendedColumns()).toBe("boolean");
  }, 30000);

  it("serves a locality search instead of failing when the columns are absent", async () => {
    const feed = await fetchPublicPropertyFeed({ city: "Hyderabad", locality: "Gachibowli" });

    expect(feed.source).toBe("database");
    expect(feed.error).toBeNull();

    if (propertySchemaHasExtendedColumns()) {
      // Migration applied: the filter is a real locality filter.
      for (const p of feed.properties) {
        if (p.locality) expect(p.locality.toLowerCase()).toContain("gachibowli");
      }
    }
  }, 30000);

  it("reuses the detected schema state instead of re-probing every query", async () => {
    await fetchPublicPropertyFeed({ city: "Hyderabad" });
    const first = propertySchemaHasExtendedColumns();
    expect(typeof first).toBe("boolean");

    await fetchPublicPropertyFeed({ city: "Hyderabad", listing: "rent" });
    expect(propertySchemaHasExtendedColumns()).toBe(first);
  }, 30000);

  it("loads a property detail page from the database", async () => {
    const feed = await fetchPublicPropertyFeed({ city: "Hyderabad" });
    const target = feed.properties[0];
    expect(target).toBeDefined();

    const detail = await fetchPublicPropertyById(target!.id);
    expect(detail).not.toBeNull();
    expect(detail!.id).toBe(target!.id);
    expect(detail!.title).toBeTruthy();
  }, 30000);
});
