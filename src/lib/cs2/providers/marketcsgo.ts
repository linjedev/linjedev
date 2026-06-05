import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketHashName,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const MARKET_CSGO_BASE_URL = process.env.MARKET_CSGO_API_BASE ?? "https://market.csgo.com";
const BATCH_LIMIT = 50;

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

function chunkValues(values: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function marketCsgoPriceToUsdCents(value: unknown, currency: unknown) {
  const price = readNumber(value);
  if (price === null) return null;
  const normalizedCurrency = (readString(currency) ?? "USD").toUpperCase();
  if (normalizedCurrency !== "USD") return null;
  return Math.round(price / 10);
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
