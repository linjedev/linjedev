import type { Cs2MarketSource } from "@/lib/cs2/types";

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
];

export function getConfiguredMarketProviders() {
  const configured = ["Skinport"];
  if (process.env.CS2SH_API_KEY) configured.push("cs2.sh");
  if (process.env.PRICEMPIRE_API_KEY) configured.push("Pricempire");
  if (process.env.CS2CAP_API_KEY) configured.push("CS2Cap");
  if (process.env.CSFLOAT_API_KEY) configured.push("CSFloat");
  if (process.env.STEAM_WEB_API_KEY) configured.push("Steam");
  if (process.env.DMARKET_API_KEY) configured.push("DMarket");
  if (process.env.BITSKINS_API_KEY) configured.push("BitSkins");
  return configured;
}
