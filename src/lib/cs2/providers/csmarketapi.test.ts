import { describe, expect, it } from "vitest";
import { csMarketApiHistoryToCandles, csMarketApiLatestToProviderItem, flattenCsMarketApiCatalogItems } from "@/lib/cs2/providers/csmarketapi";

describe("CSMarketAPI provider normalization", () => {
  it("maps catalog item metadata into provider catalog rows", () => {
    const items = flattenCsMarketApiCatalogItems([
      {
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        type: "skin",
        weapon: "AK-47",
        exterior: "Field-Tested",
        quality: "Classified",
        collection: "The Phoenix Collection",
        cloudflare_icon_url: "https://cdn.example.com/redline.png",
      },
      {
        market_hash_name: "Sticker | Crown (Foil)",
        type: "sticker",
        sticker_collection: "Community Stickers",
        quality: "Exotic",
        akamai_icon_url: "https://cdn.example.com/crown.png",
      },
    ], 1);

    expect(items).toEqual([
      expect.objectContaining({
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        exterior: "Field-Tested",
        rarity: "Classified",
        collection: "The Phoenix Collection",
        imageUrl: "https://cdn.example.com/redline.png",
        tradable: true,
      }),
    ]);
  });

  it("maps aggregate latest listings into per-market snapshots", () => {
    const item = csMarketApiLatestToProviderItem({
      market_hash_name: "AK-47 | Redline (Field-Tested)",
      listings: [
        {
          id: 1,
          market: "SKINPORT",
          market_link: "https://skinport.com/item",
          min_price: 28.4,
          median_price: 30.2,
          listings: 18,
          timestamp: "2026-06-05T12:00:00Z",
        },
        {
          id: 2,
          market: "BUFFMARKET",
          market_link: "https://buff.market/item",
          min_price: 26.1,
          mean_price: 27.8,
          listings: 7,
          timestamp: "2026-06-05T12:01:00Z",
        },
      ],
    });

    expect(item).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      exterior: "Field-Tested",
      tradable: true,
    }));
    expect(item?.snapshots).toEqual([
      expect.objectContaining({
        provider: "csmarketapi",
        marketName: "Skinport",
        marketRegion: "global",
        askCents: 2840,
        medianCents: 3020,
        askVolume: 18,
        observedAt: new Date("2026-06-05T12:00:00Z"),
      }),
      expect.objectContaining({
        provider: "csmarketapi",
        marketName: "BUFF.Market",
        askCents: 2610,
        medianCents: 2780,
        askVolume: 7,
      }),
    ]);
  });

  it("maps aggregate sales history into daily candles", () => {
    const candles = csMarketApiHistoryToCandles({
      marketHashName: "Sticker | Crown (Foil)",
      payload: [
        {
          day: "2026-06-04",
          sales: [
            {
              id: 1,
              market: "CSFLOAT",
              min_price: 720.1,
              max_price: 760.2,
              median_price: 740.15,
              volume: 3,
            },
          ],
        },
      ],
    });

    expect(candles).toEqual([
      expect.objectContaining({
        marketHashName: "Sticker | Crown (Foil)",
        provider: "csmarketapi",
        marketName: "CSFloat",
        interval: "1d",
        openCents: 72010,
        highCents: 76020,
        lowCents: 72010,
        closeCents: 74015,
        volume: 3,
        startsAt: new Date("2026-06-04T00:00:00.000Z"),
      }),
    ]);
  });
});
