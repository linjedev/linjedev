import { describe, expect, it } from "vitest";
import { flattenBitSkinsItems } from "@/lib/cs2/providers/bitskins";

describe("BitSkins provider normalization", () => {
  it("maps public insell rows into normalized latest-price snapshots", () => {
    const items = flattenBitSkinsItems({
      list: [
        {
          skin_id: 24360,
          name: "AK-47 | Olive Polycam (Field-Tested)",
          price_min: 130,
          price_max: 12754,
          price_avg: 1035,
          quantity: 14,
        },
      ],
    }, {
      observedAt: new Date("2026-06-05T12:00:00.000Z"),
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Olive Polycam (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      exterior: "Field-Tested",
      imageUrl: null,
      tradable: true,
    }));
    expect(items[0].snapshots).toEqual([
      expect.objectContaining({
        provider: "bitskins",
        marketName: "BitSkins",
        marketRegion: "global",
        askCents: 130,
        medianCents: 1035,
        askVolume: 14,
        observedAt: new Date("2026-06-05T12:00:00.000Z"),
        sourceUrl: "https://bitskins.com/market/cs2?search=AK-47%20%7C%20Olive%20Polycam%20(Field-Tested)",
      }),
    ]);
  });

  it("filters exact names, query matches, invalid rows, and limits", () => {
    const items = flattenBitSkinsItems({
      list: [
        { price_min: 100 },
        { name: "Sticker | Crown (Foil)", price_min: 74025, quantity: 1 },
        { name: "Operation Bravo Case", price_min: 5510, quantity: 2 },
      ],
    }, {
      query: "case",
      limit: 1,
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({
      marketHashName: "Operation Bravo Case",
      itemType: "case",
    }));

    expect(flattenBitSkinsItems({
      list: [
        { name: "Sticker | Crown (Foil)", price_min: 74025 },
        { name: "Operation Bravo Case", price_min: 5510 },
      ],
    }, {
      marketHashNames: ["Sticker | Crown (Foil)"],
    }).map((item) => item.marketHashName)).toEqual(["Sticker | Crown (Foil)"]);
  });
});
