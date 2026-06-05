import { describe, expect, it } from "vitest";
import { buildCs2ImageCatalog, getIndexedCs2ImageUrl, resolveCs2ImageUrl } from "@/lib/cs2/imageIndex";

describe("CS2 image index", () => {
  it("returns indexed direct item renders for known sample items", () => {
    const imageUrl = getIndexedCs2ImageUrl("AK-47 | Redline (Field-Tested)");

    expect(imageUrl).toBe("/cs2-images/ak-redline.png");
    expect(imageUrl).not.toContain("/social-images/");
  });

  it("prefers indexed clean renders over candidate social-card URLs", () => {
    const resolved = resolveCs2ImageUrl(
      "Sticker | Crown (Foil)",
      "https://csgoskins.gg/social-images/background-card.png",
    );

    expect(resolved).toBe("/cs2-images/crown-foil.png");
    expect(resolved).not.toContain("/social-images/");
  });

  it("drops social-card candidates when no direct indexed render exists", () => {
    expect(resolveCs2ImageUrl(
      "Unknown Item",
      "https://csgoskins.gg/social-images/background-card.png",
    )).toBeNull();
  });

  it("builds a full image catalog while preferring local transparent renders", () => {
    const catalog = buildCs2ImageCatalog([
      {
        marketHashName: "AK-47 | Redline (Field-Tested)",
        imageUrl: "https://cdn.example.com/ak-redline.png",
      },
      {
        marketHashName: "M4A4 | Poseidon (Factory New)",
        imageUrl: "https://cdn.example.com/m4a4-poseidon.png",
      },
    ]);

    expect(catalog).toContainEqual(expect.objectContaining({
      marketHashName: "AK-47 | Redline (Field-Tested)",
      imageUrl: "/cs2-images/ak-redline.png",
      backgroundRemoved: true,
    }));
    expect(catalog).toContainEqual(expect.objectContaining({
      marketHashName: "M4A4 | Poseidon (Factory New)",
      imageUrl: "https://cdn.example.com/m4a4-poseidon.png",
      backgroundRemoved: false,
    }));
  });
});
