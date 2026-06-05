import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketHashName,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const CSPRICEAPI_BASE_URL = process.env.CSPRICEAPI_BASE_URL ?? "https://api.cspriceapi.com";
const DEFAULT_CNY_TO_USD_RATE = 0.139;

type CsPriceSearchItem = {
  market_hash_name?: unknown;
  price?: unknown;
  price_rmb?: unknown;
  count?: unknown;
  updated_at?: unknown;
  item_page_url?: unknown;
  liquidity?: unknown;
};

type CsPriceSearchResponse = {
  is_doppler?: boolean;
  data?: Record<string, unknown>;
};

function getApiKey() {
  const apiKey = process.env.CSPRICEAPI_API_KEY;
  if (!apiKey) throw new Error("CSPRICEAPI_API_KEY is required for CSPriceAPI sync.");
  return apiKey;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function readUsdPerCny() {
  const envRate = Number(process.env.CSPRICEAPI_CNY_TO_USD_RATE ?? "");
  if (Number.isFinite(envRate) && envRate > 0) return envRate;

  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=CNY&to=USD", {
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`FX rate returned ${response.status}`);
    const payload = await response.json() as { rates?: Record<string, unknown> };
    const rate = readNumber(payload.rates?.USD);
    if (rate && rate > 0) return rate;
  } catch {
    // fall back below
  }

  return DEFAULT_CNY_TO_USD_RATE;
}

function cnyToUsdCents(value: number | null, usdPerCny: number) {
  if (value === null) return null;
  return Math.round(value * usdPerCny * 100);
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function rowToSnapshot(params: {
  providerKey: "buff163" | "youpin" | "c5game";
  row: CsPriceSearchItem;
  usdPerCny: number;
}): ProviderSnapshotInput | null {
  const marketHashName = readString(params.row.market_hash_name);
  if (!marketHashName) return null;
  const marketName = normalizeMarketName(params.providerKey);
  return {
    provider: "cspriceapi",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: cnyToUsdCents(readNumber(params.row.price) ?? readNumber(params.row.price_rmb), params.usdPerCny),
    bidCents: null,
    medianCents: null,
    askVolume: readNumber(params.row.count),
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: readNumber(params.row.liquidity),
    observedAt: parseDate(params.row.updated_at),
    sourceUrl: readString(params.row.item_page_url) ?? undefined,
    raw: {
      source: params.providerKey,
      price: params.row.price,
      price_rmb: params.row.price_rmb,
      count: params.row.count,
      liquidity: params.row.liquidity,
      updated_at: params.row.updated_at,
    },
  };
}

export function flattenCsPriceSearchResult(params: {
  marketHashName: string;
  data: Record<string, unknown>;
  usdPerCny: number;
}) {
  const snapshots: ProviderSnapshotInput[] = [];
  for (const providerKey of ["buff163", "youpin", "c5game"] as const) {
    const value = params.data[providerKey];
    if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
    const snapshot = rowToSnapshot({
      providerKey,
      row: value as CsPriceSearchItem,
      usdPerCny: params.usdPerCny,
    });
    if (snapshot) snapshots.push(snapshot);
  }

  if (snapshots.length === 0) return null;

  return {
    marketHashName: normalizeMarketHashName(params.marketHashName),
    itemType: inferItemType(params.marketHashName),
    category: inferCategory(params.marketHashName),
    rarity: null,
    exterior: inferExterior(params.marketHashName),
    collection: null,
    imageUrl: null,
    tradable: true,
    snapshots,
  } satisfies ProviderItemInput;
}

async function fetchSearchRow(marketHashName: string) {
  const url = new URL("/v1/prices/search", CSPRICEAPI_BASE_URL);
  url.searchParams.set("market_hash_name", marketHashName);
  const response = await fetch(url, {
    headers: {
      "x-api-key": getApiKey(),
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) throw new Error(`CSPriceAPI /v1/prices/search returned ${response.status}`);
  return await response.json() as CsPriceSearchResponse;
}

export async function fetchCsPriceApiLatestItems(params: {
  marketHashNames?: string[];
  limit?: number;
}) {
  const marketHashNames = [...new Set((params.marketHashNames ?? []).map((name) => normalizeMarketHashName(name).trim()).filter(Boolean))];
  if (marketHashNames.length === 0) return [];

  const usdPerCny = await readUsdPerCny();
  const items: ProviderItemInput[] = [];
  for (const marketHashName of marketHashNames.slice(0, params.limit ?? marketHashNames.length)) {
    const payload = await fetchSearchRow(marketHashName);
    if (payload.is_doppler) continue;
    if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) continue;
    const item = flattenCsPriceSearchResult({
      marketHashName,
      data: payload.data as Record<string, unknown>,
      usdPerCny,
    });
    if (item) items.push(item);
  }
  return items;
}
