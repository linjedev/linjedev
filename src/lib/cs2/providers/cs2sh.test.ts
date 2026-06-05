import { describe, expect, it } from "vitest";
import { flattenLatestItems } from "@/lib/cs2/providers/cs2sh";

describe("cs2.sh provider normalization", () => {
  it("flattens latest item payloads and variant payloads into provider items", () => {
    const items = flattenLatestItems({
      "AK-47 | Redline (Field-Tested)": {
        market_hash_name: "AK-47 | Redline (Field-Tested)",
        buff: {
          ask: 26.72,
          ask_volume: 2214,
          bid: 26.1,
          bid_volume: 402,
          collected_at: "2026-06-04T12:00:00Z",
        },
        csfloat: {
          ask: 28.42,
          ask_volume: 516,
          collected_at: "2026-06-04T12:01:00Z",
        },
        variants: {
          "low float": {
            buff: {
              ask: 32,
              ask_volume: 12,
              collected_at: "2026-06-04T12:02:00Z",
            },
          },
        },
      },
    });

    expect(items).toHaveLength(2);
    expect(items[0].marketHashName).toBe("AK-47 | Redline (Field-Tested)");
    expect(items[0].snapshots).toEqual(expect.arrayContaining([
      expect.objectContaining({
        marketName: "BUFF163",
        marketRegion: "china",
        askCents: 2672,
      }),
      expect.objectContaining({
        marketName: "CSFloat",
        marketRegion: "global",
        askCents: 2842,
      }),
    ]));
    expect(items[1].marketHashName).toBe("AK-47 | Redline (Field-Tested) :: low float");
    expect(items[1].snapshots[0]).toEqual(expect.objectContaining({
      marketName: "BUFF163",
      askCents: 3200,
    }));
  });

  it("honors a sync item limit after variant expansion", () => {
    const items = flattenLatestItems({
      "Sticker | Crown (Foil)": {
        buff: { ask: 895.4, collected_at: "2026-06-04T12:00:00Z" },
      },
      "Revolution Case": {
        steam: { ask: 1.2, collected_at: "2026-06-04T12:00:00Z" },
      },
    }, 1);

    expect(items).toHaveLength(1);
    expect(items[0].marketHashName).toBe("Sticker | Crown (Foil)");
  });
});
