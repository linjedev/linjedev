import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketHashName,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";
import type { Cs2FloatListingView } from "@/lib/cs2/types";

const MARKET_CSGO_BASE_URL = process.env.MARKET_CSGO_API_BASE ?? "https://market.csgo.com";
const BATCH_LIMIT = 50;
const DEFAULT_RUB_TO_USD_RATE = 0.0112;

function getApiKey() {
  const apiKey = process.env.MARKET_CSGO_API_KEY;
  if (!apiKey) throw new Error("MARKET_CSGO_API_KEY is required for Market.CSGO sync.");
  return apiKey;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function readIdentifier(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return readString(value);
}

function chunkValues(values: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dayStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function marketCsgoPriceToUsdCents(value: unknown, currency: unknown) {
  const price = readNumber(value);
  if (price === null) return null;
  const normalizedCurrency = (readString(currency) ?? "USD").toUpperCase();
  if (normalizedCurrency !== "USD") return null;
  return Math.round(price / 10);
}

function marketCsgoHistoryPriceToUsdCents(value: unknown, currency: unknown, rubToUsdRate: number) {
  const price = readNumber(value);
  if (price === null) return null;
  const normalizedCurrency = (readString(currency) ?? "USD").toUpperCase();
  if (normalizedCurrency === "USD") return Math.round(price * 100);
  if (normalizedCurrency === "RUB") return Math.round(price * rubToUsdRate * 100);
  return null;
}

function normalizeMarketCsgoRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
  }
  if (typeof value !== "object" || value === null) return [];
  return Object.values(value).flatMap((entry) => normalizeMarketCsgoRows(entry));
}

function rowAskCents(row: Record<string, unknown>, currency: unknown) {
  return marketCsgoPriceToUsdCents(row.price ?? row.price_usd ?? row.priceUsd, currency);
}

function chooseBestAsk(rows: Record<string, unknown>[], currency: unknown) {
  return rows
    .map((row) => ({ row, askCents: rowAskCents(row, currency) }))
    .filter((entry): entry is { row: Record<string, unknown>; askCents: number } => entry.askCents !== null)
    .sort((left, right) => left.askCents - right.askCents)[0] ?? null;
}

