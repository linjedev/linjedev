import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketHashName,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const WAXPEER_BASE_URL = process.env.WAXPEER_API_BASE ?? "https://api.waxpeer.com";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function waxpeerPriceToUsdCents(value: unknown) {
  const price = readNumber(value);
  return price === null ? null : Math.round(price / 10);
}

function normalizeImageUrl(value: unknown) {
  const imageUrl = readString(value);
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `https://community.cloudflare.steamstatic.com/economy/image/${imageUrl}`;
}

function exactNameKey(value: string) {
  return normalizeMarketHashName(value).toLowerCase();
}

function waxpeerRowToInput(row: Record<string, unknown>, requestedName: string): ProviderItemInput | null {
  const marketHashName = normalizeMarketHashName(readString(row.name) ?? requestedName);
  const marketName = normalizeMarketName("waxpeer");
  const askCents = waxpeerPriceToUsdCents(row.price);
  if (askCents === null) return null;

  const askVolume = readNumber(row.count) ?? readNumber(row.amount) ?? readNumber(row.quantity);
  const bidCents = waxpeerPriceToUsdCents(row.highest_offer);
  const snapshot: ProviderSnapshotInput = {
    provider: "waxpeer",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents,
    bidCents,
    medianCents: waxpeerPriceToUsdCents(row.steam_price),
    askVolume,
    bidVolume: null,
    salesVolume24h: null,
    liquidityScore: askVolume,
    observedAt: new Date(),
    sourceUrl: `https://waxpeer.com/item/${encodeURIComponent(marketHashName)}`,
    raw: row,
  };

  return {
    marketHashName,
    itemType: inferItemType(marketHashName),
    category: inferCategory(marketHashName),
    rarity: null,
    exterior: inferExterior(marketHashName),
    collection: null,
    imageUrl: normalizeImageUrl(row.img),
    tradable: true,
    snapshots: [snapshot],
  };
}

export function flattenWaxpeerPriceRows(params: {
  requestedName: string;
  payload: Record<string, unknown>;
}) {
  if (params.payload.success === false) return [];
  const rows = Array.isArray(params.payload.items)
    ? params.payload.items.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    : [];
  const requestedKey = exactNameKey(params.requestedName);
  const exactRows = rows.filter((row) => exactNameKey(readString(row.name) ?? "") === requestedKey);
  const candidates = exactRows.length > 0 ? exactRows : rows;
  const items = candidates
    .map((row) => waxpeerRowToInput(row, params.requestedName))
    .filter((item): item is ProviderItemInput => item !== null)
    .sort((left, right) => (left.snapshots[0]?.askCents ?? Number.MAX_SAFE_INTEGER) - (right.snapshots[0]?.askCents ?? Number.MAX_SAFE_INTEGER));
  return items.slice(0, 1);
}

async function fetchWaxpeerPricesByName(marketHashName: string) {
  const url = new URL("/v1/prices", WAXPEER_BASE_URL);
  url.searchParams.set("game", "csgo");
  url.searchParams.set("minified", "0");
  url.searchParams.set("highest_offer", "1");
  url.searchParams.set("search", marketHashName);
  url.searchParams.set("single", "1");
  if (process.env.WAXPEER_API_KEY) {
    url.searchParams.set("api", process.env.WAXPEER_API_KEY);
  }

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`WAXPEER prices returned ${response.status}`);
  const payload = await response.json() as unknown;
  return typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
}

export async function fetchWaxpeerLatestItems(params: {
  marketHashNames?: string[];
  limit?: number;
}) {
  const marketHashNames = [...new Set((params.marketHashNames ?? []).map((name) => normalizeMarketHashName(name).trim()).filter(Boolean))];
  if (marketHashNames.length === 0) {
    throw new Error("WAXPEER latest sync requires explicit marketHashNames.");
  }

  const limitedNames = marketHashNames.slice(0, params.limit ?? marketHashNames.length);
  const items = await Promise.all(limitedNames.map(async (marketHashName) => flattenWaxpeerPriceRows({
    requestedName: marketHashName,
    payload: await fetchWaxpeerPricesByName(marketHashName),
  })));
  return items.flat();
}
