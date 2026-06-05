import { describe, expect, it } from "vitest";
import { flattenDMarketItems } from "@/lib/cs2/providers/dmarket";

describe("DMarket provider normalization", () => {
  it("groups market offers into lowest-ask snapshots", () => {
    const items = flattenDMarketItems({
      objects: [
        {
          title: "AK-47 | Redline (Field-Tested)",
          image: "https://steamcommunity-a.akamaihd.net/economy/image/redline",
          price: { USD: "11500" },
          suggestedPrice: { USD: "4326" },
          createdAt: 1768317425,
          extra: {
            quality: "classified",
            tradable: true,
          },
        },
        {
          title: "AK-47 | Redline (Field-Tested)",
          image: "https://steamcommunity-a.akamaihd.net/economy/image/redline-expensive",
          price: { USD: "34999" },
          suggestedPrice: { USD: "4326" },
          createdAt: 1768317430,
          extra: {
            quality: "classified",
            tradable: true,
          },
        },
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      rarity: "classified",
      exterior: "Field-Tested",
      imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/redline",
      tradable: true,
    }));
    expect(items[0].snapshots).toEqual([
      expect.objectContaining({
        provider: "dmarket",
        marketName: "DMarket",
        marketRegion: "global",
        askCents: 11500,
        medianCents: 4326,
        askVolume: 2,
        observedAt: new Date(1768317425 * 1000),
        sourceUrl: "https://dmarket.com/ingame-items/item-list/csgo-skins?title=AK-47%20%7C%20Redline%20(Field-Tested)",
      }),
    ]);
  });

  it("filters exact names, query matches, invalid rows, and limits", () => {
    const items = flattenDMarketItems({
      objects: [
        { price: { USD: "100" } },
        { title: "Sticker | Crown (Foil)", price: { USD: "74025" } },
        { title: "Operation Bravo Case", price: { USD: "5510" } },
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

    expect(flattenDMarketItems({
      objects: [
        { title: "Sticker | Crown (Foil)", price: { USD: "74025" } },
        { title: "Operation Bravo Case", price: { USD: "5510" } },
      ],
    }, {
      marketHashNames: ["Sticker | Crown (Foil)"],
    }).map((item) => item.marketHashName)).toEqual(["Sticker | Crown (Foil)"]);
  });
});
