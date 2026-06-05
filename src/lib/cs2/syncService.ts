import { fetchCs2CapCandles, fetchCs2CapCatalogItems, fetchCs2CapLatestItems } from "@/lib/cs2/providers/cs2cap";
import { fetchC5GameLatestItems } from "@/lib/cs2/providers/c5game";
import { fetchCsPriceApiLatestItems } from "@/lib/cs2/providers/cspriceapi";
import { fetchCs2ShHistory, fetchCs2ShLatestItems } from "@/lib/cs2/providers/cs2sh";
import { fetchCsFloatLatestItems, fetchCsFloatSalesHistory } from "@/lib/cs2/providers/csfloat";
import { fetchMarketCsgoLatestItems, fetchMarketCsgoSalesHistory } from "@/lib/cs2/providers/marketcsgo";
import { fetchPricempireHistory, fetchPricempireLatestItems } from "@/lib/cs2/providers/pricempire";
import { fetchSkinportLatestItems } from "@/lib/cs2/providers/skinport";
import { fetchSteamLatestItems, fetchSteamPriceHistory } from "@/lib/cs2/providers/steam";
import type { Cs2PipelineSyncSummary, Cs2SweepSyncSummary, Cs2SyncSummary, ProviderCandleInput } from "@/lib/cs2/providers/types";
import { getCs2ItemMetadataCatalog } from "@/lib/cs2/itemMetadataService";
import {
  createCs2SyncRun,
  finishCs2SyncRun,
  getCs2MissingChinesePriceMarketHashNames,
  getCs2MissingHistoryMarketHashNames,
  getCs2WatchlistMarketHashNames,
  getCs2SyncStatus,
  persistProviderCandles,
  persistProviderCatalogItems,
  persistProviderItems,
} from "@/lib/cs2/syncRepository";
import {
  getConfiguredCs2CapPriceSources,
  getConfiguredCs2ShSources,
  getConfiguredPricempirePriceSources,
} from "@/lib/cs2/marketSources";

export type Cs2LatestProvider = "cs2.sh" | "cs2cap" | "pricempire" | "skinport" | "steam" | "csfloat" | "c5game" | "cspriceapi" | "marketcsgo";
export type Cs2HistoryProvider = "cs2.sh" | "cs2cap" | "pricempire" | "csfloat" | "steam" | "marketcsgo";
export type Cs2CatalogProvider = "metadata" | "cs2cap";
type Cs2CapCandleInterval = "5m" | "1h" | "1d";

export { getCs2SyncStatus };

function isCs2CapCandleInterval(interval: "5m" | "30m" | "1h" | "1d"): interval is Cs2CapCandleInterval {
  return interval !== "30m";
}

function formatWatchlistHistorySyncError(error: unknown) {
  if (!(error instanceof Error)) return "Watchlist history sync failed";
  if (error.message.includes("prisma.cs2WatchlistItem") || error.message.includes("ECONNREFUSED")) {
    return "Watchlist database unavailable or CS2 schema pending.";
  }
  return error.message;
}

