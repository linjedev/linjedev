import { afterEach, describe, expect, it, vi } from "vitest";

describe("CS2 item metadata service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("flattens grouped CSGO-API all-item payloads into sellable metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        skins: [
          {
            market_hash_name: "AK-47 | Redline (Field-Tested)",
            image: "https://cdn.example.com/ak.png",
            rarity: { name: "Classified" },
            collections: [{ name: "The Phoenix Collection" }],
          },
        ],
        keychains: [
          {
            market_hash_name: "Charm | Semi-Precious",
            image: "https://cdn.example.com/charm.png",
            rarity: { name: "Remarkable" },
          },
        ],
        crates: [
          {
            market_hash_name: "Revolution Case",
            image: "https://cdn.example.com/case.png",
          },
        ],
        keys: [
          {
            market_hash_name: "Revolution Case Key",
            image: "https://cdn.example.com/key.png",
          },
        ],
      }),
    }));

    const { getCs2ItemMetadataCatalogWithTotal } = await import("@/lib/cs2/itemMetadataService");

    const catalog = await getCs2ItemMetadataCatalogWithTotal({});

    expect(catalog.total).toBe(4);
    expect(catalog.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "skins",
        collection: "The Phoenix Collection",
      }),
      expect.objectContaining({
        marketHashName: "Charm | Semi-Precious",
        itemType: "charm",
        category: "keychains",
      }),
      expect.objectContaining({
        marketHashName: "Revolution Case",
        itemType: "case",
        category: "crates",
      }),
      expect.objectContaining({
        marketHashName: "Revolution Case Key",
        itemType: "key",
        category: "keys",
      }),
    ]));
  });

  it("keeps search and item-type filters working over grouped metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        agents: [
          { market_hash_name: "Sir Bloody Miami Darryl | The Professionals", image: null },
        ],
        patches: [
          { market_hash_name: "Patch | Metal Legendary Eagle Master", image: null },
        ],
      }),
    }));

    const { getCs2ItemMetadataCatalogWithTotal } = await import("@/lib/cs2/itemMetadataService");

    const catalog = await getCs2ItemMetadataCatalogWithTotal({
      query: "miami professionals",
      itemType: "operator",
    });

    expect(catalog.total).toBe(1);
    expect(catalog.items[0]).toEqual(expect.objectContaining({
      marketHashName: "Sir Bloody Miami Darryl | The Professionals",
      itemType: "operator",
    }));
  });
});
