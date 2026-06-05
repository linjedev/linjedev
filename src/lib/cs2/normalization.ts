import type { Cs2MarketRegion } from "@/lib/cs2/types";

const CHINESE_MARKETS = new Set(["buff", "buff163", "BUFF163", "youpin", "YouPin898", "youpin898", "C5Game", "c5"]);

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
  if (lower === "steam") return "Steam";
  if (lower === "c5" || lower === "c5game") return "C5Game";
  if (lower === "buffmarket") return "BUFF.Market";
  if (lower === "dmarket") return "DMarket";
  if (lower === "skinport") return "Skinport";
  if (lower === "waxpeer") return "WAXPEER";
  if (lower === "whitemarket") return "white.market";
  return marketName;
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
  if (marketHashName.startsWith("★") && marketHashName.toLowerCase().includes("gloves")) return "gloves";
  if (marketHashName.startsWith("★")) return "knife";
  if (marketHashName.includes(" | ")) {
    const right = marketHashName.split(" | ")[1];
    if (right && hasSkinExterior(right)) return "skin";
    return "operator";
  }
  if (marketHashName.toLowerCase().includes("case")) return "case";
  if (marketHashName.toLowerCase().includes("capsule")) return "capsule";
  return "sellable";
}

export function inferCategory(marketHashName: string) {
  if (!marketHashName.includes(" | ")) return inferItemType(marketHashName);
  return marketHashName.split(" | ")[0]?.replace("★", "").trim() || null;
}

export function normalizeVariantName(baseName: string, variantName: string) {
  return `${baseName} :: ${variantName}`;
}
