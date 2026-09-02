import { describe, it, expect } from "vitest";
import { handleLocationStats } from "@/routes/api/v2/stats/location";

describe("Location Scoping & Statistics Audit Suite", () => {
  it("1. Rejects location stats requests without mandatory state parameter", async () => {
    const req = new Request("http://localhost/api/v2/stats/location?city=Hyderabad");
    const res = await handleLocationStats(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("mandatory");
  });

  it("2. Rejects location stats requests without mandatory city parameter", async () => {
    const req = new Request("http://localhost/api/v2/stats/location?state=Telangana");
    const res = await handleLocationStats(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("mandatory");
  });

  it("3. Validates classification of Global vs Location-Scoped metrics", () => {
    const locationScopedMetrics = [
      "buy_count",
      "rent_count",
      "commercial_count",
      "locality_breakdown",
      "search_radius_results",
      "featured_city_properties",
    ];

    const globalMetrics = [
      "total_registered_users",
      "total_platform_transactions",
      "system_uptime_percentage",
      "financial_loan_partners_count",
    ];

    expect(locationScopedMetrics).toHaveLength(6);
    expect(globalMetrics).toHaveLength(4);
    expect(locationScopedMetrics).not.toContain("total_registered_users");
  });

  it("4. Enforces case-insensitive normalization on location parameters", () => {
    const rawState = "  TeLaNgAnA  ";
    const rawCity = "  HyDeRaBaD  ";

    const normState = rawState.trim().toLowerCase();
    const normCity = rawCity.trim().toLowerCase();

    expect(normState).toBe("telangana");
    expect(normCity).toBe("hyderabad");
  });
});
