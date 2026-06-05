import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
  toCents,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const SKINPORT_BASE_URL = process.env.SKINPORT_API_BASE ?? "https://api.skinport.com";
const DEFAULT_APP_ID = 730;
const DEFAULT_CURRENCY = "USD";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseDate(value: unknown) {
  const raw = readString(value);
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeImageUrl(value: unknown) {
  const imageUrl = readString(value);
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `https://community.cloudflare.steamstatic.com/economy/image/${imageUrl}`;
}

function searchKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesQuery(marketHashName: string, query?: string | null) {
  const normalizedQuery = searchKey(query ?? "");
  if (!normalizedQuery) return true;
  const haystack = searchKey(marketHashName);
  return normalizedQuery.split(" ").filter(Boolean).every((token) => haystack.includes(token));
}

function skinportRowToInput(row: Record<string, unknown>): ProviderItemInput | null {
  const marketHashName = readString(row.market_hash_name);
  if (!marketHashName) return null;

  const marketName = normalizeMarketName("skinport");
  const observedAt = parseDate(row.updated_at ?? row.created_at);
  const snapshot: ProviderSnapshotInput = {
    provider: "skinport",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: toCents(readNumber(row.min_price)),
    bidCents: null,
    medianCents: toCents(readNumber(row.median_price) ?? readNumber(row.suggested_price) ?? readNumber(row.mean_price)),
    askVolume: readNumber(row.quantity),
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: null,
    observedAt,
    sourceUrl: readString(row.item_page) ?? readString(row.market_page) ?? undefined,
    raw: row,
  };

  return {
    marketHashName,
    itemType: inferItemType(marketHashName),
    category: inferCategory(marketHashName),
    rarity: null,
    exterior: inferExterior(marketHashName),
    collection: null,
    imageUrl: normalizeImageUrl(row.image),
    tradable: true,
    snapshots: [snapshot],
  };
}

export function flattenSkinportItems(rows: Record<string, unknown>[], limit?: number) {
  const items: ProviderItemInput[] = [];
  for (const row of rows) {
    if (limit && items.length >= limit) break;
    const item = skinportRowToInput(row);
    if (item) items.push(item);
  }
  return items;
}

export async function fetchSkinportLatestItems(params: {
  marketHashNames?: string[];
  query?: string | null;
  limit?: number;
  tradable?: boolean;
  appId?: number;
  currency?: string;
}) {
  const url = new URL(`${SKINPORT_BASE_URL}/v1/items`);
  url.searchParams.set("app_id", String(params.appId ?? DEFAULT_APP_ID));
  url.searchParams.set("currency", params.currency ?? DEFAULT_CURRENCY);
  if (typeof params.tradable === "boolean") url.searchParams.set("tradable", String(params.tradable));

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Skinport /items returned ${response.status}`);

  const payload = await response.json() as unknown;
  const rows = Array.isArray(payload)
    ? payload.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    : [];
  const requested = new Set(params.marketHashNames?.map((name) => name.trim()).filter(Boolean) ?? []);
  const filteredRows = requested.size > 0
    ? rows.filter((row) => requested.has(readString(row.market_hash_name) ?? ""))
    : rows.filter((row) => matchesQuery(readString(row.market_hash_name) ?? "", params.query));

  return flattenSkinportItems(filteredRows, params.limit);
}
