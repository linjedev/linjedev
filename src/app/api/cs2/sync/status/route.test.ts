import { describe, expect, it, vi } from "vitest";
import { getCs2SyncStatus } from "@/lib/cs2/syncRepository";
import { GET } from "./route";

vi.mock("@/lib/cs2/syncRepository", () => ({
  getCs2SyncStatus: vi.fn(),
}));

describe("CS2 sync status route", () => {
  it("returns a stable unavailable payload when the database is offline", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(getCs2SyncStatus).mockRejectedValue(new Error("ECONNREFUSED"));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual(expect.objectContaining({
      status: "unavailable",
      databaseAvailable: false,
      itemCount: 0,
      latestSnapshotCount: 0,
      marketSummaryCount: 0,
      candleCount: 0,
      latestObservation: null,
      recentRuns: [],
    }));
    warnSpy.mockRestore();
  });
});
