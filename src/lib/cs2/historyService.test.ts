import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    cs2Item: {
      findUnique: vi.fn(),
    },
  },
}));

import { getCs2ItemHistory } from "@/lib/cs2/historyService";

describe("CS2 history service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns item snapshots and candles from the database", async () => {
    vi.mocked(prisma.cs2Item.findUnique).mockResolvedValue({
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
      marketSnapshots: [{
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
      priceCandles: [{
        provider: "cs2cap",
        marketName: "BUFF163",
        interval: "1d",
        openCents: 2300,
        highCents: 2500,
        lowCents: 2200,
        closeCents: 2400,
        volume: 15,
        startsAt: new Date("2026-06-01T00:00:00.000Z"),
      }],
      marketSummary: {
        bestAskCents: 2400,
        bestBidCents: null,
        chineseAskCents: 2400,
        globalAskCents: null,
        spreadPercent: null,
      },
    } as never);

    const response = await getCs2ItemHistory({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      snapshotLimit: 50,
      candleLimit: 90,
    });

    expect(prisma.cs2Item.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { marketHashName: "AK-47 | Redline (Field-Tested)" },
      include: expect.objectContaining({
        marketSnapshots: expect.objectContaining({ take: 50 }),
        priceCandles: expect.objectContaining({ take: 90 }),
      }),
    }));
    expect(response).toEqual(expect.objectContaining({
      mode: "live",
      warning: null,
      item: expect.objectContaining({
        marketHashName: "AK-47 | Redline (Field-Tested)",
        chineseAskCents: 2400,
      }),
    }));
    expect(response.item?.candles).toHaveLength(1);
  });

  it("falls back to sample item history when the database is unavailable", async () => {
    vi.mocked(prisma.cs2Item.findUnique).mockRejectedValue(new Error("offline") as never);

    const response = await getCs2ItemHistory({
      marketHashName: "AK-47 | Redline (Field-Tested)",
    });

    expect(response.mode).toBe("sample");
    expect(response.item?.marketHashName).toBe("AK-47 | Redline (Field-Tested)");
    expect(response.item?.candles.length).toBeGreaterThan(0);
  });
});
