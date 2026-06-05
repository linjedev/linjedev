import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";
import type { Cs2FloatListingView, Cs2FloatSort } from "@/lib/cs2/types";

const CSFLOAT_BASE_URL = "https://csfloat.com/api/v1";
const STEAM_IMAGE_BASE = "https://community.fastly.steamstatic.com/economy/image";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readCents(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function steamImageUrl(path: unknown) {
  const value = readString(path);
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${STEAM_IMAGE_BASE}/${value}`;
}

function readObject(value: unknown) {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function readDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function listingToView(row: Record<string, unknown>): Cs2FloatListingView | null {
  const item = readObject(row.item);
  const marketHashName = readString(item?.market_hash_name) ?? readString(row.market_hash_name);
  if (!marketHashName) return null;
  const listingId = readString(row.id) ?? `${marketHashName}-${readNumber(item?.float_value) ?? "listing"}`;
  const screenshotId = readString(row.id);

  return {
    id: listingId,
    marketHashName,
    itemName: readString(item?.item_name),
    wearName: readString(item?.wear_name),
    priceCents: readNumber(row.price),
    referencePriceCents: readNumber(item?.scm && readObject(item.scm)?.price),
    floatValue: readNumber(item?.float_value),
    paintSeed: readNumber(item?.paint_seed),
    paintIndex: readNumber(item?.paint_index),
    floatRank: readNumber(item?.float_rank),
    rarity: readNumber(item?.rarity),
    imageUrl: steamImageUrl(item?.icon_url),
    screenshotUrl: screenshotId ? `${CSFLOAT_BASE_URL}/listings/${screenshotId}/screenshot` : null,
    inspectUrl: readString(item?.inspect_link),
    listingUrl: screenshotId ? `https://csfloat.com/item/${screenshotId}` : null,
    hasScreenshot: readBoolean(item?.has_screenshot),
    stickers: Array.isArray(item?.stickers)
      ? item.stickers.map((sticker) => readObject(sticker)).filter((sticker): sticker is Record<string, unknown> => sticker !== null).map((sticker) => ({
        name: readString(sticker.name) ?? "Sticker",
        slot: readNumber(sticker.slot),
        imageUrl: steamImageUrl(sticker.icon_url),
      }))
      : [],
  };
}

