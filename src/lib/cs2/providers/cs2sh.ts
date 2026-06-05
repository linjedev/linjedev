import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
  normalizeVariantName,
  toCents,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const CS2SH_BASE_URL = "https://api.cs2.sh";
const SOURCE_KEYS = ["buff", "youpin", "csfloat", "skinport", "c5game", "steam"];

function getApiKey() {
  const apiKey = process.env.CS2SH_API_KEY;
  if (!apiKey) throw new Error("CS2SH_API_KEY is required for cs2.sh sync.");
  return apiKey;
}

function requestHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip",
  };
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function sourceToSnapshot(provider: string, source: string, sourcePayload: unknown): ProviderSnapshotInput | null {
  if (typeof sourcePayload !== "object" || sourcePayload === null) return null;
  const sourceRecord = sourcePayload as Record<string, unknown>;
  const marketName = normalizeMarketName(source);
  return {
    provider,
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: toCents(sourceRecord.ask),
    bidCents: toCents(sourceRecord.bid),
    medianCents: toCents(sourceRecord.median_ask),
    askVolume: typeof sourceRecord.ask_volume === "number" ? sourceRecord.ask_volume : null,
    bidVolume: typeof sourceRecord.bid_volume === "number" ? sourceRecord.bid_volume : null,
    salesVolume24h: typeof sourceRecord.sales_volume_24h === "number" ? sourceRecord.sales_volume_24h : null,
    liquidityScore: typeof sourceRecord.liquidity_score === "number" ? sourceRecord.liquidity_score : null,
    observedAt: parseDate(sourceRecord.collected_at ?? sourceRecord.updated_at),
    raw: sourceRecord,
  };
}

function itemPayloadToInput(marketHashName: string, itemPayload: Record<string, unknown>): ProviderItemInput {
  const snapshots = SOURCE_KEYS
    .map((source) => sourceToSnapshot("cs2.sh", source, itemPayload[source]))
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

export function flattenLatestItems(payload: Record<string, Record<string, unknown>>, limit?: number) {
  const items: ProviderItemInput[] = [];
  for (const [marketHashName, itemPayload] of Object.entries(payload)) {
    if (limit && items.length >= limit) break;
    items.push(itemPayloadToInput(marketHashName, itemPayload));

    const variants = itemPayload.variants;
    if (typeof variants !== "object" || variants === null) continue;
    for (const [variantName, variantPayload] of Object.entries(variants as Record<string, unknown>)) {
      if (limit && items.length >= limit) break;
      if (typeof variantPayload !== "object" || variantPayload === null) continue;
      items.push(itemPayloadToInput(
        normalizeVariantName(marketHashName, variantName),
        variantPayload as Record<string, unknown>,
      ));
    }
  }
  return items;
}

export async function fetchCs2ShLatestItems(params: {
  marketHashNames?: string[];
  limit?: number;
}) {
  const hasFilter = params.marketHashNames && params.marketHashNames.length > 0;
  const response = await fetch(`${CS2SH_BASE_URL}/v1/prices/latest`, {
    method: hasFilter ? "POST" : "GET",
    headers: requestHeaders(),
    body: hasFilter ? JSON.stringify({ items: params.marketHashNames }) : undefined,
    next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error(`cs2.sh latest returned ${response.status}`);
  const payload = await response.json() as { items?: Record<string, Record<string, unknown>> };
  return flattenLatestItems(payload.items ?? {}, params.limit);
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function sourceToCandle(params: {
  marketHashName: string;
  source: string;
  interval: "5m" | "30m" | "1h" | "1d";
  bucket: string;
  sourcePayload: unknown;
}): ProviderCandleInput | null {
  if (typeof params.sourcePayload !== "object" || params.sourcePayload === null) return null;
  const sourceRecord = params.sourcePayload as Record<string, unknown>;
  const open = readNumber(sourceRecord, ["open", "ask_open"]);
  const high = readNumber(sourceRecord, ["high", "ask_high"]);
  const low = readNumber(sourceRecord, ["low", "ask_low"]);
  const close = readNumber(sourceRecord, ["close", "ask_close"]);
  if (open === null || high === null || low === null || close === null) return null;

  return {
    marketHashName: params.marketHashName,
    provider: "cs2.sh",
    marketName: normalizeMarketName(params.source),
    interval: params.interval,
    openCents: Math.round(open * 100),
    highCents: Math.round(high * 100),
    lowCents: Math.round(low * 100),
    closeCents: Math.round(close * 100),
    volume: readNumber(sourceRecord, ["volume", "sales_volume", "ask_volume"]),
    startsAt: parseDate(params.bucket),
  };
}

export async function fetchCs2ShHistory(params: {
  marketHashNames: string[];
  sources: string[];
  start: string;
  end: string;
  interval: "5m" | "30m" | "1h" | "1d";
}) {
  const response = await fetch(`${CS2SH_BASE_URL}/v1/prices/history`, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      items: params.marketHashNames,
      sources: params.sources,
      start: params.start,
      end: params.end,
      interval: params.interval,
    }),
  });

  if (!response.ok) throw new Error(`cs2.sh history returned ${response.status}`);
  const payload = await response.json() as { items?: Record<string, unknown> };
  const candles: ProviderCandleInput[] = [];

  for (const [marketHashName, itemPayload] of Object.entries(payload.items ?? {})) {
    const buckets: unknown[] = Array.isArray(itemPayload)
      ? itemPayload
      : typeof itemPayload === "object" && itemPayload !== null && Array.isArray((itemPayload as Record<string, unknown>).history)
        ? (itemPayload as Record<string, unknown>).history as unknown[]
        : [];
    for (const bucketPayload of buckets) {
      if (typeof bucketPayload !== "object" || bucketPayload === null) continue;
      const bucketRecord = bucketPayload as Record<string, unknown>;
      const bucket = typeof bucketRecord.bucket === "string" ? bucketRecord.bucket : null;
      if (!bucket) continue;
      for (const source of params.sources) {
        const candle = sourceToCandle({
          marketHashName,
          source,
          interval: params.interval,
          bucket,
          sourcePayload: bucketRecord[source],
        });
        if (candle) candles.push(candle);
      }
    }
  }

  return candles;
}
