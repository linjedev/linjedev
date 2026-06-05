import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

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
