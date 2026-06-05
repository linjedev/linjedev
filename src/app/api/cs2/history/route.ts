import { NextResponse } from "next/server";
import { z } from "zod";
import { getCs2ItemHistory } from "@/lib/cs2/historyService";

const querySchema = z.object({
  marketHashName: z.string().min(2),
  snapshotLimit: z.coerce.number().int().positive().max(500).optional(),
  candleLimit: z.coerce.number().int().positive().max(1000).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    marketHashName: searchParams.get("marketHashName"),
    snapshotLimit: searchParams.get("snapshotLimit") ?? undefined,
    candleLimit: searchParams.get("candleLimit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid CS2 history query" }, { status: 400 });
  }

  return NextResponse.json(await getCs2ItemHistory(parsed.data));
}
