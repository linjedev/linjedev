import { NextResponse } from "next/server";
import { z } from "zod";
import { getCs2Catalog } from "@/lib/cs2/catalogService";

const querySchema = z.object({
  q: z.string().nullable().optional(),
  query: z.string().nullable().optional(),
  itemType: z.string().nullable().optional(),
  coverage: z.enum(["all", "with-history", "missing-history", "with-china", "missing-china", "spreadable"]).optional(),
  marketFocus: z.enum(["all", "china", "global"]).optional(),
  source: z.enum(["all", "buff", "youpin", "c5game", "csfloat", "skinport", "steam", "dmarket", "bitskins", "buffmarket", "waxpeer", "whitemarket"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.enum(["updated", "name", "price-asc", "price-desc", "china-discount"]).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q"),
    query: searchParams.get("query"),
    itemType: searchParams.get("itemType"),
    coverage: searchParams.get("coverage") ?? undefined,
    marketFocus: searchParams.get("marketFocus") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid catalog query" }, { status: 400 });
  }

  return NextResponse.json(await getCs2Catalog({
    query: parsed.data.query ?? parsed.data.q,
    itemType: parsed.data.itemType,
    coverage: parsed.data.coverage,
    marketFocus: parsed.data.marketFocus,
    source: parsed.data.source,
    page: parsed.data.page,
    limit: parsed.data.limit,
    sort: parsed.data.sort,
  }));
}
