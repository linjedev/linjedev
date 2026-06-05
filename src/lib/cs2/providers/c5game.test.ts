import { describe, expect, it } from "vitest";
import { flattenC5GameStats } from "@/lib/cs2/providers/c5game";

describe("C5Game provider", () => {
  it("normalizes C5Game item stats into China-market snapshots in USD cents", () => {
    const items = flattenC5GameStats({
      usdPerCny: 0.14,
      statsByName: {
        "AK-47 | Redline (Field-Tested)": {
          marketHashName: "AK-47 | Redline (Field-Tested)",
          itemId: 42,
          sellPrice: 10000,
          sellCount: 12,
          purchaseMaxPrice: 9800,
          purchaseCount: 5,
          temporaryRental: 1,
          permanentRental: 2,
        },
      },
      survivalByName: {
        "AK-47 | Redline (Field-Tested)": 5000,
      },
    });

    expect(items).toEqual([
      expect.objectContaining({
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        snapshots: [
          expect.objectContaining({
            provider: "c5game",
            marketName: "C5Game",
            marketRegion: "china",
            askCents: 1400,
            bidCents: 1372,
            askVolume: 12,
            bidVolume: 5,
            liquidityScore: 20,
            raw: expect.objectContaining({
              survivalCount: 5000,
              currency: "CNY",
              usdPerCny: 0.14,
            }),
          }),
        ],
      }),
    ]);
  });
});
