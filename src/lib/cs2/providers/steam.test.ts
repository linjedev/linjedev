import { describe, expect, it } from "vitest";
import { steamPriceOverviewToInput } from "@/lib/cs2/providers/steam";

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
});
