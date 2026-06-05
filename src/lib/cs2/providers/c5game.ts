import {
  inferCategory,
  inferExterior,
  inferItemType,
  inferMarketRegion,
  normalizeMarketHashName,
  normalizeMarketName,
} from "@/lib/cs2/normalization";
import type { ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";

const C5GAME_BASE_URL = process.env.C5GAME_API_BASE ?? "https://openapi.c5game.com";
const C5GAME_APP_ID = 730;
const BATCH_LIMIT = 100;
const DEFAULT_CNY_TO_USD_RATE = 0.139;

type C5GameStatRow = {
  marketHashName?: unknown;
  itemId?: unknown;
  sellPrice?: unknown;
  sellCount?: unknown;
  purchaseMaxPrice?: unknown;
  purchaseCount?: unknown;
  temporaryRental?: unknown;
  permanentRental?: unknown;
};

function getApiKey() {
  const apiKey = process.env.C5GAME_API_KEY;
  if (!apiKey) throw new Error("C5GAME_API_KEY is required for C5Game sync.");
  return apiKey;
}

function requestHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function chunkValues(values: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function readUsdPerCny() {
  const envRate = Number(process.env.C5GAME_CNY_TO_USD_RATE ?? "");
  if (Number.isFinite(envRate) && envRate > 0) return envRate;

  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=CNY&to=USD", {
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`FX rate returned ${response.status}`);
    const payload = await response.json() as { rates?: Record<string, unknown> };
    const rate = readNumber(payload.rates?.USD);
    if (rate && rate > 0) return rate;
  } catch {
    // Fall back to an approximate rate when the FX feed is unavailable.
  }

  return DEFAULT_CNY_TO_USD_RATE;
}

function cnyFenToUsdCents(value: number | null, usdPerCny: number) {
  if (value === null) return null;
  return Math.round(value * usdPerCny);
}

async function postC5Game<T>(path: string, marketHashNames: string[]) {
  const url = new URL(path, C5GAME_BASE_URL);
  url.searchParams.set("app-key", getApiKey());

  const response = await fetch(url, {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      appId: C5GAME_APP_ID,
      marketHashNames,
    }),
    next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error(`C5Game ${path} returned ${response.status}`);

  const payload = await response.json() as {
    success?: boolean;
    data?: T;
    errorMsg?: string;
  };

  if (!payload.success) {
    throw new Error(payload.errorMsg || `C5Game ${path} request failed.`);
  }

  return payload.data;
}

function rowToSnapshot(row: C5GameStatRow, survivalCount: number | null, usdPerCny: number): ProviderSnapshotInput | null {
  const marketHashName = readString(row.marketHashName);
  if (!marketHashName) return null;

  const marketName = normalizeMarketName("c5game");
  const sellCount = readNumber(row.sellCount);
  const purchaseCount = readNumber(row.purchaseCount);
  const temporaryRental = readNumber(row.temporaryRental) ?? 0;
  const permanentRental = readNumber(row.permanentRental) ?? 0;

  return {
    provider: "c5game",
    marketName,
    marketRegion: inferMarketRegion(marketName),
    askCents: cnyFenToUsdCents(readNumber(row.sellPrice), usdPerCny),
    bidCents: cnyFenToUsdCents(readNumber(row.purchaseMaxPrice), usdPerCny),
    medianCents: null,
    askVolume: sellCount,
    bidVolume: purchaseCount,
    salesVolume24h: null,
    liquidityScore: (sellCount ?? 0) + (purchaseCount ?? 0) + temporaryRental + permanentRental,
    observedAt: new Date(),
    raw: {
      itemId: row.itemId,
      sellPrice: row.sellPrice,
      sellCount: row.sellCount,
      purchaseMaxPrice: row.purchaseMaxPrice,
      purchaseCount: row.purchaseCount,
      temporaryRental: row.temporaryRental,
      permanentRental: row.permanentRental,
      survivalCount,
      currency: "CNY",
      usdPerCny,
    },
  };
}

export function flattenC5GameStats(params: {
  statsByName: Record<string, C5GameStatRow>;
  survivalByName?: Record<string, unknown>;
  usdPerCny: number;
}) {
  const items: ProviderItemInput[] = [];

  for (const [key, row] of Object.entries(params.statsByName)) {
    const marketHashName = normalizeMarketHashName(readString(row.marketHashName) ?? key);
    const survivalCount = readNumber(params.survivalByName?.[key] ?? params.survivalByName?.[marketHashName] ?? null);
    const snapshot = rowToSnapshot({
      ...row,
      marketHashName,
    }, survivalCount, params.usdPerCny);

    if (!snapshot) continue;

    items.push({
      marketHashName,
      itemType: inferItemType(marketHashName),
      category: inferCategory(marketHashName),
      rarity: null,
      exterior: inferExterior(marketHashName),
      collection: null,
      imageUrl: null,
      tradable: true,
      snapshots: [snapshot],
    });
  }

  return items;
}

export async function fetchC5GameLatestItems(params: {
  marketHashNames?: string[];
  limit?: number;
}) {
  const marketHashNames = [...new Set((params.marketHashNames ?? []).map((name) => normalizeMarketHashName(name).trim()).filter(Boolean))];
  if (marketHashNames.length === 0) {
    throw new Error("C5Game latest sync requires explicit marketHashNames.");
  }

  const limitedNames = marketHashNames.slice(0, params.limit ?? marketHashNames.length);
  const usdPerCny = await readUsdPerCny();
  const statsByName: Record<string, C5GameStatRow> = {};
  const survivalByName: Record<string, unknown> = {};

  for (const chunk of chunkValues(limitedNames, BATCH_LIMIT)) {
    const [statsChunk, survivalChunk] = await Promise.all([
      postC5Game<Record<string, C5GameStatRow>>("/merchant/market/v2/item/stat/hash/name", chunk),
      postC5Game<Record<string, unknown>>("/merchant/market/v2/item/survival/hash/name", chunk),
    ]);
    Object.assign(statsByName, statsChunk ?? {});
    Object.assign(survivalByName, survivalChunk ?? {});
  }

  return flattenC5GameStats({
    statsByName,
    survivalByName,
    usdPerCny,
  });
}
