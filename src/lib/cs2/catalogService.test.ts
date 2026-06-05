import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCs2ItemMetadataByMarketHashName,
  getCs2ItemMetadataCatalog,
  getCs2ItemMetadataCatalogWithTotal,
} from "@/lib/cs2/itemMetadataService";
import {
  fetchCs2CapCatalogItems,
  fetchCs2CapLatestItems,
} from "@/lib/cs2/providers/cs2cap";
import { fetchSkinportLatestItems } from "@/lib/cs2/providers/skinport";
import type { Cs2ItemView } from "@/lib/cs2/types";
import { prisma } from "@/lib/db";

vi.mock("@/lib/cs2/providers/cs2cap", () => ({
  fetchCs2CapCatalogItems: vi.fn(),
  fetchCs2CapLatestItems: vi.fn(),
}));
vi.mock("@/lib/cs2/providers/skinport", () => ({
  fetchSkinportLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/itemMetadataService", () => ({
  getCs2ItemMetadataByMarketHashName: vi.fn(),
  getCs2ItemMetadataCatalog: vi.fn(),
  getCs2ItemMetadataCatalogWithTotal: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cs2Item: {
      count: vi.fn().mockRejectedValue(new Error("offline")),
      findMany: vi.fn(),
    },
  },
}));

import { getCs2Catalog, sortCs2CatalogItems } from "@/lib/cs2/catalogService";

function item(overrides: Partial<Cs2ItemView>): Cs2ItemView {
  return {
    id: "item",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    itemType: "skin",
    category: "AK-47",
    rarity: null,
    exterior: "Field-Tested",
    collection: null,
    imageUrl: null,
    tradable: true,
    bestAskCents: 3000,
    bestBidCents: 2900,
    chineseAskCents: 2700,
    globalAskCents: 3000,
    spreadPercent: -10,
    snapshots: [],
    candles: [],
    ...overrides,
  };
}

