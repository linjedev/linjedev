import { NextResponse } from "next/server";
import { buildCs2ImageCatalog } from "@/lib/cs2/imageIndex";
import { getCs2ItemMetadataCatalog } from "@/lib/cs2/itemMetadataService";
import type { Cs2ItemMetadata } from "@/lib/cs2/itemMetadataService";

export async function GET() {
  let warning: string | null = null;
  let metadata: Cs2ItemMetadata[] = [];

  try {
    metadata = await getCs2ItemMetadataCatalog({});
  } catch (error) {
    warning = error instanceof Error ? error.message : "CS2 metadata image catalog unavailable.";
  }

  const items = buildCs2ImageCatalog(metadata);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    warning,
    items,
  });
}
