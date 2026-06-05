import { inferExterior, inferItemType } from "@/lib/cs2/normalization";

type Cs2ApiItem = {
  market_hash_name?: unknown;
  image?: unknown;
  rarity?: { name?: unknown } | null;
  collection?: { name?: unknown } | null;
  collections?: Array<{ name?: unknown }> | null;
  category?: { name?: unknown } | null;
};

export type Cs2ItemMetadata = {
  marketHashName: string;
  imageUrl: string | null;
  rarity: string | null;
  collection: string | null;
  category: string | null;
  itemType: string | null;
  exterior: string | null;
};

export type Cs2ItemMetadataCatalogResponse = {
  items: Cs2ItemMetadata[];
  total: number;
  offset: number;
  limit: number;
};

const CSGO_API_ALL_ITEMS_URL = process.env.CSGO_API_ALL_ITEMS_URL
  ?? "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/all.json";

let metadataPromise: Promise<Map<string, Cs2ItemMetadata>> | null = null;

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function rowToMetadata(row: Cs2ApiItem): Cs2ItemMetadata | null {
  const marketHashName = readString(row.market_hash_name);
  if (!marketHashName) return null;
  return {
    marketHashName,
    imageUrl: readString(row.image),
    rarity: readString(row.rarity?.name),
    collection: readString(row.collection?.name) ?? readString(row.collections?.[0]?.name),
    category: readString(row.category?.name),
    itemType: inferItemType(marketHashName),
    exterior: inferExterior(marketHashName),
  };
}

async function fetchMetadataIndex() {
  const response = await fetch(CSGO_API_ALL_ITEMS_URL, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`CSGO-API all items returned ${response.status}`);

  const payload = await response.json() as unknown;
  const rows = typeof payload === "object" && payload !== null
    ? Object.values(payload as Record<string, unknown>)
    : [];
  const index = new Map<string, Cs2ItemMetadata>();
  for (const value of rows) {
    if (typeof value !== "object" || value === null) continue;
    const metadata = rowToMetadata(value as Cs2ApiItem);
    if (metadata) index.set(metadata.marketHashName, metadata);
  }
  return index;
}

export async function getCs2ItemMetadataIndex() {
  metadataPromise ??= fetchMetadataIndex();
  return metadataPromise;
}

export async function getCs2ItemMetadataByMarketHashName(marketHashNames: string[]) {
  const index = await getCs2ItemMetadataIndex();
  const metadata = new Map<string, Cs2ItemMetadata>();
  for (const marketHashName of marketHashNames) {
    const match = index.get(marketHashName);
    if (match) metadata.set(marketHashName, match);
  }
  return metadata;
}

function normalizeSearchToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesMetadata(metadata: Cs2ItemMetadata, query?: string | null) {
  const normalizedQuery = normalizeSearchToken(query ?? "");
  if (!normalizedQuery) return true;
  const haystack = normalizeSearchToken([
    metadata.marketHashName,
    metadata.itemType ?? "",
    metadata.category ?? "",
    metadata.rarity ?? "",
    metadata.collection ?? "",
  ].join(" "));
  return normalizedQuery
    .split(" ")
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

function filterAndPageMetadataIndex(
  index: Map<string, Cs2ItemMetadata>,
  params: {
    query?: string | null;
    itemType?: string | null;
    limit?: number;
    offset?: number;
  },
) {
  const query = params.query;
  const itemType = params.itemType?.trim().toLowerCase() || null;
  const allItems = Array.from(index.values());
  const filtered = allItems.filter((metadata) => {
    if (itemType && metadata.itemType !== itemType) return false;
    return matchesMetadata(metadata, query);
  });

  const sorted = filtered.sort((a, b) => a.marketHashName.localeCompare(b.marketHashName));
  const total = sorted.length;
  const offset = params.offset ?? 0;
  const limit = params.limit ?? sorted.length;
  const cappedOffset = Math.max(0, Math.min(offset, total));
  return {
    items: sorted.slice(cappedOffset, cappedOffset + Math.max(0, limit)),
    total,
    offset: cappedOffset,
    limit: Math.max(0, Math.min(limit, sorted.length)),
  };
}

export async function getCs2ItemMetadataCatalog(params: {
  query?: string | null;
  itemType?: string | null;
  limit?: number;
  offset?: number;
}): Promise<Cs2ItemMetadata[]> {
  const response = await getCs2ItemMetadataCatalogWithTotal(params);
  return response.items;
}

export async function getCs2ItemMetadataCatalogWithTotal(params: {
  query?: string | null;
  itemType?: string | null;
  limit?: number;
  offset?: number;
}): Promise<Cs2ItemMetadataCatalogResponse> {
  const index = await getCs2ItemMetadataIndex();
  return filterAndPageMetadataIndex(index, params);
}
