import { NextResponse } from "next/server";
import { getCs2TrackerOverview } from "@/lib/cs2/marketService";

function readOwnerKey(request: Request) {
  return request.headers.get("x-linje-watch-owner")?.trim() || "linje-local-watchlist";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const overview = await getCs2TrackerOverview({
    ownerKey: readOwnerKey(request),
    query: searchParams.get("q"),
  });

  return NextResponse.json(overview.analysis);
}
