import type { Prisma } from "@/generated/prisma";
import {
  inferCategory,
  inferExterior,
  inferItemType,
} from "@/lib/cs2/normalization";
import type { ProviderCandleInput, ProviderCatalogItemInput, ProviderItemInput } from "@/lib/cs2/providers/types";
import { prisma } from "@/lib/db";

function toJsonInput(raw: Record<string, unknown> | undefined) {
  return raw ? JSON.parse(JSON.stringify(raw)) as Prisma.InputJsonValue : undefined;
}

function minNullable(values: Array<number | null>) {
  const numeric = values.filter((value): value is number => value !== null);
  return numeric.length > 0 ? Math.min(...numeric) : null;
}

function maxNullable(values: Array<number | null>) {
  const numeric = values.filter((value): value is number => value !== null);
  return numeric.length > 0 ? Math.max(...numeric) : null;
}

function averageNullable(values: Array<number | null>) {
  const numeric = values.filter((value): value is number => value !== null);
  return numeric.length > 0
    ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length
    : null;
}

export async function refreshCs2ItemMarketSummary(itemId: string) {
  const snapshots = await prisma.cs2MarketLatestSnapshot.findMany({
    where: { itemId },
    select: {
      marketRegion: true,
      askCents: true,
      bidCents: true,
      askVolume: true,
      bidVolume: true,
      salesVolume24h: true,
      liquidityScore: true,
      observedAt: true,
    },
  });

  const bestAskCents = minNullable(snapshots.map((snapshot) => snapshot.askCents));
  const bestBidCents = maxNullable(snapshots.map((snapshot) => snapshot.bidCents));
  const chineseAskCents = minNullable(snapshots
    .filter((snapshot) => snapshot.marketRegion === "china")
    .map((snapshot) => snapshot.askCents));
  const globalAskCents = minNullable(snapshots
    .filter((snapshot) => snapshot.marketRegion !== "china")
    .map((snapshot) => snapshot.askCents));
  const spreadPercent = chineseAskCents && globalAskCents
    ? Number((((chineseAskCents - globalAskCents) / globalAskCents) * 100).toFixed(2))
    : null;
  const latestObservedAt = snapshots.length > 0
    ? new Date(Math.max(...snapshots.map((snapshot) => snapshot.observedAt.getTime())))
    : null;

  await prisma.cs2ItemMarketSummary.upsert({
    where: { itemId },
    update: {
      bestAskCents,
      bestBidCents,
      chineseAskCents,
      globalAskCents,
      spreadPercent,
      askVolumeTotal: snapshots.reduce((sum, snapshot) => sum + (snapshot.askVolume ?? 0), 0),
      bidVolumeTotal: snapshots.reduce((sum, snapshot) => sum + (snapshot.bidVolume ?? 0), 0),
      salesVolume24hTotal: snapshots.reduce((sum, snapshot) => sum + (snapshot.salesVolume24h ?? 0), 0),
      liquidityScore: averageNullable(snapshots.map((snapshot) => snapshot.liquidityScore)),
      latestObservedAt,
    },
    create: {
      itemId,
      bestAskCents,
      bestBidCents,
      chineseAskCents,
      globalAskCents,
      spreadPercent,
      askVolumeTotal: snapshots.reduce((sum, snapshot) => sum + (snapshot.askVolume ?? 0), 0),
      bidVolumeTotal: snapshots.reduce((sum, snapshot) => sum + (snapshot.bidVolume ?? 0), 0),
      salesVolume24hTotal: snapshots.reduce((sum, snapshot) => sum + (snapshot.salesVolume24h ?? 0), 0),
      liquidityScore: averageNullable(snapshots.map((snapshot) => snapshot.liquidityScore)),
      latestObservedAt,
    },
  });
}

export async function createCs2SyncRun(provider: string) {
  try {
    return await prisma.cs2MarketSyncRun.create({
      data: {
        provider,
        status: "running",
      },
    });
  } catch {
    return null;
  }
}

export async function finishCs2SyncRun(params: {
  id?: string;
  status: "ok" | "error";
  itemCount: number;
  snapshotCount: number;
  message?: string | null;
}) {
  if (!params.id) return;
  await prisma.cs2MarketSyncRun.update({
    where: { id: params.id },
    data: {
      status: params.status,
      itemCount: params.itemCount,
      snapshotCount: params.snapshotCount,
      message: params.message,
      finishedAt: new Date(),
    },
  });
}

