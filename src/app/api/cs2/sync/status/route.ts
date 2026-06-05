import { NextResponse } from "next/server";
import { getCs2SyncStatus } from "@/lib/cs2/syncRepository";

export async function GET() {
  try {
    return NextResponse.json(await getCs2SyncStatus());
  } catch (error) {
    console.warn("[cs2] Sync status unavailable.", error);
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      status: "unavailable",
      databaseAvailable: false,
      message: "CS2 database unavailable or schema pending.",
      itemCount: 0,
      latestSnapshotCount: 0,
      marketSummaryCount: 0,
      candleCount: 0,
      latestObservation: null,
      recentRuns: [],
    });
  }
}
