import { describe, expect, it } from "vitest";
import { flattenWaxpeerPriceRows } from "@/lib/cs2/providers/waxpeer";

describe("WAXPEER provider normalization", () => {
  it("maps exact price rows into latest snapshots", () => {
    const items = flattenWaxpeerPriceRows({
      requestedName: "★ Butterfly Knife | Doppler (Factory New)",
      payload: {
        success: true,
        items: [
          {
            name: "★ Butterfly Knife | Doppler (Factory New)",
            item_id: "27253164358",
            price: "1380000",
            highest_offer: "1325000",
            steam_price: "1453040",
            count: 4,
            img: "https://steamcommunity-a.akamaihd.net/economy/image/class/730/5070448210/200fx125f",
            weapon: "Butterfly Knife",
            paint_index: 420,
            float: 0.0460052728652954,
          },
        ],
      },
    });

    expect(items).toEqual([
      expect.objectContaining({
        marketHashName: "★ Butterfly Knife | Doppler (Factory New)",
        itemType: "knife",
        category: "Butterfly Knife",
        exterior: "Factory New",
        imageUrl: "https://steamcommunity-a.akamaihd.net/economy/image/class/730/5070448210/200fx125f",
        snapshots: [
          expect.objectContaining({
            provider: "waxpeer",
            marketName: "WAXPEER",
            askCents: 138000,
            bidCents: 132500,
            medianCents: 145304,
            askVolume: 4,
          }),
        ],
      }),
    ]);
  });

  it("chooses the cheapest exact row when search returns multiple rows", () => {
    const items = flattenWaxpeerPriceRows({
      requestedName: "AK-47 | Redline (Field-Tested)",
      payload: {
        success: true,
        items: [
          { name: "AK-47 | Redline (Field-Tested)", price: "31000" },
          { name: "AK-47 | Redline (Field-Tested)", price: "29900" },
          { name: "AK-47 | Redline (Minimal Wear)", price: "62000" },
        ],
      },
    });

    expect(items).toHaveLength(1);
    expect(items[0].marketHashName).toBe("AK-47 | Redline (Field-Tested)");
    expect(items[0].snapshots[0].askCents).toBe(2990);
  });

  it("skips unsuccessful payloads", () => {
    expect(flattenWaxpeerPriceRows({
      requestedName: "AK-47 | Redline (Field-Tested)",
      payload: { success: false, items: [] },
    })).toEqual([]);
  });
});
