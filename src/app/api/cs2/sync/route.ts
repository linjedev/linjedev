import { NextResponse } from "next/server";
import { z } from "zod";
import { syncCs2Catalog, syncCs2GapSweep, syncCs2History, syncCs2LatestPrices, syncCs2MarketPipeline, syncCs2MissingHistory, syncCs2WatchlistHistory } from "@/lib/cs2/syncService";

const cs2HistorySourceEnum = z.enum([
  "buff",
  "buff163",
  "buff163_buy",
  "youpin",
  "youpin_buy",
  "csfloat",
  "skinport",
  "c5game",
  "steam",
  "dmarket",
  "bitskins",
]);

const latestSchema = z.object({
  mode: z.literal("latest").default("latest"),
  provider: z.enum(["cs2.sh", "cs2cap", "pricempire", "skinport", "steam", "csfloat", "c5game", "cspriceapi", "marketcsgo", "waxpeer", "bitskins", "dmarket"]).default("cs2.sh"),
  marketHashNames: z.array(z.string().min(2)).max(250).optional(),
  providers: z.array(z.string().min(2)).max(80).optional(),
  limit: z.number().int().positive().max(100000).optional(),
  type: z.string().min(2).optional(),
}).superRefine((payload, context) => {
  if ((payload.provider === "c5game" || payload.provider === "cspriceapi" || payload.provider === "steam" || payload.provider === "csfloat" || payload.provider === "marketcsgo" || payload.provider === "waxpeer") && (payload.marketHashNames ?? []).length === 0) {
    context.addIssue({
      code: "custom",
      message: `${payload.provider} latest sync requires explicit marketHashNames`,
      path: ["marketHashNames"],
    });
  }
});

const catalogSchema = z.object({
  mode: z.literal("catalog"),
  provider: z.enum(["metadata", "cs2cap"]).default("metadata"),
  query: z.string().min(1).optional(),
  limit: z.number().int().positive().max(100000).optional(),
});

const historySchema = z.object({
  mode: z.literal("history"),
  provider: z.enum(["cs2.sh", "cs2cap", "pricempire", "csfloat", "steam", "marketcsgo"]).default("cs2.sh"),
  marketHashNames: z.array(z.string().min(2)).min(1).max(100),
  sources: z.array(cs2HistorySourceEnum).min(1).optional(),
  start: z.string().min(8).optional(),
  end: z.string().min(8).optional(),
  lookback: z.string().min(1).optional(),
  interval: z.enum(["5m", "30m", "1h", "1d"]).default("1d"),
  fill: z.boolean().optional(),
}).superRefine((payload, context) => {
  if (payload.provider === "cs2.sh" && (!payload.start || !payload.end)) {
    context.addIssue({
      code: "custom",
      message: "start and end are required for cs2.sh history sync",
      path: ["start"],
    });
  }
  if (payload.provider === "cs2cap" && payload.interval === "30m") {
    context.addIssue({
      code: "custom",
      message: "CS2Cap candles support 5m, 1h, and 1d intervals",
      path: ["interval"],
    });
  }
  if (payload.provider === "pricempire" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Pricempire history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "csfloat" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "CSFloat sales history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "steam" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Steam market history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "marketcsgo" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Market.CSGO sales history sync currently supports daily candles",
      path: ["interval"],
    });
  }
});

const watchlistHistorySchema = z.object({
  mode: z.literal("watchlist-history"),
  provider: z.enum(["cs2.sh", "cs2cap", "pricempire", "csfloat", "steam", "marketcsgo"]).default("cs2.sh"),
  ownerKey: z.string().min(2).max(200).optional(),
  sources: z.array(cs2HistorySourceEnum).min(1).optional(),
  start: z.string().min(8).optional(),
  end: z.string().min(8).optional(),
  lookback: z.string().min(1).optional(),
  interval: z.enum(["5m", "30m", "1h", "1d"]).default("1d"),
  fill: z.boolean().optional(),
  limit: z.number().int().positive().max(250).optional(),
  staleAfterDays: z.number().int().positive().max(365).optional(),
}).superRefine((payload, context) => {
  if (payload.provider === "cs2.sh" && (!payload.start || !payload.end)) {
    context.addIssue({
      code: "custom",
      message: "start and end are required for cs2.sh watchlist history sync",
      path: ["start"],
    });
  }
  if (payload.provider === "cs2cap" && payload.interval === "30m") {
    context.addIssue({
      code: "custom",
      message: "CS2Cap candles support 5m, 1h, and 1d intervals",
      path: ["interval"],
    });
  }
  if (payload.provider === "pricempire" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Pricempire history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "csfloat" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "CSFloat sales history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "steam" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Steam market history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "marketcsgo" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Market.CSGO sales history sync currently supports daily candles",
      path: ["interval"],
    });
  }
});

