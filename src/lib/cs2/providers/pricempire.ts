import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const PRICEMPIRE_BASE_URL = process.env.PRICEMPIRE_API_BASE ?? "https://api.pricempire.com";
const PRICEMPIRE_CDN_URL = "https://cs2-cdn.pricempire.com";
const DEFAULT_SOURCES = ["buff163", "buff163_buy", "youpin", "youpin_buy", "csfloat", "skinport", "steam"];

function getApiKey() {
  const apiKey = process.env.PRICEMPIRE_API_KEY;
  if (!apiKey) throw new Error("PRICEMPIRE_API_KEY is required for Pricempire sync.");
  return apiKey;
}

function requestHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeProviderKey(providerKey: string) {
  return providerKey.endsWith("_buy")
    ? providerKey.slice(0, -4)
    : providerKey;
}

function isBuyOrderProvider(providerKey: string) {
  return providerKey.endsWith("_buy");
}

function normalizeImageUrl(imagePath: unknown) {
  const imageUrl = readString(imagePath);
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `${PRICEMPIRE_CDN_URL}${imageUrl}`;
}

type SnapshotBuilder = {
  provider: "pricempire";
  marketName: string;
  marketRegion: ReturnType<typeof inferMarketRegion>;
  askCents: number | null;
  bidCents: number | null;
  medianCents: number | null;
  askVolume: number | null;
  bidVolume: number | null;
  salesVolume24h: number | null;
  liquidityScore: number | null;
  observedAt: Date;
  raw: Record<string, unknown>;
};

function mergePriceRow(builder: SnapshotBuilder, providerKey: string, priceRow: Record<string, unknown>) {
  const priceCents = readNumber(priceRow.price);
  const volume = readNumber(priceRow.count);
  const updatedAt = parseDate(priceRow.updated_at);
  if (updatedAt > builder.observedAt) builder.observedAt = updatedAt;

  if (isBuyOrderProvider(providerKey)) {
    builder.bidCents = priceCents;
    builder.bidVolume = volume;
    builder.raw.bidSource = priceRow;
    return;
  }

  builder.askCents = priceCents;
  builder.askVolume = volume;
  builder.medianCents = readNumber(priceRow.median_7) ?? readNumber(priceRow.median_30);
  builder.raw.askSource = priceRow;
}

function priceItemToInput(row: Record<string, unknown>): ProviderItemInput | null {
  const marketHashName = readString(row.market_hash_name);
  if (!marketHashName) return null;

  const snapshotsByMarket = new Map<string, SnapshotBuilder>();
  const prices = Array.isArray(row.prices) ? row.prices : [];
  for (const pricePayload of prices) {
    if (typeof pricePayload !== "object" || pricePayload === null) continue;
    const priceRow = pricePayload as Record<string, unknown>;
    const providerKey = readString(priceRow.provider_key);
    const priceCents = readNumber(priceRow.price);
    if (!providerKey || priceCents === null) continue;

    const marketName = normalizeMarketName(normalizeProviderKey(providerKey));
    const existing = snapshotsByMarket.get(marketName);
    const snapshot = existing ?? {
      provider: "pricempire" as const,
      marketName,
      marketRegion: inferMarketRegion(marketName),
      askCents: null,
      bidCents: null,
      medianCents: null,
      askVolume: null,
      bidVolume: null,
      salesVolume24h: null,
      liquidityScore: readNumber(row.liquidity),
      observedAt: parseDate(priceRow.updated_at),
      raw: {
        marketHashName,
        liquidity: row.liquidity,
        count: row.count,
        rank: row.rank,
      },
    };
    mergePriceRow(snapshot, providerKey, priceRow);
    snapshotsByMarket.set(marketName, snapshot);
  }

  return {
    marketHashName,
    itemType: inferItemType(marketHashName),
    category: inferCategory(marketHashName),
    rarity: null,
    exterior: inferExterior(marketHashName),
    collection: null,
    imageUrl: normalizeImageUrl(row.image),
    tradable: true,
    snapshots: [...snapshotsByMarket.values()].map((snapshot): ProviderSnapshotInput => ({
      provider: snapshot.provider,
      marketName: snapshot.marketName,
      marketRegion: snapshot.marketRegion,
      askCents: snapshot.askCents,
      bidCents: snapshot.bidCents,
      medianCents: snapshot.medianCents,
      askVolume: snapshot.askVolume,
      bidVolume: snapshot.bidVolume,
      salesVolume24h: snapshot.salesVolume24h,
      liquidityScore: snapshot.liquidityScore,
      observedAt: snapshot.observedAt,
      raw: snapshot.raw,
    })),
  };
}

