import { describe, expect, it } from "vitest";
import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
  normalizeVariantName,
  toCents,
} from "@/lib/cs2/normalization";

describe("CS2 normalization", () => {
  it("infers sellable item metadata from market hash names", () => {
    expect(inferItemType("AK-47 | Redline (Field-Tested)")).toBe("skin");
    expect(inferItemType("Sticker | Crown (Foil)")).toBe("sticker");
    expect(inferItemType("Sir Bloody Miami Darryl | The Professionals")).toBe("operator");
    expect(inferItemType("Revolution Case")).toBe("case");
    expect(inferItemType("★ Butterfly Knife | Doppler (Factory New)")).toBe("knife");
    expect(inferCategory("AK-47 | Redline (Field-Tested)")).toBe("AK-47");
    expect(inferExterior("AK-47 | Redline (Field-Tested)")).toBe("Field-Tested");
  });

  it("normalizes market names and Chinese market regions", () => {
    expect(normalizeMarketName("buff")).toBe("BUFF163");
    expect(normalizeMarketName("youpin")).toBe("YouPin898");
    expect(inferMarketRegion("BUFF163")).toBe("china");
    expect(inferMarketRegion("CSFloat")).toBe("global");
  });

  it("normalizes prices and provider variants", () => {
    expect(toCents(12.345)).toBe(1235);
    expect(toCents("12.34")).toBeNull();
    expect(normalizeVariantName("M9 Bayonet | Doppler (Factory New)", "Ruby"))
      .toBe("M9 Bayonet | Doppler (Factory New) :: Ruby");
  });
});
