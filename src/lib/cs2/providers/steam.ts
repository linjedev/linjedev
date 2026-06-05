import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const STEAM_MARKET_BASE_URL = process.env.STEAM_MARKET_BASE_URL ?? "https://steamcommunity.com";
const DEFAULT_APP_ID = 730;
const DEFAULT_CURRENCY = 1;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseSteamPrice(value: unknown) {
  const raw = readString(value);
  if (!raw) return null;
  const normalized = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/u)?.[0];
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function parseSteamVolume(value: unknown) {
  const raw = readString(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/,/g, "").match(/\d+/u)?.[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSteamHistoryTimestamp(value: unknown) {
  const raw = readString(value);
  if (!raw) return null;
  const dayMatch = raw.match(/^([A-Za-z]{3}\s+\d{1,2}\s+\d{4})/u);
  const candidate = dayMatch ? `${dayMatch[1]} 00:00:00 UTC` : raw;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dayStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function steamPriceOverviewToInput(params: {
  marketHashName: string;
  payload: Record<string, unknown>;
  observedAt?: Date;
}): ProviderItemInput | null {
  if (params.payload.success === false) return null;
  const lowestPrice = parseSteamPrice(params.payload.lowest_price);
  const medianPrice = parseSteamPrice(params.payload.median_price);
  if (lowestPrice === null && medianPrice === null) return null;

  const marketName = normalizeMarketName("steam");
  const snapshot: ProviderSnapshotInput = {
    provider: "steam",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: lowestPrice,
    bidCents: null,
    medianCents: medianPrice,
    askVolume: parseSteamVolume(params.payload.volume),
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: null,
    observedAt: params.observedAt ?? new Date(),
    sourceUrl: `${STEAM_MARKET_BASE_URL}/market/listings/${DEFAULT_APP_ID}/${encodeURIComponent(params.marketHashName)}`,
    raw: params.payload,
  };

  return {
    marketHashName: params.marketHashName,
    itemType: inferItemType(params.marketHashName),
    category: inferCategory(params.marketHashName),
    rarity: null,
    exterior: inferExterior(params.marketHashName),
    collection: null,
    imageUrl: null,
    tradable: true,
    snapshots: [snapshot],
  };
}

async function fetchSteamPriceOverview(marketHashName: string, params: {
  appId?: number;
  currency?: number;
}) {
  const url = new URL(`${STEAM_MARKET_BASE_URL}/market/priceoverview/`);
  url.searchParams.set("appid", String(params.appId ?? DEFAULT_APP_ID));
  url.searchParams.set("currency", String(params.currency ?? DEFAULT_CURRENCY));
  url.searchParams.set("market_hash_name", marketHashName);

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Steam priceoverview returned ${response.status}`);
  const payload = await response.json() as unknown;
  return typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
}

export async function fetchSteamLatestItems(params: {
  marketHashNames?: string[];
  limit?: number;
  appId?: number;
  currency?: number;
}) {
  const marketHashNames = [...new Set((params.marketHashNames ?? []).map((name) => name.trim()).filter(Boolean))];
  if (marketHashNames.length === 0) return [];

  const items: ProviderItemInput[] = [];
  for (const marketHashName of marketHashNames.slice(0, params.limit ?? marketHashNames.length)) {
    const payload = await fetchSteamPriceOverview(marketHashName, params);
    const item = steamPriceOverviewToInput({ marketHashName, payload });
    if (item) items.push(item);
  }

  return items;
}

export function steamPriceHistoryToCandles(params: {
  marketHashName: string;
  payload: unknown;
}) {
  const payloadObject = typeof params.payload === "object" && params.payload !== null
    ? params.payload as Record<string, unknown>
    : {};
  if (payloadObject.success === false) return [];
  const rows = Array.isArray(payloadObject.prices)
    ? payloadObject.prices
    : Array.isArray(params.payload)
      ? params.payload
      : [];
  const grouped = new Map<string, Array<{ timestamp: Date; priceCents: number; volume: number | null }>>();

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const timestamp = parseSteamHistoryTimestamp(row[0]);
    const priceCents = parseSteamPrice(row[1]);
    if (timestamp === null || priceCents === null) continue;
    const key = dayKey(timestamp);
    grouped.set(key, [...(grouped.get(key) ?? []), {
      timestamp,
      priceCents,
      volume: parseSteamVolume(row[2]),
    }]);
  }

  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, points]): ProviderCandleInput => {
    const ordered = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const prices = ordered.map((point) => point.priceCents);
    const volume = ordered.some((point) => point.volume !== null)
      ? ordered.reduce((sum, point) => sum + (point.volume ?? 0), 0)
      : null;
    return {
      marketHashName: params.marketHashName,
      provider: "steam",
      marketName: normalizeMarketName("steam"),
      interval: "1d",
      openCents: ordered[0].priceCents,
      highCents: Math.max(...prices),
      lowCents: Math.min(...prices),
      closeCents: ordered.at(-1)?.priceCents ?? ordered[0].priceCents,
      volume,
      startsAt: dayStart(date),
    };
  });
}

async function fetchSteamPriceHistoryPayload(marketHashName: string, params: {
  appId?: number;
}) {
  const url = new URL(`${STEAM_MARKET_BASE_URL}/market/pricehistory/`);
  url.searchParams.set("appid", String(params.appId ?? DEFAULT_APP_ID));
  url.searchParams.set("market_hash_name", marketHashName);

  const headers = process.env.STEAM_MARKET_COOKIE
    ? { Cookie: process.env.STEAM_MARKET_COOKIE }
    : undefined;
  const response = await fetch(url, {
    headers,
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Steam pricehistory returned ${response.status}`);
  return await response.json() as unknown;
}

export async function fetchSteamPriceHistory(params: {
  marketHashNames: string[];
  appId?: number;
}) {
  const marketHashNames = [...new Set(params.marketHashNames.map((name) => name.trim()).filter(Boolean))];
  const candles = await Promise.all(marketHashNames.map(async (marketHashName) => steamPriceHistoryToCandles({
    marketHashName,
    payload: await fetchSteamPriceHistoryPayload(marketHashName, params),
  })));
  return candles.flat();
}
