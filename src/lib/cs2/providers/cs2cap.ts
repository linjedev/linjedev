import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderCatalogItemInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const CS2CAP_BASE_URL = process.env.CS2CAP_API_BASE ?? "https://api.cs2c.app/v1";
const DEFAULT_PAGE_SIZE = 100;

function getApiKey() {
  const apiKey = process.env.CS2CAP_API_KEY;
  if (!apiKey) throw new Error("CS2CAP_API_KEY is required for CS2Cap sync.");
  return apiKey;
}

function requestHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function itemTypeFromCatalog(row: Record<string, unknown>, marketHashName: string) {
  return readString(row.item_subtype)?.toLowerCase()
    ?? readString(row.item_type)?.toLowerCase()
    ?? inferItemType(marketHashName);
}

function catalogRowToInput(row: Record<string, unknown>): ProviderCatalogItemInput | null {
  const marketHashName = readString(row.market_hash_name);
  if (!marketHashName) return null;
  return {
    marketHashName,
    itemType: itemTypeFromCatalog(row, marketHashName),
    category: readString(row.weapon_type) ?? readString(row.base_name) ?? inferCategory(marketHashName),
    rarity: readString(row.rarity_name),
    exterior: readString(row.wear_name) ?? inferExterior(marketHashName),
    collection: readString(row.collection),
    imageUrl: readString(row.image_url),
    tradable: readBoolean(row.tradable) ?? true,
  };
}

function snapshotRowToInput(row: Record<string, unknown>): ProviderSnapshotInput | null {
  const provider = readString(row.provider);
  const askCents = readNumber(row.lowest_ask);
  if (!provider || askCents === null) return null;
  const marketName = normalizeMarketName(provider);
  return {
    provider: "cs2cap",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents,
    bidCents: null,
    medianCents: null,
    askVolume: readNumber(row.quantity),
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: null,
    observedAt: parseDate(row.last_updated ?? row.timestamp),
    sourceUrl: readString(row.url) ?? readString(row.link) ?? undefined,
    raw: row,
  };
}

function candleRowToInput(params: {
  marketHashName: string;
  interval: "5m" | "1h" | "1d";
  row: Record<string, unknown>;
}): ProviderCandleInput | null {
  const openedAt = readNumber(params.row.t);
  const openCents = readNumber(params.row.o);
  const highCents = readNumber(params.row.h);
  const lowCents = readNumber(params.row.l);
  const closeCents = readNumber(params.row.c);
  if (
    openedAt === null
    || openCents === null
    || highCents === null
    || lowCents === null
    || closeCents === null
  ) {
    return null;
  }

  return {
    marketHashName: params.marketHashName,
    provider: "cs2cap",
    marketName: "Composite",
    interval: params.interval,
    openCents,
    highCents,
    lowCents,
    closeCents,
    volume: readNumber(params.row.v),
    startsAt: new Date(openedAt * 1000),
  };
}

function priceRowsToItems(rows: Record<string, unknown>[]) {
  const grouped = new Map<string, ProviderItemInput>();
  for (const row of rows) {
    const marketHashName = readString(row.market_hash_name);
    if (!marketHashName) continue;
    const existing = grouped.get(marketHashName);
    const item = existing ?? {
      marketHashName,
      itemType: inferItemType(marketHashName),
      category: inferCategory(marketHashName),
      rarity: null,
      exterior: inferExterior(marketHashName),
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [],
    };
    const snapshot = snapshotRowToInput(row);
    if (snapshot) item.snapshots.push(snapshot);
    grouped.set(marketHashName, item);
  }
  return [...grouped.values()];
}

function appendProviders(url: URL, providers?: string[]) {
  for (const provider of providers ?? []) {
    if (provider.trim()) url.searchParams.append("providers", provider.trim());
  }
}

