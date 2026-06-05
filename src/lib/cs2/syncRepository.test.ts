import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { persistProviderCatalogItems, persistProviderItems } from "@/lib/cs2/syncRepository";

vi.mock("@/lib/db", () => ({
  prisma: {
    cs2Item: {
      upsert: vi.fn(),
    },
    cs2MarketSyncRun: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    cs2MarketSnapshot: {
      createMany: vi.fn(),
    },
    cs2MarketLatestSnapshot: {
      upsert: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    cs2ItemMarketSummary: {
      upsert: vi.fn(),
      count: vi.fn(),
    },
    cs2PriceCandle: {
      upsert: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("CS2 sync repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts catalog items by market hash name", async () => {
    vi.mocked(prisma.cs2Item.upsert).mockResolvedValue({ id: "item-1" } as never);

    await persistProviderCatalogItems([{
      marketHashName: "AWP | Dragon Lore (Factory New)",
      itemType: "rifles",
      category: "Sniper Rifle",
      rarity: "Covert",
      exterior: "Factory New",
      collection: "The Cobblestone Collection",
      imageUrl: "https://cdn.cs2c.app/images/dragon-lore.png",
      tradable: true,
    }]);

    expect(prisma.cs2Item.upsert).toHaveBeenCalledWith({
      where: { marketHashName: "AWP | Dragon Lore (Factory New)" },
      update: expect.objectContaining({
        itemType: "rifles",
        category: "Sniper Rifle",
        rarity: "Covert",
      }),
      create: expect.objectContaining({
        marketHashName: "AWP | Dragon Lore (Factory New)",
        collection: "The Cobblestone Collection",
        tradable: true,
      }),
    });
  });

  it("refreshes derived market summaries after latest snapshot persistence", async () => {
    vi.mocked(prisma.cs2Item.upsert).mockResolvedValue({ id: "item-1" } as never);
    vi.mocked(prisma.cs2MarketSnapshot.createMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(prisma.cs2MarketLatestSnapshot.upsert).mockResolvedValue({ id: "snapshot" } as never);
    vi.mocked(prisma.cs2MarketLatestSnapshot.findMany).mockResolvedValue([
      {
        marketRegion: "china",
        askCents: 2672,
        bidCents: 2610,
        askVolume: 2214,
        bidVolume: 402,
        salesVolume24h: 188,
        liquidityScore: 94,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
      },
      {
        marketRegion: "global",
        askCents: 2842,
        bidCents: 2791,
        askVolume: 516,
        bidVolume: 88,
        salesVolume24h: 47,
        liquidityScore: 81,
        observedAt: new Date("2026-06-05T12:01:00.000Z"),
      },
    ] as never);
    vi.mocked(prisma.cs2ItemMarketSummary.upsert).mockResolvedValue({ id: "summary" } as never);

    const snapshotCount = await persistProviderItems([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: null,
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [
        {
          provider: "cs2.sh",
          marketName: "BUFF163",
          marketRegion: "china",
          askCents: 2672,
          bidCents: 2610,
          medianCents: 2703,
          askVolume: 2214,
          bidVolume: 402,
          salesVolume24h: 188,
          liquidityScore: 94,
          observedAt: new Date("2026-06-05T12:00:00.000Z"),
        },
        {
          provider: "cs2.sh",
          marketName: "CSFloat",
          marketRegion: "global",
          askCents: 2842,
          bidCents: 2791,
          medianCents: 2880,
          askVolume: 516,
          bidVolume: 88,
          salesVolume24h: 47,
          liquidityScore: 81,
          observedAt: new Date("2026-06-05T12:01:00.000Z"),
        },
      ],
    }]);

    expect(snapshotCount).toBe(2);
    expect(prisma.cs2ItemMarketSummary.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { itemId: "item-1" },
      update: expect.objectContaining({
        bestAskCents: 2672,
        bestBidCents: 2791,
        chineseAskCents: 2672,
        globalAskCents: 2842,
        spreadPercent: -5.98,
        askVolumeTotal: 2730,
        bidVolumeTotal: 490,
        salesVolume24hTotal: 235,
        liquidityScore: 87.5,
        latestObservedAt: new Date("2026-06-05T12:01:00.000Z"),
      }),
    }));
  });
});