function readObject(value: unknown) {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function marketCsgoRowToFloatListing(params: {
  row: Record<string, unknown>;
  marketHashName: string;
  currency: unknown;
}) {
  const extra = readObject(params.row.extra);
  const listingId = readIdentifier(params.row.id) ?? `${params.marketHashName}-${readIdentifier(params.row.class) ?? "listing"}`;
  const floatValue = readNumber(extra?.float);
  const stickerIds = readString(extra?.stickers)?.split("|").map((value) => value.trim()).filter(Boolean) ?? [];

  const listing: Cs2FloatListingView = {
    id: `marketcsgo-${listingId}`,
    marketHashName: readString(params.row.market_hash_name) ?? params.marketHashName,
    itemName: null,
    wearName: inferExterior(params.marketHashName),
    priceCents: marketCsgoPriceToUsdCents(params.row.price, params.currency),
    referencePriceCents: null,
    floatValue,
    paintSeed: null,
    paintIndex: null,
    floatRank: null,
    rarity: null,
    imageUrl: null,
    screenshotUrl: null,
    inspectUrl: null,
    listingUrl: `${MARKET_CSGO_BASE_URL}/en/item/${encodeURIComponent(String(listingId))}`,
    hasScreenshot: false,
    stickers: stickerIds.map((id, slot) => ({
      name: `Sticker ${id}`,
      slot,
      imageUrl: null,
    })),
  };

  return listing;
}

function matchesFloatFilters(listing: Cs2FloatListingView, params: {
  minFloat?: number | null;
  maxFloat?: number | null;
  paintSeed?: number | null;
  paintIndex?: number | null;
}) {
  if (params.minFloat !== null && params.minFloat !== undefined && (listing.floatValue ?? 1) < params.minFloat) return false;
  if (params.maxFloat !== null && params.maxFloat !== undefined && (listing.floatValue ?? 1) > params.maxFloat) return false;
  if (params.paintSeed !== null && params.paintSeed !== undefined && listing.paintSeed !== params.paintSeed) return false;
  if (params.paintIndex !== null && params.paintIndex !== undefined && listing.paintIndex !== params.paintIndex) return false;
  return true;
}

export function marketCsgoRowsToFloatListings(params: {
  marketHashName: string;
  payload: Record<string, unknown>;
  minFloat?: number | null;
  maxFloat?: number | null;
  paintSeed?: number | null;
  paintIndex?: number | null;
  limit?: number;
}) {
  if (params.payload.success === false) return [];
  const currency = params.payload.currency ?? "USD";
  return normalizeMarketCsgoRows(params.payload.data)
    .map((row) => marketCsgoRowToFloatListing({
      row,
      marketHashName: params.marketHashName,
      currency,
    }))
    .filter((listing) => matchesFloatFilters(listing, params))
    .slice(0, params.limit);
}

export function flattenMarketCsgoItems(params: {
  marketHashName: string;
  payload: Record<string, unknown>;
  observedAt?: Date;
}) {
  if (params.payload.success === false) return [];
  const currency = params.payload.currency ?? "USD";
  const rows = normalizeMarketCsgoRows(params.payload.data);
  const best = chooseBestAsk(rows, currency);
  if (!best) return [];

  const marketHashName = normalizeMarketHashName(
    readString(best.row.market_hash_name)
      ?? readString(best.row.hash_name)
      ?? params.marketHashName,
  );
  const marketName = normalizeMarketName("marketcsgo");
  const askVolume = readNumber(best.row.count) ?? rows.length;
  const snapshot: ProviderSnapshotInput = {
    provider: "marketcsgo",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: best.askCents,
    bidCents: null,
    medianCents: null,
    askVolume,
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: askVolume,
    observedAt: params.observedAt ?? new Date(),
    sourceUrl: `${MARKET_CSGO_BASE_URL}/en/?search=${encodeURIComponent(marketHashName)}`,
    raw: {
      currency,
      rows,
      selected: best.row,
    },
  };

  const item: ProviderItemInput = {
    marketHashName,
    itemType: inferItemType(marketHashName),
    category: inferCategory(marketHashName),
    rarity: null,
    exterior: inferExterior(marketHashName),
    collection: null,
    imageUrl: null,
    tradable: true,
    snapshots: [snapshot],
  };

  return [item];
}

async function fetchMarketCsgoBatch(marketHashNames: string[]) {
  const url = new URL("/api/v2/search-list-items-by-hash-name-all", MARKET_CSGO_BASE_URL);
  url.searchParams.set("key", getApiKey());
  for (const marketHashName of marketHashNames) {
    url.searchParams.append("list_hash_name[]", marketHashName);
  }

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Market.CSGO item search returned ${response.status}`);
  const payload = await response.json() as unknown;
  return typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
}

export async function fetchMarketCsgoLatestItems(params: {
  marketHashNames?: string[];
  limit?: number;
}) {
  const marketHashNames = [...new Set((params.marketHashNames ?? []).map((name) => normalizeMarketHashName(name).trim()).filter(Boolean))];
  if (marketHashNames.length === 0) {
    throw new Error("Market.CSGO latest sync requires explicit marketHashNames.");
  }

  const items: ProviderItemInput[] = [];
  const limitedNames = marketHashNames.slice(0, params.limit ?? marketHashNames.length);
  for (const chunk of chunkValues(limitedNames, BATCH_LIMIT)) {
    const payload = await fetchMarketCsgoBatch(chunk);
    const data = typeof payload.data === "object" && payload.data !== null ? payload.data as Record<string, unknown> : {};
    for (const marketHashName of chunk) {
      items.push(...flattenMarketCsgoItems({
        marketHashName,
        payload: {
          success: payload.success,
          currency: payload.currency,
          data: data[marketHashName] ?? [],
        },
      }));
    }
  }

  return items;
}

export async function fetchMarketCsgoFloatListings(params: {
  marketHashName: string;
  minFloat?: number | null;
  maxFloat?: number | null;
  paintSeed?: number | null;
  paintIndex?: number | null;
  limit?: number;
}) {
  const url = new URL("/api/v2/search-item-by-hash-name-specific", MARKET_CSGO_BASE_URL);
  url.searchParams.set("key", getApiKey());
  url.searchParams.set("hash_name", normalizeMarketHashName(params.marketHashName));
  url.searchParams.set("lang", "en");

  const response = await fetch(url, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`Market.CSGO specific item search returned ${response.status}`);
  const payload = await response.json() as unknown;
  return marketCsgoRowsToFloatListings({
    ...params,
    payload: typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {},
  });
}

function historyEntryToPoint(entry: unknown, currency: unknown, rubToUsdRate: number) {
  if (!Array.isArray(entry)) return null;
  const timestampSeconds = readNumber(entry[0]);
  const priceCents = marketCsgoHistoryPriceToUsdCents(entry[1], currency, rubToUsdRate);
  if (timestampSeconds === null || priceCents === null) return null;
  const timestamp = new Date(timestampSeconds * 1000);
  if (Number.isNaN(timestamp.getTime())) return null;
  return { timestamp, priceCents };
}

export function marketCsgoHistoryToCandles(params: {
  marketHashName: string;
  payload: Record<string, unknown>;
  rubToUsdRate?: number;
}) {
  if (params.payload.success === false) return [];
  const currency = params.payload.currency ?? "USD";
  const rubToUsdRate = params.rubToUsdRate ?? DEFAULT_RUB_TO_USD_RATE;
  const data = typeof params.payload.data === "object" && params.payload.data !== null
    ? params.payload.data as Record<string, unknown>
    : {};
  const row = typeof data[params.marketHashName] === "object" && data[params.marketHashName] !== null
    ? data[params.marketHashName] as Record<string, unknown>
    : null;
  const history = Array.isArray(row?.history) ? row.history : [];
  const buckets = new Map<string, Array<{ timestamp: Date; priceCents: number }>>();

  for (const entry of history) {
    const point = historyEntryToPoint(entry, currency, rubToUsdRate);
    if (!point) continue;
    const key = dayKey(point.timestamp);
    buckets.set(key, [...(buckets.get(key) ?? []), point]);
  }

  const marketName = normalizeMarketName("marketcsgo");
  return [...buckets.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, points]): ProviderCandleInput => {
    const ordered = [...points].sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
    const prices = ordered.map((point) => point.priceCents);
    return {
      marketHashName: params.marketHashName,
      provider: "marketcsgo",
      marketName,
      interval: "1d",
      openCents: ordered[0].priceCents,
      highCents: Math.max(...prices),
      lowCents: Math.min(...prices),
      closeCents: ordered.at(-1)?.priceCents ?? ordered[0].priceCents,
      volume: ordered.length,
      startsAt: dayStart(date),
    };
  });
}

async function readRubToUsdRate() {
  const envRate = Number(process.env.MARKET_CSGO_RUB_TO_USD_RATE ?? "");
  if (Number.isFinite(envRate) && envRate > 0) return envRate;
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=RUB&to=USD", {
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`FX rate returned ${response.status}`);
    const payload = await response.json() as { rates?: Record<string, unknown> };
    const rate = readNumber(payload.rates?.USD);
    if (rate && rate > 0) return rate;
  } catch {
    // Keep history ingestion working when the FX feed is unavailable.
  }
  return DEFAULT_RUB_TO_USD_RATE;
}

async function fetchMarketCsgoHistoryBatch(marketHashNames: string[]) {
  const url = new URL("/api/v2/get-list-items-info", MARKET_CSGO_BASE_URL);
  url.searchParams.set("key", getApiKey());
  for (const marketHashName of marketHashNames) {
    url.searchParams.append("list_hash_name[]", marketHashName);
  }

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Market.CSGO item history returned ${response.status}`);
  const payload = await response.json() as unknown;
  return typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
}

export async function fetchMarketCsgoSalesHistory(params: {
  marketHashNames: string[];
}) {
  const marketHashNames = [...new Set(params.marketHashNames.map((name) => normalizeMarketHashName(name).trim()).filter(Boolean))];
  const rubToUsdRate = await readRubToUsdRate();
  const candles: ProviderCandleInput[] = [];

  for (const chunk of chunkValues(marketHashNames, BATCH_LIMIT)) {
    const payload = await fetchMarketCsgoHistoryBatch(chunk);
    for (const marketHashName of chunk) {
      candles.push(...marketCsgoHistoryToCandles({
        marketHashName,
        payload,
        rubToUsdRate,
      }));
    }
  }

  return candles;
}
