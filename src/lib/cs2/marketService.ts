import { prisma } from "@/lib/db";
import { buildCs2MarketAnalysis } from "@/lib/cs2/analysisService";
import { CS2_MARKET_SOURCES, getConfiguredMarketProviders } from "@/lib/cs2/marketSources";
import { calculateCs2DerivedPrices, dbItemToCs2ItemView } from "@/lib/cs2/itemView";
import { fetchC5GameLatestItems } from "@/lib/cs2/providers/c5game";
import { fetchCsPriceApiLatestItems } from "@/lib/cs2/providers/cspriceapi";
import { fetchCs2ShLatestItems } from "@/lib/cs2/providers/cs2sh";
import { getCs2ItemMetadataByMarketHashName } from "@/lib/cs2/itemMetadataService";
import { hydrateCs2ItemsFromConfiguredProviders } from "@/lib/cs2/syncService";
import { inferCategory, inferExterior, inferItemType } from "@/lib/cs2/normalization";
import { SAMPLE_CS2_ITEMS } from "@/lib/cs2/sampleData";
import type { Cs2ItemView, Cs2MarketRegion, Cs2MarketSnapshotView, Cs2TrackerOverview, Cs2WatchlistEntryView } from "@/lib/cs2/types";

function filterItems(items: Cs2ItemView[], query: string | null) {
  if (!query) return items;
  const tokens = buildSearchQueryTokens(query);
  if (tokens.length === 0) return items;
  return items.filter((item) => {
    const haystack = [
      item.marketHashName,
      item.itemType,
      item.category,
      item.rarity,
      item.collection,
    ].filter(Boolean)
      .join(" ")
      .toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

function buildSearchQueryTokens(query: string | null) {
  return query
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean) ?? [];
}

function providerItemsToSnapshotMap(providerItems: Array<{
  marketHashName: string;
  snapshots: Array<{
    provider: string;
    marketName: string;
    marketRegion: Cs2MarketRegion;
    askCents: number | null;
    bidCents: number | null;
    medianCents: number | null;
    askVolume: number | null;
    bidVolume: number | null;
    salesVolume24h: number | null;
    liquidityScore: number | null;
    observedAt: Date;
    sourceUrl?: string;
  }>;
}>): Map<string, Cs2MarketSnapshotView[]> {
  const mapped = new Map<string, Cs2MarketSnapshotView[]>();

  for (const item of providerItems) {
    mapped.set(item.marketHashName, item.snapshots.map((snapshot) => ({
      provider: snapshot.provider,
      marketName: snapshot.marketName,
      marketRegion: snapshot.marketRegion,
      currency: "USD",
      askCents: snapshot.askCents,
      bidCents: snapshot.bidCents,
      medianCents: snapshot.medianCents,
      askVolume: snapshot.askVolume,
      bidVolume: snapshot.bidVolume,
      salesVolume24h: snapshot.salesVolume24h,
      liquidityScore: snapshot.liquidityScore,
      observedAt: snapshot.observedAt.toISOString(),
      sourceUrl: snapshot.sourceUrl,
    })));
  }

  return mapped;
}

function mergeLiveSnapshotMaps(snapshotMaps: Map<string, Cs2MarketSnapshotView[]>[]) {
  const merged = new Map<string, Cs2MarketSnapshotView[]>();

  for (const snapshotMap of snapshotMaps) {
    for (const [marketHashName, snapshots] of snapshotMap.entries()) {
      const existing = merged.get(marketHashName) ?? [];
      const byMarket = new Map(existing.map((snapshot) => [`${snapshot.provider}\u0000${snapshot.marketName}`, snapshot]));
      for (const snapshot of snapshots) {
        byMarket.set(`${snapshot.provider}\u0000${snapshot.marketName}`, snapshot);
      }
      merged.set(marketHashName, [...byMarket.values()]);
    }
  }

  return merged;
}

async function fetchConfiguredLatestSnapshots(marketHashNames: string[]): Promise<Map<string, Cs2MarketSnapshotView[]>> {
  if (marketHashNames.length === 0) return new Map();

  const snapshotMaps = await Promise.all([
    process.env.CS2SH_API_KEY
      ? fetchCs2ShLatestItems({ marketHashNames }).then(providerItemsToSnapshotMap).catch((error) => {
        console.warn("[cs2] cs2.sh overview refresh failed.", error);
        return new Map<string, Cs2MarketSnapshotView[]>();
      })
      : Promise.resolve(new Map<string, Cs2MarketSnapshotView[]>()),
    process.env.C5GAME_API_KEY
      ? fetchC5GameLatestItems({ marketHashNames }).then(providerItemsToSnapshotMap).catch((error) => {
        console.warn("[cs2] C5Game overview refresh failed.", error);
        return new Map<string, Cs2MarketSnapshotView[]>();
      })
      : Promise.resolve(new Map<string, Cs2MarketSnapshotView[]>()),
    process.env.CSPRICEAPI_API_KEY
      ? fetchCsPriceApiLatestItems({ marketHashNames }).then(providerItemsToSnapshotMap).catch((error) => {
        console.warn("[cs2] CSPriceAPI overview refresh failed.", error);
        return new Map<string, Cs2MarketSnapshotView[]>();
      })
      : Promise.resolve(new Map<string, Cs2MarketSnapshotView[]>()),
  ]);

  return mergeLiveSnapshotMaps(snapshotMaps);
}

function buildItemSearchWhere(query?: string | null) {
  const tokens = buildSearchQueryTokens(query ?? null);
  if (tokens.length === 0) return undefined;
  return {
    AND: tokens.map((token) => ({
      OR: [
        { marketHashName: { contains: token, mode: "insensitive" as const } },
        { itemType: { contains: token, mode: "insensitive" as const } },
        { category: { contains: token, mode: "insensitive" as const } },
        { rarity: { contains: token, mode: "insensitive" as const } },
        { collection: { contains: token, mode: "insensitive" as const } },
      ],
    })),
  };
}

async function getDatabaseItems(query?: string | null) {
  const items = await prisma.cs2Item.findMany({
    where: buildItemSearchWhere(query),
    include: {
      latestSnapshots: {
        orderBy: { observedAt: "desc" },
      },
      marketSnapshots: {
        orderBy: { observedAt: "desc" },
        take: 80,
      },
      priceCandles: {
        orderBy: { startsAt: "asc" },
        take: 60,
      },
      marketSummary: true,
    },
    orderBy: { updatedAt: "desc" },
    take: query?.trim() ? 500 : 250,
  });

  return items.map(dbItemToCs2ItemView);
}

async function getDatabaseWatchlist(ownerKey: string): Promise<Cs2WatchlistEntryView[]> {
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

function getSampleWatchlist(ownerKey: string): Cs2WatchlistEntryView[] {
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

function buildMetrics(items: Cs2ItemView[], watchlist: Cs2WatchlistEntryView[]) {
  const markets = new Set(items.flatMap((item) => item.snapshots.map((snapshot) => snapshot.marketName)));
  const chinaSpreads = items
    .map((item) => item.spreadPercent)
    .filter((value): value is number => value !== null);
  return {
    trackedItems: items.length,
    watchedItems: watchlist.length,
    chineseMarkets: CS2_MARKET_SOURCES.filter((source) => source.region === "china").length,
    marketsRepresented: markets.size,
    averageChinaDiscountPercent: chinaSpreads.length > 0
      ? Number((chinaSpreads.reduce((sum, value) => sum + value, 0) / chinaSpreads.length).toFixed(2))
      : null,
  };
}

function buildSourceStatus(params: {
  sources: Cs2TrackerOverview["sources"];
  items: Cs2ItemView[];
  configuredProviders: string[];
}) {
  const configured = new Set(params.configuredProviders.map((provider) => provider.toLowerCase()));
  const marketCounts = new Map<string, { itemIds: Set<string>; marketNames: Set<string> }>();

  for (const item of params.items) {
    for (const snapshot of item.snapshots) {
      const marketKey = snapshot.marketName.toLowerCase();
      const providerKey = snapshot.provider.toLowerCase();
      for (const key of [marketKey, providerKey]) {
        const existing = marketCounts.get(key) ?? { itemIds: new Set<string>(), marketNames: new Set<string>() };
        existing.itemIds.add(item.id);
        existing.marketNames.add(snapshot.marketName);
        marketCounts.set(key, existing);
      }
    }
  }

  return params.sources.map((source) => {
    const coverage = marketCounts.get(source.id.toLowerCase()) ?? marketCounts.get(source.name.toLowerCase()) ?? {
      itemIds: new Set<string>(),
      marketNames: new Set<string>(),
    };
    const hasLiveCoverage = coverage.itemIds.size > 0;
    const configuredDirect = configured.has(source.id.toLowerCase());
    const officialApi: "official" | "indirect" | "unknown" = source.id === "c5game"
      ? "official"
      : source.role === "aggregator"
        ? "official"
        : source.id === "buff" || source.id === "youpin"
          ? "unknown"
          : "indirect";
    const integration: "direct" | "aggregated" | "unavailable" = configuredDirect
      ? "direct"
      : hasLiveCoverage
        ? "aggregated"
        : "unavailable";

    const note = integration === "direct"
      ? officialApi === "official"
        ? "Direct API configured."
        : "Direct source configured."
      : integration === "aggregated"
        ? "Visible through configured aggregator feeds."
        : source.id === "buff" || source.id === "youpin"
          ? "No direct official public API verified in this build."
          : "No live source configured.";

    return {
      id: source.id,
      name: source.name,
      homepageUrl: source.homepageUrl,
      region: source.region,
      role: source.role,
      configured: configuredDirect,
      hasLiveCoverage,
      integration,
      officialApi,
      marketsSeen: coverage.marketNames.size,
      itemCount: coverage.itemIds.size,
      note,
    };
  });
}

export async function getCs2TrackerOverview(params: {
  ownerKey: string;
  query?: string | null;
}): Promise<Cs2TrackerOverview> {
  let warning: string | null = null;
  let mode: Cs2TrackerOverview["mode"] = "sample";
  let items = SAMPLE_CS2_ITEMS;
  let watchlist = getSampleWatchlist(params.ownerKey);

  try {
    const databaseItems = await getDatabaseItems(params.query);
    if (databaseItems.length > 0) {
      items = databaseItems;
      mode = "live";
    }
    watchlist = await getDatabaseWatchlist(params.ownerKey);
  } catch (error) {
    console.warn("[cs2] Database unavailable; showing sample market data.", error);
    warning = "Database unavailable or CS2 schema pending; showing sample market data.";
  }

  const configuredProviders = getConfiguredMarketProviders();
  if (configuredProviders.includes("cs2.sh") || configuredProviders.includes("c5game") || configuredProviders.includes("cspriceapi")) {
    try {
      const liveSnapshots = await fetchConfiguredLatestSnapshots(items.slice(0, 40).map((item) => item.marketHashName));
      if (liveSnapshots.size > 0) {
        items = items.map((item) => {
          const snapshots = liveSnapshots.get(item.marketHashName);
          if (!snapshots || snapshots.length === 0) return item;
          return calculateCs2DerivedPrices({ ...item, snapshots });
        });
        mode = mode === "sample" ? "mixed" : "live";
      }
    } catch (error) {
      warning = error instanceof Error ? error.message : "Live market refresh failed.";
    }
  }

  const filteredItems = filterItems(items, params.query ?? null);
  return {
    generatedAt: new Date().toISOString(),
    mode,
    warning,
    sources: CS2_MARKET_SOURCES,
    sourceStatus: buildSourceStatus({
      sources: CS2_MARKET_SOURCES,
      items: filteredItems,
      configuredProviders,
    }),
    configuredProviders,
    items: filteredItems,
    watchlist,
    analysis: buildCs2MarketAnalysis(filteredItems, watchlist),
    metrics: buildMetrics(filteredItems, watchlist),
  };
}

export async function addCs2WatchlistItem(params: {
  ownerKey: string;
  marketHashName: string;
  targetBuyCents?: number | null;
  targetSellCents?: number | null;
  notes?: string | null;
}) {
  const sampleMatch = SAMPLE_CS2_ITEMS.find((item) => item.marketHashName === params.marketHashName);
  const metadataMap = await getCs2ItemMetadataByMarketHashName([params.marketHashName]);
  const metadata = metadataMap.get(params.marketHashName);
  const item = await prisma.cs2Item.upsert({
    where: { marketHashName: params.marketHashName },
    update: {},
    create: {
      marketHashName: params.marketHashName,
      itemType: sampleMatch?.itemType ?? inferItemType(params.marketHashName),
      category: sampleMatch?.category ?? inferCategory(params.marketHashName),
      rarity: sampleMatch?.rarity ?? metadata?.rarity,
      exterior: sampleMatch?.exterior ?? inferExterior(params.marketHashName),
      collection: sampleMatch?.collection ?? metadata?.collection,
      imageUrl: sampleMatch?.imageUrl ?? metadata?.imageUrl,
      tradable: true,
    },
  });

  if (sampleMatch) {
    await Promise.all(sampleMatch.snapshots.map((snapshot) => prisma.cs2MarketSnapshot.create({
      data: {
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
        observedAt: new Date(),
        sourceUrl: snapshot.sourceUrl,
      },
    })));
  }

  const hydration = await hydrateCs2ItemsFromConfiguredProviders({
    marketHashNames: [params.marketHashName],
  });

  const watchlistItem = await prisma.cs2WatchlistItem.upsert({
    where: {
      ownerKey_itemId: {
        ownerKey: params.ownerKey,
        itemId: item.id,
      },
    },
    update: {
      targetBuyCents: params.targetBuyCents,
      targetSellCents: params.targetSellCents,
      notes: params.notes,
    },
    create: {
      ownerKey: params.ownerKey,
      itemId: item.id,
      targetBuyCents: params.targetBuyCents,
      targetSellCents: params.targetSellCents,
      notes: params.notes,
    },
  });

  return {
    watchlistItem,
    hydration,
  };
}

export async function removeCs2WatchlistItem(ownerKey: string, itemId: string) {
  await prisma.cs2WatchlistItem.delete({
    where: {
      ownerKey_itemId: {
        ownerKey,
        itemId,
      },
    },
  });
}
