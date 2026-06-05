import { describe, expect, it } from "vitest";
import { flattenCsPriceSearchResult } from "@/lib/cs2/providers/cspriceapi";

describe("CSPriceAPI provider", () => {
  it("normalizes exact-item cross-market China search results", () => {
    const item = flattenCsPriceSearchResult({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      usdPerCny: 0.14,
      data: {
        buff163: {
          market_hash_name: "AK-47 | Redline (Field-Tested)",
          price: "140.00",
          count: 12,
          updated_at: "2026-06-05T12:00:00.000Z",
          item_page_url: "https://buff.163.com/goods/1",
          liquidity: "8.7",
        },
        youpin: {
          market_hash_name: "AK-47 | Redline (Field-Tested)",
          price_rmb: "138.00",
          count: 9,
          updated_at: "2026-06-05T12:00:00.000Z",
          item_page_url: "https://www.youpin898.com/goods/2",
          liquidity: "7.9",
        },
      },
    });

    expect(item).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      snapshots: expect.arrayContaining([
        expect.objectContaining({
          provider: "cspriceapi",
          marketName: "BUFF163",
          askCents: 1960,
          askVolume: 12,
        }),
        expect.objectContaining({
          provider: "cspriceapi",
          marketName: "YouPin898",
          askCents: 1932,
          askVolume: 9,
        }),
      ]),
    }));
  });
});
