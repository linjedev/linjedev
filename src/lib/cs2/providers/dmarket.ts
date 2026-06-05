import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const DMARKET_BASE_URL = process.env.DMARKET_API_BASE ?? "https://api.dmarket.com";
const DEFAULT_GAME_ID = "a8db";
const DEFAULT_CURRENCY = "USD";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readUsdCents(value: unknown) {
  if (typeof value !== "object" || value === null) return null;
  return Math.round(readNumber((value as Record<string, unknown>).USD) ?? NaN) || null;
}

function readExtraString(row: Record<string, unknown>, key: string) {
  const extra = row.extra;
  if (typeof extra !== "object" || extra === null) return null;
  return readString((extra as Record<string, unknown>)[key]);
}

function readCreatedAt(row: Record<string, unknown>, fallback: Date) {
  const value = readNumber(row.createdAt);
  return value === null ? fallback : new Date(value * 1000);
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

function dmarketRowToInput(params: {
  row: Record<string, unknown>;
  askVolume: number;
  observedAt: Date;
}): ProviderItemInput | null {
  const marketHashName = readString(params.row.title);
  if (!marketHashName) return null;

  const marketName = normalizeMarketName("dmarket");
  const snapshot: ProviderSnapshotInput = {
    provider: "dmarket",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: readUsdCents(params.row.price),
    bidCents: null,
    medianCents: readUsdCents(params.row.suggestedPrice),
    askVolume: params.askVolume,
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: null,
    observedAt: params.observedAt,
    sourceUrl: `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(marketHashName)}`,
    raw: params.row,
  };

  return {
    marketHashName,
    itemType: inferItemType(marketHashName),
    category: inferCategory(marketHashName),
    rarity: readExtraString(params.row, "quality"),
    exterior: inferExterior(marketHashName),
    collection: null,
    imageUrl: readString(params.row.image),
    tradable: readExtraString(params.row, "tradable") !== "false",
    snapshots: [snapshot],
  };
}

export function flattenDMarketItems(payload: unknown, params: {
  marketHashNames?: string[];
  query?: string | null;
  limit?: number;
  observedAt?: Date;
} = {}) {
  const rows: unknown[] = (() => {
    if (typeof payload === "object" && payload !== null) {
      const objects = (payload as Record<string, unknown>).objects;
      if (Array.isArray(objects)) return objects;
    }
    return Array.isArray(payload) ? payload : [];
  })();
  const requested = new Set(params.marketHashNames?.map((name) => name.trim()).filter(Boolean) ?? []);
  const grouped = new Map<string, { row: Record<string, unknown>; askVolume: number; observedAt: Date; askCents: number | null }>();
  const fallbackObservedAt = params.observedAt ?? new Date();

  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const record = row as Record<string, unknown>;
    const marketHashName = readString(record.title);
    if (!marketHashName) continue;
    if (requested.size > 0 && !requested.has(marketHashName)) continue;
    if (requested.size === 0 && !matchesQuery(marketHashName, params.query)) continue;

    const askCents = readUsdCents(record.price);
    const existing = grouped.get(marketHashName);
    if (!existing || (askCents !== null && (existing.askCents === null || askCents < existing.askCents))) {
      grouped.set(marketHashName, {
        row: record,
        askVolume: (existing?.askVolume ?? 0) + 1,
        observedAt: readCreatedAt(record, fallbackObservedAt),
        askCents,
      });
    } else {
      existing.askVolume += 1;
    }
  }

  const items: ProviderItemInput[] = [];
  for (const entry of grouped.values()) {
    if (params.limit && items.length >= params.limit) break;
    const item = dmarketRowToInput(entry);
    if (item) items.push(item);
  }
  return items;
}

export async function fetchDMarketLatestItems(params: {
  marketHashNames?: string[];
  query?: string | null;
  limit?: number;
  gameId?: string;
  currency?: string;
}) {
  const marketHashNames = [...new Set(params.marketHashNames?.map((name) => name.trim()).filter(Boolean) ?? [])];
  if (marketHashNames.length > 0) {
    const pages = await Promise.all(marketHashNames.map((marketHashName) => fetchDMarketPage({
      title: marketHashName,
      limit: Math.max(1, Math.min(100, params.limit ?? 50)),
      gameId: params.gameId,
      currency: params.currency,
    })));
    return pages.flatMap((payload, index) => flattenDMarketItems(payload, {
      marketHashNames: [marketHashNames[index]],
      limit: 1,
    }));
  }

  return flattenDMarketItems(await fetchDMarketPage({
    title: params.query ?? undefined,
    limit: params.limit,
    gameId: params.gameId,
    currency: params.currency,
  }), {
    query: params.query,
    limit: params.limit,
  });
}

async function fetchDMarketPage(params: {
  title?: string;
  limit?: number;
  gameId?: string;
  currency?: string;
}) {
  const url = new URL(`${DMARKET_BASE_URL}/exchange/v1/market/items`);
  url.searchParams.set("gameId", params.gameId ?? DEFAULT_GAME_ID);
  url.searchParams.set("currency", params.currency ?? DEFAULT_CURRENCY);
  url.searchParams.set("limit", String(Math.max(1, Math.min(100, params.limit ?? 50))));
  url.searchParams.set("orderBy", "price");
  url.searchParams.set("orderDir", "asc");
  if (params.title) url.searchParams.set("title", params.title);

  const response = await fetch(url, {
    next: { revalidate: 180 },
  });
  if (!response.ok) throw new Error(`DMarket /market/items returned ${response.status}`);
  return response.json();
}
