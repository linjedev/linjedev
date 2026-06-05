import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const BITSKINS_BASE_URL = process.env.BITSKINS_API_BASE ?? "https://api.bitskins.com";
const DEFAULT_APP_ID = 730;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bitskinsCents(value: unknown) {
  const amount = readNumber(value);
  return amount === null ? null : Math.round(amount);
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

function bitskinsRowToInput(row: Record<string, unknown>, observedAt: Date): ProviderItemInput | null {
  const marketHashName = readString(row.name);
  if (!marketHashName) return null;

  const marketName = normalizeMarketName("bitskins");
  const snapshot: ProviderSnapshotInput = {
    provider: "bitskins",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: bitskinsCents(row.price_min),
    bidCents: null,
    medianCents: bitskinsCents(row.price_avg),
    askVolume: readNumber(row.quantity),
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: null,
    observedAt,
    sourceUrl: `https://bitskins.com/market/cs2?search=${encodeURIComponent(marketHashName)}`,
    raw: row,
  };

  return {
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
}

export function flattenBitSkinsItems(payload: unknown, params: {
  marketHashNames?: string[];
  query?: string | null;
  limit?: number;
  observedAt?: Date;
} = {}) {
  const rows: unknown[] = (() => {
    if (typeof payload === "object" && payload !== null) {
      const list = (payload as Record<string, unknown>).list;
      if (Array.isArray(list)) return list;
    }
    return Array.isArray(payload) ? payload : [];
  })();
  const requested = new Set(params.marketHashNames?.map((name) => name.trim()).filter(Boolean) ?? []);
  const observedAt = params.observedAt ?? new Date();
  const items: ProviderItemInput[] = [];

  for (const row of rows) {
    if (params.limit && items.length >= params.limit) break;
    if (typeof row !== "object" || row === null) continue;
    const marketHashName = readString((row as Record<string, unknown>).name);
    if (!marketHashName) continue;
    if (requested.size > 0 && !requested.has(marketHashName)) continue;
    if (requested.size === 0 && !matchesQuery(marketHashName, params.query)) continue;
    const item = bitskinsRowToInput(row as Record<string, unknown>, observedAt);
    if (item) items.push(item);
  }

  return items;
}

export async function fetchBitSkinsLatestItems(params: {
  marketHashNames?: string[];
  query?: string | null;
  limit?: number;
  appId?: number;
}) {
  const response = await fetch(`${BITSKINS_BASE_URL}/market/insell/${params.appId ?? DEFAULT_APP_ID}`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`BitSkins /market/insell returned ${response.status}`);

  return flattenBitSkinsItems(await response.json(), {
    marketHashNames: params.marketHashNames,
    query: params.query,
    limit: params.limit,
  });
}
