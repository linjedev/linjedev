import { describe, expect, it } from "vitest";
import { flattenPricempireHistoryRows, flattenPricempirePriceRows } from "@/lib/cs2/providers/pricempire";

describe("Pricempire provider normalization", () => {
  it("combines Chinese ask and buy-order sources into anchor market snapshots", () => {
    const items = flattenPricempirePriceRows([
      {
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        image: "/panorama/images/econ/default_generated/ak-redline.png",
        liquidity: 92,
        count: 2214,
        rank: 120,
        prices: [
          {
            provider_key: "buff163",
            price: 2672,
            count: 2214,
            updated_at: "2026-06-05T10:00:00Z",
            median_7: 2680,
            meta: {
              original_price: 191.24,
              original_currency: "CNY",
            },
          },
          {
            provider_key: "buff163_buy",
            price: 2610,
            count: 402,
            updated_at: "2026-06-05T10:01:00Z",
          },
          {
            provider_key: "youpin",
            price: 2664,
            count: 1880,
            updated_at: "2026-06-05T10:02:00Z",
          },
          {
            provider_key: "youpin_buy",
            price: 2590,
            count: 331,
            updated_at: "2026-06-05T10:03:00Z",
          },
        ],
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      imageUrl: "https://cs2-cdn.pricempire.com/panorama/images/econ/default_generated/ak-redline.png",
    }));
    expect(items[0].snapshots).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: "pricempire",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 2672,
        bidCents: 2610,
        askVolume: 2214,
        bidVolume: 402,
        liquidityScore: 92,
        observedAt: new Date("2026-06-05T10:01:00Z"),
      }),
      expect.objectContaining({
        marketName: "YouPin898",
        marketRegion: "china",
        askCents: 2664,
        bidCents: 2590,
        observedAt: new Date("2026-06-05T10:03:00Z"),
      }),
    ]));
  });

  it("maps enterprise history points into daily candles for the requested provider", () => {
    const candles = flattenPricempireHistoryRows({
      providerKey: "youpin",
      interval: "1d",
      data: {
        "Sticker | Crown (Foil)": {
          "1770076800": 89540,
          "1770163200": 90210,
        },
      },
    });

    expect(candles).toEqual([
      expect.objectContaining({
        marketHashName: "Sticker | Crown (Foil)",
        provider: "pricempire",
        marketName: "YouPin898",
        interval: "1d",
        openCents: 89540,
        closeCents: 89540,
        startsAt: new Date(1770076800 * 1000),
      }),
      expect.objectContaining({
        closeCents: 90210,
        startsAt: new Date(1770163200 * 1000),
      }),
    ]);
  });
});
