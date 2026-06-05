import { NextResponse } from "next/server";
import {
  buildCs2AnalysisCsv,
  buildCs2AnalysisExportRows,
  getCs2DatabaseMarketAnalysis,
} from "@/lib/cs2/analysisRepository";

function readOwnerKey(request: Request) {
  return request.headers.get("x-linje-watch-owner")?.trim() || "linje-local-watchlist";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const analysis = await getCs2DatabaseMarketAnalysis(readOwnerKey(request));

  if (format === "json") {
    return NextResponse.json({
      generatedAt: analysis.generatedAt,
      rows: buildCs2AnalysisExportRows(analysis),
      coverage: analysis.marketCoverage,
    });
  }

  return new Response(buildCs2AnalysisCsv(analysis), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linje-cs2-market-analysis-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
