import type {
  Cs2ItemView,
  Cs2ItemTypeCoverageEntry,
  Cs2MarketAnalysis,
  Cs2MarketCoverageEntry,
  Cs2MarketOpportunity,
  Cs2MarketRegion,
  Cs2PriceCandleView,
  Cs2TrendSignal,
  Cs2WatchlistEntryView,
  Cs2WatchlistSignal,
} from "@/lib/cs2/types";

const STALE_OBSERVATION_MS = 1000 * 60 * 60 * 12;

function firstMarketWithAsk(item: Cs2ItemView, region: "china" | "global") {
  const snapshots = item.snapshots
    .filter((snapshot) => (region === "china" ? snapshot.marketRegion === "china" : snapshot.marketRegion !== "china"))
    .filter((snapshot) => snapshot.askCents !== null)
    .sort((a, b) => (a.askCents ?? Number.MAX_SAFE_INTEGER) - (b.askCents ?? Number.MAX_SAFE_INTEGER));
  return snapshots[0] ?? null;
}

function liquidityFor(item: Cs2ItemView) {
  const askVolume = item.snapshots.reduce((sum, snapshot) => sum + (snapshot.askVolume ?? 0), 0);
  const bidVolume = item.snapshots.reduce((sum, snapshot) => sum + (snapshot.bidVolume ?? 0), 0);
  const salesVolume = item.snapshots.reduce((sum, snapshot) => sum + (snapshot.salesVolume24h ?? 0), 0);
  const explicitScore = item.snapshots
    .map((snapshot) => snapshot.liquidityScore)
    .filter((value): value is number => value !== null);
  const volumeScore = Math.min(100, Math.log10(Math.max(1, askVolume + bidVolume + salesVolume)) * 25);
  return explicitScore.length > 0
    ? Math.round((explicitScore.reduce((sum, value) => sum + value, 0) / explicitScore.length + volumeScore) / 2)
    : Math.round(volumeScore);
}

export function buildCs2MarketOpportunities(items: Cs2ItemView[]): Cs2MarketOpportunity[] {
  return items
    .map((item) => {
      const chineseMarket = firstMarketWithAsk(item, "china");
      const globalMarket = firstMarketWithAsk(item, "global");
      if (!chineseMarket?.askCents || !globalMarket?.askCents) return null;
      const spreadPercent = Number((((chineseMarket.askCents - globalMarket.askCents) / globalMarket.askCents) * 100).toFixed(2));
      if (spreadPercent >= 0) return null;
      const askVolume = item.snapshots.reduce((sum, snapshot) => sum + (snapshot.askVolume ?? 0), 0);
      const liquidityScore = liquidityFor(item);
      const analysisScore = Number((Math.abs(spreadPercent) * 4 + liquidityScore * 0.6 + Math.min(30, askVolume / 100)).toFixed(2));

      return {
        itemId: item.id,
        marketHashName: item.marketHashName,
        itemType: item.itemType,
        chineseAskCents: chineseMarket.askCents,
        globalAskCents: globalMarket.askCents,
        spreadPercent,
        bestChineseMarket: chineseMarket.marketName,
        bestGlobalMarket: globalMarket.marketName,
        askVolume,
        liquidityScore,
        analysisScore,
      };
    })
    .filter((opportunity): opportunity is Cs2MarketOpportunity => opportunity !== null)
    .sort((a, b) => b.analysisScore - a.analysisScore)
    .slice(0, 20);
}

export function buildCs2WatchlistSignals(items: Cs2ItemView[], watchlist: Cs2WatchlistEntryView[]): Cs2WatchlistSignal[] {
  const itemByName = new Map(items.map((item) => [item.marketHashName, item]));
  const signals: Cs2WatchlistSignal[] = [];

  for (const entry of watchlist) {
    const item = itemByName.get(entry.marketHashName);
    if (!item) continue;
    if (entry.targetBuyCents && item.chineseAskCents && item.chineseAskCents <= entry.targetBuyCents) {
      signals.push({
        itemId: item.id,
        marketHashName: item.marketHashName,
        signal: "buy-target",
        severity: "critical",
        message: "Chinese anchor ask is at or below the buy target.",
      });
    }
    if (entry.targetSellCents && item.globalAskCents && item.globalAskCents >= entry.targetSellCents) {
      signals.push({
        itemId: item.id,
        marketHashName: item.marketHashName,
        signal: "sell-target",
        severity: "warning",
        message: "Global ask is at or above the sell target.",
      });
    }
    if (item.spreadPercent !== null && item.spreadPercent <= -5) {
      signals.push({
        itemId: item.id,
        marketHashName: item.marketHashName,
        signal: "china-discount",
        severity: "info",
        message: "Chinese anchor price is at least 5% below the best global ask.",
      });
    }
    const latestObserved = Math.max(...item.snapshots.map((snapshot) => new Date(snapshot.observedAt).getTime()).filter(Number.isFinite));
    if (Number.isFinite(latestObserved) && Date.now() - latestObserved > STALE_OBSERVATION_MS) {
      signals.push({
        itemId: item.id,
        marketHashName: item.marketHashName,
        signal: "stale-data",
        severity: "warning",
        message: "Latest market observation is older than 12 hours.",
      });
    }
  }

  return signals.slice(0, 30);
}

