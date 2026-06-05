import { buildCs2MarketAnalysis } from "@/lib/cs2/analysisService";
import { dbItemToCs2ItemView } from "@/lib/cs2/itemView";
import { SAMPLE_CS2_ITEMS } from "@/lib/cs2/sampleData";
import type { Cs2ItemView, Cs2MarketAnalysis, Cs2WatchlistEntryView } from "@/lib/cs2/types";
import { prisma } from "@/lib/db";

const STALE_OBSERVATION_MS = 1000 * 60 * 60 * 12;

function sampleWatchlist(ownerKey: string): Cs2WatchlistEntryView[] {
  if (!ownerKey) return [];
  return SAMPLE_CS2_ITEMS.slice(0, 3).map((item) => ({
    id: `sample-watch-${item.id}`,
    itemId: item.id,
    marketHashName: item.marketHashName,
    targetBuyCents: item.chineseAskCents ? Math.round(item.chineseAskCents * 0.95) : null,
    targetSellCents: item.globalAskCents ? Math.round(item.globalAskCents * 1.08) : null,
    notes: "Sample watch item. Add an API key and database to persist live market targets.",
    createdAt: new Date().toISOString(),
  }));
}

async function getWatchlist(ownerKey: string): Promise<Cs2WatchlistEntryView[]> {
  const rows = await prisma.cs2WatchlistItem.findMany({
    where: { ownerKey },
    include: { item: true },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    itemId: row.itemId,
    marketHashName: row.item.marketHashName,
    targetBuyCents: row.targetBuyCents,
    targetSellCents: row.targetSellCents,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  }));
}

async function getAnalysisItems() {
  const rows = await prisma.cs2Item.findMany({
    where: {
      OR: [
        { marketSummary: { is: { spreadPercent: { not: null } } } },
        { priceCandles: { some: {} } },
      ],
    },
    include: {
      latestSnapshots: { orderBy: { observedAt: "desc" } },
      marketSnapshots: { orderBy: { observedAt: "desc" }, take: 40 },
      priceCandles: { orderBy: { startsAt: "asc" }, take: 60 },
      marketSummary: true,
    },
    orderBy: [
      { marketSummary: { spreadPercent: "asc" } },
      { marketSummary: { liquidityScore: "desc" } },
      { updatedAt: "desc" },
    ],
    take: 500,
  });

  return rows.map(dbItemToCs2ItemView);
}

async function getCoverageCounts(items: Cs2ItemView[]): Promise<Pick<Cs2MarketAnalysis, "marketCoverage">["marketCoverage"]> {
  const [
    totalItems,
    itemsWithChinesePrice,
    itemsWithGlobalPrice,
    itemsWithCrossMarketSpread,
    itemsWithHistory,
    candleCount,
    marketGroups,
    itemTypeGroups,
  ] = await Promise.all([
    prisma.cs2Item.count(),
    prisma.cs2ItemMarketSummary.count({ where: { chineseAskCents: { not: null } } }),
    prisma.cs2ItemMarketSummary.count({ where: { globalAskCents: { not: null } } }),
    prisma.cs2ItemMarketSummary.count({ where: { spreadPercent: { not: null } } }),
    prisma.cs2Item.count({ where: { priceCandles: { some: {} } } }),
    prisma.cs2PriceCandle.count(),
    prisma.cs2MarketLatestSnapshot.groupBy({
      by: ["provider", "marketName", "marketRegion"],
      _count: { itemId: true, askCents: true, bidCents: true },
      _sum: { askVolume: true, bidVolume: true, salesVolume24h: true },
      _avg: { liquidityScore: true },
      _max: { observedAt: true },
      orderBy: { _count: { itemId: "desc" } },
    }),
    prisma.cs2Item.groupBy({
      by: ["itemType"],
      _count: { _all: true },
      orderBy: { _count: { itemType: "desc" } },
    }),
  ]);

  const itemTypeEntries = await Promise.all(itemTypeGroups.map(async (group) => {
    const itemType = group.itemType;
    const [
      typeWithChinesePrice,
      typeWithGlobalPrice,
      typeWithHistory,
      typeCandleCount,
    ] = await Promise.all([
      prisma.cs2Item.count({ where: { itemType, marketSummary: { is: { chineseAskCents: { not: null } } } } }),
      prisma.cs2Item.count({ where: { itemType, marketSummary: { is: { globalAskCents: { not: null } } } } }),
      prisma.cs2Item.count({ where: { itemType, priceCandles: { some: {} } } }),
      prisma.cs2PriceCandle.count({ where: { item: { itemType } } }),
    ]);

    return {
      itemType,
      itemCount: group._count._all,
      itemsWithChinesePrice: typeWithChinesePrice,
      itemsWithGlobalPrice: typeWithGlobalPrice,
      itemsWithHistory: typeWithHistory,
      candleCount: typeCandleCount,
    };
  }));

  const staleBefore = Date.now() - STALE_OBSERVATION_MS;
  const staleItems = items.filter((item) => {
    const latest = Math.max(...item.snapshots.map((snapshot) => new Date(snapshot.observedAt).getTime()).filter(Number.isFinite));
    return Number.isFinite(latest) && latest < staleBefore;
  }).length;

  return {
    totalItems,
    itemsWithChinesePrice,
    itemsWithGlobalPrice,
    itemsWithCrossMarketSpread,
    itemsWithHistory,
    candleCount,
    markets: marketGroups.map((group) => ({
      provider: group.provider,
      marketName: group.marketName,
      marketRegion: group.marketRegion as "china" | "global" | "north-america" | "europe",
      itemCount: group._count.itemId,
      askCount: group._count.askCents,
      bidCount: group._count.bidCents,
      askVolumeTotal: group._sum.askVolume ?? 0,
      bidVolumeTotal: group._sum.bidVolume ?? 0,
      salesVolume24hTotal: group._sum.salesVolume24h ?? 0,
      averageLiquidityScore: group._avg.liquidityScore === null ? null : Number(group._avg.liquidityScore.toFixed(2)),
      latestObservedAt: group._max.observedAt?.toISOString() ?? null,
      staleItemCount: 0,
    })),
    itemTypes: itemTypeEntries.sort((a, b) => b.itemCount - a.itemCount || a.itemType.localeCompare(b.itemType)),
    gaps: {
      missingChinesePrice: totalItems - itemsWithChinesePrice,
      missingGlobalPrice: totalItems - itemsWithGlobalPrice,
      missingCrossMarketSpread: totalItems - itemsWithCrossMarketSpread,
      missingHistory: totalItems - itemsWithHistory,
      staleItems,
    },
  };
}

export async function getCs2DatabaseMarketAnalysis(ownerKey: string): Promise<Cs2MarketAnalysis> {
  try {
    const [items, watchlist] = await Promise.all([
      getAnalysisItems(),
      getWatchlist(ownerKey),
    ]);
    if (items.length === 0) return buildCs2MarketAnalysis(SAMPLE_CS2_ITEMS, sampleWatchlist(ownerKey));

    const analysis = buildCs2MarketAnalysis(items, watchlist);
    return {
      ...analysis,
      marketCoverage: await getCoverageCounts(items),
    };
  } catch {
    return buildCs2MarketAnalysis(SAMPLE_CS2_ITEMS, sampleWatchlist(ownerKey));
  }
}
