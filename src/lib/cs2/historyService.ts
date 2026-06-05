import { dbItemToCs2ItemView } from "@/lib/cs2/itemView";
import { SAMPLE_CS2_ITEMS } from "@/lib/cs2/sampleData";
import type { Cs2ItemHistoryResponse } from "@/lib/cs2/types";
import { prisma } from "@/lib/db";

export async function getCs2ItemHistory(params: {
  marketHashName: string;
  snapshotLimit?: number;
  candleLimit?: number;
}): Promise<Cs2ItemHistoryResponse> {
  const snapshotLimit = Math.min(500, Math.max(1, params.snapshotLimit ?? 200));
  const candleLimit = Math.min(1000, Math.max(1, params.candleLimit ?? 365));

  try {
    const row = await prisma.cs2Item.findUnique({
      where: { marketHashName: params.marketHashName },
      include: {
        latestSnapshots: {
          orderBy: { observedAt: "desc" },
        },
        marketSnapshots: {
          orderBy: { observedAt: "desc" },
          take: snapshotLimit,
        },
        priceCandles: {
          orderBy: { startsAt: "asc" },
          take: candleLimit,
        },
        marketSummary: true,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      mode: "live",
      warning: row ? null : "Item not found in CS2 database.",
      item: row ? dbItemToCs2ItemView(row) : null,
    };
  } catch {
    const sampleItem = SAMPLE_CS2_ITEMS.find((item) => item.marketHashName === params.marketHashName) ?? null;
    return {
      generatedAt: new Date().toISOString(),
      mode: "sample",
      warning: "Database unavailable or CS2 schema pending; showing sample item history if available.",
      item: sampleItem,
    };
  }
}
