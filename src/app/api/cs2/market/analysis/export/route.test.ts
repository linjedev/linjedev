import { describe, expect, it, vi } from "vitest";
import { getCs2DatabaseMarketAnalysis } from "@/lib/cs2/analysisRepository";
import { GET } from "./route";
import type { Cs2MarketAnalysis } from "@/lib/cs2/types";

vi.mock("@/lib/cs2/analysisRepository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/cs2/analysisRepository")>("@/lib/cs2/analysisRepository");
  return {
    ...actual,
    getCs2DatabaseMarketAnalysis: vi.fn(),
  };
});

const analysisFixture: Cs2MarketAnalysis = {
  generatedAt: "2026-06-05T12:00:00.000Z",
  opportunities: [{
    itemId: "ak-redline",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    itemType: "skin",
    chineseAskCents: 2400,
    globalAskCents: 3000,
    spreadPercent: -20,
    bestChineseMarket: "BUFF163",
    bestGlobalMarket: "Skinport",
    askVolume: 10,
    liquidityScore: 25,
    analysisScore: 95,
  }],
  trendSignals: [],
  watchlistSignals: [],
  marketCoverage: {
    totalItems: 1,
    itemsWithChinesePrice: 1,
    itemsWithGlobalPrice: 1,
    itemsWithCrossMarketSpread: 1,
    itemsWithHistory: 0,
    candleCount: 0,
    markets: [],
    itemTypes: [],
    gaps: {
      missingChinesePrice: 0,
      missingGlobalPrice: 0,
      missingCrossMarketSpread: 0,
      missingHistory: 1,
      staleItems: 0,
    },
  },
};

describe("CS2 analysis export route", () => {
  it("returns CSV by default", async () => {
    vi.mocked(getCs2DatabaseMarketAnalysis).mockResolvedValue(analysisFixture);

    const response = await GET(new Request("http://localhost/api/cs2/market/analysis/export", {
      headers: { "x-linje-watch-owner": "owner-1" },
    }));
    const text = await response.text();

    expect(getCs2DatabaseMarketAnalysis).toHaveBeenCalledWith("owner-1");
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(response.headers.get("Content-Disposition")).toContain("linje-cs2-market-analysis");
    expect(text).toContain("rowType,marketHashName");
    expect(text).toContain("AK-47 | Redline (Field-Tested)");
  });

  it("returns JSON rows and coverage when requested", async () => {
    vi.mocked(getCs2DatabaseMarketAnalysis).mockResolvedValue(analysisFixture);

    const response = await GET(new Request("http://localhost/api/cs2/market/analysis/export?format=json"));
    const payload = await response.json();

    expect(payload).toEqual(expect.objectContaining({
      generatedAt: "2026-06-05T12:00:00.000Z",
      coverage: expect.objectContaining({ totalItems: 1 }),
      rows: [expect.objectContaining({
        rowType: "opportunity",
        marketHashName: "AK-47 | Redline (Field-Tested)",
      })],
    }));
  });
});
