import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    cs2Item: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    cs2WatchlistItem: {
      findMany: vi.fn(),
    },
    cs2ItemMarketSummary: {
      count: vi.fn(),
    },
    cs2PriceCandle: {
      count: vi.fn(),
    },
    cs2MarketLatestSnapshot: {
      groupBy: vi.fn(),
    },
  },
}));

import { getCs2DatabaseMarketAnalysis } from "@/lib/cs2/analysisRepository";

describe("CS2 analysis repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses database-wide coverage counts instead of only the loaded analysis item slice", async () => {
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([{
      id: "ak-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Classified",
      exterior: "Field-Tested",
      collection: "The Phoenix Collection",
      imageUrl: null,
      tradable: true,
      latestSnapshots: [{
        provider: "cspriceapi",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 2500,
        bidCents: null,
        medianCents: null,
        askVolume: 20,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 12,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: null,
      }, {
        provider: "skinport",
        marketName: "Skinport",
        marketRegion: "europe",
        askCents: 3000,
        bidCents: null,
        medianCents: null,
        askVolume: 8,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 9,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: null,
      }],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 2500,
        bestBidCents: null,
        chineseAskCents: 2500,
        globalAskCents: 3000,
        spreadPercent: -16.67,
      },
    }] as never);
    vi.mocked(prisma.cs2WatchlistItem.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.cs2Item.count).mockImplementation(((args?: unknown) => {
      const text = JSON.stringify(args ?? {});
      if (text.includes("priceCandles")) return 700;
      if (text.includes("itemType")) return 1;
      return 1200;
    }) as never);
    vi.mocked(prisma.cs2ItemMarketSummary.count).mockImplementation(((args?: unknown) => {
      const text = JSON.stringify(args ?? {});
      if (text.includes("chineseAskCents")) return 820;
      if (text.includes("globalAskCents")) return 930;
      if (text.includes("spreadPercent")) return 760;
      return 0;
    }) as never);
    vi.mocked(prisma.cs2PriceCandle.count).mockImplementation(((args?: unknown) => {
      const text = JSON.stringify(args ?? {});
      return text.includes("itemType") ? 18 : 4500;
    }) as never);
    vi.mocked(prisma.cs2MarketLatestSnapshot.groupBy).mockResolvedValue([{
      provider: "cspriceapi",
      marketName: "BUFF163",
      marketRegion: "china",
      _count: { itemId: 820, askCents: 810, bidCents: 120 },
      _sum: { askVolume: 5400, bidVolume: 900, salesVolume24h: 300 },
      _avg: { liquidityScore: 18.123 },
      _max: { observedAt: new Date("2026-06-05T12:00:00.000Z") },
    }] as never);
    vi.mocked(prisma.cs2Item.groupBy).mockResolvedValue([{
      itemType: "skin",
      _count: { _all: 1200 },
    }] as never);

    const analysis = await getCs2DatabaseMarketAnalysis("owner-1");

    expect(analysis.opportunities[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      bestChineseMarket: "BUFF163",
    }));
    expect(analysis.marketCoverage).toEqual(expect.objectContaining({
      totalItems: 1200,
      itemsWithChinesePrice: 820,
      itemsWithGlobalPrice: 930,
      itemsWithCrossMarketSpread: 760,
      itemsWithHistory: 700,
      candleCount: 4500,
    }));
    expect(analysis.marketCoverage.markets[0]).toEqual(expect.objectContaining({
      marketName: "BUFF163",
      itemCount: 820,
      askVolumeTotal: 5400,
      averageLiquidityScore: 18.12,
    }));
  });
});
