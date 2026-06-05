import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBitSkinsLatestItems } from "@/lib/cs2/providers/bitskins";
import { fetchC5GameLatestItems } from "@/lib/cs2/providers/c5game";
import { fetchCsPriceApiLatestItems } from "@/lib/cs2/providers/cspriceapi";
import { fetchCs2ShLatestItems } from "@/lib/cs2/providers/cs2sh";
import { fetchCsMarketApiLatestItems } from "@/lib/cs2/providers/csmarketapi";
import { fetchCsFloatLatestItems } from "@/lib/cs2/providers/csfloat";
import { fetchDMarketLatestItems } from "@/lib/cs2/providers/dmarket";
import { fetchMarketCsgoLatestItems } from "@/lib/cs2/providers/marketcsgo";
import { fetchSteamLatestItems } from "@/lib/cs2/providers/steam";
import { fetchWaxpeerLatestItems } from "@/lib/cs2/providers/waxpeer";
import { getCs2ItemMetadataByMarketHashName } from "@/lib/cs2/itemMetadataService";
import { hydrateCs2ItemsFromConfiguredProviders } from "@/lib/cs2/syncService";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    cs2Item: {
      findMany: vi.fn().mockRejectedValue(new Error("offline")),
      upsert: vi.fn(),
    },
    cs2WatchlistItem: {
      findMany: vi.fn().mockRejectedValue(new Error("offline")),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    cs2MarketSnapshot: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cs2/providers/cs2sh", () => ({
  fetchCs2ShLatestItems: vi.fn().mockResolvedValue([]),
  fetchCs2ShHistory: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/csmarketapi", () => ({
  fetchCsMarketApiLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/bitskins", () => ({
  fetchBitSkinsLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/c5game", () => ({
  fetchC5GameLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/cspriceapi", () => ({
  fetchCsPriceApiLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/csfloat", () => ({
  fetchCsFloatLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/dmarket", () => ({
  fetchDMarketLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/marketcsgo", () => ({
  fetchMarketCsgoLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/steam", () => ({
  fetchSteamLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/waxpeer", () => ({
  fetchWaxpeerLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/itemMetadataService", () => ({
  getCs2ItemMetadataByMarketHashName: vi.fn(),
}));

vi.mock("@/lib/cs2/syncService", () => ({
  hydrateCs2ItemsFromConfiguredProviders: vi.fn(),
}));

import { addCs2WatchlistItem, getCs2TrackerOverview } from "@/lib/cs2/marketService";