export function flattenPricempirePriceRows(rows: Record<string, unknown>[], limit?: number) {
  const items: ProviderItemInput[] = [];
  for (const row of rows) {
    if (limit && items.length >= limit) break;
    const item = priceItemToInput(row);
    if (item) items.push(item);
  }
  return items;
}

export function flattenPricempireHistoryRows(params: {
  providerKey: string;
  interval: "1d";
  data: Record<string, Record<string, unknown>>;
}) {
  const candles: ProviderCandleInput[] = [];
  for (const [marketHashName, points] of Object.entries(params.data)) {
    for (const [timestamp, value] of Object.entries(points)) {
      const priceCents = readNumber(value);
      const startsAtMs = Number(timestamp) * 1000;
      if (priceCents === null || Number.isNaN(startsAtMs)) continue;
      candles.push({
        marketHashName,
        provider: "pricempire",
        marketName: normalizeMarketName(normalizeProviderKey(params.providerKey)),
        interval: params.interval,
        openCents: priceCents,
        highCents: priceCents,
        lowCents: priceCents,
        closeCents: priceCents,
        volume: null,
        startsAt: new Date(startsAtMs),
      });
    }
  }
  return candles;
}

export async function fetchPricempireLatestItems(params: {
  marketHashNames?: string[];
  sources?: string[];
  limit?: number;
  type?: string;
}) {
  const url = new URL(`${PRICEMPIRE_BASE_URL}/v4/paid/items/prices`);
  url.searchParams.set("app_id", "730");
  url.searchParams.set("sources", (params.sources?.length ? params.sources : DEFAULT_SOURCES).join(","));
  url.searchParams.set("currency", "USD");
  url.searchParams.set("avg", "false");
  url.searchParams.set("median", "true");
  url.searchParams.set("inflation_threshold", "-1");
  url.searchParams.set("metas", "liquidity,count,rank,image");
  if (params.type) url.searchParams.set("type", params.type);

  const response = await fetch(url, {
    headers: requestHeaders(),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Pricempire /items/prices returned ${response.status}`);

  const payload = await response.json() as unknown;
  const rows = Array.isArray(payload)
    ? payload.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    : [];
  const filteredRows = params.marketHashNames?.length
    ? rows.filter((row) => params.marketHashNames?.includes(readString(row.market_hash_name) ?? ""))
    : rows;

  return flattenPricempirePriceRows(filteredRows, params.limit);
}

export async function fetchPricempireHistory(params: {
  marketHashNames: string[];
  providerKey: string;
  start?: string;
  end?: string;
}) {
  const url = new URL(`${PRICEMPIRE_BASE_URL}/v4/paid/items/prices/history`);
  url.searchParams.set("app_id", "730");
  url.searchParams.set("provider_key", params.providerKey);
  url.searchParams.set("currency", "USD");
  url.searchParams.set("market_hash_names", params.marketHashNames.join(","));
  if (params.start) url.searchParams.set("from_date", params.start);
  if (params.end) url.searchParams.set("to_date", params.end);

  const response = await fetch(url, {
    headers: requestHeaders(),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Pricempire /items/prices/history returned ${response.status}`);

  const payload = await response.json() as { data?: unknown };
  const data = typeof payload.data === "object" && payload.data !== null
    ? payload.data as Record<string, Record<string, unknown>>
    : {};
  return flattenPricempireHistoryRows({
    providerKey: params.providerKey,
    interval: "1d",
    data,
  });
}