function candleGroupKey(candle: Cs2PriceCandleView) {
  return `${candle.provider}\u0000${candle.marketName}\u0000${candle.interval}`;
}

function classifyTrend(params: {
  changePercent: number;
  volatilityPercent: number;
}): Pick<Cs2TrendSignal, "signal" | "severity"> {
  if (params.volatilityPercent >= 18) return { signal: "volatile", severity: "critical" };
  if (params.volatilityPercent >= 10) return { signal: "volatile", severity: "warning" };
  if (params.changePercent >= 6) return { signal: "uptrend", severity: "info" };
  if (params.changePercent <= -6) return { signal: "downtrend", severity: "warning" };
  return { signal: "stable", severity: "info" };
}

function buildTrendSignal(item: Cs2ItemView, candles: Cs2PriceCandleView[]): Cs2TrendSignal | null {
  const ordered = [...candles]
    .filter((candle) => candle.closeCents > 0)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  if (ordered.length < 2) return null;

  const first = ordered[0];
  const latest = ordered[ordered.length - 1];
  const closes = ordered.map((candle) => candle.closeCents);
  const averageClose = closes.reduce((sum, close) => sum + close, 0) / closes.length;
  const highClose = Math.max(...closes);
  const lowClose = Math.min(...closes);
  const changePercent = Number((((latest.closeCents - first.closeCents) / first.closeCents) * 100).toFixed(2));
  const volatilityPercent = Number((((highClose - lowClose) / Math.max(1, averageClose)) * 100).toFixed(2));
  const totalVolume = ordered.some((candle) => candle.volume !== null)
    ? ordered.reduce((sum, candle) => sum + (candle.volume ?? 0), 0)
    : null;
  const classification = classifyTrend({ changePercent, volatilityPercent });

  return {
    itemId: item.id,
    marketHashName: item.marketHashName,
    provider: latest.provider,
    marketName: latest.marketName,
    interval: latest.interval,
    candleCount: ordered.length,
    firstCloseCents: first.closeCents,
    latestCloseCents: latest.closeCents,
    changePercent,
    volatilityPercent,
    totalVolume,
    ...classification,
  };
}

export function buildCs2TrendSignals(items: Cs2ItemView[]): Cs2TrendSignal[] {
  const signals: Cs2TrendSignal[] = [];

  for (const item of items) {
    const candleGroups = new Map<string, Cs2PriceCandleView[]>();
    for (const candle of item.candles) {
      const key = candleGroupKey(candle);
      candleGroups.set(key, [...(candleGroups.get(key) ?? []), candle]);
    }

    for (const candles of candleGroups.values()) {
      const signal = buildTrendSignal(item, candles);
      if (signal) signals.push(signal);
    }
  }

  return signals
    .sort((a, b) => {
      const scoreA = Math.abs(a.changePercent) + a.volatilityPercent;
      const scoreB = Math.abs(b.changePercent) + b.volatilityPercent;
      return scoreB - scoreA;
    })
    .slice(0, 30);
}

function latestSnapshotTime(item: Cs2ItemView) {
  const observedTimes = item.snapshots
    .map((snapshot) => new Date(snapshot.observedAt).getTime())
    .filter(Number.isFinite);
  return observedTimes.length > 0 ? Math.max(...observedTimes) : null;
}

function isItemStale(item: Cs2ItemView) {
  const latestObserved = latestSnapshotTime(item);
  return latestObserved !== null && Date.now() - latestObserved > STALE_OBSERVATION_MS;
}

function average(values: number[]) {
  return values.length > 0
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
    : null;
}

