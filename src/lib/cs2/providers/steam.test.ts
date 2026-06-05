import { describe, expect, it } from "vitest";
import { steamPriceHistoryToCandles, steamPriceOverviewToInput } from "@/lib/cs2/providers/steam";

describe("Steam CS2 market provider", () => {
  it("maps priceoverview payloads into exact-item snapshots", () => {
    const item = steamPriceOverviewToInput({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      observedAt: new Date("2026-06-05T12:00:00.000Z"),
      payload: {
        success: true,
        lowest_price: "$26.72",
        median_price: "$27.91",
        volume: "1,234",
      },
    });

    expect(item).toEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      itemType: "skin",
      exterior: "Field-Tested",
      snapshots: [
        expect.objectContaining({
          provider: "steam",
          marketName: "Steam",
          askCents: 2672,
          medianCents: 2791,
          askVolume: 1234,
          observedAt: new Date("2026-06-05T12:00:00.000Z"),
        }),
      ],
    }));
  });

  it("skips failed or empty priceoverview payloads", () => {
    expect(steamPriceOverviewToInput({
      marketHashName: "Sticker | Crown (Foil)",
      payload: { success: false },
    })).toBeNull();
    expect(steamPriceOverviewToInput({
      marketHashName: "Sticker | Crown (Foil)",
      payload: { success: true, volume: "10" },
    })).toBeNull();
  });

  it("maps Steam pricehistory rows into daily candles", () => {
    const candles = steamPriceHistoryToCandles({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      payload: {
        success: true,
        prices: [
          ["Jun 04 2026 01: +0", "$26.72", "12"],
          ["Jun 04 2026 18: +0", "27.10", "8"],
          ["Jun 05 2026 01: +0", "27.91", "4"],
        ],
      },
    });

    expect(candles).toEqual([
      expect.objectContaining({
        marketHashName: "AK-47 | Redline (Field-Tested)",
        provider: "steam",
        marketName: "Steam",
        interval: "1d",
        openCents: 2672,
        highCents: 2710,
        lowCents: 2672,
        closeCents: 2710,
        volume: 20,
        startsAt: new Date("2026-06-04T00:00:00.000Z"),
      }),
      expect.objectContaining({
        openCents: 2791,
        closeCents: 2791,
        volume: 4,
        startsAt: new Date("2026-06-05T00:00:00.000Z"),
      }),
    ]);
  });
});
