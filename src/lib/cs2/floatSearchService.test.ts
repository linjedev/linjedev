import { describe, expect, it, vi } from "vitest";
import { searchCs2FloatListings } from "@/lib/cs2/floatSearchService";

vi.mock("@/lib/cs2/providers/csfloat", () => ({
  fetchCsFloatListings: vi.fn().mockRejectedValue(new Error("offline")),
}));

describe("CS2 float search service", () => {
  it("falls back to sample listings while preserving float filters", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await searchCs2FloatListings({
      query: "AK-47",
      maxFloat: 0.18,
      sort: "lowest_float",
    });

    expect(response.mode).toBe("sample");
    expect(response.warning).toContain("CSFloat listings unavailable");
    expect(response.listings).toHaveLength(1);
    expect(response.listings[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      floatValue: 0.15081234,
    }));

    warnSpy.mockRestore();
  });
});
