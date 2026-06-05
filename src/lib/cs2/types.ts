export type Cs2MarketRegion = "china" | "global" | "north-america" | "europe";

export type Cs2MarketSource = {
  id: string;
  name: string;
  region: Cs2MarketRegion;
  role: "anchor" | "market" | "aggregator";
  homepageUrl: string;
  requiresApiKey: boolean;
  priority: number;
  coverage: string;
};

export type Cs2MarketSnapshotView = {
  provider: string;
  marketName: string;
  marketRegion: Cs2MarketRegion;
  currency: "USD";
  askCents: number | null;
  bidCents: number | null;
  medianCents: number | null;
  askVolume: number | null;
  bidVolume: number | null;
  salesVolume24h: number | null;
  liquidityScore: number | null;
  observedAt: string;
  sourceUrl?: string;
};

export type Cs2PriceCandleView = {
  provider: string;
  marketName: string;
  interval: "5m" | "30m" | "1h" | "1d";
  openCents: number;
  highCents: number;
  lowCents: number;
  closeCents: number;
  volume: number | null;
  startsAt: string;
};

export type Cs2ItemView = {
  id: string;
  marketHashName: string;
  itemType: string;
  category: string | null;
  rarity: string | null;
  exterior: string | null;
  collection: string | null;
  imageUrl: string | null;
  tradable: boolean;
  bestAskCents: number | null;
  bestBidCents: number | null;
  chineseAskCents: number | null;
  globalAskCents: number | null;
  spreadPercent: number | null;
  snapshots: Cs2MarketSnapshotView[];
  candles: Cs2PriceCandleView[];
};

export type Cs2ItemHistoryResponse = {
  generatedAt: string;
  mode: "live" | "sample";
  warning: string | null;
  item: Cs2ItemView | null;
};

export type Cs2WatchlistEntryView = {
  id: string;
  itemId: string;
  marketHashName: string;
  targetBuyCents: number | null;
  targetSellCents: number | null;
  notes: string | null;
  createdAt: string;
};

export type Cs2MarketOpportunity = {
  itemId: string;
  marketHashName: string;
  itemType: string;
  chineseAskCents: number;
  globalAskCents: number;
  spreadPercent: number;
  bestChineseMarket: string;
  bestGlobalMarket: string;
  askVolume: number;
  liquidityScore: number;
  analysisScore: number;
};

export type Cs2TrendSignal = {
  itemId: string;
  marketHashName: string;
  provider: string;
  marketName: string;
  interval: "5m" | "30m" | "1h" | "1d";
  candleCount: number;
  firstCloseCents: number;
  latestCloseCents: number;
  changePercent: number;
  volatilityPercent: number;
  totalVolume: number | null;
  signal: "uptrend" | "downtrend" | "volatile" | "stable";
  severity: "info" | "warning" | "critical";
};

export type Cs2MarketCoverageEntry = {
  provider: string;
  marketName: string;
  marketRegion: Cs2MarketRegion;
  itemCount: number;
  askCount: number;
  bidCount: number;
  askVolumeTotal: number;
  bidVolumeTotal: number;
  salesVolume24hTotal: number;
  averageLiquidityScore: number | null;
  latestObservedAt: string | null;
  staleItemCount: number;
};

export type Cs2ItemTypeCoverageEntry = {
  itemType: string;
  itemCount: number;
  itemsWithChinesePrice: number;
  itemsWithGlobalPrice: number;
  itemsWithHistory: number;
  candleCount: number;
};

export type Cs2CoverageGaps = {
  missingChinesePrice: number;
  missingGlobalPrice: number;
  missingCrossMarketSpread: number;
  missingHistory: number;
  staleItems: number;
};

export type Cs2WatchlistSignal = {
  itemId: string;
  marketHashName: string;
  signal: "buy-target" | "sell-target" | "china-discount" | "stale-data";
  severity: "info" | "warning" | "critical";
  message: string;
};

export type Cs2MarketAnalysis = {
  generatedAt: string;
  opportunities: Cs2MarketOpportunity[];
  trendSignals: Cs2TrendSignal[];
  watchlistSignals: Cs2WatchlistSignal[];
  marketCoverage: {
    totalItems: number;
    itemsWithChinesePrice: number;
    itemsWithGlobalPrice: number;
    itemsWithCrossMarketSpread: number;
    itemsWithHistory: number;
    candleCount: number;
    markets: Cs2MarketCoverageEntry[];
    itemTypes: Cs2ItemTypeCoverageEntry[];
    gaps: Cs2CoverageGaps;
  };
};