describe("CS2 market service source status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CS2SH_API_KEY;
    delete process.env.CS2CAP_API_KEY;
    delete process.env.PRICEMPIRE_API_KEY;
    delete process.env.C5GAME_API_KEY;
    delete process.env.CSPRICEAPI_API_KEY;
    delete process.env.CSMARKETAPI_API_KEY;
    delete process.env.CSFLOAT_API_KEY;
    delete process.env.MARKET_CSGO_API_KEY;
    delete process.env.WAXPEER_API_KEY;
    vi.mocked(fetchBitSkinsLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchCs2ShLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchC5GameLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchCsPriceApiLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchCsMarketApiLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchCsFloatLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchDMarketLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchMarketCsgoLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchSteamLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchWaxpeerLatestItems).mockResolvedValue([] as never);
    vi.mocked(getCs2ItemMetadataByMarketHashName).mockResolvedValue(new Map() as never);
    vi.mocked(hydrateCs2ItemsFromConfiguredProviders).mockResolvedValue([] as never);
  });

  it("reports configured WAXPEER as a direct official source", async () => {
    process.env.WAXPEER_API_KEY = "waxpeer-key";

    const overview = await getCs2TrackerOverview({
      ownerKey: "owner-1",
      query: null,
    });

    expect(overview.sourceStatus.find((source) => source.id === "waxpeer")).toEqual(expect.objectContaining({
      configured: true,
      integration: "direct",
      officialApi: "official",
      note: "Direct API configured.",
    }));
  });

  it("reports direct configured China sources separately from aggregator-fed anchors", async () => {
    process.env.C5GAME_API_KEY = "c5game-key";

    const overview = await getCs2TrackerOverview({
      ownerKey: "owner-1",
      query: null,
    });

    const c5game = overview.sourceStatus.find((source) => source.id === "c5game");
    const buff = overview.sourceStatus.find((source) => source.id === "buff");
    const youpin = overview.sourceStatus.find((source) => source.id === "youpin");

    expect(c5game).toEqual(expect.objectContaining({
      configured: true,
      integration: "direct",
      officialApi: "official",
    }));
    expect(buff).toEqual(expect.objectContaining({
      configured: false,
      integration: expect.stringMatching(/aggregated|unavailable/),
      officialApi: "unknown",
    }));
    expect(youpin).toEqual(expect.objectContaining({
      configured: false,
      integration: expect.stringMatching(/aggregated|unavailable/),
      officialApi: "unknown",
    }));
  });

  it("merges direct C5Game live snapshots into the overview refresh path", async () => {
    process.env.C5GAME_API_KEY = "c5game-key";
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
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: null,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: null,
        spreadPercent: null,
      },
    }] as never);
    vi.mocked(prisma.cs2WatchlistItem.findMany).mockResolvedValue([] as never);
    vi.mocked(fetchCs2ShLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchC5GameLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: null,
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [{
        provider: "c5game",
        marketName: "C5Game",
        marketRegion: "china",
        askCents: 2800,
        bidCents: 2750,
        medianCents: null,
        askVolume: 10,
        bidVolume: 4,
        salesVolume24h: null,
        liquidityScore: 18,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      }],
    }] as never);

    const overview = await getCs2TrackerOverview({
      ownerKey: "owner-live",
      query: null,
    });

    expect(overview.mode).toBe("live");
    expect(overview.items[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      chineseAskCents: 2800,
      bestBidCents: 2750,
    }));
    expect(overview.sourceStatus.find((source) => source.id === "c5game")).toEqual(expect.objectContaining({
      hasLiveCoverage: true,
      itemCount: 1,
    }));
  });

  it("merges CSPriceAPI China-market snapshots into the overview refresh path", async () => {
    process.env.CSPRICEAPI_API_KEY = "cspriceapi-key";
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
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: null,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: null,
        spreadPercent: null,
      },
    }] as never);
    vi.mocked(prisma.cs2WatchlistItem.findMany).mockResolvedValue([] as never);
    vi.mocked(fetchCsPriceApiLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: null,
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [{
        provider: "cspriceapi",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 2790,
        bidCents: null,
        medianCents: null,
        askVolume: 14,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 11,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      }, {
        provider: "cspriceapi",
        marketName: "YouPin898",
        marketRegion: "china",
        askCents: 2810,
        bidCents: null,
        medianCents: null,
        askVolume: 9,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 10,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      }],
    }] as never);

    const overview = await getCs2TrackerOverview({
      ownerKey: "owner-csprice",
      query: null,
    });

    expect(overview.mode).toBe("live");
    expect(overview.items[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      chineseAskCents: 2790,
    }));
    expect(overview.sourceStatus.find((source) => source.id === "buff")).toEqual(expect.objectContaining({
      hasLiveCoverage: true,
      itemCount: 1,
    }));
    expect(overview.sourceStatus.find((source) => source.id === "youpin")).toEqual(expect.objectContaining({
      hasLiveCoverage: true,
      itemCount: 1,
    }));
  });

  it("merges direct Market.CSGO and WAXPEER snapshots into the overview refresh path", async () => {
    process.env.MARKET_CSGO_API_KEY = "market-key";
    process.env.WAXPEER_API_KEY = "waxpeer-key";
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
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: null,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: null,
        spreadPercent: null,
      },
    }] as never);
    vi.mocked(prisma.cs2WatchlistItem.findMany).mockResolvedValue([] as never);
    vi.mocked(fetchMarketCsgoLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: null,
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [{
        provider: "marketcsgo",
        marketName: "Market.CSGO",
        marketRegion: "global",
        askCents: 3000,
        bidCents: null,
        medianCents: null,
        askVolume: 8,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 8,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      }],
    }] as never);
    vi.mocked(fetchWaxpeerLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: null,
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [{
        provider: "waxpeer",
        marketName: "WAXPEER",
        marketRegion: "global",
        askCents: 2950,
        bidCents: 2850,
        medianCents: null,
        askVolume: 5,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 5,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      }],
    }] as never);

    const overview = await getCs2TrackerOverview({
      ownerKey: "owner-direct-markets",
      query: null,
    });

    expect(overview.items[0]).toEqual(expect.objectContaining({
      globalAskCents: 2950,
      bestBidCents: 2850,
    }));
    expect(overview.sourceStatus.find((source) => source.id === "marketcsgo")).toEqual(expect.objectContaining({
      hasLiveCoverage: true,
      integration: "direct",
      officialApi: "official",
    }));
    expect(overview.sourceStatus.find((source) => source.id === "waxpeer")).toEqual(expect.objectContaining({
      hasLiveCoverage: true,
      integration: "direct",
      officialApi: "official",
    }));
  });

  it("merges direct Steam and CSFloat snapshots into the overview refresh path", async () => {
    process.env.CSFLOAT_API_KEY = "csfloat-key";
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
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: null,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: null,
        spreadPercent: null,
      },
    }] as never);
    vi.mocked(prisma.cs2WatchlistItem.findMany).mockResolvedValue([] as never);
    vi.mocked(fetchSteamLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: null,
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [{
        provider: "steam",
        marketName: "Steam",
        marketRegion: "global",
        askCents: 3200,
        bidCents: null,
        medianCents: 3300,
        askVolume: 50,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: null,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      }],
    }] as never);
    vi.mocked(fetchCsFloatLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: null,
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [{
        provider: "csfloat",
        marketName: "CSFloat",
        marketRegion: "global",
        askCents: 3050,
        bidCents: null,
        medianCents: null,
        askVolume: 7,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: null,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      }],
    }] as never);

    const overview = await getCs2TrackerOverview({
      ownerKey: "owner-steam-csfloat",
      query: null,
    });

    expect(fetchSteamLatestItems).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(fetchCsFloatLatestItems).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(overview.items[0]).toEqual(expect.objectContaining({
      globalAskCents: 3050,
      bestAskCents: 3050,
    }));
    expect(overview.sourceStatus.find((source) => source.id === "steam")).toEqual(expect.objectContaining({
      hasLiveCoverage: true,
      integration: "direct",
      officialApi: "official",
    }));
    expect(overview.sourceStatus.find((source) => source.id === "csfloat")).toEqual(expect.objectContaining({
      hasLiveCoverage: true,
      integration: "direct",
      officialApi: "official",
    }));
  });

  it("keeps watched items in analysis even when they are outside the visible query page", async () => {
    vi.mocked(prisma.cs2Item.findMany)
      .mockResolvedValueOnce([{
        id: "m4a4-poseidon",
        marketHashName: "M4A4 | Poseidon (Factory New)",
        itemType: "skin",
        category: "M4A4",
        rarity: "Classified",
        exterior: "Factory New",
        collection: null,
        imageUrl: null,
        tradable: true,
        latestSnapshots: [],
        marketSnapshots: [],
        priceCandles: [],
        marketSummary: null,
      }] as never)
      .mockResolvedValueOnce([{
        id: "ak-redline",
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        rarity: "Classified",
        exterior: "Field-Tested",
        collection: null,
        imageUrl: null,
        tradable: true,
        latestSnapshots: [{
          provider: "cspriceapi",
          marketName: "BUFF163",
          marketRegion: "china",
          askCents: 2400,
          bidCents: null,
          medianCents: null,
          askVolume: 10,
          bidVolume: null,
          salesVolume24h: null,
          liquidityScore: 14,
          observedAt: new Date("2026-06-05T12:00:00.000Z"),
          sourceUrl: null,
        }],
        marketSnapshots: [],
        priceCandles: [],
        marketSummary: {
          bestAskCents: 2400,
          bestBidCents: null,
          chineseAskCents: 2400,
          globalAskCents: null,
          spreadPercent: null,
        },
      }] as never);
    vi.mocked(prisma.cs2WatchlistItem.findMany).mockResolvedValue([{
      id: "watch-1",
      itemId: "ak-redline",
      ownerKey: "owner-watch",
      userId: null,
      targetBuyCents: 2500,
      targetSellCents: null,
      notes: null,
      createdAt: new Date("2026-06-05T12:00:00.000Z"),
      updatedAt: new Date("2026-06-05T12:00:00.000Z"),
      item: {
        id: "ak-redline",
        marketHashName: "AK-47 | Redline (Field-Tested)",
      },
    }] as never);

    const overview = await getCs2TrackerOverview({
      ownerKey: "owner-watch",
      query: "poseidon",
    });

    expect(overview.items.map((item) => item.marketHashName)).toEqual(["M4A4 | Poseidon (Factory New)"]);
    expect(overview.analysis.watchlistSignals).toContainEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      signal: "buy-target",
    }));
  });

  it("returns a normalized watchlist entry and refreshed item after add", async () => {
    vi.mocked(prisma.cs2Item.upsert).mockResolvedValue({
      id: "ak-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
    } as never);
    vi.mocked(prisma.cs2WatchlistItem.upsert).mockResolvedValue({
      id: "watch-1",
      itemId: "ak-redline",
      targetBuyCents: 2500,
      targetSellCents: 3200,
      notes: "watch spread",
      createdAt: new Date("2026-06-05T12:00:00.000Z"),
    } as never);
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([{
      id: "ak-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Classified",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: null,
    }] as never);
    vi.mocked(hydrateCs2ItemsFromConfiguredProviders).mockResolvedValue([{
      provider: "cspriceapi",
      status: "ok",
      itemCount: 1,
      snapshotCount: 3,
      candleCount: 0,
      message: null,
    }] as never);

    const result = await addCs2WatchlistItem({
      ownerKey: "owner-1",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      targetBuyCents: 2500,
      targetSellCents: 3200,
      notes: "watch spread",
    });

    expect(hydrateCs2ItemsFromConfiguredProviders).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(result.watchlistItem).toEqual({
      id: "watch-1",
      itemId: "ak-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      targetBuyCents: 2500,
      targetSellCents: 3200,
      notes: "watch spread",
      createdAt: "2026-06-05T12:00:00.000Z",
    });
    expect(result.item).toEqual(expect.objectContaining({
      id: "ak-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
    }));
    expect(result.hydration).toEqual([expect.objectContaining({
      provider: "cspriceapi",
      status: "ok",
    })]);
  });
});
