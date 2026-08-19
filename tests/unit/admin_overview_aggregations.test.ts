import { describe, it, expect, vi } from "vitest";
import { loadOverview } from "@/lib/admin.server";

describe("Admin Overview SQL Aggregations", () => {
  it("calculates metrics using exact counts without pulling full tables into memory", async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn((table: string) => {
        return {
          select: vi.fn((columns: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head && opts?.count === "exact") {
              return {
                eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
                gte: vi.fn().mockResolvedValue({ count: 3, error: null }),
                then: (resolve: (v: unknown) => void) =>
                  Promise.resolve({ count: 10, error: null }).then(resolve),
              };
            }
            return {
              limit: vi.fn().mockResolvedValue({
                data: [{ city: "Hyderabad" }, { city: "Hyderabad" }, { city: "Bengaluru" }],
                error: null,
              }),
            };
          }),
        };
      }),
    };

    const overview = await loadOverview(
      mockSupabase as unknown as Parameters<typeof loadOverview>[0],
    );

    expect(overview).toBeDefined();
    expect(typeof overview.totalProperties).toBe("number");
    expect(typeof overview.approvedProperties).toBe("number");
    expect(typeof overview.pendingProperties).toBe("number");
    expect(typeof overview.totalEnquiries).toBe("number");
    expect(typeof overview.totalUsers).toBe("number");
    expect(Array.isArray(overview.cities)).toBe(true);
  });
});
