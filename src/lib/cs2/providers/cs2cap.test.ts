import { describe, expect, it } from "vitest";
import { flattenCs2CapCandleRows, flattenCs2CapCatalogRows, flattenCs2CapPriceRows } from "@/lib/cs2/providers/cs2cap";

describe("CS2Cap provider normalization", () => {
  it("groups marketplace price rows by item and marks Chinese anchor markets", () => {
    const items = flattenCs2CapPriceRows([
      {
        provider: "buff163",
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        lowest_ask: 2672,
        quantity: 2214,
        link: "https://cs2c.app/r/buff163/123",
        timestamp: "2026-06-04T12:00:00Z",
        last_updated: "2026-06-04T12:01:00Z",
      },
      {
        provider: "csfloat",
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        lowest_ask: 2842,
        quantity: 516,
        link: "https://cs2c.app/r/csfloat/123",
        timestamp: "2026-06-04T12:02:00Z",
        last_updated: "2026-06-04T12:03:00Z",
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].marketHashName).toBe("AK-47 | Redline (Field-Tested)");
    expect(items[0].snapshots).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: "cs2cap",
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 2672,
        askVolume: 2214,
      }),
      expect.objectContaining({
        marketName: "CSFloat",
        marketRegion: "global",
        askCents: 2842,
      }),
    ]));
  });

  it("maps catalog metadata into canonical sellable item rows", () => {
    const items = flattenCs2CapCatalogRows([
      {
        market_hash_name: "AWP | Dragon Lore (Factory New)",
        item_type: "Weapon",
        item_subtype: "Rifles",
        weapon_type: "Sniper Rifle",
        wear_name: "Factory New",
        rarity_name: "Covert",
        collection: "The Cobblestone Collection",
        image_url: "https://cdn.cs2c.app/images/dragon-lore.png",
      },
    ]);

    expect(items[0]).toEqual(expect.objectContaining({
      marketHashName: "AWP | Dragon Lore (Factory New)",
      itemType: "rifles",
      category: "Sniper Rifle",
      rarity: "Covert",
      exterior: "Factory New",
      collection: "The Cobblestone Collection",
      tradable: true,
    }));
  });

  it("maps CS2Cap composite OHLC rows into historical candles", () => {
    const candles = flattenCs2CapCandleRows({
      marketHashName: "Sticker | Crown (Foil)",
      interval: "1d",
      rows: [{
        t: 1773466200,
        o: 1783,
        h: 2529,
        l: 1529,
        c: 1782,
        v: 24,
      }],
    });

    expect(candles[0]).toEqual(expect.objectContaining({
      marketHashName: "Sticker | Crown (Foil)",
      provider: "cs2cap",
      marketName: "Composite",
      interval: "1d",
      openCents: 1783,
      highCents: 2529,
      lowCents: 1529,
      closeCents: 1782,
      volume: 24,
      startsAt: new Date(1773466200 * 1000),
    }));
  });
});