async function getJsonItems(path: string, params: URLSearchParams) {
  const response = await fetch(`${CS2CAP_BASE_URL}${path}?${params.toString()}`, {
    headers: requestHeaders(),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`CS2Cap ${path} returned ${response.status}`);
  return await response.json() as { items?: unknown[] };
}

export function flattenCs2CapPriceRows(rows: Record<string, unknown>[]) {
  return priceRowsToItems(rows);
}

export function flattenCs2CapCatalogRows(rows: Record<string, unknown>[]) {
  return rows
    .map(catalogRowToInput)
    .filter((item): item is ProviderCatalogItemInput => item !== null);
}

export function flattenCs2CapCandleRows(params: {
  marketHashName: string;
  interval: "5m" | "1h" | "1d";
  rows: Record<string, unknown>[];
}) {
  return params.rows
    .map((row) => candleRowToInput({ ...params, row }))
    .filter((candle): candle is ProviderCandleInput => candle !== null);
}

export async function fetchCs2CapLatestItems(params: {
  marketHashNames?: string[];
  providers?: string[];
  limit?: number;
}) {
  if (params.marketHashNames && params.marketHashNames.length > 0) {
    const rows: Record<string, unknown>[] = [];
    for (const marketHashName of params.marketHashNames) {
      const searchParams = new URLSearchParams({
        market_hash_name: marketHashName,
        currency: "USD",
        limit: String(params.limit ?? DEFAULT_PAGE_SIZE),
      });
      const url = new URL(`${CS2CAP_BASE_URL}/prices`);
      appendProviders(url, params.providers);
      for (const [key, value] of searchParams.entries()) url.searchParams.set(key, value);
      const response = await fetch(url, { headers: requestHeaders(), next: { revalidate: 300 } });
      if (!response.ok) throw new Error(`CS2Cap /prices returned ${response.status}`);
      const payload = await response.json() as { items?: unknown[] };
      rows.push(...(payload.items ?? []).filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null));
    }
    return priceRowsToItems(rows);
  }

  const maxRows = params.limit ?? DEFAULT_PAGE_SIZE;
  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  while (rows.length < maxRows) {
    const url = new URL(`${CS2CAP_BASE_URL}/prices`);
    url.searchParams.set("currency", "USD");
    url.searchParams.set("limit", String(Math.min(DEFAULT_PAGE_SIZE, maxRows - rows.length)));
    url.searchParams.set("offset", String(offset));
    appendProviders(url, params.providers);
    const response = await fetch(url, { headers: requestHeaders(), next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`CS2Cap /prices returned ${response.status}`);
    const payload = await response.json() as { items?: unknown[] };
    const pageRows = (payload.items ?? []).filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
    rows.push(...pageRows);
    if (pageRows.length < DEFAULT_PAGE_SIZE) break;
    offset += pageRows.length;
  }

  return priceRowsToItems(rows);
}

export async function fetchCs2CapCatalogItems(params: {
  query?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.query?.trim()) searchParams.set("q", params.query.trim());
  if (params.limit) searchParams.set("limit", String(params.limit));
  const payload = await getJsonItems("/items", searchParams);
  const rows = (payload.items ?? []).filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
  return flattenCs2CapCatalogRows(rows);
}

export async function fetchCs2CapCandles(params: {
  marketHashNames: string[];
  start?: string;
  end?: string;
  lookback?: string;
  interval: "5m" | "1h" | "1d";
  fill?: boolean;
}) {
  const candles: ProviderCandleInput[] = [];
  for (const marketHashName of params.marketHashNames) {
    const searchParams = new URLSearchParams({
      market_hash_name: marketHashName,
      interval: params.interval,
      currency: "USD",
    });
    if (params.lookback) searchParams.set("lookback", params.lookback);
    if (params.start) searchParams.set("start", params.start);
    if (params.end) searchParams.set("end", params.end);
    if (params.fill !== undefined) searchParams.set("fill", String(params.fill));
    const response = await fetch(`${CS2CAP_BASE_URL}/prices/candles?${searchParams.toString()}`, {
      headers: requestHeaders(),
      next: { revalidate: 300 },
    });
    if (!response.ok) throw new Error(`CS2Cap /prices/candles returned ${response.status}`);
    const payload = await response.json() as { data?: unknown[] };
    const rows = (payload.data ?? []).filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
    candles.push(...flattenCs2CapCandleRows({
      marketHashName,
      interval: params.interval,
      rows,
    }));
  }
  return candles;
}