describe("CS2 catalog service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.cs2Item.count).mockRejectedValue(new Error("offline") as never);
  vi.mocked(fetchSkinportLatestItems).mockRejectedValue(new Error("skinport unavailable") as never);
  vi.mocked(fetchCs2CapCatalogItems).mockResolvedValue([] as never);
  vi.mocked(fetchCs2CapLatestItems).mockResolvedValue([] as never);
  vi.mocked(getCs2ItemMetadataByMarketHashName).mockResolvedValue(new Map() as never);
  vi.mocked(getCs2ItemMetadataCatalog).mockResolvedValue([] as never);
  vi.mocked(getCs2ItemMetadataCatalogWithTotal).mockResolvedValue({
    items: [],
    total: 0,
    offset: 0,
    limit: 0,
  } as never);
  });

  it("falls back to a paginated sample catalog when the database is unavailable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(getCs2ItemMetadataCatalog).mockRejectedValue(new Error("metadata unavailable") as never);
    const catalog = await getCs2Catalog({
      query: "sticker",
      itemType: "sticker",
      page: 1,
      limit: 2,
      sort: "name",
    });

    expect(catalog.mode).toBe("sample");
    expect(catalog.warning).toContain("Database unavailable");
    expect(catalog.items.length).toBeLessThanOrEqual(2);
    expect(catalog.items.every((catalogItem) => catalogItem.itemType === "sticker")).toBe(true);
    expect(catalog.facets.itemTypes.some((facet) => facet.value === "sticker")).toBe(true);
    warnSpy.mockRestore();
  });

  it("falls back to paginated metadata catalog when the database is unavailable and no query is provided", async () => {
    const metadataRows = [
      {
        marketHashName: "AK-47 | Frontside Misty (Field-Tested)",
        imageUrl: "https://community.akamai.steamstatic.com/economy/image/frontside-misty",
        rarity: "Classified",
        collection: "Dust 2 Collection",
        category: "AK-47",
        itemType: "skin",
        exterior: "Field-Tested",
      },
      {
        marketHashName: "Sticker | Gamma 2",
        imageUrl: "https://community.akamai.steamstatic.com/economy/image/sticker-gamma2",
        rarity: null,
        collection: null,
        category: "Stickers",
        itemType: "sticker",
        exterior: null,
      },
    ];

    vi.mocked(getCs2ItemMetadataCatalogWithTotal).mockResolvedValue({
      items: [metadataRows[0]] as never,
      total: metadataRows.length,
      offset: 0,
      limit: 1,
    } as never);

    const catalog = await getCs2Catalog({
      query: null,
      page: 1,
      limit: 1,
      sort: "name",
    });

    expect(catalog.mode).toBe("sample");
    expect(catalog.totalItems).toBe(2);
    expect(catalog.warning).toContain("showing metadata market catalog");
    expect(catalog.items.length).toBe(1);
    expect(catalog.items[0].marketHashName).toBe("AK-47 | Frontside Misty (Field-Tested)");
    expect(catalog.totalPages).toBe(2);
  });

  it("merges live provider results when DB search coverage is partial", async () => {
    vi.mocked(prisma.cs2Item.count).mockResolvedValue(1 as never);
    vi.mocked(prisma.cs2Item.findMany)
      .mockResolvedValueOnce([{
        id: "db-ak47-redline",
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        rarity: "Classified",
        exterior: "Field-Tested",
        collection: "The Phoenix Case",
        imageUrl: null,
        tradable: true,
        latestSnapshots: [],
        marketSnapshots: [],
        priceCandles: [],
        marketSummary: {
          bestAskCents: 3200,
          bestBidCents: 3000,
          chineseAskCents: 3100,
          globalAskCents: 3200,
          spreadPercent: -3.1,
        },
      } as never])
      .mockResolvedValueOnce([{
        id: "db-ak47-redline",
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        rarity: "Classified",
        exterior: "Field-Tested",
        collection: "The Phoenix Case",
        imageUrl: null,
        tradable: true,
      } as never]);

    vi.mocked(fetchCs2CapCatalogItems).mockResolvedValue([{
      marketHashName: "AK-47 | Case Hardened (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Industrial",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
    }] as never);
    vi.mocked(fetchCs2CapLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Case Hardened (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Industrial",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/casehardened",
      tradable: true,
      snapshots: [{
        provider: "cs2cap",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 4100,
        bidCents: null,
        medianCents: 4150,
        askVolume: 7,
        bidVolume: null,
        salesVolume24h: 3,
        liquidityScore: 12,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: "https://cs2c.app/item/ak47-case-hardened",
      }],
    } as never]);

    const catalog = await getCs2Catalog({
      query: "ak-47",
      page: 1,
      limit: 50,
      sort: "name",
    });

    expect(catalog.mode).toBe("live");
    expect(catalog.warning).toContain("Partial database coverage");
    expect(catalog.totalItems).toBe(2);
    expect(catalog.items.map((item) => item.marketHashName)).toEqual(expect.arrayContaining([
      "AK-47 | Redline (Field-Tested)",
      "AK-47 | Case Hardened (Field-Tested)",
    ]));
  });

  it("merges live provider results even when database search is not marked partial", async () => {
    vi.mocked(prisma.cs2Item.count).mockResolvedValue(50 as never);
    vi.mocked(prisma.cs2Item.findMany)
      .mockResolvedValueOnce([{
        id: "db-ak47-redline",
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        rarity: "Classified",
        exterior: "Field-Tested",
        collection: "The Phoenix Case",
        imageUrl: null,
        tradable: true,
        latestSnapshots: [],
        marketSnapshots: [],
        priceCandles: [],
        marketSummary: {
          bestAskCents: 3200,
          bestBidCents: 3000,
          chineseAskCents: 3100,
          globalAskCents: 3200,
          spreadPercent: -3.1,
        },
      } as never])
      .mockResolvedValueOnce([{
        id: "db-ak47-redline",
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        rarity: "Classified",
        exterior: "Field-Tested",
        collection: "The Phoenix Case",
        imageUrl: null,
        tradable: true,
      } as never]);

    vi.mocked(fetchCs2CapCatalogItems).mockResolvedValue([{
      marketHashName: "AK-47 | Case Hardened (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Industrial",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
    }] as never);
    vi.mocked(fetchCs2CapLatestItems).mockResolvedValue([{
      marketHashName: "AK-47 | Case Hardened (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Industrial",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/casehardened",
      tradable: true,
      snapshots: [{
        provider: "cs2cap",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 4100,
        bidCents: null,
        medianCents: 4150,
        askVolume: 7,
        bidVolume: null,
        salesVolume24h: 3,
        liquidityScore: 12,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: "https://cs2c.app/item/ak47-case-hardened",
      }],
    } as never]);

    const catalog = await getCs2Catalog({
      query: "ak-47",
      page: 1,
      limit: 10,
      sort: "name",
    });

    expect(catalog.mode).toBe("live");
    expect(catalog.warning).toContain("Merged with live market search results for this query.");
    expect(catalog.totalItems).toBe(2);
    expect(catalog.items.map((item) => item.marketHashName)).toEqual(expect.arrayContaining([
      "AK-47 | Redline (Field-Tested)",
      "AK-47 | Case Hardened (Field-Tested)",
    ]));
  });

  it("uses live Skinport search when the database is unavailable and a query is present", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(fetchSkinportLatestItems).mockResolvedValue([
      {
        marketHashName: "M4A4 | Poseidon (Factory New)",
        itemType: "skin",
        category: "M4A4",
        rarity: null,
        exterior: "Factory New",
        collection: null,
        imageUrl: null,
        tradable: true,
        snapshots: [{
          provider: "skinport",
          marketName: "Skinport",
          marketRegion: "global",
          askCents: 119900,
          bidCents: null,
          medianCents: 121000,
          askVolume: 4,
          bidVolume: null,
          salesVolume24h: null,
          liquidityScore: null,
          observedAt: new Date("2026-06-05T12:00:00.000Z"),
          sourceUrl: "https://skinport.com/item/csgo/m4a4-poseidon-factory-new",
        }],
      },
    ] as never);
    vi.mocked(getCs2ItemMetadataByMarketHashName).mockResolvedValue(new Map([
      ["M4A4 | Poseidon (Factory New)", {
        marketHashName: "M4A4 | Poseidon (Factory New)",
        imageUrl: "https://community.akamai.steamstatic.com/economy/image/poseidon",
        rarity: "Classified",
        collection: "The Gods and Monsters Collection",
        category: "Rifles",
      }],
    ]) as never);

    const catalog = await getCs2Catalog({
      query: "m4a4 poseidon",
      page: 1,
      limit: 10,
      sort: "price-asc",
    });

    expect(fetchSkinportLatestItems).toHaveBeenCalledWith({
      query: "m4a4 poseidon",
      limit: 10,
    });
    expect(getCs2ItemMetadataByMarketHashName).toHaveBeenCalledWith(["M4A4 | Poseidon (Factory New)"]);
    expect(catalog.mode).toBe("live");
    expect(catalog.warning).toContain("Skinport");
    expect(catalog.items[0]).toEqual(expect.objectContaining({
      marketHashName: "M4A4 | Poseidon (Factory New)",
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/poseidon",
      bestAskCents: 119900,
      globalAskCents: 119900,
    }));
    warnSpy.mockRestore();
  });

  it("uses live CS2Cap search when Skinport is unavailable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(fetchCs2CapCatalogItems).mockResolvedValue([{
      marketHashName: "M4A4 | Neo-Noir (Field-Tested)",
      itemType: "skin",
      category: "M4A4",
      rarity: "Covert",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
    }] as never);
    vi.mocked(fetchCs2CapLatestItems).mockResolvedValue([{
      marketHashName: "M4A4 | Neo-Noir (Field-Tested)",
      itemType: "skin",
      category: "M4A4",
      rarity: "Covert",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/neo-noir",
      tradable: true,
      snapshots: [{
        provider: "cs2cap",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 9800,
        bidCents: null,
        medianCents: 9900,
        askVolume: 2,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: null,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: "https://cs2c.app/item/m4a4-neo-noir",
      }],
    }] as never);

    const catalog = await getCs2Catalog({
      query: "m4a4 neo-noir",
      page: 1,
      limit: 10,
      sort: "name",
    });

    expect(fetchCs2CapCatalogItems).toHaveBeenCalledWith({
      query: "m4a4 neo-noir",
      limit: 10,
    });
    expect(fetchCs2CapLatestItems).toHaveBeenCalledWith({
      marketHashNames: ["M4A4 | Neo-Noir (Field-Tested)"],
      limit: 2,
    });
    expect(catalog.mode).toBe("live");
    expect(catalog.warning).toContain("CS2Cap");
    expect(catalog.items[0]).toEqual(expect.objectContaining({
      marketHashName: "M4A4 | Neo-Noir (Field-Tested)",
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/neo-noir",
      bestAskCents: 9800,
    }));
    warnSpy.mockRestore();
  });

  it("filters the catalog by coverage gaps for analysis workflows", async () => {
    vi.mocked(prisma.cs2Item.count).mockResolvedValue(2 as never);
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([{
      id: "db-ak47-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Classified",
      exterior: "Field-Tested",
      collection: "The Phoenix Case",
      imageUrl: null,
      tradable: true,
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [{
        provider: "cs2.sh",
        marketName: "BUFF163",
        interval: "1d",
        openCents: 3000,
        highCents: 3200,
        lowCents: 2950,
        closeCents: 3150,
        volume: 12,
        startsAt: new Date("2026-06-01T00:00:00.000Z"),
      }, {
        provider: "cs2.sh",
        marketName: "BUFF163",
        interval: "1d",
        openCents: 3150,
        highCents: 3250,
        lowCents: 3100,
        closeCents: 3200,
        volume: 18,
        startsAt: new Date("2026-06-02T00:00:00.000Z"),
      }],
      marketSummary: {
        bestAskCents: 3200,
        bestBidCents: 3000,
        chineseAskCents: 3100,
        globalAskCents: 3200,
        spreadPercent: -3.1,
      },
    }, {
      id: "db-crown-foil",
      marketHashName: "Sticker | Crown (Foil)",
      itemType: "sticker",
      category: "sticker",
      rarity: "Contraband",
      exterior: null,
      collection: null,
      imageUrl: null,
      tradable: true,
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 89540,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: 89540,
        spreadPercent: null,
      },
    }] as never);

    const catalog = await getCs2Catalog({
      coverage: "missing-history",
      page: 1,
      limit: 50,
      sort: "name",
    });

    expect(catalog.coverage).toBe("missing-history");
    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].marketHashName).toBe("Sticker | Crown (Foil)");
  });

  it("filters the catalog by market focus for China-first analysis", async () => {
    vi.mocked(prisma.cs2Item.count).mockResolvedValue(2 as never);
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([{
      id: "db-ak47-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Classified",
      exterior: "Field-Tested",
      collection: "The Phoenix Case",
      imageUrl: null,
      tradable: true,
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 3200,
        bestBidCents: 3000,
        chineseAskCents: 3100,
        globalAskCents: 3200,
        spreadPercent: -3.1,
      },
    }, {
      id: "db-crown-foil",
      marketHashName: "Sticker | Crown (Foil)",
      itemType: "sticker",
      category: "sticker",
      rarity: "Contraband",
      exterior: null,
      collection: null,
      imageUrl: null,
      tradable: true,
      latestSnapshots: [],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 89540,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: 89540,
        spreadPercent: null,
      },
    }] as never);

    const catalog = await getCs2Catalog({
      marketFocus: "china",
      page: 1,
      limit: 50,
      sort: "name",
    });

    expect(catalog.marketFocus).toBe("china");
    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].marketHashName).toBe("AK-47 | Redline (Field-Tested)");
  });

  it("filters the catalog by specific market source", async () => {
    vi.mocked(prisma.cs2Item.count).mockResolvedValue(2 as never);
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([{
      id: "db-ak47-redline",
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "Classified",
      exterior: "Field-Tested",
      collection: "The Phoenix Case",
      imageUrl: null,
      tradable: true,
      latestSnapshots: [{
        provider: "cspriceapi",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 3100,
        bidCents: null,
        medianCents: null,
        askVolume: 12,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 8,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: null,
      }],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 3200,
        bestBidCents: 3000,
        chineseAskCents: 3100,
        globalAskCents: 3200,
        spreadPercent: -3.1,
      },
    }, {
      id: "db-crown-foil",
      marketHashName: "Sticker | Crown (Foil)",
      itemType: "sticker",
      category: "sticker",
      rarity: "Contraband",
      exterior: null,
      collection: null,
      imageUrl: null,
      tradable: true,
      latestSnapshots: [{
        provider: "skinport",
        marketName: "Skinport",
        marketRegion: "global",
        askCents: 89540,
        bidCents: null,
        medianCents: null,
        askVolume: 5,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 4,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: null,
      }],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 89540,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: 89540,
        spreadPercent: null,
      },
    }] as never);

    const catalog = await getCs2Catalog({
      source: "buff",
      page: 1,
      limit: 50,
      sort: "name",
    });

    expect(catalog.source).toBe("buff");
    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].marketHashName).toBe("AK-47 | Redline (Field-Tested)");
  });

  it("filters the catalog by extended marketplace sources", async () => {
    vi.mocked(prisma.cs2Item.count).mockResolvedValue(2 as never);
    vi.mocked(prisma.cs2Item.findMany).mockResolvedValue([{
      id: "db-dmarket-knife",
      marketHashName: "\u2605 Karambit | Doppler (Factory New)",
      itemType: "knife",
      category: "Karambit",
      rarity: "Covert",
      exterior: "Factory New",
      collection: null,
      imageUrl: null,
      tradable: true,
      latestSnapshots: [{
        provider: "cs2cap",
        marketName: "DMarket",
        marketRegion: "global",
        askCents: 170000,
        bidCents: null,
        medianCents: null,
        askVolume: 2,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 5,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: null,
      }],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 170000,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: 170000,
        spreadPercent: null,
      },
    }, {
      id: "db-marketcsgo-gloves",
      marketHashName: "\u2605 Sport Gloves | Pandora's Box (Field-Tested)",
      itemType: "gloves",
      category: "Sport Gloves",
      rarity: "Extraordinary",
      exterior: "Field-Tested",
      collection: null,
      imageUrl: null,
      tradable: true,
      latestSnapshots: [{
        provider: "cs2cap",
        marketName: "Market.CSGO",
        marketRegion: "global",
        askCents: 630000,
        bidCents: null,
        medianCents: null,
        askVolume: 1,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 2,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: null,
      }],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 630000,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: 630000,
        spreadPercent: null,
      },
    }, {
      id: "db-bitskins-sticker",
      marketHashName: "Sticker | Crown (Foil)",
      itemType: "sticker",
      category: "sticker",
      rarity: "Contraband",
      exterior: null,
      collection: null,
      imageUrl: null,
      tradable: true,
      latestSnapshots: [{
        provider: "cs2cap",
        marketName: "BitSkins",
        marketRegion: "global",
        askCents: 90000,
        bidCents: null,
        medianCents: null,
        askVolume: 1,
        bidVolume: null,
        salesVolume24h: null,
        liquidityScore: 3,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: null,
      }],
      marketSnapshots: [],
      priceCandles: [],
      marketSummary: {
        bestAskCents: 90000,
        bestBidCents: null,
        chineseAskCents: null,
        globalAskCents: 90000,
        spreadPercent: null,
      },
    }] as never);

    const catalog = await getCs2Catalog({
      source: "dmarket",
      page: 1,
      limit: 50,
      sort: "name",
    });

    expect(catalog.source).toBe("dmarket");
    expect(catalog.items).toHaveLength(1);
    expect(catalog.items[0].marketHashName).toBe("\u2605 Karambit | Doppler (Factory New)");

    const marketCsgoCatalog = await getCs2Catalog({
      source: "marketcsgo",
      page: 1,
      limit: 50,
      sort: "name",
    });

    expect(marketCsgoCatalog.source).toBe("marketcsgo");
    expect(marketCsgoCatalog.items).toHaveLength(1);
    expect(marketCsgoCatalog.items[0].marketHashName).toBe("\u2605 Sport Gloves | Pandora's Box (Field-Tested)");
  });

  it("falls back to metadata search results when Skinport is unavailable", async () => {
    const metadataItem = {
      marketHashName: "Knife | Autotronic",
      imageUrl: "https://community.akamai.steamstatic.com/economy/image/sample",
      rarity: "Covert",
      collection: null,
      category: "Knives",
      itemType: "knife",
      exterior: "Factory New",
    };
    vi.mocked(getCs2ItemMetadataCatalog).mockResolvedValue([metadataItem] as never);
    vi.mocked(getCs2ItemMetadataCatalogWithTotal).mockResolvedValue({
      items: [metadataItem] as never,
      total: 1,
      offset: 0,
      limit: 10,
    } as never);
    const catalog = await getCs2Catalog({
      query: "autotronic",
      page: 1,
      limit: 10,
      sort: "name",
    });
    expect(vi.mocked(getCs2ItemMetadataCatalogWithTotal)).toHaveBeenCalled();
    expect(catalog.mode).toBe("sample");
    expect(catalog.warning).toContain("metadata catalog fallback");
    expect(catalog.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        marketHashName: metadataItem.marketHashName,
        imageUrl: metadataItem.imageUrl,
        itemType: metadataItem.itemType,
      }),
    ]));
    expect(catalog.totalItems).toBe(1);
  });

  it("orders live China-discount catalog pages through the market summary index", async () => {
    vi.mocked(prisma.cs2Item.count).mockResolvedValue(0 as never);
    vi.mocked(prisma.cs2Item.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    const catalog = await getCs2Catalog({
      page: 2,
      limit: 25,
      sort: "china-discount",
    });

    expect(catalog.mode).toBe("live");
    expect(prisma.cs2Item.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      orderBy: [
        { marketSummary: { spreadPercent: "asc" } },
        { marketSummary: { askVolumeTotal: "desc" } },
        { marketHashName: "asc" },
      ],
      skip: 25,
      take: 25,
    }));
  });

  it("sorts cross-market discount opportunities before flat or expensive Chinese asks", () => {
    const sorted = sortCs2CatalogItems([
      item({ id: "flat", marketHashName: "Flat", spreadPercent: 0 }),
      item({ id: "discount", marketHashName: "Discount", spreadPercent: -12.5 }),
      item({ id: "premium", marketHashName: "Premium", spreadPercent: 8.2 }),
    ], "china-discount");

    expect(sorted.map((catalogItem) => catalogItem.id)).toEqual(["discount", "flat", "premium"]);
  });
});
