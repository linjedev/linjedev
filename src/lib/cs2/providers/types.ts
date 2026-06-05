import type { Cs2MarketRegion } from "@/lib/cs2/types";

export type ProviderSnapshotInput = {
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
  raw?: Record<string, unknown>;
};

export type ProviderItemInput = {
  marketHashName: string;
  itemType: string;
  category: string | null;
  rarity: string | null;
  exterior: string | null;
  collection: string | null;
  imageUrl: string | null;
  tradable: boolean;
  snapshots: ProviderSnapshotInput[];
};

export type ProviderCatalogItemInput = Omit<ProviderItemInput, "snapshots">;

export type ProviderCandleInput = {
  marketHashName: string;
  provider: string;
  marketName: string;
  interval: "5m" | "30m" | "1h" | "1d";
  openCents: number;
  highCents: number;
  lowCents: number;
  closeCents: number;
  volume: number | null;
  startsAt: Date;
};

export type Cs2SyncSummary = {
  provider: string;
  status: "ok" | "error";
  itemCount: number;
  snapshotCount: number;
  candleCount: number;
  message: string | null;
  nextCursor?: string | null;
};

export type Cs2PipelineSyncSummary = Cs2SyncSummary & {
  provider: "pipeline";
  runs: Cs2SyncSummary[];
};

export type Cs2SweepSyncSummary = Cs2SyncSummary & {
  provider: "sweep";
  target: "latest-china" | "history-gaps";
  batches: Cs2SyncSummary[];
};
