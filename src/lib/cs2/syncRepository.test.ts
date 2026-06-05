import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { getCs2MissingChinesePriceMarketHashNames, getCs2MissingHistoryMarketHashNames, getCs2SyncStatus, persistProviderCatalogItems, persistProviderItems } from "@/lib/cs2/syncRepository";

vi.mock("@/lib/db", () => ({
  prisma: {
    cs2Item: {
      upsert: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
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
      groupBy: vi.fn(),
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

  it("returns sync coverage gaps for scalable market indexing", async () => {
    vi.mocked(prisma.cs2Item.count)
      .mockResolvedValueOnce(1000 as never)
      .mockResolvedValueOnce(820 as never)
      .mockResolvedValueOnce(640 as never);
    vi.mocked(prisma.cs2MarketLatestSnapshot.count).mockResolvedValue(3000 as never);
    vi.mocked(prisma.cs2ItemMarketSummary.count)
      .mockResolvedValueOnce(900 as never)
      .mockResolvedValueOnce(760 as never)
      .mockResolvedValueOnce(810 as never);
    vi.mocked(prisma.cs2PriceCandle.count).mockResolvedValue(12000 as never);
    vi.mocked(prisma.cs2MarketLatestSnapshot.groupBy).mockResolvedValue([{
      provider: "cspriceapi",
      marketRegion: "china",
      _count: { _all: 1600, itemId: 760 },
    }] as never);
    vi.mocked(prisma.cs2MarketSyncRun.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.cs2MarketLatestSnapshot.findFirst).mockResolvedValue({
      observedAt: new Date("2026-06-05T12:00:00.000Z"),
      provider: "cspriceapi",
      marketName: "BUFF163",
    } as never);

    const status = await getCs2SyncStatus();

    expect(status.coverage).toEqual({
      itemsWithLatestSnapshots: 820,
      itemsWithChinesePrice: 760,
      itemsWithGlobalPrice: 810,
      itemsWithHistory: 640,
      itemsMissingLatestSnapshots: 180,
      itemsMissingChinesePrice: 240,
      itemsMissingGlobalPrice: 190,
      itemsMissingHistory: 360,
    });
    expect(status.providerCoverage).toEqual([{
      provider: "cspriceapi",
      marketRegion: "china",
      itemCount: 760,
      snapshotCount: 1600,
    }]);
  });

  it("selects catalog items missing or stale Chinese prices for cursor backfill", async () => {
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([
      { marketHashName: "AK-47 | Redline (Field-Tested)" },
      { marketHashName: "Sticker | Crown (Foil)" },
    ] as never);

    const names = await getCs2MissingChinesePriceMarketHashNames({
      limit: 25,
      staleAfterHours: 24,
      afterMarketHashName: "AK-47 | Asiimov (Field-Tested)",
    });

    expect(prisma.cs2Item.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: [
          { marketHashName: { gt: "AK-47 | Asiimov (Field-Tested)" } },
          {
            OR: [
              { marketSummary: { is: null } },
              { marketSummary: { is: { chineseAskCents: null } } },
              { marketSummary: { is: { latestObservedAt: { lt: expect.any(Date) } } } },
            ],
          },
        ],
      },
      select: { marketHashName: true },
      orderBy: { marketHashName: "asc" },
      take: 25,
    }));
    expect(names).toEqual([
      "AK-47 | Redline (Field-Tested)",
      "Sticker | Crown (Foil)",
    ]);
  });

  it("selects catalog items missing or stale history candles for cursor backfill", async () => {
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([
      { marketHashName: "M4A4 | Poseidon (Factory New)" },
    ] as never);

    const names = await getCs2MissingHistoryMarketHashNames({
      limit: 40,
      staleAfterDays: 14,
      afterMarketHashName: "M4A1-S | Hot Rod (Factory New)",
    });

    expect(prisma.cs2Item.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: [
          { marketHashName: { gt: "M4A1-S | Hot Rod (Factory New)" } },
          {
            OR: [
              { priceCandles: { none: {} } },
              { priceCandles: { every: { startsAt: { lt: expect.any(Date) } } } },
            ],
          },
        ],
      },
      select: { marketHashName: true },
      orderBy: { marketHashName: "asc" },
      take: 40,
    }));
    expect(names).toEqual(["M4A4 | Poseidon (Factory New)"]);
  });
});