const historyGapsSchema = z.object({
  mode: z.literal("history-gaps"),
  provider: z.enum(["cs2.sh", "cs2cap", "pricempire", "csfloat", "steam", "marketcsgo"]).default("cs2cap"),
  sources: z.array(cs2HistorySourceEnum).min(1).optional(),
  start: z.string().min(8).optional(),
  end: z.string().min(8).optional(),
  lookback: z.string().min(1).optional(),
  interval: z.enum(["5m", "30m", "1h", "1d"]).default("1d"),
  fill: z.boolean().optional(),
  limit: z.number().int().positive().max(250).optional(),
  afterMarketHashName: z.string().min(2).optional(),
}).superRefine((payload, context) => {
  if (payload.provider === "cs2.sh" && (!payload.start || !payload.end)) {
    context.addIssue({
      code: "custom",
      message: "start and end are required for cs2.sh history gap sync",
      path: ["start"],
    });
  }
  if (payload.provider === "cs2cap" && payload.interval === "30m") {
    context.addIssue({
      code: "custom",
      message: "CS2Cap candles support 5m, 1h, and 1d intervals",
      path: ["interval"],
    });
  }
  if (payload.provider === "pricempire" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Pricempire history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "csfloat" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "CSFloat sales history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "steam" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Steam market history sync currently supports daily candles",
      path: ["interval"],
    });
  }
  if (payload.provider === "marketcsgo" && payload.interval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Market.CSGO sales history sync currently supports daily candles",
      path: ["interval"],
    });
  }
});