export async function hydrateCs2ItemsFromConfiguredProviders(params: {
  marketHashNames: string[];
}) {
  const marketHashNames = [...new Set(params.marketHashNames.map((name) => name.trim()).filter(Boolean))];
  const summaries: Cs2SyncSummary[] = [];

  if (marketHashNames.length === 0) return summaries;

  if (process.env.CS2SH_API_KEY) {
    try {
      const items = await fetchCs2ShLatestItems({ marketHashNames });
      const snapshotCount = await persistProviderItems(items);
      summaries.push({
        provider: "cs2.sh",
        status: "ok",
        itemCount: items.length,
        snapshotCount,
        candleCount: 0,
        message: null,
      });
    } catch (error) {
      summaries.push({
        provider: "cs2.sh",
        status: "error",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: error instanceof Error ? error.message : "cs2.sh hydration failed",
      });
    }
  }

  if (process.env.CS2CAP_API_KEY) {
    try {
      const providers = getConfiguredCs2CapPriceSources();
      const items = await fetchCs2CapLatestItems({
        marketHashNames,
        providers,
        limit: marketHashNames.length * providers.length,
      });
      const snapshotCount = await persistProviderItems(items);
      summaries.push({
        provider: "cs2cap",
        status: "ok",
        itemCount: items.length,
        snapshotCount,
        candleCount: 0,
        message: null,
      });
    } catch (error) {
      summaries.push({
        provider: "cs2cap",
        status: "error",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: error instanceof Error ? error.message : "CS2Cap hydration failed",
      });
    }
  }

  if (process.env.PRICEMPIRE_API_KEY) {
    try {
      const sources = getConfiguredPricempirePriceSources();
      const items = await fetchPricempireLatestItems({
        marketHashNames,
        sources,
        limit: Math.max(1, marketHashNames.length),
      });
      const snapshotCount = await persistProviderItems(items);
      summaries.push({
        provider: "pricempire",
        status: "ok",
        itemCount: items.length,
        snapshotCount,
        candleCount: 0,
        message: null,
      });
    } catch (error) {
      summaries.push({
        provider: "pricempire",
        status: "error",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: error instanceof Error ? error.message : "Pricempire hydration failed",
      });
    }
  }

  if (process.env.C5GAME_API_KEY) {
    try {
      const items = await fetchC5GameLatestItems({ marketHashNames });
      const snapshotCount = await persistProviderItems(items);
      summaries.push({
        provider: "c5game",
        status: "ok",
        itemCount: items.length,
        snapshotCount,
        candleCount: 0,
        message: null,
      });
    } catch (error) {
      summaries.push({
        provider: "c5game",
        status: "error",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: error instanceof Error ? error.message : "C5Game hydration failed",
      });
    }
  }

  if (process.env.CSPRICEAPI_API_KEY) {
    try {
      const items = await fetchCsPriceApiLatestItems({ marketHashNames });
      const snapshotCount = await persistProviderItems(items);
      summaries.push({
        provider: "cspriceapi",
        status: "ok",
        itemCount: items.length,
        snapshotCount,
        candleCount: 0,
        message: null,
      });
    } catch (error) {
      summaries.push({
        provider: "cspriceapi",
        status: "error",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: error instanceof Error ? error.message : "CSPriceAPI hydration failed",
      });
    }
  }

  if (process.env.MARKET_CSGO_API_KEY) {
    try {
      const items = await fetchMarketCsgoLatestItems({ marketHashNames });
      const snapshotCount = await persistProviderItems(items);
      summaries.push({
        provider: "marketcsgo",
        status: "ok",
        itemCount: items.length,
        snapshotCount,
        candleCount: 0,
        message: null,
      });
    } catch (error) {
      summaries.push({
        provider: "marketcsgo",
        status: "error",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: error instanceof Error ? error.message : "Market.CSGO hydration failed",
      });
    }
  }

  return summaries;
}