export function flattenCsFloatListings(rows: Record<string, unknown>[]) {
  return rows
    .map(listingToView)
    .filter((listing): listing is Cs2FloatListingView => listing !== null);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function csFloatListingsToProviderItems(listings: Cs2FloatListingView[], observedAt = new Date()): ProviderItemInput[] {
  const byItem = new Map<string, Cs2FloatListingView[]>();
  for (const listing of listings) {
    byItem.set(listing.marketHashName, [...(byItem.get(listing.marketHashName) ?? []), listing]);
  }

  const marketName = normalizeMarketName("csfloat");
  return [...byItem.entries()].map(([marketHashName, itemListings]) => {
    const pricedListings = itemListings.filter((listing) => listing.priceCents !== null);
    const askCents = pricedListings.length > 0
      ? Math.min(...pricedListings.map((listing) => listing.priceCents ?? Number.MAX_SAFE_INTEGER))
      : null;
    const referencePrices = itemListings
      .map((listing) => listing.referencePriceCents)
      .filter((price): price is number => price !== null);
    const bestListing = pricedListings
      .sort((a, b) => (a.priceCents ?? Number.MAX_SAFE_INTEGER) - (b.priceCents ?? Number.MAX_SAFE_INTEGER))[0] ?? itemListings[0];
    const snapshot: ProviderSnapshotInput = {
      provider: "csfloat",
      marketName,
      marketRegion: inferMarketRegion(marketName),
      askCents,
      bidCents: null,
      medianCents: median(referencePrices),
      askVolume: itemListings.length,
      bidVolume: null,
      salesVolume24h: null,
      liquidityScore: null,
      observedAt,
      sourceUrl: bestListing.listingUrl ?? `https://csfloat.com/search?market_hash_name=${encodeURIComponent(marketHashName)}`,
      raw: {
        listingCount: itemListings.length,
        listings: itemListings.slice(0, 10),
      },
    };

    return {
      marketHashName,
      itemType: inferItemType(marketHashName),
      category: inferCategory(marketHashName),
      rarity: bestListing.rarity === null ? null : String(bestListing.rarity),
      exterior: inferExterior(marketHashName) ?? bestListing.wearName,
      collection: null,
      imageUrl: bestListing.imageUrl,
      tradable: true,
      snapshots: [snapshot],
    };
  });
}

function dayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dayStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function salePriceCents(row: Record<string, unknown>) {
  return readCents(row.price)
    ?? readCents(row.sale_price)
    ?? readCents(row.sold_price)
    ?? readCents(row.price_cents);
}

function saleTimestamp(row: Record<string, unknown>) {
  return readDate(row.sold_at)
    ?? readDate(row.created_at)
    ?? readDate(row.updated_at)
    ?? readDate(row.accepted_at)
    ?? readDate(row.transacted_at);
}

function extractSalesRows(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  const objectPayload = readObject(payload);
  if (!objectPayload) return [];
  if (Array.isArray(objectPayload.data)) return objectPayload.data;
  if (Array.isArray(objectPayload.sales)) return objectPayload.sales;
  if (Array.isArray(objectPayload.history)) return objectPayload.history;
  return [];
}

export function csFloatSalesToCandles(params: {
  marketHashName: string;
  payload: unknown;
}) {
  const buckets = new Map<string, Array<{ priceCents: number; timestamp: Date }>>();
  for (const rawRow of extractSalesRows(params.payload)) {
    const row = readObject(rawRow);
    if (!row) continue;
    const priceCents = salePriceCents(row);
    const timestamp = saleTimestamp(row);
    if (priceCents === null || timestamp === null) continue;
    const key = dayKey(timestamp);
    buckets.set(key, [...(buckets.get(key) ?? []), { priceCents, timestamp }]);
  }

  const candles: ProviderCandleInput[] = [];
  for (const [date, sales] of [...buckets.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const ordered = [...sales].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const prices = ordered.map((sale) => sale.priceCents);
    candles.push({
      marketHashName: params.marketHashName,
      provider: "csfloat",
      marketName: normalizeMarketName("csfloat"),
      interval: "1d",
      openCents: ordered[0].priceCents,
      highCents: Math.max(...prices),
      lowCents: Math.min(...prices),
      closeCents: ordered.at(-1)?.priceCents ?? ordered[0].priceCents,
      volume: ordered.length,
      startsAt: dayStart(date),
    });
  }

  return candles;
}

export async function fetchCsFloatListings(params: {
  query?: string | null;
  marketHashName?: string | null;
  minFloat?: number | null;
  maxFloat?: number | null;
  paintSeed?: number | null;
  paintIndex?: number | null;
  sort?: Cs2FloatSort;
  limit?: number;
}) {
  const url = new URL(`${CSFLOAT_BASE_URL}/listings`);
  url.searchParams.set("limit", String(Math.min(50, Math.max(1, params.limit ?? 20))));
  url.searchParams.set("sort_by", params.sort ?? "best_deal");
  const marketHashName = params.marketHashName?.trim() || params.query?.trim();
  if (marketHashName) url.searchParams.set("market_hash_name", marketHashName);
  if (params.minFloat !== null && params.minFloat !== undefined) url.searchParams.set("min_float", String(params.minFloat));
  if (params.maxFloat !== null && params.maxFloat !== undefined) url.searchParams.set("max_float", String(params.maxFloat));
  if (params.paintSeed !== null && params.paintSeed !== undefined) url.searchParams.set("paint_seed", String(params.paintSeed));
  if (params.paintIndex !== null && params.paintIndex !== undefined) url.searchParams.set("paint_index", String(params.paintIndex));

  const response = await fetch(url, {
    headers: process.env.CSFLOAT_API_KEY ? { Authorization: process.env.CSFLOAT_API_KEY } : undefined,
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`CSFloat listings returned ${response.status}`);
  const payload = await response.json() as unknown;
  const payloadObject = readObject(payload);
  const dataRows = payloadObject && Array.isArray(payloadObject.data) ? payloadObject.data : [];
  const rows = Array.isArray(payload)
    ? payload
    : dataRows;
  return flattenCsFloatListings(rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null));
}

export async function fetchCsFloatLatestItems(params: {
  marketHashNames?: string[];
  limit?: number;
}) {
  const marketHashNames = [...new Set((params.marketHashNames ?? []).map((name) => name.trim()).filter(Boolean))];
  if (marketHashNames.length === 0) return [];

  const listings = (await Promise.all(marketHashNames.map((marketHashName) => fetchCsFloatListings({
    marketHashName,
    sort: "lowest_price",
    limit: params.limit ? Math.min(50, params.limit) : 20,
  })))).flat();

  return csFloatListingsToProviderItems(listings);
}

async function fetchCsFloatSalesPayload(marketHashName: string) {
  const response = await fetch(`${CSFLOAT_BASE_URL}/history/${encodeURIComponent(marketHashName)}/sales`, {
    headers: process.env.CSFLOAT_API_KEY ? { Authorization: process.env.CSFLOAT_API_KEY } : undefined,
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`CSFloat sales history returned ${response.status}`);
  return await response.json() as unknown;
}

export async function fetchCsFloatSalesHistory(params: {
  marketHashNames: string[];
}) {
  const marketHashNames = [...new Set(params.marketHashNames.map((name) => name.trim()).filter(Boolean))];
  const candles = await Promise.all(marketHashNames.map(async (marketHashName) => csFloatSalesToCandles({
    marketHashName,
    payload: await fetchCsFloatSalesPayload(marketHashName),
  })));

  return candles.flat();
}