export async function persistProviderItems(items: ProviderItemInput[]) {
  let snapshotCount = 0;

  for (const providerItem of items) {
    const item = await prisma.cs2Item.upsert({
      where: { marketHashName: providerItem.marketHashName },
      update: {
        itemType: providerItem.itemType,
        category: providerItem.category,
        rarity: providerItem.rarity,
        exterior: providerItem.exterior,
        collection: providerItem.collection,
        imageUrl: providerItem.imageUrl,
        tradable: providerItem.tradable,
      },
      create: {
        marketHashName: providerItem.marketHashName,
        itemType: providerItem.itemType,
        category: providerItem.category,
        rarity: providerItem.rarity,
        exterior: providerItem.exterior,
        collection: providerItem.collection,
        imageUrl: providerItem.imageUrl,
        tradable: providerItem.tradable,
      },
    });

    const snapshotRows = providerItem.snapshots.map((snapshot) => ({
      itemId: item.id,
      provider: snapshot.provider,
      marketName: snapshot.marketName,
      marketRegion: snapshot.marketRegion,
      askCents: snapshot.askCents,
      bidCents: snapshot.bidCents,
      medianCents: snapshot.medianCents,
      askVolume: snapshot.askVolume,
      bidVolume: snapshot.bidVolume,
      salesVolume24h: snapshot.salesVolume24h,
      liquidityScore: snapshot.liquidityScore,
      observedAt: snapshot.observedAt,
      sourceUrl: snapshot.sourceUrl,
      raw: toJsonInput(snapshot.raw),
    }));

    if (snapshotRows.length > 0) {
      await prisma.cs2MarketSnapshot.createMany({ data: snapshotRows });
      snapshotCount += snapshotRows.length;
    }

    await Promise.all(providerItem.snapshots.map((snapshot) => prisma.cs2MarketLatestSnapshot.upsert({
      where: {
        itemId_provider_marketName: {
          itemId: item.id,
          provider: snapshot.provider,
          marketName: snapshot.marketName,
        },
      },
      update: {
        marketRegion: snapshot.marketRegion,
        askCents: snapshot.askCents,
        bidCents: snapshot.bidCents,
        medianCents: snapshot.medianCents,
        askVolume: snapshot.askVolume,
        bidVolume: snapshot.bidVolume,
        salesVolume24h: snapshot.salesVolume24h,
        liquidityScore: snapshot.liquidityScore,
        observedAt: snapshot.observedAt,
        sourceUrl: snapshot.sourceUrl,
        raw: toJsonInput(snapshot.raw),
      },
      create: {
        itemId: item.id,
        provider: snapshot.provider,
        marketName: snapshot.marketName,
        marketRegion: snapshot.marketRegion,
        askCents: snapshot.askCents,
        bidCents: snapshot.bidCents,
        medianCents: snapshot.medianCents,
        askVolume: snapshot.askVolume,
        bidVolume: snapshot.bidVolume,
        salesVolume24h: snapshot.salesVolume24h,
        liquidityScore: snapshot.liquidityScore,
        observedAt: snapshot.observedAt,
        sourceUrl: snapshot.sourceUrl,
        raw: toJsonInput(snapshot.raw),
      },
    })));

    await refreshCs2ItemMarketSummary(item.id);
  }

  return snapshotCount;
}

export async function persistProviderCatalogItems(items: ProviderCatalogItemInput[]) {
  for (const providerItem of items) {
    await prisma.cs2Item.upsert({
      where: { marketHashName: providerItem.marketHashName },
      update: {
        itemType: providerItem.itemType,
        category: providerItem.category,
        rarity: providerItem.rarity,
        exterior: providerItem.exterior,
        collection: providerItem.collection,
        imageUrl: providerItem.imageUrl,
        tradable: providerItem.tradable,
      },
      create: {
        marketHashName: providerItem.marketHashName,
        itemType: providerItem.itemType,
        category: providerItem.category,
        rarity: providerItem.rarity,
        exterior: providerItem.exterior,
        collection: providerItem.collection,
        imageUrl: providerItem.imageUrl,
        tradable: providerItem.tradable,
      },
    });
  }
}

export async function persistProviderCandles(candles: ProviderCandleInput[]) {
  let candleCount = 0;
  for (const candle of candles) {
    const item = await prisma.cs2Item.upsert({
      where: { marketHashName: candle.marketHashName },
      update: {},
      create: {
        marketHashName: candle.marketHashName,
        itemType: inferItemType(candle.marketHashName),
        category: inferCategory(candle.marketHashName),
        exterior: inferExterior(candle.marketHashName),
        tradable: true,
      },
    });

    await prisma.cs2PriceCandle.upsert({
      where: {
        itemId_provider_marketName_interval_startsAt: {
          itemId: item.id,
          provider: candle.provider,
          marketName: candle.marketName,
          interval: candle.interval,
          startsAt: candle.startsAt,
        },
      },
      update: {
        openCents: candle.openCents,
        highCents: candle.highCents,
        lowCents: candle.lowCents,
        closeCents: candle.closeCents,
        volume: candle.volume,
      },
      create: {
        itemId: item.id,
        provider: candle.provider,
        marketName: candle.marketName,
        interval: candle.interval,
        openCents: candle.openCents,
        highCents: candle.highCents,
        lowCents: candle.lowCents,
        closeCents: candle.closeCents,
        volume: candle.volume,
        startsAt: candle.startsAt,
      },
    });
    candleCount += 1;
  }
  return candleCount;
}