export function buildCs2MarketCoverageEntries(items: Cs2ItemView[]): Cs2MarketCoverageEntry[] {
  const grouped = new Map<string, {
    provider: string;
    marketName: string;
    marketRegion: Cs2MarketRegion;
    itemIds: Set<string>;
    staleItemIds: Set<string>;
    askCount: number;
    bidCount: number;
    askVolumeTotal: number;
    bidVolumeTotal: number;
    salesVolume24hTotal: number;
    liquidityScores: number[];
    latestObservedAt: number | null;
  }>();

  for (const item of items) {
    for (const snapshot of item.snapshots) {
      const key = `${snapshot.provider}\u0000${snapshot.marketName}`;
      const existing = grouped.get(key) ?? {
        provider: snapshot.provider,
        marketName: snapshot.marketName,
        marketRegion: snapshot.marketRegion,
        itemIds: new Set<string>(),
        staleItemIds: new Set<string>(),
        askCount: 0,
        bidCount: 0,
        askVolumeTotal: 0,
        bidVolumeTotal: 0,
        salesVolume24hTotal: 0,
        liquidityScores: [],
        latestObservedAt: null,
      };
      existing.itemIds.add(item.id);
      if (isItemStale({ ...item, snapshots: [snapshot] })) existing.staleItemIds.add(item.id);
      if (snapshot.askCents !== null) existing.askCount += 1;
      if (snapshot.bidCents !== null) existing.bidCount += 1;
      existing.askVolumeTotal += snapshot.askVolume ?? 0;
      existing.bidVolumeTotal += snapshot.bidVolume ?? 0;
      existing.salesVolume24hTotal += snapshot.salesVolume24h ?? 0;
      if (snapshot.liquidityScore !== null) existing.liquidityScores.push(snapshot.liquidityScore);
      const observedAt = new Date(snapshot.observedAt).getTime();
      if (Number.isFinite(observedAt)) {
        existing.latestObservedAt = Math.max(existing.latestObservedAt ?? 0, observedAt);
      }
      grouped.set(key, existing);
    }
  }

  return [...grouped.values()]
    .map((entry) => ({
      provider: entry.provider,
      marketName: entry.marketName,
      marketRegion: entry.marketRegion,
      itemCount: entry.itemIds.size,
      askCount: entry.askCount,
      bidCount: entry.bidCount,
      askVolumeTotal: entry.askVolumeTotal,
      bidVolumeTotal: entry.bidVolumeTotal,
      salesVolume24hTotal: entry.salesVolume24hTotal,
      averageLiquidityScore: average(entry.liquidityScores),
      latestObservedAt: entry.latestObservedAt ? new Date(entry.latestObservedAt).toISOString() : null,
      staleItemCount: entry.staleItemIds.size,
    }))
    .sort((a, b) => b.itemCount - a.itemCount || b.askVolumeTotal - a.askVolumeTotal || a.marketName.localeCompare(b.marketName));
}

export function buildCs2ItemTypeCoverageEntries(items: Cs2ItemView[]): Cs2ItemTypeCoverageEntry[] {
  const grouped = new Map<string, Cs2ItemView[]>();
  for (const item of items) grouped.set(item.itemType, [...(grouped.get(item.itemType) ?? []), item]);

  return [...grouped.entries()]
    .map(([itemType, typedItems]) => ({
      itemType,
      itemCount: typedItems.length,
      itemsWithChinesePrice: typedItems.filter((item) => item.chineseAskCents !== null).length,
      itemsWithGlobalPrice: typedItems.filter((item) => item.globalAskCents !== null).length,
      itemsWithHistory: typedItems.filter((item) => item.candles.length > 1).length,
      candleCount: typedItems.reduce((sum, item) => sum + item.candles.length, 0),
    }))
    .sort((a, b) => b.itemCount - a.itemCount || a.itemType.localeCompare(b.itemType));
}

export function buildCs2MarketAnalysis(items: Cs2ItemView[], watchlist: Cs2WatchlistEntryView[]): Cs2MarketAnalysis {
  const itemsWithChinesePrice = items.filter((item) => item.chineseAskCents !== null).length;
  const itemsWithGlobalPrice = items.filter((item) => item.globalAskCents !== null).length;
  const itemsWithCrossMarketSpread = items.filter((item) => item.spreadPercent !== null).length;
  const itemsWithHistory = items.filter((item) => item.candles.length > 1).length;
  const candleCount = items.reduce((sum, item) => sum + item.candles.length, 0);

  return {
    generatedAt: new Date().toISOString(),
    opportunities: buildCs2MarketOpportunities(items),
    trendSignals: buildCs2TrendSignals(items),
    watchlistSignals: buildCs2WatchlistSignals(items, watchlist),
    marketCoverage: {
      totalItems: items.length,
      itemsWithChinesePrice,
      itemsWithGlobalPrice,
      itemsWithCrossMarketSpread,
      itemsWithHistory,
      candleCount,
      markets: buildCs2MarketCoverageEntries(items),
      itemTypes: buildCs2ItemTypeCoverageEntries(items),
      gaps: {
        missingChinesePrice: items.length - itemsWithChinesePrice,
        missingGlobalPrice: items.length - itemsWithGlobalPrice,
        missingCrossMarketSpread: items.length - itemsWithCrossMarketSpread,
        missingHistory: items.length - itemsWithHistory,
        staleItems: items.filter(isItemStale).length,
      },
    },
  };
}
