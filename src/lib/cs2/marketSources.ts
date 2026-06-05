import type { Cs2MarketSource } from "@/lib/cs2/types";

const EXTENDED_AGGREGATOR_MARKETS = ["buffmarket", "marketcsgo", "waxpeer", "whitemarket"];
const CS2CAP_FALLBACK_PRICE_SOURCES = ["buff163", "buff163_buy", "youpin", "youpin_buy", "csfloat", "steam", "dmarket", "bitskins", ...EXTENDED_AGGREGATOR_MARKETS];
const PRICEMPIRE_FALLBACK_PRICE_SOURCES = ["buff163", "buff163_buy", "youpin", "youpin_buy", "csfloat", "steam", "dmarket", "bitskins", ...EXTENDED_AGGREGATOR_MARKETS];
const CS2SH_FALLBACK_PRICE_SOURCES = ["buff", "youpin", "csfloat", "skinport", "c5game", "steam", "dmarket", "bitskins"];

function parseCommaList(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  const parsed = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (parsed.length === 0) return fallback;
  return parsed;
}

function normalizeMarketSourceToken(token: string) {
  return token.toLowerCase().replace(/\s+/g, "").trim();
}

function uniqLower(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = normalizeMarketSourceToken(value);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

export const CS2_MARKET_SOURCES: Cs2MarketSource[] = [
  {
    id: "buff",
    name: "BUFF163",
    region: "china",
    role: "anchor",
    homepageUrl: "https://buff.163.com",
    requiresApiKey: true,
    priority: 100,
    coverage: "Primary Chinese liquidity venue and reference pricing anchor.",
  },
  {
    id: "youpin",
    name: "YouPin898",
    region: "china",
    role: "anchor",
    homepageUrl: "https://www.youpin898.com",
    requiresApiKey: true,
    priority: 95,
    coverage: "Major Chinese marketplace; critical second anchor beside BUFF163.",
  },
  {
    id: "c5game",
    name: "C5Game",
    region: "china",
    role: "market",
    homepageUrl: "https://www.c5game.com",
    requiresApiKey: true,
    priority: 92,
    coverage: "Direct Chinese marketplace pricing and buy-order stats by market hash name.",
  },
  {
    id: "cs2sh",
    name: "cs2.sh",
    region: "global",
    role: "aggregator",
    homepageUrl: "https://cs2.sh/docs",
    requiresApiKey: true,
    priority: 90,
    coverage: "BUFF, YouPin, CSFloat, Skinport, Steam, C5Game, live prices, candles, and archives.",
  },
  {
    id: "pricempire",
    name: "Pricempire",
    region: "global",
    role: "aggregator",
    homepageUrl: "https://pricempire.com/docs",
    requiresApiKey: true,
    priority: 89,
    coverage: "China-first price feed across BUFF163, YouPin898, buy orders, images, liquidity metadata, and many western markets.",
  },
  {
    id: "cspriceapi",
    name: "CSPriceAPI",
    region: "global",
    role: "aggregator",
    homepageUrl: "https://cspriceapi.com/docs",
    requiresApiKey: true,
    priority: 87,
    coverage: "Cross-market exact-item search across YouPin, BUFF163, C5Game, Skinport, and more.",
  },
  {
    id: "cs2cap",
    name: "CS2Cap",
    region: "global",
    role: "aggregator",
    homepageUrl: "https://docs.cs2cap.com",
    requiresApiKey: true,
    priority: 88,
    coverage: "Unified API across 40+ marketplaces including BUFF163, YouPin, Steam, CSFloat, DMarket, and Skinport.",
  },
  {
    id: "csfloat",
    name: "CSFloat",
    region: "global",
    role: "market",
    homepageUrl: "https://docs.csfloat.com",
    requiresApiKey: true,
    priority: 72,
    coverage: "Float-aware listings, sales, inspect data, and western liquidity.",
  },
  {
    id: "steam",
    name: "Steam Community Market",
    region: "global",
    role: "market",
    homepageUrl: "https://steamcommunity.com/market",
    requiresApiKey: false,
    priority: 60,
    coverage: "Official marketplace reference, but rate limits and caps make it incomplete for high-end analysis.",
  },
  {
    id: "skinport",
    name: "Skinport",
    region: "europe",
    role: "market",
    homepageUrl: "https://skinport.com",
    requiresApiKey: false,
    priority: 55,
    coverage: "Large bot-based marketplace with public price feeds for common comparisons.",
  },
  {
    id: "dmarket",
    name: "DMarket",
    region: "global",
    role: "market",
    homepageUrl: "https://docs.dmarket.com/v1/swagger.html",
    requiresApiKey: true,
    priority: 50,
    coverage: "Trading API with aggregated market prices and active listings.",
  },
  {
    id: "bitskins",
    name: "BitSkins",
    region: "global",
    role: "market",
    homepageUrl: "https://bitskins.com/docs/api/v2",
    requiresApiKey: true,
    priority: 45,
    coverage: "Direct marketplace API for pricing summaries, market items, and item history.",
  },
  {
    id: "buffmarket",
    name: "BUFF.Market",
    region: "global",
    role: "market",
    homepageUrl: "https://buff.market",
    requiresApiKey: true,
    priority: 44,
    coverage: "Non-China BUFF marketplace pricing through aggregator feeds.",
  },
  {
    id: "marketcsgo",
    name: "Market.CSGO",
    region: "global",
    role: "market",
    homepageUrl: "https://market.csgo.com",
    requiresApiKey: true,
    priority: 43,
    coverage: "Market.CSGO active listing and historical sales coverage through aggregator feeds.",
  },
  {
    id: "waxpeer",
    name: "WAXPEER",
    region: "global",
    role: "market",
    homepageUrl: "https://waxpeer.com",
    requiresApiKey: true,
    priority: 42,
    coverage: "Western marketplace listing prices available through aggregator feeds.",
  },
  {
    id: "whitemarket",
    name: "white.market",
    region: "global",
    role: "market",
    homepageUrl: "https://white.market",
    requiresApiKey: true,
    priority: 41,
    coverage: "white.market listing prices available through aggregator feeds.",
  },
];

export function getConfiguredMarketProviders() {
  const configured = [
    "skinport",
    ...(process.env.CS2SH_API_KEY ? ["cs2.sh"] : []),
    ...(process.env.CS2CAP_API_KEY ? ["cs2cap"] : []),
    ...(process.env.PRICEMPIRE_API_KEY ? ["pricempire"] : []),
    ...(process.env.CSPRICEAPI_API_KEY ? ["cspriceapi"] : []),
    ...(process.env.C5GAME_API_KEY ? ["c5game"] : []),
    ...(process.env.MARKET_CSGO_API_KEY ? ["marketcsgo"] : []),
    ...(process.env.WAXPEER_API_KEY ? ["waxpeer"] : []),
    ...(process.env.CSFLOAT_API_KEY ? ["csfloat"] : []),
    "steam",
    ...(process.env.DMARKET_API_KEY ? ["dmarket"] : []),
    ...(process.env.BITSKINS_API_KEY ? ["bitskins"] : []),
    ...(process.env.CS2CAP_API_KEY || process.env.PRICEMPIRE_API_KEY ? EXTENDED_AGGREGATOR_MARKETS : []),
  ];
  return [...new Set(configured)];
}

export function getConfiguredCs2CapPriceSources() {
  return uniqLower(parseCommaList(process.env.CS2CAP_PRICE_SOURCES, CS2CAP_FALLBACK_PRICE_SOURCES));
}

export function getConfiguredPricempirePriceSources() {
  return uniqLower(parseCommaList(process.env.PRICEMPIRE_PRICE_SOURCES, PRICEMPIRE_FALLBACK_PRICE_SOURCES));
}

export function getConfiguredCs2ShSources() {
  return uniqLower(parseCommaList(process.env.CS2SH_SOURCES, CS2SH_FALLBACK_PRICE_SOURCES));
}

export function listAllSellableMarketSourceNames() {
  return CS2_MARKET_SOURCES.filter((source) => source.region).map((source) => source.name);
}