export async function getCs2WatchlistMarketHashNames(params: {
  ownerKey: string;
  limit?: number;
}) {
  const rows = await prisma.cs2WatchlistItem.findMany({
    where: { ownerKey: params.ownerKey },
    include: {
      item: {
        select: { marketHashName: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: Math.min(250, Math.max(1, params.limit ?? 100)),
  });

  return rows.map((row) => row.item.marketHashName);
}

export async function getCs2MissingChinesePriceMarketHashNames(params: {
  limit?: number;
  staleAfterHours?: number;
}) {
  const staleBefore = new Date(Date.now() - Math.max(1, params.staleAfterHours ?? 12) * 60 * 60 * 1000);
  const rows = await prisma.cs2Item.findMany({
    where: {
      OR: [
        { marketSummary: { is: null } },
        { marketSummary: { is: { chineseAskCents: null } } },
        { marketSummary: { is: { latestObservedAt: { lt: staleBefore } } } },
      ],
    },
    select: { marketHashName: true },
    orderBy: [
      { marketSummary: { latestObservedAt: "asc" } },
      { updatedAt: "asc" },
    ],
    take: Math.min(250, Math.max(1, params.limit ?? 100)),
  });

  return rows.map((row) => row.marketHashName);
}

export async function getCs2MissingHistoryMarketHashNames(params: {
  limit?: number;
  staleAfterDays?: number;
}) {
  const staleBefore = new Date(Date.now() - Math.max(1, params.staleAfterDays ?? 7) * 24 * 60 * 60 * 1000);
  const rows = await prisma.cs2Item.findMany({
    where: {
      OR: [
        { priceCandles: { none: {} } },
        { priceCandles: { every: { startsAt: { lt: staleBefore } } } },
      ],
    },
    select: { marketHashName: true },
    orderBy: { updatedAt: "asc" },
    take: Math.min(250, Math.max(1, params.limit ?? 100)),
  });

  return rows.map((row) => row.marketHashName);
}

export async function getCs2SyncStatus() {
  const [
    itemCount,
    latestSnapshotCount,
    marketSummaryCount,
    candleCount,
    itemsWithLatestSnapshots,
    itemsWithChinesePrice,
    itemsWithGlobalPrice,
    itemsWithHistory,
    providerCoverage,
    lastRuns,
    latestObservation,
  ] = await Promise.all([
    prisma.cs2Item.count(),
    prisma.cs2MarketLatestSnapshot.count(),
    prisma.cs2ItemMarketSummary.count(),
    prisma.cs2PriceCandle.count(),
    prisma.cs2Item.count({ where: { latestSnapshots: { some: {} } } }),
    prisma.cs2ItemMarketSummary.count({ where: { chineseAskCents: { not: null } } }),
    prisma.cs2ItemMarketSummary.count({ where: { globalAskCents: { not: null } } }),
    prisma.cs2Item.count({ where: { priceCandles: { some: {} } } }),
    prisma.cs2MarketLatestSnapshot.groupBy({
      by: ["provider", "marketRegion"],
      _count: { _all: true, itemId: true },
      orderBy: { _count: { itemId: "desc" } },
    }),
    prisma.cs2MarketSyncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.cs2MarketLatestSnapshot.findFirst({
      orderBy: { observedAt: "desc" },
      select: { observedAt: true, provider: true, marketName: true },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    itemCount,
    latestSnapshotCount,
    marketSummaryCount,
    candleCount,
    coverage: {
      itemsWithLatestSnapshots,
      itemsWithChinesePrice,
      itemsWithGlobalPrice,
      itemsWithHistory,
      itemsMissingLatestSnapshots: Math.max(0, itemCount - itemsWithLatestSnapshots),
      itemsMissingChinesePrice: Math.max(0, itemCount - itemsWithChinesePrice),
      itemsMissingGlobalPrice: Math.max(0, itemCount - itemsWithGlobalPrice),
      itemsMissingHistory: Math.max(0, itemCount - itemsWithHistory),
    },
    providerCoverage: providerCoverage.map((group) => ({
      provider: group.provider,
      marketRegion: group.marketRegion,
      itemCount: group._count.itemId,
      snapshotCount: group._count._all,
    })),
    latestObservation: latestObservation ? {
      observedAt: latestObservation.observedAt.toISOString(),
      provider: latestObservation.provider,
      marketName: latestObservation.marketName,
    } : null,
    recentRuns: lastRuns.map((run) => ({
      id: run.id,
      provider: run.provider,
      status: run.status,
      itemCount: run.itemCount,
      snapshotCount: run.snapshotCount,
      message: run.message,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
    })),
  };
}
