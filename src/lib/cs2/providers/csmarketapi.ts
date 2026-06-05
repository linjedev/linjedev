import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
  toCents,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const CSMARKETAPI_BASE_URL = process.env.CSMARKETAPI_BASE_URL ?? "https://api.csmarketapi.com";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_MAX_AGE = "PT10M";
const MARKET_NAME_MAP: Record<string, string> = {
  STEAMCOMMUNITY: "Steam",
  BUFFMARKET: "BUFF.Market",
  SKINS: "Skins",
  SKINPORT: "Skinport",
  MARKETCSGO: "Market.CSGO",
  DMARKET: "DMarket",
  GAMERPAYGG: "GamerPay",
  CSDEALS: "CS.Deals",
  SKINBARON: "SkinBaron",
  CSFLOAT: "CSFloat",
  CSMONEY: "CS.MONEY",
  WHITEMARKET: "white.market",
};

function apiKey() {
  const key = process.env.CSMARKETAPI_API_KEY;
  if (!key) throw new Error("CSMARKETAPI_API_KEY is required for CSMarketAPI sync.");
  return key;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function marketDisplayName(value: unknown) {
  const token = readString(value);
  if (!token) return null;
  return MARKET_NAME_MAP[token] ?? normalizeMarketName(token.toLowerCase());
}

function parseTimestamp(value: unknown) {
  const raw = readString(value);
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function csMarketApiListingToSnapshot(row: Record<string, unknown>): ProviderSnapshotInput | null {
  const marketName = marketDisplayName(row.market);
  if (!marketName) return null;

  return {
    provider: "csmarketapi",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: toCents(readNumber(row.min_price)),
    bidCents: null,
    medianCents: toCents(readNumber(row.median_price) ?? readNumber(row.mean_price)),
    askVolume: readNumber(row.listings),
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: null,
    observedAt: parseTimestamp(row.timestamp),
    sourceUrl: readString(row.market_link) ?? undefined,
    raw: row,
  };
}

export function csMarketApiLatestToProviderItem(payload: unknown): ProviderItemInput | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const marketHashName = readString(record.market_hash_name);
  if (!marketHashName) return null;
  const listings = Array.isArray(record.listings) ? record.listings : [];
  const snapshots = listings
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map(csMarketApiListingToSnapshot)
    .filter((snapshot): snapshot is ProviderSnapshotInput => snapshot !== null);

  return {
    marketHashName,
    itemType: inferItemType(marketHashName),
    category: inferCategory(marketHashName),
    rarity: null,
    exterior: inferExterior(marketHashName),
    collection: null,
    imageUrl: null,
    tradable: true,
    snapshots,
  };
}

export function csMarketApiHistoryToCandles(params: {
  marketHashName: string;
  payload: unknown;
}) {
  const days = Array.isArray(params.payload) ? params.payload : [];
  const candles: ProviderCandleInput[] = [];

  for (const dayRow of days) {
    if (typeof dayRow !== "object" || dayRow === null) continue;
    const dayRecord = dayRow as Record<string, unknown>;
    const day = readString(dayRecord.day);
    const sales = Array.isArray(dayRecord.sales) ? dayRecord.sales : [];
    if (!day) continue;
    for (const sale of sales) {
      if (typeof sale !== "object" || sale === null) continue;
      const saleRecord = sale as Record<string, unknown>;
      const marketName = marketDisplayName(saleRecord.market);
      const closeCents = toCents(readNumber(saleRecord.median_price) ?? readNumber(saleRecord.mean_price) ?? readNumber(saleRecord.min_price));
      if (!marketName || closeCents === null) continue;
      candles.push({
        marketHashName: params.marketHashName,
        provider: "csmarketapi",
        marketName,
        interval: "1d",
        openCents: toCents(readNumber(saleRecord.min_price)) ?? closeCents,
        highCents: toCents(readNumber(saleRecord.max_price)) ?? closeCents,
        lowCents: toCents(readNumber(saleRecord.min_price)) ?? closeCents,
        closeCents,
        volume: readNumber(saleRecord.volume),
        startsAt: new Date(`${day}T00:00:00.000Z`),
      });
    }
  }

  return candles;
}

export async function fetchCsMarketApiLatestItems(params: {
  marketHashNames: string[];
  markets?: string[];
  maxAge?: string;
  currency?: string;
  limit?: number;
}) {
  const marketHashNames = [...new Set(params.marketHashNames.map((name) => name.trim()).filter(Boolean))].slice(0, params.limit);
  const items = await Promise.all(marketHashNames.map(async (marketHashName) => {
    const url = new URL(`${CSMARKETAPI_BASE_URL}/v1/listings/latest/aggregate`);
    url.searchParams.set("key", apiKey());
    url.searchParams.set("market_hash_name", marketHashName);
    url.searchParams.set("currency", params.currency ?? DEFAULT_CURRENCY);
    url.searchParams.set("max_age", params.maxAge ?? DEFAULT_MAX_AGE);
    for (const market of params.markets ?? []) url.searchParams.append("markets", market);

    const response = await fetch(url, { next: { revalidate: 120 } });
    if (!response.ok) throw new Error(`CSMarketAPI latest aggregate returned ${response.status}`);
    return csMarketApiLatestToProviderItem(await response.json());
  }));

  return items.filter((item): item is ProviderItemInput => item !== null);
}

export async function fetchCsMarketApiHistory(params: {
  marketHashNames: string[];
  markets?: string[];
  start?: string;
  end?: string;
  currency?: string;
}) {
  const candles = await Promise.all(params.marketHashNames.map(async (marketHashName) => {
    const url = new URL(`${CSMARKETAPI_BASE_URL}/v1/sales/history/aggregate`);
    url.searchParams.set("key", apiKey());
    url.searchParams.set("market_hash_name", marketHashName);
    url.searchParams.set("currency", params.currency ?? DEFAULT_CURRENCY);
    if (params.start) url.searchParams.set("start", params.start);
    if (params.end) url.searchParams.set("end", params.end);
    for (const market of params.markets ?? []) url.searchParams.append("markets", market);

    const response = await fetch(url, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`CSMarketAPI history aggregate returned ${response.status}`);
    return csMarketApiHistoryToCandles({
      marketHashName,
      payload: await response.json(),
    });
  }));

  return candles.flat();
}
