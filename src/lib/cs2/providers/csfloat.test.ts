import { describe, expect, it } from "vitest";
import { flattenCsFloatListings } from "@/lib/cs2/providers/csfloat";

describe("CSFloat listing normalization", () => {
  it("maps listing asset float, paint, image, and sticker data", () => {
    const listings = flattenCsFloatListings([{
      id: "324288155723370196",
      price: 221000,
      item: {
        market_hash_name: "M4A4 | Poseidon (Factory New)",
        item_name: "M4A4 | Poseidon",
        wear_name: "Factory New",
        float_value: 0.02796577662229538,
        paint_seed: 112,
        paint_index: 449,
        icon_url: "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZ",
        inspect_link: "steam://inspect",
        has_screenshot: true,
        scm: { price: 236500 },
        stickers: [{
          name: "Sticker | Team EnVyUs (Holo) | MLG Columbus 2016",
          slot: 3,
          icon_url: "columbus2016/nv_holo.png",
        }],
      },
    }]);

    expect(listings[0]).toEqual(expect.objectContaining({
      id: "324288155723370196",
      marketHashName: "M4A4 | Poseidon (Factory New)",
      priceCents: 221000,
      referencePriceCents: 236500,
      floatValue: 0.02796577662229538,
      paintSeed: 112,
      paintIndex: 449,
      hasScreenshot: true,
    }));
    expect(listings[0].imageUrl).toContain("community.fastly.steamstatic.com/economy/image");
    expect(listings[0].stickers[0]).toEqual(expect.objectContaining({
      name: "Sticker | Team EnVyUs (Holo) | MLG Columbus 2016",
      slot: 3,
    }));
  });
});