export type Cs2CatalogSort = "updated" | "name" | "price-asc" | "price-desc" | "china-discount";
export type Cs2CatalogCoverageFilter =
  | "all"
  | "with-history"
  | "missing-history"
  | "with-china"
  | "missing-china"
  | "spreadable";

export type Cs2CatalogMarketFocus = "all" | "china" | "global";
export type Cs2CatalogSourceFilter = "all" | "buff" | "youpin" | "c5game" | "csfloat" | "skinport" | "steam";

export type Cs2CatalogResponse = {
  generatedAt: string;
  mode: "live" | "sample";
  warning: string | null;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  query: string | null;
  itemType: string | null;
  coverage: Cs2CatalogCoverageFilter;
  marketFocus: Cs2CatalogMarketFocus;
  source: Cs2CatalogSourceFilter;
  sort: Cs2CatalogSort;
  items: Cs2ItemView[];
  facets: {
    itemTypes: Array<{ value: string; count: number }>;
  };
};

export type Cs2FloatSort =
  | "best_deal"
  | "lowest_price"
  | "highest_price"
  | "lowest_float"
  | "highest_float"
  | "most_recent"
  | "float_rank";

export type Cs2FloatListingView = {
  id: string;
  marketHashName: string;
  itemName: string | null;
  wearName: string | null;
  priceCents: number | null;
  referencePriceCents: number | null;
  floatValue: number | null;
  paintSeed: number | null;
  paintIndex: number | null;
  floatRank: number | null;
  rarity: number | null;
  imageUrl: string | null;
  screenshotUrl: string | null;
  inspectUrl: string | null;
  listingUrl: string | null;
  hasScreenshot: boolean;
  stickers: Array<{
    name: string;
    slot: number | null;
    imageUrl: string | null;
  }>;
};

export type Cs2FloatSearchResponse = {
  generatedAt: string;
  mode: "live" | "sample";
  warning: string | null;
  query: string | null;
  resolvedMarketHashNames: string[];
  minFloat: number | null;
  maxFloat: number | null;
  paintSeed: number | null;
  paintIndex: number | null;
  sort: Cs2FloatSort;
  listings: Cs2FloatListingView[];
};

export type Cs2TrackerOverview = {
  generatedAt: string;
  mode: "live" | "sample" | "mixed";
  warning: string | null;
  sources: Cs2MarketSource[];
  sourceStatus: Array<{
    id: string;
    name: string;
    homepageUrl: string;
    region: Cs2MarketRegion;
    role: "anchor" | "market" | "aggregator";
    configured: boolean;
    hasLiveCoverage: boolean;
    integration: "direct" | "aggregated" | "unavailable";
    officialApi: "official" | "indirect" | "unknown";
    marketsSeen: number;
    itemCount: number;
    note: string;
  }>;
  configuredProviders: string[];
  items: Cs2ItemView[];
  watchlist: Cs2WatchlistEntryView[];
  analysis: Cs2MarketAnalysis;
  metrics: {
    trackedItems: number;
    watchedItems: number;
    chineseMarkets: number;
    marketsRepresented: number;
    averageChinaDiscountPercent: number | null;
  };
};

export type Cs2SyncStatus = {
  generatedAt: string;
  status?: "unavailable";
  databaseAvailable?: boolean;
  message?: string;
  itemCount: number;
  latestSnapshotCount: number;
  marketSummaryCount: number;
  candleCount: number;
  coverage: {
    itemsWithLatestSnapshots: number;
    itemsWithChinesePrice: number;
    itemsWithGlobalPrice: number;
    itemsWithHistory: number;
    itemsMissingLatestSnapshots: number;
    itemsMissingChinesePrice: number;
    itemsMissingGlobalPrice: number;
    itemsMissingHistory: number;
  };
  providerCoverage: Array<{
    provider: string;
    marketRegion: Cs2MarketRegion;
    itemCount: number;
    snapshotCount: number;
  }>;
  latestObservation: {
    observedAt: string;
    provider: string;
    marketName: string;
  } | null;
  recentRuns: Array<{
    id: string;
    provider: string;
    status: "running" | "ok" | "error";
    itemCount: number;
    snapshotCount: number;
    candleCount: number;
    message: string | null;
    startedAt: string;
    finishedAt: string | null;
  }>;
};
