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
const KNOWN_WEAPON_HINTS = [
  "ak-",
  "m4a1",
  "m4a1-s",
  "m4a4",
  "awp",
  "glock",
  "desert eagle",
  "p250",
  "usp",
  "usp-s",
  "fiveseven",
  "five-seven",
  "p2000",
  "p90",
  "mp7",
  "mp9",
  "mp5",
  "mag-7",
  "nova",
  "negev",
  "deagle",
  "aug",
  "sg 553",
  "scar20",
  "galil",
  "g3sg1",
  "xm1014",
  "cz75",
  "r8",
  "tec-9",
  "dual",
  "cz75-a",
  "famas",
  "sawed-off",
  "ssg 08",
  "bizon",
  "mac-10",
  "usps",
];

function startsWithStarPrefix(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith(STAR_PREFIX)
    || trimmed.startsWith("&#9733;")
    || trimmed.startsWith("Ã‚Â·")
    || trimmed.startsWith("Ã¢");
}

export function normalizeMarketHashName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/^\s*&#9733;\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*Ã‚Â·\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*Ã¢\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*\u2605\s*/u, `${STAR_PREFIX} `);
}

function normalizeForWeaponHeuristic(value: string) {
  return normalizeMarketHashName(value).toLowerCase();
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

function containsWeaponHint(value: string) {
  return KNOWN_WEAPON_HINTS.some((keyword) => value.includes(` ${keyword} `) || value.includes(`${keyword} `) || value.includes(` ${keyword}`));
}

function isLikelyOperatorPair(leftSide: string, rightSide: string) {
  if (!leftSide || !rightSide) return false;
  const left = normalizeForWeaponHeuristic(leftSide);
  const right = normalizeForWeaponHeuristic(rightSide);
  if (/\(.*\)/u.test(right)) return false;
  if (containsWeaponHint(left) || containsWeaponHint(right)) return false;
  if (left.includes("case") || right.includes("case")) return false;
  if (left.includes("capsule") || right.includes("capsule")) return false;
  if (left.includes("sticker") || right.includes("sticker")) return false;
  if (left.includes("patch") || right.includes("patch")) return false;
  if (left.includes("charm") || right.includes("charm")) return false;
  if (left.includes("graffiti") || right.includes("graffiti")) return false;
  if (left.includes("music") || right.includes("music")) return false;
  return left.length > 2 && right.length > 2;
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
  if (isLikelyOperatorPair(leftSide ?? "", rightSide ?? "")) return "operator";
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
