import { afterEach, describe, expect, it, vi } from "vitest";
import { searchCs2FloatListings } from "@/lib/cs2/floatSearchService";
import { fetchCsFloatListings } from "@/lib/cs2/providers/csfloat";
import { fetchMarketCsgoFloatListings } from "@/lib/cs2/providers/marketcsgo";

vi.mock("@/lib/cs2/providers/csfloat", () => ({
  fetchCsFloatListings: vi.fn().mockRejectedValue(new Error("offline")),
}));

vi.mock("@/lib/cs2/providers/marketcsgo", () => ({
  fetchMarketCsgoFloatListings: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/cs2/itemMetadataService", () => ({
  getCs2ItemMetadataCatalog: vi.fn(async ({ query }: { query?: string | null }) => {
    if ((query ?? "").toLowerCase().includes("redline")) {
      return [
        {
          marketHashName: "AK-47 | Redline (Field-Tested)",
          imageUrl: null,
          rarity: "Classified",
          collection: "The Phoenix Collection",
          category: "AK-47",
          itemType: "skin",
          exterior: "Field-Tested",
        },
        {
          marketHashName: "AK-47 | Redline (Minimal Wear)",
          imageUrl: null,
          rarity: "Classified",
          collection: "The Phoenix Collection",
          category: "AK-47",
          itemType: "skin",
          exterior: "Minimal Wear",
        },
      ];
    }
    return [];
  }),
}));

describe("CS2 float search service", () => {
  const previousMarketCsgoKey = process.env.MARKET_CSGO_API_KEY;

  afterEach(() => {
    vi.clearAllMocks();
    if (previousMarketCsgoKey === undefined) {
      delete process.env.MARKET_CSGO_API_KEY;
    } else {
      process.env.MARKET_CSGO_API_KEY = previousMarketCsgoKey;
    }
    vi.mocked(fetchCsFloatListings).mockRejectedValue(new Error("offline"));
    vi.mocked(fetchMarketCsgoFloatListings).mockResolvedValue([]);
  });

  it("falls back to sample listings while preserving float filters", async () => {
    const response = await searchCs2FloatListings({
      query: "AK-47",
      maxFloat: 0.18,
      sort: "lowest_float",
    });

    expect(response.mode).toBe("sample");
    expect(response.warning).toContain("CSFloat float listings unavailable");
    expect(response.listings).toHaveLength(1);
    expect(response.listings[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      floatValue: 0.15081234,
    }));
  });

  it("resolves fuzzy item names into concrete market hash names for live CSFloat requests", async () => {
    vi.mocked(fetchCsFloatListings).mockResolvedValueOnce([
      {
        id: "ft-redline",
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemName: "AK-47 | Redline",
        wearName: "Field-Tested",
        priceCents: 2899,
        referencePriceCents: 3120,
        floatValue: 0.15081234,
        paintSeed: 661,
        paintIndex: 282,
        floatRank: 1842,
        rarity: 5,
        imageUrl: null,
        screenshotUrl: null,
        inspectUrl: null,
        listingUrl: null,
        hasScreenshot: false,
        stickers: [],
      },
    ]).mockResolvedValueOnce([]);

    const response = await searchCs2FloatListings({
      query: "ak redline",
      sort: "lowest_float",
    });

    expect(fetchCsFloatListings).toHaveBeenNthCalledWith(1, expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      query: undefined,
    }));
    expect(response.mode).toBe("live");
    expect(response.resolvedMarketHashNames).toContain("AK-47 | Redline (Field-Tested)");
    expect(response.listings[0]?.marketHashName).toBe("AK-47 | Redline (Field-Tested)");
  });

  it("merges Market.CSGO float listings when its API key is configured", async () => {
    process.env.MARKET_CSGO_API_KEY = "market-key";
    vi.mocked(fetchCsFloatListings).mockRejectedValue(new Error("csfloat offline"));
    vi.mocked(fetchMarketCsgoFloatListings).mockResolvedValueOnce([
      {
        id: "marketcsgo-1",
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemName: null,
        wearName: "Field-Tested",
        priceCents: 2800,
        referencePriceCents: null,
        floatValue: 0.14,
        paintSeed: null,
        paintIndex: null,
        floatRank: null,
        rarity: null,
        imageUrl: null,
        screenshotUrl: null,
        inspectUrl: null,
        listingUrl: "https://market.csgo.com/en/item/1",
        hasScreenshot: false,
        stickers: [],
      },
    ]).mockResolvedValueOnce([]);

    const response = await searchCs2FloatListings({
      query: "ak redline",
      maxFloat: 0.18,
      sort: "lowest_price",
    });

    expect(fetchMarketCsgoFloatListings).toHaveBeenCalledWith(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      maxFloat: 0.18,
    }));
    expect(response.mode).toBe("live");
    expect(response.warning).toContain("CSFloat");
    expect(response.listings[0]).toEqual(expect.objectContaining({
      id: "marketcsgo-1",
      priceCents: 2800,
    }));
  });
});
