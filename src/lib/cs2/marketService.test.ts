import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchC5GameLatestItems } from "@/lib/cs2/providers/c5game";
import { fetchCsPriceApiLatestItems } from "@/lib/cs2/providers/cspriceapi";
import { fetchCs2ShLatestItems } from "@/lib/cs2/providers/cs2sh";
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

vi.mock("@/lib/cs2/providers/c5game", () => ({
  fetchC5GameLatestItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/providers/cspriceapi", () => ({
  fetchCsPriceApiLatestItems: vi.fn().mockResolvedValue([]),
}));

import { getCs2TrackerOverview } from "@/lib/cs2/marketService";

describe("CS2 market service source status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CS2SH_API_KEY;
    delete process.env.CS2CAP_API_KEY;
    delete process.env.PRICEMPIRE_API_KEY;
    delete process.env.C5GAME_API_KEY;
    delete process.env.CSPRICEAPI_API_KEY;
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
});