const pipelineSchema = z.object({
  mode: z.literal("pipeline"),
  includeCatalog: z.boolean().optional(),
  includeLatest: z.boolean().optional(),
  includeWatchlistHistory: z.boolean().optional(),
  latestLimit: z.number().int().positive().max(100000).optional(),
  catalogLimit: z.number().int().positive().max(100000).optional(),
  ownerKey: z.string().min(2).max(200).optional(),
  historyProvider: z.enum(["cs2.sh", "cs2cap", "pricempire", "csfloat", "steam", "marketcsgo"]).optional(),
  historySources: z.array(z.enum([
    "buff",
    "buff163",
    "buff163_buy",
    "youpin",
    "youpin_buy",
    "csfloat",
    "skinport",
    "c5game",
    "steam",
    "dmarket",
    "bitskins",
  ])).min(1).optional(),
  historyStart: z.string().min(8).optional(),
  historyEnd: z.string().min(8).optional(),
  historyLookback: z.string().min(1).optional(),
  historyInterval: z.enum(["5m", "30m", "1h", "1d"]).default("1d"),
  historyFill: z.boolean().optional(),
  watchlistLimit: z.number().int().positive().max(250).optional(),
  latestAfterMarketHashName: z.string().min(2).optional(),
}).superRefine((payload, context) => {
  if (payload.includeWatchlistHistory && payload.historyProvider === "cs2.sh" && (!payload.historyStart || !payload.historyEnd)) {
    context.addIssue({
      code: "custom",
      message: "historyStart and historyEnd are required for cs2.sh watchlist history pipeline sync",
      path: ["historyStart"],
    });
  }
  if (payload.includeWatchlistHistory && payload.historyProvider === "cs2cap" && payload.historyInterval === "30m") {
    context.addIssue({
      code: "custom",
      message: "CS2Cap candles support 5m, 1h, and 1d intervals",
      path: ["historyInterval"],
    });
  }
  if (payload.includeWatchlistHistory && payload.historyProvider === "pricempire" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Pricempire history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
  if (payload.includeWatchlistHistory && payload.historyProvider === "csfloat" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "CSFloat sales history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
  if (payload.includeWatchlistHistory && payload.historyProvider === "steam" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Steam market history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
  if (payload.includeWatchlistHistory && payload.historyProvider === "marketcsgo" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Market.CSGO sales history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
});

const sweepSchema = z.object({
  mode: z.literal("sweep"),
  target: z.enum(["latest-china", "history-gaps"]).default("latest-china"),
  maxBatches: z.number().int().positive().max(20).optional(),
  startAfterMarketHashName: z.string().min(2).optional(),
  latestLimit: z.number().int().positive().max(250).optional(),
  historyProvider: z.enum(["cs2.sh", "cs2cap", "pricempire", "csfloat", "steam", "marketcsgo"]).optional(),
  historySources: z.array(cs2HistorySourceEnum).min(1).optional(),
  historyStart: z.string().min(8).optional(),
  historyEnd: z.string().min(8).optional(),
  historyLookback: z.string().min(1).optional(),
  historyInterval: z.enum(["5m", "30m", "1h", "1d"]).default("1d"),
  historyFill: z.boolean().optional(),
  historyLimit: z.number().int().positive().max(250).optional(),
  staleAfterDays: z.number().int().positive().max(365).optional(),
}).superRefine((payload, context) => {
  if (payload.target === "history-gaps" && payload.historyProvider === "cs2.sh" && (!payload.historyStart || !payload.historyEnd)) {
    context.addIssue({
      code: "custom",
      message: "historyStart and historyEnd are required for cs2.sh history sweep",
      path: ["historyStart"],
    });
  }
  if (payload.target === "history-gaps" && payload.historyProvider === "cs2cap" && payload.historyInterval === "30m") {
    context.addIssue({
      code: "custom",
      message: "CS2Cap candles support 5m, 1h, and 1d intervals",
      path: ["historyInterval"],
    });
  }
  if (payload.target === "history-gaps" && payload.historyProvider === "pricempire" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Pricempire history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
  if (payload.target === "history-gaps" && payload.historyProvider === "csfloat" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "CSFloat sales history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
  if (payload.target === "history-gaps" && payload.historyProvider === "steam" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Steam market history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
  if (payload.target === "history-gaps" && payload.historyProvider === "marketcsgo" && payload.historyInterval !== "1d") {
    context.addIssue({
      code: "custom",
      message: "Market.CSGO sales history sync currently supports daily candles",
      path: ["historyInterval"],
    });
  }
});

const syncSchema = z.discriminatedUnion("mode", [latestSchema, catalogSchema, historySchema, watchlistHistorySchema, historyGapsSchema, pipelineSchema, sweepSchema]);

function readOwnerKey(request: Request, bodyOwnerKey?: string) {
  return bodyOwnerKey?.trim()
    || request.headers.get("x-linje-watch-owner")?.trim()
    || "linje-local-watchlist";
}

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CS2_SYNC_SECRET;
  if (!configuredSecret && process.env.NODE_ENV !== "production") return true;
  if (!configuredSecret) return false;
  return request.headers.get("x-cs2-sync-secret") === configuredSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = syncSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync payload" }, { status: 400 });
  }

  if (parsed.data.mode === "history") {
    const summary = await syncCs2History(parsed.data);
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  if (parsed.data.mode === "watchlist-history") {
    const summary = await syncCs2WatchlistHistory({
      ...parsed.data,
      ownerKey: readOwnerKey(request, parsed.data.ownerKey),
    });
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  if (parsed.data.mode === "history-gaps") {
    const summary = await syncCs2MissingHistory(parsed.data);
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  if (parsed.data.mode === "pipeline") {
    const summary = await syncCs2MarketPipeline({
      ...parsed.data,
      ownerKey: readOwnerKey(request, parsed.data.ownerKey),
    });
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  if (parsed.data.mode === "sweep") {
    const summary = await syncCs2GapSweep(parsed.data);
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  if (parsed.data.mode === "catalog") {
    const summary = await syncCs2Catalog(parsed.data);
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  const summary = await syncCs2LatestPrices(parsed.data);
  return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
}
