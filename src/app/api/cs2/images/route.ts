import { NextResponse } from "next/server";
import { CS2_IMAGE_INDEX } from "@/lib/cs2/imageIndex";

export async function GET() {
  const items = Object.entries(CS2_IMAGE_INDEX).map(([marketHashName, imageUrl]) => ({
    marketHashName,
    imageUrl,
    backgroundRemoved: true,
    source: "indexed-transparent-local-render",
  }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    items,
  });
}
