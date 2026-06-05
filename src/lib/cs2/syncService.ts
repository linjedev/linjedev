import { fetchCs2CapCandles, fetchCs2CapCatalogItems, fetchCs2CapLatestItems } from "@/lib/cs2/providers/cs2cap";
import { fetchCs2ShHistory, fetchCs2ShLatestItems } from "@/lib/cs2/providers/cs2sh";
import { fetchPricempireHistory, fetchPricempireLatestItems } from "@/lib/cs2/providers/pricempire";
import { fetchSkinportLatestItems } from "@/lib/cs2/providers/skinport";
import type { Cs2PipelineSyncSummary, Cs2SyncSummary, ProviderCandleInput } from "@/lib/cs2/providers/types";
import {
  createCs2SyncRun,
  finishCs2SyncRun,
  getCs2WatchlistMarketHashNames,
  getCs2SyncStatus,
  persistProviderCandles,
  persistProviderCatalogItems,
  persistProviderItems,
} from "@/lib/cs2/syncRepository";

export type Cs2LatestProvider = "cs2.sh" | "cs2cap" | "pricempire" | "skinport";
export type Cs2HistoryProvider = "cs2.sh" | "cs2cap" | "pricempire";
type Cs2CapCandleInterval = "5m" | "1h" | "1d";

export { getCs2SyncStatus };

const CS2CAP_PRIORITY_PROVIDERS = ["buff163", "youpin", "csfloat", "steam", "dmarket", "skinport"];
const PRICEMPIRE_PRIORITY_SOURCES = ["buff163", "buff163_buy", "youpin", "youpin_buy", "csfloat", "skinport", "steam"];

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
      const items = await fetchCs2CapLatestItems({
        marketHashNames,
        providers: CS2CAP_PRIORITY_PROVIDERS,
        limit: marketHashNames.length * CS2CAP_PRIORITY_PROVIDERS.length,
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
      const items = await fetchPricempireLatestItems({
        marketHashNames,
        sources: PRICEMPIRE_PRIORITY_SOURCES,
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
    const items = params.provider === "cs2cap"
      ? await fetchCs2CapLatestItems({
        marketHashNames: params.marketHashNames,
        providers: params.providers,
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
  provider: "cs2cap";
  query?: string;
  limit?: number;
}): Promise<Cs2SyncSummary> {
  const syncRun = await createCs2SyncRun(params.provider);

  try {
    const items = await fetchCs2CapCatalogItems({
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
    } else if (params.provider === "pricempire") {
      candles = await fetchPricempireHistory({
        marketHashNames: params.marketHashNames,
        providerKey: params.sources?.[0] ?? "buff163",
        start: params.start,
        end: params.end,
      });
    } else {
      if (!params.start || !params.end) {
        throw new Error("start and end are required for cs2.sh history sync.");
      }
      candles = await fetchCs2ShHistory({
        marketHashNames: params.marketHashNames,
        sources: params.sources ?? ["buff", "youpin", "csfloat"],
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

function summarizePipelineRuns(runs: Cs2SyncSummary[]): Cs2PipelineSyncSummary {
  const errors = runs.filter((run) => run.status === "error");
  return {
    provider: "pipeline",
    status: errors.length > 0 ? "error" : "ok",
    itemCount: runs.reduce((sum, run) => sum + run.itemCount, 0),
    snapshotCount: runs.reduce((sum, run) => sum + run.snapshotCount, 0),
    candleCount: runs.reduce((sum, run) => sum + run.candleCount, 0),
    message: errors.length > 0
      ? `${errors.length} CS2 pipeline step${errors.length === 1 ? "" : "s"} failed.`
      : null,
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
}): Promise<Cs2PipelineSyncSummary> {
  const runs: Cs2SyncSummary[] = [];
  const includeCatalog = params.includeCatalog ?? true;
  const includeLatest = params.includeLatest ?? true;

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
      runs.push(await syncCs2LatestPrices({
        provider: "cs2cap",
        providers: CS2CAP_PRIORITY_PROVIDERS,
        limit: params.latestLimit,
      }));
    }

    if (process.env.PRICEMPIRE_API_KEY) {
      runs.push(await syncCs2LatestPrices({
        provider: "pricempire",
        providers: PRICEMPIRE_PRIORITY_SOURCES,
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
