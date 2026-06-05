import { NextResponse } from "next/server";
import { z } from "zod";
import { syncCs2Catalog, syncCs2History, syncCs2LatestPrices, syncCs2MarketPipeline, syncCs2WatchlistHistory } from "@/lib/cs2/syncService";

const latestSchema = z.object({
  mode: z.literal("latest").default("latest"),
  provider: z.enum(["cs2.sh", "cs2cap", "pricempire", "skinport"]).default("cs2.sh"),
  marketHashNames: z.array(z.string().min(2)).max(250).optional(),
  providers: z.array(z.string().min(2)).max(80).optional(),
  limit: z.number().int().positive().max(100000).optional(),
  type: z.string().min(2).optional(),
});

const catalogSchema = z.object({
  mode: z.literal("catalog"),
  provider: z.literal("cs2cap").default("cs2cap"),
  query: z.string().min(1).optional(),
  limit: z.number().int().positive().max(100000).optional(),
});

const historySchema = z.object({
  mode: z.literal("history"),
  provider: z.enum(["cs2.sh", "cs2cap", "pricempire"]).default("cs2.sh"),
  marketHashNames: z.array(z.string().min(2)).min(1).max(100),
  sources: z.array(z.enum([
    "buff",
    "buff163",
    "buff163_buy",
    "youpin",
    "youpin_buy",
    "csfloat",
    "skinport",
    "c5game",
    "steam",
  ])).min(1).optional(),
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
});

const watchlistHistorySchema = z.object({
  mode: z.literal("watchlist-history"),
  provider: z.enum(["cs2.sh", "cs2cap", "pricempire"]).default("cs2.sh"),
  ownerKey: z.string().min(2).max(200).optional(),
  sources: z.array(z.enum([
    "buff",
    "buff163",
    "buff163_buy",
    "youpin",
    "youpin_buy",
    "csfloat",
    "skinport",
    "c5game",
    "steam",
  ])).min(1).optional(),
  start: z.string().min(8).optional(),
  end: z.string().min(8).optional(),
  lookback: z.string().min(1).optional(),
  interval: z.enum(["5m", "30m", "1h", "1d"]).default("1d"),
  fill: z.boolean().optional(),
  limit: z.number().int().positive().max(250).optional(),
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
});

const pipelineSchema = z.object({
  mode: z.literal("pipeline"),
  includeCatalog: z.boolean().optional(),
  includeLatest: z.boolean().optional(),
  includeWatchlistHistory: z.boolean().optional(),
  latestLimit: z.number().int().positive().max(100000).optional(),
  catalogLimit: z.number().int().positive().max(100000).optional(),
  ownerKey: z.string().min(2).max(200).optional(),
  historyProvider: z.enum(["cs2.sh", "cs2cap", "pricempire"]).optional(),
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
  ])).min(1).optional(),
  historyStart: z.string().min(8).optional(),
  historyEnd: z.string().min(8).optional(),
  historyLookback: z.string().min(1).optional(),
  historyInterval: z.enum(["5m", "30m", "1h", "1d"]).default("1d"),
  historyFill: z.boolean().optional(),
  watchlistLimit: z.number().int().positive().max(250).optional(),
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
});

const syncSchema = z.discriminatedUnion("mode", [latestSchema, catalogSchema, historySchema, watchlistHistorySchema, pipelineSchema]);

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

  if (parsed.data.mode === "pipeline") {
    const summary = await syncCs2MarketPipeline({
      ...parsed.data,
      ownerKey: readOwnerKey(request, parsed.data.ownerKey),
    });
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  if (parsed.data.mode === "catalog") {
    const summary = await syncCs2Catalog(parsed.data);
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
  }

  const summary = await syncCs2LatestPrices(parsed.data);
  return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 502 });
}
