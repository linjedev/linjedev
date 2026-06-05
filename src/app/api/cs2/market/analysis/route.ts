import { NextResponse } from "next/server";
import { getCs2DatabaseMarketAnalysis } from "@/lib/cs2/analysisRepository";

function readOwnerKey(request: Request) {
  return request.headers.get("x-linje-watch-owner")?.trim() || "linje-local-watchlist";
}

export async function GET(request: Request) {
  return NextResponse.json(await getCs2DatabaseMarketAnalysis(readOwnerKey(request)));
}
