import { describe, expect, it, vi } from "vitest";
import { buildCs2MarketAnalysis } from "@/lib/cs2/analysisService";
import type { Cs2ItemView, Cs2WatchlistEntryView } from "@/lib/cs2/types";

function item(overrides: Partial<Cs2ItemView>): Cs2ItemView {
  return {
    id: "ak",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    itemType: "skin",
    category: "AK-47",
    rarity: null,
    exterior: "Field-Tested",
    collection: null,
    imageUrl: null,
    tradable: true,
    bestAskCents: 2842,
    bestBidCents: 2791,
    chineseAskCents: 2672,
    globalAskCents: 2842,
    spreadPercent: -5.98,
    candles: [
      {
        provider: "cs2.sh",
        marketName: "BUFF163",
        interval: "1d",
        openCents: 2500,
        highCents: 2550,
        lowCents: 2480,
        closeCents: 2500,
        volume: 120,
        startsAt: "2026-06-01T00:00:00.000Z",
      },
      {
        provider: "cs2.sh",
        marketName: "BUFF163",
        interval: "1d",
        openCents: 2500,
        highCents: 2720,
        lowCents: 2490,
        closeCents: 2700,
        volume: 180,
        startsAt: "2026-06-02T00:00:00.000Z",
      },
    ],
    snapshots: [
      {
        provider: "cs2.sh",
        marketName: "BUFF163",
        marketRegion: "china",
        currency: "USD",
        askCents: 2672,
        bidCents: 2610,
        medianCents: 2703,
        askVolume: 2214,
        bidVolume: 402,
        salesVolume24h: 188,
        liquidityScore: 94,
        observedAt: "2026-06-04T12:00:00.000Z",
      },
      {
        provider: "cs2.sh",
        marketName: "CSFloat",
        marketRegion: "global",
        currency: "USD",
        askCents: 2842,
        bidCents: 2791,
        medianCents: 2880,
        askVolume: 516,
        bidVolume: 88,
        salesVolume24h: 47,
        liquidityScore: 81,
        observedAt: "2026-06-04T12:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("CS2 market analysis", () => {
  it("ranks Chinese discount opportunities and coverage", () => {
    vi.setSystemTime(new Date("2026-06-04T13:00:00.000Z"));
    const analysis = buildCs2MarketAnalysis([item({})], []);

    expect(analysis.marketCoverage).toEqual(expect.objectContaining({
      totalItems: 1,
      itemsWithChinesePrice: 1,
      itemsWithGlobalPrice: 1,
      itemsWithCrossMarketSpread: 1,
      itemsWithHistory: 1,
      candleCount: 2,
      gaps: {
        missingChinesePrice: 0,
        missingGlobalPrice: 0,
        missingCrossMarketSpread: 0,
        missingHistory: 0,
        staleItems: 0,
      },
    }));
    expect(analysis.marketCoverage.markets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: "cs2.sh",
        marketName: "BUFF163",
        marketRegion: "china",
        itemCount: 1,
        askCount: 1,
        bidCount: 1,
        askVolumeTotal: 2214,
        latestObservedAt: "2026-06-04T12:00:00.000Z",
      }),
      expect.objectContaining({
        marketName: "CSFloat",
        marketRegion: "global",
        itemCount: 1,
        askVolumeTotal: 516,
      }),
    ]));
    expect(analysis.marketCoverage.itemTypes).toEqual([
      expect.objectContaining({
        itemType: "skin",
        itemCount: 1,
        itemsWithChinesePrice: 1,
        itemsWithGlobalPrice: 1,
        itemsWithHistory: 1,
      }),
    ]);
    expect(analysis.opportunities[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      bestChineseMarket: "BUFF163",
      bestGlobalMarket: "CSFloat",
      spreadPercent: -5.98,
    }));
    vi.useRealTimers();
  });

  it("counts missing coverage and stale items for market completeness checks", () => {
    vi.setSystemTime(new Date("2026-06-05T13:00:00.000Z"));
    const analysis = buildCs2MarketAnalysis([
      item({
        id: "sticker",
        marketHashName: "Sticker | Crown (Foil)",
        itemType: "sticker",
        chineseAskCents: null,
        globalAskCents: 89540,
        spreadPercent: null,
        candles: [],
        snapshots: [{
          provider: "cs2.sh",
          marketName: "Steam",
          marketRegion: "global",
          currency: "USD",
          askCents: 89540,
          bidCents: null,
          medianCents: null,
          askVolume: 14,
          bidVolume: null,
          salesVolume24h: null,
          liquidityScore: null,
          observedAt: "2026-06-04T00:00:00.000Z",
        }],
      }),
    ], []);

    expect(analysis.marketCoverage.gaps).toEqual({
      missingChinesePrice: 1,
      missingGlobalPrice: 0,
      missingCrossMarketSpread: 1,
      missingHistory: 1,
      staleItems: 1,
    });
    vi.useRealTimers();
  });

  it("emits trend signals from historical candles", () => {
    const analysis = buildCs2MarketAnalysis([item({})], []);

    expect(analysis.trendSignals[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      provider: "cs2.sh",
      marketName: "BUFF163",
      interval: "1d",
      candleCount: 2,
      firstCloseCents: 2500,
      latestCloseCents: 2700,
      changePercent: 8,
      totalVolume: 300,
      signal: "uptrend",
    }));
  });

  it("emits watchlist target and discount signals", () => {
    vi.setSystemTime(new Date("2026-06-04T13:00:00.000Z"));
    const watchlist: Cs2WatchlistEntryView[] = [{
      id: "watch-ak",
      itemId: "ak",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      targetBuyCents: 2700,
      targetSellCents: 2800,
      notes: null,
      createdAt: "2026-06-04T12:00:00.000Z",
    }];

    const analysis = buildCs2MarketAnalysis([item({})], watchlist);

    expect(analysis.watchlistSignals.map((signal) => signal.signal)).toEqual([
      "buy-target",
      "sell-target",
      "china-discount",
    ]);
    vi.useRealTimers();
  });
});
