import { describe, expect, it } from "vitest";
import { flattenSkinportItems } from "@/lib/cs2/providers/skinport";

describe("Skinport provider normalization", () => {
  it("maps public item rows into normalized latest-price snapshots", () => {
    const items = flattenSkinportItems([
      {
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        suggested_price: 32.42,
        median_price: 31.55,
        min_price: 29.9,
        quantity: 47,
        item_page: "https://skinport.com/item/csgo/ak-47-redline-field-tested",
        image: "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWw",
        updated_at: "2026-06-05T10:15:00.000Z",
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      category: "AK-47",
      exterior: "Field-Tested",
      tradable: true,
      imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWw",
    }));
    expect(items[0].snapshots).toEqual([
      expect.objectContaining({
        provider: "skinport",
        marketName: "Skinport",
        marketRegion: "global",
        askCents: 2990,
        medianCents: 3155,
        askVolume: 47,
        observedAt: new Date("2026-06-05T10:15:00.000Z"),
        sourceUrl: "https://skinport.com/item/csgo/ak-47-redline-field-tested",
      }),
    ]);
  });

  it("skips invalid rows and respects limits", () => {
    const items = flattenSkinportItems([
      { min_price: 12 },
      { market_hash_name: "Sticker | Crown (Foil)", min_price: 740.25 },
      { market_hash_name: "Operation Bravo Case", min_price: 55.1 },
    ], 1);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({
      marketHashName: "Sticker | Crown (Foil)",
      itemType: "sticker",
    }));
  });
});
