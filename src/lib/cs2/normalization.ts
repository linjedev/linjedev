import type { Cs2MarketRegion } from "@/lib/cs2/types";

const CHINESE_MARKETS = new Set([
  "buff",
  "buff163",
  "BUFF163",
  "youpin",
  "YouPin898",
  "youpin898",
  "C5Game",
  "c5",
]);

const KNIFE_OR_GLOVE_KEYWORDS = ["knife", "knives", "glove", "gloves"];
const STAR_PREFIX = "\u2605";

function startsWithStarPrefix(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith(STAR_PREFIX)
    || trimmed.startsWith("&#9733;")
    || trimmed.startsWith("Â·")
    || trimmed.startsWith("â");
}

function normalizeMarketHashName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/^\s*&#9733;\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*Â·\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*â\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*\u2605\s*/u, `${STAR_PREFIX} `);
}

function cleanCategoryToken(value: string) {
  return value
    .trim()
    .replace(/^\u2605\s*/u, "")
    .trim();
}

export function toCents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function formatDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export function inferMarketRegion(marketName: string): Cs2MarketRegion {
  return CHINESE_MARKETS.has(marketName) ? "china" : "global";
}

export function normalizeMarketName(marketName: string) {
  const lower = marketName.toLowerCase();
  if (lower === "buff" || lower === "buff163") return "BUFF163";
  if (lower === "youpin" || lower === "youpin898") return "YouPin898";
  if (lower === "csfloat") return "CSFloat";
  if (lower === "cs2.sh") return "CS2.sh";
  if (lower === "steam") return "Steam";
  if (lower === "c5" || lower === "c5game") return "C5Game";
  if (lower === "buffmarket") return "BUFF.Market";
  if (lower === "dmarket") return "DMarket";
  if (lower === "skinport") return "Skinport";
  if (lower === "waxpeer") return "WAXPEER";
  if (lower === "whitemarket") return "white.market";
  if (lower === "bitskins") return "BitSkins";
  return marketName;
}

function categoryPrefixToType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("sticker")) return "sticker";
  if (normalized.includes("patch")) return "patch";
  if (normalized.includes("graffiti")) return "graffiti";
  if (normalized.includes("music kit")) return "music-kit";
  if (normalized.includes("charm")) return "charm";
  if (KNIFE_OR_GLOVE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return normalized.includes("glove") ? "gloves" : "knife";
  }
  if (normalized.includes("operator") || normalized.includes("agent")) return "operator";
  if (normalized.includes("case")) return "case";
  if (normalized.includes("capsule")) return "capsule";
  return null;
}

function hasSkinExterior(marketHashName: string) {
  return /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/.test(marketHashName);
}

export function inferExterior(marketHashName: string) {
  const match = marketHashName.match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/);
  return match?.[1] ?? null;
}

export function inferItemType(marketHashName: string) {
  if (marketHashName.startsWith("Sticker |")) return "sticker";
  if (marketHashName.startsWith("Charm |")) return "charm";
  if (marketHashName.startsWith("Patch |")) return "patch";
  if (marketHashName.startsWith("Graffiti |")) return "graffiti";
  if (marketHashName.startsWith("Music Kit |")) return "music-kit";
  if (marketHashName.startsWith("agent ")) return "operator";

  const normalizedName = normalizeMarketHashName(marketHashName);
  const leftSide = normalizedName.split(" | ")[0];
  const rightSide = normalizedName.split(" | ")[1];

  if (startsWithStarPrefix(marketHashName)) {
    const lower = normalizedName.toLowerCase();
    return lower.includes("glove") || lower.includes("gloves") ? "gloves" : "knife";
  }

  const leftType = leftSide ? categoryPrefixToType(leftSide) : null;
  if (leftType) return leftType;

  const rightType = rightSide ? categoryPrefixToType(rightSide) : null;
  if (rightType) return rightType;

  if (hasSkinExterior(marketHashName)) return "skin";
  if (normalizedName.toLowerCase().includes("knife")) return "knife";
  if (normalizedName.toLowerCase().includes("glove")) return "gloves";
  if (normalizedName.toLowerCase().includes("sticker")) return "sticker";

  return "sellable";
}

export function inferCategory(marketHashName: string) {
  if (!marketHashName.includes(" | ")) return inferItemType(marketHashName);
  return cleanCategoryToken(normalizeMarketHashName(marketHashName).split(" | ")[0]) || null;
}

export function normalizeVariantName(baseName: string, variantName: string) {
  return `${baseName} :: ${variantName}`;
}
