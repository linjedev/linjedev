import { describe, expect, it } from "vitest";
import { flattenMarketCsgoItems } from "@/lib/cs2/providers/marketcsgo";

describe("Market.CSGO provider normalization", () => {
  it("maps exact item search rows into a provider snapshot", () => {
    const items = flattenMarketCsgoItems({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      observedAt: new Date("2026-06-05T10:00:00.000Z"),
      payload: {
        success: true,
        currency: "USD",
        data: [
          {
            market_hash_name: "AK-47 | Redline (Field-Tested)",
            price: 29900,
            count: 47,
          },
        ],
      },
    });

    expect(items).toEqual([
      expect.objectContaining({
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        exterior: "Field-Tested",
        snapshots: [
          expect.objectContaining({
            provider: "marketcsgo",
            marketName: "Market.CSGO",
            marketRegion: "global",
            askCents: 2990,
            askVolume: 47,
          }),
        ],
      }),
    ]);
  });

  it("chooses the lowest ask from list endpoint rows", () => {
    const items = flattenMarketCsgoItems({
      marketHashName: "Sticker | Crown (Foil)",
      payload: {
        success: true,
        currency: "USD",
        data: {
          "Sticker | Crown (Foil)": [
            { market_hash_name: "Sticker | Crown (Foil)", price: "999000" },
            { market_hash_name: "Sticker | Crown (Foil)", price: "950000" },
          ],
        },
      },
    });

    expect(items[0].snapshots[0]).toEqual(expect.objectContaining({
      askCents: 95000,
      askVolume: 2,
    }));
  });

  it("skips unsuccessful or unsupported-currency payloads", () => {
    expect(flattenMarketCsgoItems({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      payload: { success: false, data: [] },
    })).toEqual([]);
    expect(flattenMarketCsgoItems({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      payload: {
        success: true,
        currency: "RUB",
        data: [{ market_hash_name: "AK-47 | Redline (Field-Tested)", price: 29900 }],
      },
    })).toEqual([]);
  });
});
