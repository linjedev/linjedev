import { resolveCs2ImageUrl } from "@/lib/cs2/imageIndex";
import { formatDate } from "@/lib/cs2/normalization";
import type { Cs2ItemView, Cs2MarketRegion } from "@/lib/cs2/types";

export function calculateCs2DerivedPrices(
  item: Omit<Cs2ItemView, "bestAskCents" | "bestBidCents" | "chineseAskCents" | "globalAskCents" | "spreadPercent">,
): Cs2ItemView {
  const asks = item.snapshots.map((snapshot) => snapshot.askCents).filter((value): value is number => value !== null);
  const bids = item.snapshots.map((snapshot) => snapshot.bidCents).filter((value): value is number => value !== null);
  const chineseAsks = item.snapshots
    .filter((snapshot) => snapshot.marketRegion === "china")
    .map((snapshot) => snapshot.askCents)
    .filter((value): value is number => value !== null);
  const globalAsks = item.snapshots
    .filter((snapshot) => snapshot.marketRegion !== "china")
    .map((snapshot) => snapshot.askCents)
    .filter((value): value is number => value !== null);
  const chineseAskCents = chineseAsks.length > 0 ? Math.min(...chineseAsks) : null;
  const globalAskCents = globalAsks.length > 0 ? Math.min(...globalAsks) : null;
  const spreadPercent = chineseAskCents && globalAskCents
    ? Number((((chineseAskCents - globalAskCents) / globalAskCents) * 100).toFixed(2))
    : null;

  return {
    ...item,
    bestAskCents: asks.length > 0 ? Math.min(...asks) : null,
    bestBidCents: bids.length > 0 ? Math.max(...bids) : null,
    chineseAskCents,
    globalAskCents,
    spreadPercent,
  };
}

type DbSnapshot = {
  provider: string;
  marketName: string;
  marketRegion: string;
  askCents: number | null;
  bidCents: number | null;
  medianCents: number | null;
  askVolume: number | null;
  bidVolume: number | null;
  salesVolume24h: number | null;
  liquidityScore: number | null;
  observedAt: Date;
  sourceUrl: string | null;
};

type DbCandle = {
  provider: string;
  marketName: string;
  interval: string;
  openCents: number;
  highCents: number;
  lowCents: number;
  closeCents: number;
  volume: number | null;
  startsAt: Date;
};

type DbMarketSummary = {
  bestAskCents: number | null;
  bestBidCents: number | null;
  chineseAskCents: number | null;
  globalAskCents: number | null;
  spreadPercent: number | null;
} | null;

export function dbItemToCs2ItemView(item: {
  id: string;
  marketHashName: string;
  itemType: string;
  category: string | null;
  rarity: string | null;
  exterior: string | null;
  collection: string | null;
  imageUrl: string | null;
  tradable: boolean;
  latestSnapshots?: DbSnapshot[];
  marketSnapshots?: DbSnapshot[];
  priceCandles?: DbCandle[];
  marketSummary?: DbMarketSummary;
}): Cs2ItemView {
  const snapshots = item.latestSnapshots && item.latestSnapshots.length > 0
    ? item.latestSnapshots
    : item.marketSnapshots ?? [];

  const derived = calculateCs2DerivedPrices({
    id: item.id,
    marketHashName: item.marketHashName,
    itemType: item.itemType,
    category: item.category,
    rarity: item.rarity,
    exterior: item.exterior,
    collection: item.collection,
    imageUrl: resolveCs2ImageUrl(item.marketHashName, item.imageUrl),
    tradable: item.tradable,
    snapshots: snapshots.map((snapshot) => ({
      provider: snapshot.provider,
      marketName: snapshot.marketName,
      marketRegion: snapshot.marketRegion as Cs2MarketRegion,
      currency: "USD",
      askCents: snapshot.askCents,
      bidCents: snapshot.bidCents,
      medianCents: snapshot.medianCents,
      askVolume: snapshot.askVolume,
      bidVolume: snapshot.bidVolume,
      salesVolume24h: snapshot.salesVolume24h,
      liquidityScore: snapshot.liquidityScore,
      observedAt: formatDate(snapshot.observedAt),
      sourceUrl: snapshot.sourceUrl ?? undefined,
    })),
    candles: (item.priceCandles ?? []).map((candle) => ({
      provider: candle.provider,
      marketName: candle.marketName,
      interval: candle.interval as "5m" | "30m" | "1h" | "1d",
      openCents: candle.openCents,
      highCents: candle.highCents,
      lowCents: candle.lowCents,
      closeCents: candle.closeCents,
      volume: candle.volume,
      startsAt: formatDate(candle.startsAt),
    })),
  });

  if (!item.marketSummary) return derived;

  return {
    ...derived,
    bestAskCents: item.marketSummary.bestAskCents,
    bestBidCents: item.marketSummary.bestBidCents,
    chineseAskCents: item.marketSummary.chineseAskCents,
    globalAskCents: item.marketSummary.globalAskCents,
    spreadPercent: item.marketSummary.spreadPercent,
  };
}
