import { describe, expect, it } from "vitest";
import { csFloatListingsToProviderItems, csFloatSalesToCandles, flattenCsFloatListings } from "@/lib/cs2/providers/csfloat";

describe("CSFloat listing normalization", () => {
  it("maps listing asset float, paint, image, and sticker data", () => {
    const listings = flattenCsFloatListings([{
      id: "324288155723370196",
      price: 221000,
      item: {
        market_hash_name: "M4A4 | Poseidon (Factory New)",
        item_name: "M4A4 | Poseidon",
        wear_name: "Factory New",
        float_value: 0.02796577662229538,
        paint_seed: 112,
        paint_index: 449,
        icon_url: "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZ",
        inspect_link: "steam://inspect",
        has_screenshot: true,
        scm: { price: 236500 },
        stickers: [{
          name: "Sticker | Team EnVyUs (Holo) | MLG Columbus 2016",
          slot: 3,
          icon_url: "columbus2016/nv_holo.png",
        }],
      },
    }]);

    expect(listings[0]).toEqual(expect.objectContaining({
      id: "324288155723370196",
      marketHashName: "M4A4 | Poseidon (Factory New)",
      priceCents: 221000,
      referencePriceCents: 236500,
      floatValue: 0.02796577662229538,
      paintSeed: 112,
      paintIndex: 449,
      hasScreenshot: true,
    }));
    expect(listings[0].imageUrl).toContain("community.fastly.steamstatic.com/economy/image");
    expect(listings[0].stickers[0]).toEqual(expect.objectContaining({
      name: "Sticker | Team EnVyUs (Holo) | MLG Columbus 2016",
      slot: 3,
    }));
  });

  it("rolls active listings into a market snapshot for sync", () => {
    const items = csFloatListingsToProviderItems([
      {
        id: "high",
        marketHashName: "M4A4 | Poseidon (Factory New)",
        itemName: "M4A4 | Poseidon",
        wearName: "Factory New",
        priceCents: 223000,
        referencePriceCents: 236500,
        floatValue: 0.031,
        paintSeed: 112,
        paintIndex: 449,
        floatRank: null,
        rarity: 6,
        imageUrl: "https://cdn.example.com/poseidon.png",
        screenshotUrl: null,
        inspectUrl: null,
        listingUrl: "https://csfloat.com/item/high",
        hasScreenshot: true,
        stickers: [],
      },
      {
        id: "low",
        marketHashName: "M4A4 | Poseidon (Factory New)",
        itemName: "M4A4 | Poseidon",
        wearName: "Factory New",
        priceCents: 221000,
        referencePriceCents: 235000,
        floatValue: 0.027,
        paintSeed: 113,
        paintIndex: 449,
        floatRank: null,
        rarity: 6,
        imageUrl: "https://cdn.example.com/poseidon.png",
        screenshotUrl: null,
        inspectUrl: null,
        listingUrl: "https://csfloat.com/item/low",
        hasScreenshot: true,
        stickers: [],
      },
    ], new Date("2026-06-05T12:00:00.000Z"));

    expect(items).toEqual([
      expect.objectContaining({
        marketHashName: "M4A4 | Poseidon (Factory New)",
        itemType: "skin",
        imageUrl: "https://cdn.example.com/poseidon.png",
        snapshots: [
          expect.objectContaining({
            provider: "csfloat",
            marketName: "CSFloat",
            askCents: 221000,
            medianCents: 235750,
            askVolume: 2,
            sourceUrl: "https://csfloat.com/item/low",
          }),
        ],
      }),
    ]);
  });

  it("aggregates CSFloat sales rows into daily candles", () => {
    const candles = csFloatSalesToCandles({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      payload: {
        data: [
          { price: 2600, sold_at: "2026-06-04T03:00:00.000Z" },
          { price: 2800, sold_at: "2026-06-04T18:00:00.000Z" },
          { sale_price: 2700, created_at: "2026-06-05T12:00:00.000Z" },
        ],
      },
    });

    expect(candles).toEqual([
      expect.objectContaining({
        marketHashName: "AK-47 | Redline (Field-Tested)",
        provider: "csfloat",
        marketName: "CSFloat",
        interval: "1d",
        openCents: 2600,
        highCents: 2800,
        lowCents: 2600,
        closeCents: 2800,
        volume: 2,
        startsAt: new Date("2026-06-04T00:00:00.000Z"),
      }),
      expect.objectContaining({
        openCents: 2700,
        closeCents: 2700,
        volume: 1,
        startsAt: new Date("2026-06-05T00:00:00.000Z"),
      }),
    ]);
  });
});
