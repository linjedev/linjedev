import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addCs2WatchlistItem,
  getCs2TrackerOverview,
  removeCs2WatchlistItem,
} from "@/lib/cs2/marketService";

const watchlistSchema = z.object({
  marketHashName: z.string().min(2),
  targetBuyCents: z.number().int().positive().nullable().optional(),
  targetSellCents: z.number().int().positive().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

function readOwnerKey(request: Request) {
  return request.headers.get("x-linje-watch-owner")?.trim() || "linje-local-watchlist";
}

export async function GET(request: Request) {
  const overview = await getCs2TrackerOverview({ ownerKey: readOwnerKey(request) });
  return NextResponse.json({ watchlist: overview.watchlist });
}

export async function POST(request: Request) {
  const parsed = watchlistSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid watchlist payload" }, { status: 400 });
  }

  try {
    const result = await addCs2WatchlistItem({
      ownerKey: readOwnerKey(request),
      ...parsed.data,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add watchlist item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  try {
    await removeCs2WatchlistItem(readOwnerKey(request), itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove watchlist item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