export async function syncCs2LatestPrices(params: {
  provider: Cs2LatestProvider;
  marketHashNames?: string[];
  providers?: string[];
  limit?: number;
  type?: string;
}): Promise<Cs2SyncSummary> {
  const syncRun = await createCs2SyncRun(params.provider);

  try {
    if ((params.provider === "c5game" || params.provider === "cspriceapi" || params.provider === "steam" || params.provider === "csfloat" || params.provider === "marketcsgo") && (params.marketHashNames ?? []).length === 0) {
      throw new Error(`${params.provider} latest sync requires explicit marketHashNames.`);
    }

    const items = params.provider === "cs2cap"
      ? await fetchCs2CapLatestItems({
        marketHashNames: params.marketHashNames,
        providers: params.providers,
        limit: params.limit,
      })
      : params.provider === "c5game"
        ? await fetchC5GameLatestItems({
          marketHashNames: params.marketHashNames,
          limit: params.limit,
        })
      : params.provider === "cspriceapi"
        ? await fetchCsPriceApiLatestItems({
          marketHashNames: params.marketHashNames,
          limit: params.limit,
        })
      : params.provider === "steam"
        ? await fetchSteamLatestItems({
          marketHashNames: params.marketHashNames,
          limit: params.limit,
        })
      : params.provider === "csfloat"
        ? await fetchCsFloatLatestItems({
          marketHashNames: params.marketHashNames,
          limit: params.limit,
        })
      : params.provider === "marketcsgo"
        ? await fetchMarketCsgoLatestItems({
          marketHashNames: params.marketHashNames,
          limit: params.limit,
        })
      : params.provider === "pricempire"
        ? await fetchPricempireLatestItems({
          marketHashNames: params.marketHashNames,
          sources: params.providers,
          limit: params.limit,
          type: params.type,
        })
        : params.provider === "skinport"
          ? await fetchSkinportLatestItems({
            marketHashNames: params.marketHashNames,
            limit: params.limit,
          })
          : await fetchCs2ShLatestItems({
            marketHashNames: params.marketHashNames,
            limit: params.limit,
          });
    const snapshotCount = await persistProviderItems(items);
    await finishCs2SyncRun({
      id: syncRun?.id,
      status: "ok",
      itemCount: items.length,
      snapshotCount,
    });
    return {
      provider: params.provider,
      status: "ok",
      itemCount: items.length,
      snapshotCount,
      candleCount: 0,
      message: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await finishCs2SyncRun({
      id: syncRun?.id,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      message,
    });
    return {
      provider: params.provider,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      candleCount: 0,
      message,
    };
  }
}

export async function syncCs2Catalog(params: {
  provider: Cs2CatalogProvider;
  query?: string;
  limit?: number;
}): Promise<Cs2SyncSummary> {
  const syncRun = await createCs2SyncRun(params.provider);

  try {
    const items = params.provider === "metadata"
      ? (await getCs2ItemMetadataCatalog({
        query: params.query,
        limit: params.limit,
      })).map((item) => ({
        marketHashName: item.marketHashName,
        itemType: item.itemType ?? "unknown",
        category: item.category,
        rarity: item.rarity,
        exterior: item.exterior,
        collection: item.collection,
        imageUrl: item.imageUrl,
        tradable: true,
      }))
      : await fetchCs2CapCatalogItems({
        query: params.query,
        limit: params.limit,
      });
    await persistProviderCatalogItems(items);
    await finishCs2SyncRun({
      id: syncRun?.id,
      status: "ok",
      itemCount: items.length,
      snapshotCount: 0,
    });
    return {
      provider: params.provider,
      status: "ok",
      itemCount: items.length,
      snapshotCount: 0,
      candleCount: 0,
      message: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog sync failed";
    await finishCs2SyncRun({
      id: syncRun?.id,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      message,
    });
    return {
      provider: params.provider,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      candleCount: 0,
      message,
    };
  }
}

export async function syncCs2History(params: {
  provider: Cs2HistoryProvider;
  marketHashNames: string[];
  sources?: string[];
  start?: string;
  end?: string;
  lookback?: string;
  interval: "5m" | "30m" | "1h" | "1d";
  fill?: boolean;
}): Promise<Cs2SyncSummary> {
  const syncRun = await createCs2SyncRun(params.provider);

  try {
    if (params.provider === "cs2.sh" && (!params.start || !params.end)) {
      throw new Error("start and end are required for cs2.sh history sync.");
    }
    if (params.provider === "cs2cap" && !isCs2CapCandleInterval(params.interval)) {
      throw new Error("CS2Cap candles support 5m, 1h, and 1d intervals.");
    }
    if (params.provider === "pricempire" && params.interval !== "1d") {
      throw new Error("Pricempire history sync currently supports daily candles.");
    }
    if (params.provider === "csfloat" && params.interval !== "1d") {
      throw new Error("CSFloat sales history sync currently supports daily candles.");
    }
    if (params.provider === "steam" && params.interval !== "1d") {
      throw new Error("Steam market history sync currently supports daily candles.");
    }
    if (params.provider === "marketcsgo" && params.interval !== "1d") {
      throw new Error("Market.CSGO sales history sync currently supports daily candles.");
    }

    let candles: ProviderCandleInput[];
    if (params.provider === "cs2cap") {
      if (!isCs2CapCandleInterval(params.interval)) {
        throw new Error("CS2Cap candles support 5m, 1h, and 1d intervals.");
      }
      candles = await fetchCs2CapCandles({
        marketHashNames: params.marketHashNames,
        start: params.start,
        end: params.end,
        lookback: params.lookback,
        interval: params.interval,
        fill: params.fill,
      });
    } else if (params.provider === "steam") {
      candles = await fetchSteamPriceHistory({
        marketHashNames: params.marketHashNames,
      });
    } else if (params.provider === "csfloat") {
      candles = await fetchCsFloatSalesHistory({
        marketHashNames: params.marketHashNames,
      });
    } else if (params.provider === "marketcsgo") {
      candles = await fetchMarketCsgoSalesHistory({
        marketHashNames: params.marketHashNames,
      });
    } else if (params.provider === "pricempire") {
      const providerSources = getConfiguredPricempirePriceSources();
      candles = await fetchPricempireHistory({
        marketHashNames: params.marketHashNames,
        providerKey: params.sources?.[0] ?? providerSources[0] ?? "buff163",
        start: params.start,
        end: params.end,
      });
    } else {
      if (!params.start || !params.end) {
        throw new Error("start and end are required for cs2.sh history sync.");
      }
      candles = await fetchCs2ShHistory({
        marketHashNames: params.marketHashNames,
        sources: params.sources ?? getConfiguredCs2ShSources(),
        start: params.start,
        end: params.end,
        interval: params.interval,
      });
    }
    const candleCount = await persistProviderCandles(candles);
    await finishCs2SyncRun({
      id: syncRun?.id,
      status: "ok",
      itemCount: params.marketHashNames.length,
      snapshotCount: 0,
      candleCount,
    });
    return {
      provider: params.provider,
      status: "ok",
      itemCount: params.marketHashNames.length,
      snapshotCount: 0,
      candleCount,
      message: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "History sync failed";
    await finishCs2SyncRun({
      id: syncRun?.id,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      message,
    });
    return {
      provider: params.provider,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      candleCount: 0,
      message,
    };
  }
}

export async function syncCs2WatchlistHistory(params: {
  ownerKey: string;
  provider: Cs2HistoryProvider;
  sources?: string[];
  start?: string;
  end?: string;
  lookback?: string;
  interval: "5m" | "30m" | "1h" | "1d";
  fill?: boolean;
  limit?: number;
}): Promise<Cs2SyncSummary> {
  try {
    const marketHashNames = await getCs2WatchlistMarketHashNames({
      ownerKey: params.ownerKey,
      limit: params.limit,
    });

    if (marketHashNames.length === 0) {
      return {
        provider: params.provider,
        status: "ok",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: "No watchlist items to backfill.",
      };
    }

    return await syncCs2History({
      provider: params.provider,
      marketHashNames,
      sources: params.sources,
      start: params.start,
      end: params.end,
      lookback: params.lookback,
      interval: params.interval,
      fill: params.fill,
    });
  } catch (error) {
    return {
      provider: params.provider,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      candleCount: 0,
      message: formatWatchlistHistorySyncError(error),
    };
  }
}

export async function syncCs2MissingHistory(params: {
  provider: Cs2HistoryProvider;
  sources?: string[];
  start?: string;
  end?: string;
  lookback?: string;
  interval: "5m" | "30m" | "1h" | "1d";
  fill?: boolean;
  limit?: number;
  staleAfterDays?: number;
  afterMarketHashName?: string;
}): Promise<Cs2SyncSummary> {
  try {
    const batchLimit = Math.min(250, Math.max(1, params.limit ?? 100));
    const marketHashNames = await getCs2MissingHistoryMarketHashNames({
      limit: batchLimit,
      staleAfterDays: params.staleAfterDays,
      afterMarketHashName: params.afterMarketHashName,
    });
    const nextCursor = marketHashNames.length === batchLimit
      ? marketHashNames.at(-1) ?? null
      : null;

    if (marketHashNames.length === 0) {
      return {
        provider: params.provider,
        status: "ok",
        itemCount: 0,
        snapshotCount: 0,
        candleCount: 0,
        message: "No catalog history gaps to backfill.",
        nextCursor: null,
      };
    }

    const summary = await syncCs2History({
      provider: params.provider,
      marketHashNames,
      sources: params.sources,
      start: params.start,
      end: params.end,
      lookback: params.lookback,
      interval: params.interval,
      fill: params.fill,
    });
    return {
      ...summary,
      nextCursor,
    };
  } catch (error) {
    return {
      provider: params.provider,
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      candleCount: 0,
      message: error instanceof Error ? error.message : "History gap sync failed",
      nextCursor: null,
    };
  }
}

function summarizePipelineRuns(runs: Cs2SyncSummary[]): Cs2PipelineSyncSummary {
  const errors = runs.filter((run) => run.status === "error");
  const nextCursor = [...runs].reverse().find((run) => run.nextCursor !== undefined)?.nextCursor ?? null;
  return {
    provider: "pipeline",
    status: errors.length > 0 ? "error" : "ok",
    itemCount: runs.reduce((sum, run) => sum + run.itemCount, 0),
    snapshotCount: runs.reduce((sum, run) => sum + run.snapshotCount, 0),
    candleCount: runs.reduce((sum, run) => sum + run.candleCount, 0),
    message: errors.length > 0
      ? `${errors.length} CS2 pipeline step${errors.length === 1 ? "" : "s"} failed.`
      : null,
    nextCursor,
    runs,
  };
}

export async function syncCs2MarketPipeline(params: {
  includeCatalog?: boolean;
  includeLatest?: boolean;
  includeWatchlistHistory?: boolean;
  latestLimit?: number;
  catalogLimit?: number;
  ownerKey?: string;
  historyProvider?: Cs2HistoryProvider;
  historySources?: string[];
  historyStart?: string;
  historyEnd?: string;
  historyLookback?: string;
  historyInterval?: "5m" | "30m" | "1h" | "1d";
  historyFill?: boolean;
  watchlistLimit?: number;
  latestAfterMarketHashName?: string;
}): Promise<Cs2PipelineSyncSummary> {
  const runs: Cs2SyncSummary[] = [];
  const includeCatalog = params.includeCatalog ?? true;
  const includeLatest = params.includeLatest ?? true;
  const exactItemLimit = Math.min(250, Math.max(1, params.latestLimit ?? 100));
  const exactItemNames = params.ownerKey
    ? await getCs2WatchlistMarketHashNames({
      ownerKey: params.ownerKey,
      limit: Math.min(250, Math.max(1, params.watchlistLimit ?? 100)),
    }).catch(() => [])
    : await getCs2MissingChinesePriceMarketHashNames({
      limit: exactItemLimit,
      afterMarketHashName: params.latestAfterMarketHashName,
    }).catch(() => []);
  const latestGapNextCursor = !params.ownerKey && exactItemNames.length === exactItemLimit
    ? exactItemNames.at(-1) ?? null
    : null;

  if (includeCatalog) {
    runs.push(await syncCs2Catalog({
      provider: "metadata",
      limit: params.catalogLimit,
    }));
  }

  if (includeCatalog && process.env.CS2CAP_API_KEY) {
    runs.push(await syncCs2Catalog({
      provider: "cs2cap",
      limit: params.catalogLimit,
    }));
  }

  if (includeLatest) {
    runs.push(await syncCs2LatestPrices({
      provider: "skinport",
      limit: params.latestLimit,
    }));

    if (process.env.CS2SH_API_KEY) {
      runs.push(await syncCs2LatestPrices({
        provider: "cs2.sh",
        limit: params.latestLimit,
      }));
    }

    if (process.env.CS2CAP_API_KEY) {
      const sources = getConfiguredCs2CapPriceSources();
      runs.push(await syncCs2LatestPrices({
        provider: "cs2cap",
        providers: sources,
        limit: params.latestLimit,
      }));
    }

    if (process.env.PRICEMPIRE_API_KEY) {
      const sources = getConfiguredPricempirePriceSources();
      runs.push(await syncCs2LatestPrices({
        provider: "pricempire",
        providers: sources,
        limit: params.latestLimit,
      }));
    }

    if (exactItemNames.length > 0) {
      runs.push(await syncCs2LatestPrices({
        provider: "steam",
        marketHashNames: exactItemNames,
        limit: params.latestLimit,
      }));
      runs.push(await syncCs2LatestPrices({
        provider: "csfloat",
        marketHashNames: exactItemNames,
        limit: params.latestLimit,
      }));
    }

    if (process.env.C5GAME_API_KEY && exactItemNames.length > 0) {
      const run = await syncCs2LatestPrices({
        provider: "c5game",
        marketHashNames: exactItemNames,
        limit: params.latestLimit,
      });
      run.nextCursor = latestGapNextCursor;
      runs.push(run);
    }

    if (process.env.CSPRICEAPI_API_KEY && exactItemNames.length > 0) {
      const run = await syncCs2LatestPrices({
        provider: "cspriceapi",
        marketHashNames: exactItemNames,
        limit: params.latestLimit,
      });
      run.nextCursor = latestGapNextCursor;
      runs.push(run);
    }

    if (process.env.MARKET_CSGO_API_KEY && exactItemNames.length > 0) {
      runs.push(await syncCs2LatestPrices({
        provider: "marketcsgo",
        marketHashNames: exactItemNames,
        limit: params.latestLimit,
      }));
    }
  }

  if (params.includeWatchlistHistory) {
    const historyProvider = params.historyProvider ?? (
      process.env.CS2SH_API_KEY
        ? "cs2.sh"
        : process.env.CS2CAP_API_KEY
          ? "cs2cap"
          : "pricempire"
    );
    runs.push(await syncCs2WatchlistHistory({
      ownerKey: params.ownerKey ?? "linje-local-watchlist",
      provider: historyProvider,
      sources: params.historySources,
      start: params.historyStart,
      end: params.historyEnd,
      lookback: params.historyLookback,
      interval: params.historyInterval ?? "1d",
      fill: params.historyFill,
      limit: params.watchlistLimit,
    }));
  }

  if (runs.length === 0) {
    return {
      provider: "pipeline",
      status: "error",
      itemCount: 0,
      snapshotCount: 0,
      candleCount: 0,
      message: "No CS2 provider API keys configured for pipeline sync.",
      runs: [],
    };
  }

  return summarizePipelineRuns(runs);
}

function summarizeSweepBatches(target: Cs2SweepSyncSummary["target"], batches: Cs2SyncSummary[]): Cs2SweepSyncSummary {
  const errors = batches.filter((batch) => batch.status === "error");
  const nextCursor = batches.at(-1)?.nextCursor ?? null;
  return {
    provider: "sweep",
    target,
    status: errors.length > 0 ? "error" : "ok",
    itemCount: batches.reduce((sum, batch) => sum + batch.itemCount, 0),
    snapshotCount: batches.reduce((sum, batch) => sum + batch.snapshotCount, 0),
    candleCount: batches.reduce((sum, batch) => sum + batch.candleCount, 0),
    message: errors.length > 0
      ? `${errors.length} CS2 sweep batch${errors.length === 1 ? "" : "es"} failed.`
      : null,
    nextCursor,
    batches,
  };
}

export async function syncCs2GapSweep(params: {
  target: Cs2SweepSyncSummary["target"];
  maxBatches?: number;
  startAfterMarketHashName?: string;
  latestLimit?: number;
  historyProvider?: Cs2HistoryProvider;
  historySources?: string[];
  historyStart?: string;
  historyEnd?: string;
  historyLookback?: string;
  historyInterval?: "5m" | "30m" | "1h" | "1d";
  historyFill?: boolean;
  historyLimit?: number;
  staleAfterDays?: number;
}): Promise<Cs2SweepSyncSummary> {
  const batchCount = Math.min(20, Math.max(1, params.maxBatches ?? 3));
  const batches: Cs2SyncSummary[] = [];
  let cursor: string | null | undefined = params.startAfterMarketHashName ?? null;

  for (let index = 0; index < batchCount; index += 1) {
    const batch: Cs2SyncSummary = params.target === "latest-china"
      ? await syncCs2MarketPipeline({
        includeCatalog: index === 0,
        includeLatest: true,
        includeWatchlistHistory: false,
        latestLimit: params.latestLimit,
        latestAfterMarketHashName: cursor ?? undefined,
      })
      : await syncCs2MissingHistory({
        provider: params.historyProvider ?? (
          process.env.CS2CAP_API_KEY
            ? "cs2cap"
            : process.env.CS2SH_API_KEY
              ? "cs2.sh"
              : "pricempire"
        ),
        sources: params.historySources,
        start: params.historyStart,
        end: params.historyEnd,
        lookback: params.historyLookback,
        interval: params.historyInterval ?? "1d",
        fill: params.historyFill,
        limit: params.historyLimit,
        staleAfterDays: params.staleAfterDays,
        afterMarketHashName: cursor ?? undefined,
      });

    batches.push(batch);
    cursor = batch.nextCursor ?? null;
    if (batch.status === "error" || !cursor) break;
  }

  return summarizeSweepBatches(params.target, batches);
}
