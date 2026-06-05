import { NextResponse } from "next/server";
import { z } from "zod";
import { searchCs2FloatListings } from "@/lib/cs2/floatSearchService";

const querySchema = z.object({
  q: z.string().nullable().optional(),
  minFloat: z.coerce.number().min(0).max(1).nullable().optional(),
  maxFloat: z.coerce.number().min(0).max(1).nullable().optional(),
  paintSeed: z.coerce.number().int().min(0).max(1000).nullable().optional(),
  paintIndex: z.coerce.number().int().min(0).nullable().optional(),
  sort: z.enum(["best_deal", "lowest_price", "highest_price", "lowest_float", "highest_float", "most_recent", "float_rank"]).optional(),
}).superRefine((payload, context) => {
  if (
    payload.minFloat !== null
    && payload.minFloat !== undefined
    && payload.maxFloat !== null
    && payload.maxFloat !== undefined
    && payload.minFloat > payload.maxFloat
  ) {
    context.addIssue({
      code: "custom",
      path: ["minFloat"],
      message: "minFloat must be less than or equal to maxFloat",
    });
  }
});

function numberParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) ?? undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q"),
    minFloat: numberParam(searchParams, "minFloat"),
    maxFloat: numberParam(searchParams, "maxFloat"),
    paintSeed: numberParam(searchParams, "paintSeed"),
    paintIndex: numberParam(searchParams, "paintIndex"),
    sort: searchParams.get("sort") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid float search query" }, { status: 400 });
  }

  return NextResponse.json(await searchCs2FloatListings({
    query: parsed.data.q,
    minFloat: parsed.data.minFloat,
    maxFloat: parsed.data.maxFloat,
    paintSeed: parsed.data.paintSeed,
    paintIndex: parsed.data.paintIndex,
    sort: parsed.data.sort,
  }));
}
