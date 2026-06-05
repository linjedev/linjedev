import { prisma } from "@/lib/db";
import {
  getCs2ItemMetadataByMarketHashName,
  getCs2ItemMetadataCatalog,
} from "@/lib/cs2/itemMetadataService";
import { dbItemToCs2ItemView } from "@/lib/cs2/itemView";
import {
  fetchCs2CapCatalogItems,
  fetchCs2CapLatestItems,
} from "@/lib/cs2/providers/cs2cap";
import { fetchSkinportLatestItems } from "@/lib/cs2/providers/skinport";
import { inferCategory, inferItemType } from "@/lib/cs2/normalization";
import type { ProviderCatalogItemInput, ProviderItemInput, ProviderSnapshotInput } from "@/lib/cs2/providers/types";
import { SAMPLE_CS2_ITEMS } from "@/lib/cs2/sampleData";
import type { Cs2CatalogResponse, Cs2CatalogSort, Cs2ItemView } from "@/lib/cs2/types";

type CatalogParams = {
  query?: string | null;
  itemType?: string | null;
  page?: number;
  limit?: number;
  sort?: Cs2CatalogSort;
};

function normalizePage(value: number | undefined) {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

function normalizeLimit(value: number | undefined) {
  if (!Number.isInteger(value) || !value) return 50;
  return Math.min(100, Math.max(1, value));
}

function itemMatches(item: Cs2ItemView, params: CatalogParams) {
  const query = searchKey(params.query ?? "");
  const itemType = params.itemType?.trim().toLowerCase();
  if (itemType && item.itemType.toLowerCase() !== itemType) return false;
  if (!query) return true;
  const haystack = searchKey([
    item.marketHashName,
    item.itemType,
    item.category,
    item.rarity,
    item.collection,
  ].filter(Boolean).join(" "));
  return query.split(" ").filter(Boolean).every((token) => haystack.includes(token));
}

function buildSearchTokens(value?: string | null) {
  return searchKey(value ?? "")
    .split(" ")
    .filter(Boolean);
}

export function sortCs2CatalogItems(items: Cs2ItemView[], sort: Cs2CatalogSort) {
  return [...items].sort((a, b) => {
    if (sort === "name") return a.marketHashName.localeCompare(b.marketHashName);
    if (sort === "price-asc") return (a.bestAskCents ?? Number.MAX_SAFE_INTEGER) - (b.bestAskCents ?? Number.MAX_SAFE_INTEGER);
    if (sort === "price-desc") return (b.bestAskCents ?? -1) - (a.bestAskCents ?? -1);
    if (sort === "china-discount") return (a.spreadPercent ?? 1000) - (b.spreadPercent ?? 1000);
    return a.marketHashName.localeCompare(b.marketHashName);
  });
}

function buildFacets(items: Cs2ItemView[]) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.itemType, (counts.get(item.itemType) ?? 0) + 1);
  return {
    itemTypes: [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
  };
}

function buildSearchWhere(params: CatalogParams) {
  const normalizedType = params.itemType?.trim().toLowerCase();
  const queryTokens = buildSearchTokens(params.query);
  const queryWhere = queryTokens.length > 0 ? {
    AND: queryTokens.map((token) => ({
      OR: [
        { marketHashName: { contains: token, mode: "insensitive" as const } },
        { itemType: { contains: token, mode: "insensitive" as const } },
        { category: { contains: token, mode: "insensitive" as const } },
        { rarity: { contains: token, mode: "insensitive" as const } },
        { collection: { contains: token, mode: "insensitive" as const } },
      ],
    })),
  } : {};
  return {
    ...(normalizedType ? { itemType: normalizedType } : {}),
    ...queryWhere,
  };
}

function buildCatalogOrderBy(sort: Cs2CatalogSort) {
  if (sort === "name") return [{ marketHashName: "asc" as const }];
  if (sort === "price-asc") {
    return [
      { marketSummary: { bestAskCents: "asc" as const } },
      { marketHashName: "asc" as const },
    ];
  }
  if (sort === "price-desc") {
    return [
      { marketSummary: { bestAskCents: "desc" as const } },
      { marketHashName: "asc" as const },
    ];
  }
  if (sort === "china-discount") {
    return [
      { marketSummary: { spreadPercent: "asc" as const } },
      { marketSummary: { askVolumeTotal: "desc" as const } },
      { marketHashName: "asc" as const },
    ];
  }
  return [
    { marketSummary: { latestObservedAt: "desc" as const } },
    { updatedAt: "desc" as const },
  ];
}

function buildResponse(params: CatalogParams & {
  mode: "live" | "sample";
  warning: string | null;
  page: number;
  limit: number;
  totalItems: number;
  items: Cs2ItemView[];
  facetItems: Cs2ItemView[];
}): Cs2CatalogResponse {
  return {
    generatedAt: new Date().toISOString(),
    mode: params.mode,
    warning: params.warning,
    page: params.page,
    limit: params.limit,
    totalItems: params.totalItems,
    totalPages: Math.max(1, Math.ceil(params.totalItems / params.limit)),
    query: params.query?.trim() || null,
    itemType: params.itemType?.trim() || null,
    sort: params.sort ?? "updated",
    items: params.items,
    facets: buildFacets(params.facetItems),
  };
}

function searchKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toItemSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function catalogSeedToItem(
  seed: {
    marketHashName: string;
    itemType: string;
    category: string | null;
    rarity: string | null;
    exterior: string | null;
    collection: string | null;
    imageUrl: string | null;
    tradable: boolean;
  },
  snapshots: ProviderSnapshotInput[] = [],
  idPrefix = "metadata",
) {
  const normalizedSnapshots = snapshots.map((snapshot) => ({
    provider: snapshot.provider,
    marketName: snapshot.marketName,
    marketRegion: snapshot.marketRegion,
    currency: "USD" as const,
    askCents: snapshot.askCents,
    bidCents: snapshot.bidCents,
    medianCents: snapshot.medianCents,
    askVolume: snapshot.askVolume,
    bidVolume: snapshot.bidVolume,
    salesVolume24h: snapshot.salesVolume24h,
    liquidityScore: snapshot.liquidityScore,
    observedAt: snapshot.observedAt.toISOString(),
    sourceUrl: snapshot.sourceUrl,
  }));
  const bestAskCents = normalizedSnapshots.reduce<number | null>((bestAsk, snapshot) => {
    if (snapshot.askCents === null) return bestAsk;
    return bestAsk === null ? snapshot.askCents : Math.min(bestAsk, snapshot.askCents);
  }, null);

  return {
    id: `${idPrefix}-${toItemSlug(seed.marketHashName)}`,
    marketHashName: seed.marketHashName,
    itemType: seed.itemType,
    category: seed.category,
    rarity: seed.rarity,
    exterior: seed.exterior,
    collection: seed.collection,
    imageUrl: seed.imageUrl,
    tradable: seed.tradable,
    bestAskCents,
    bestBidCents: null,
    chineseAskCents: null,
    globalAskCents: bestAskCents,
    spreadPercent: null,
    snapshots: normalizedSnapshots,
    candles: [],
  };
}

function providerItemToCatalogItem(item: ProviderItemInput, metadata?: {
  imageUrl: string | null;
  rarity: string | null;
  collection: string | null;
  category: string | null;
}): Cs2ItemView {
  return catalogSeedToItem({
    marketHashName: item.marketHashName,
    itemType: item.itemType,
    category: item.category ?? metadata?.category ?? null,
    rarity: item.rarity ?? metadata?.rarity ?? null,
    exterior: item.exterior,
    collection: item.collection ?? metadata?.collection ?? null,
    imageUrl: item.imageUrl ?? metadata?.imageUrl ?? null,
    tradable: item.tradable,
  }, item.snapshots, "skinport");
}

function catalogSeedToCatalogItem(item: ProviderCatalogItemInput): Cs2ItemView {
  return catalogSeedToItem({
    marketHashName: item.marketHashName,
    itemType: item.itemType,
    category: item.category,
    rarity: item.rarity,
    exterior: item.exterior,
    collection: item.collection,
    imageUrl: item.imageUrl,
    tradable: item.tradable,
  }, [], "cs2cap");
}

function metadataToCatalogItem(metadata: Awaited<ReturnType<typeof getCs2ItemMetadataCatalog>>[number]): Cs2ItemView {
  return catalogSeedToItem({
    marketHashName: metadata.marketHashName,
    itemType: metadata.itemType ?? inferItemType(metadata.marketHashName),
    category: metadata.category ?? inferCategory(metadata.marketHashName),
    rarity: metadata.rarity,
    exterior: metadata.exterior,
    collection: metadata.collection,
    imageUrl: metadata.imageUrl,
    tradable: true,
  }, [], "metadata");
}

function mergeCatalogRows(baseRows: Cs2ItemView[], incomingRows: Cs2ItemView[]) {
  const merged = new Map<string, Cs2ItemView>();

  for (const item of baseRows) {
    merged.set(item.marketHashName.toLowerCase(), item);
  }

  for (const item of incomingRows) {
    const key = item.marketHashName.toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      continue;
    }

    merged.set(key, {
      ...existing,
      itemType: existing.itemType || item.itemType,
      category: existing.category ?? item.category,
      rarity: existing.rarity ?? item.rarity,
      exterior: existing.exterior ?? item.exterior,
      collection: existing.collection ?? item.collection,
      imageUrl: existing.imageUrl ?? item.imageUrl,
      tradable: existing.tradable || item.tradable,
      bestAskCents: existing.bestAskCents ?? item.bestAskCents,
      bestBidCents: existing.bestBidCents ?? item.bestBidCents,
      chineseAskCents: existing.chineseAskCents ?? item.chineseAskCents,
      globalAskCents: existing.globalAskCents ?? item.globalAskCents,
      spreadPercent: existing.spreadPercent ?? item.spreadPercent,
      snapshots: existing.snapshots.length > 0 ? existing.snapshots : item.snapshots,
      candles: existing.candles.length > 0 ? existing.candles : item.candles,
    });
  }

  return Array.from(merged.values());
}

function catalogCandidatesToResponse(
  params: CatalogParams & { page: number; limit: number; sort: Cs2CatalogSort; },
  candidates: Cs2ItemView[],
  warning: string,
  mode: "live" | "sample",
) {
  if (candidates.length === 0) return null;
  const offset = (params.page - 1) * params.limit;
  const sorted = sortCs2CatalogItems(candidates, params.sort);
  return buildResponse({
    ...params,
    mode,
    warning,
    totalItems: sorted.length,
    items: sorted.slice(offset, offset + params.limit),
    facetItems: sorted,
  });
}

async function getSkinportSearchCandidates(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const query = params.query?.trim();
  if (!query || query.length < 2) return [];

  const maxRows = Math.min(500, Math.max(params.page * params.limit, params.limit));
  const items = await fetchSkinportLatestItems({
    query,
    limit: maxRows,
  });
  const metadata = await getCs2ItemMetadataByMarketHashName(items.map((item) => item.marketHashName));
  return sortCs2CatalogItems(
    items
      .map((item) => providerItemToCatalogItem(item, metadata.get(item.marketHashName)))
      .filter((item) => itemMatches(item, params)),
    params.sort,
  );
}

async function getSkinportSearchFallback(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const candidates = await getSkinportSearchCandidates(params);
  if (candidates.length === 0) return null;
  return catalogCandidatesToResponse(
    params,
    candidates,
    "Database unavailable; showing live Skinport market search results.",
    "live",
  );
}

async function getCs2CapSearchCandidates(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const query = params.query?.trim();
  if (!query || query.length < 2) return [];

  const maxRows = Math.min(500, Math.max(params.page * params.limit, params.limit));
  const catalogRows = await fetchCs2CapCatalogItems({
    query,
    limit: maxRows,
  });
  if (catalogRows.length === 0) return [];

  const catalogItems = catalogRows.map((item) => catalogSeedToCatalogItem(item));
  const filteredCatalog = catalogItems.filter((item) => itemMatches(item, params));
  const byName = new Map(filteredCatalog.map((item) => [item.marketHashName, item]));
  const names = Array.from(byName.keys());

  let latestRows: ProviderItemInput[] = [];
  if (names.length > 0) {
    latestRows = await fetchCs2CapLatestItems({
      marketHashNames: names,
      limit: Math.max(1, names.length * 2),
    });
  }
  const latestByName = new Map(latestRows.map((row) => [row.marketHashName, row]));

  return sortCs2CatalogItems(filteredCatalog.map((item) => {
    const live = latestByName.get(item.marketHashName);
    if (!live || live.snapshots.length === 0) return item;
    return catalogSeedToItem({
      marketHashName: item.marketHashName,
      itemType: live.itemType ?? item.itemType,
      category: live.category ?? item.category,
      rarity: item.rarity,
      exterior: item.exterior,
      collection: item.collection,
      imageUrl: item.imageUrl ?? live.imageUrl,
      tradable: live.tradable,
    }, live.snapshots, "cs2cap");
  }), params.sort);
}

async function getCs2CapSearchFallback(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const candidates = await getCs2CapSearchCandidates(params);
  if (candidates.length === 0) return null;
  return catalogCandidatesToResponse(
    params,
    candidates,
    "Database unavailable; showing live CS2Cap market search results.",
    "live",
  );
}

async function getMetadataSearchCandidates(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const query = params.query?.trim();
  if (!query || query.length < 2) return [];

  const fetchLimit = Math.min(500, Math.max(params.page * params.limit, params.limit));
  const metadataRows = await getCs2ItemMetadataCatalog({
    query,
    itemType: params.itemType,
    limit: fetchLimit,
    offset: 0,
  });
  return sortCs2CatalogItems(
    metadataRows.map(metadataToCatalogItem).filter((item) => itemMatches(item, params)),
    params.sort,
  );
}

async function getMetadataSearchFallback(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const candidates = await getMetadataSearchCandidates(params);
  if (candidates.length === 0) return null;
  return catalogCandidatesToResponse(
    params,
    candidates,
    "Database unavailable; using metadata catalog fallback for search results.",
    "sample",
  );
}

async function getLiveSearchCandidates(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const query = params.query?.trim();
  if (!query || query.length < 2) return [];

  const candidates: Cs2ItemView[] = [];
  const appendCandidates = (rows: Cs2ItemView[]) => {
    if (rows.length > 0) candidates.push(...rows);
  };

  try {
    appendCandidates(await getCs2CapSearchCandidates(params));
  } catch (error) {
    console.warn("[cs2] CS2Cap catalog search fallback unavailable.", error);
  }

  try {
    appendCandidates(await getSkinportSearchCandidates(params));
  } catch (error) {
    console.warn("[cs2] Skinport catalog search fallback unavailable.", error);
  }

  if (candidates.length === 0) {
    try {
      appendCandidates(await getMetadataSearchCandidates(params));
    } catch (error) {
      console.warn("[cs2] Metadata catalog search fallback unavailable.", error);
    }
  }

  return mergeCatalogRows([], candidates);
}

export async function getCs2Catalog(params: CatalogParams): Promise<Cs2CatalogResponse> {
  const page = normalizePage(params.page);
  const limit = normalizeLimit(params.limit);
  const sort = params.sort ?? "updated";
  const hasQuery = Boolean(params.query?.trim());

  try {
    const where = buildSearchWhere(params);
    const [totalItems, rows, facetRows] = await Promise.all([
      prisma.cs2Item.count({ where }),
      prisma.cs2Item.findMany({
        where,
        include: {
          latestSnapshots: { orderBy: { observedAt: "desc" } },
          marketSnapshots: { orderBy: { observedAt: "desc" }, take: 30 },
          priceCandles: { orderBy: { startsAt: "asc" }, take: 30 },
          marketSummary: true,
        },
        orderBy: buildCatalogOrderBy(sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cs2Item.findMany({
        where: buildSearchWhere({ query: params.query, itemType: params.itemType }),
        select: { itemType: true, id: true, marketHashName: true, category: true, rarity: true, exterior: true, collection: true, imageUrl: true, tradable: true },
        take: 5000,
      }),
    ]);
    const mappedRows = rows.map(dbItemToCs2ItemView);
    const facetItems = facetRows.map((item) => ({
      id: item.id,
      marketHashName: item.marketHashName,
      itemType: item.itemType,
      category: item.category,
      rarity: item.rarity,
      exterior: item.exterior,
      collection: item.collection,
      imageUrl: item.imageUrl,
      tradable: item.tradable,
      bestAskCents: null,
      bestBidCents: null,
      chineseAskCents: null,
      globalAskCents: null,
      spreadPercent: null,
      snapshots: [],
      candles: [],
    }));

    if (hasQuery) {
      const liveCandidates = await getLiveSearchCandidates({
        ...params,
        page,
        limit,
        sort,
      });
      if (liveCandidates.length > 0) {
        const mergedRows = mergeCatalogRows(mappedRows, liveCandidates);
        const offset = (page - 1) * limit;
        const mergedSorted = sortCs2CatalogItems(mergedRows, sort);
        const warning = totalItems === 0
          ? "Database unavailable; showing live market search results."
          : totalItems < page * limit
            ? "Partial database coverage for this query; merged with live market search results."
            : "Merged with live market search results for this query.";
        return buildResponse({
          ...params,
          mode: "live",
          warning,
          page,
          limit,
          sort,
          totalItems: mergedSorted.length,
          items: mergedSorted.slice(offset, offset + limit),
          facetItems: mergedSorted,
        });
      }
    }

    if (totalItems === 0 && hasQuery) {
      try {
        const cs2CapFallback = await getCs2CapSearchFallback({
          ...params,
          page,
          limit,
          sort,
        });
        if (cs2CapFallback?.items.length) return cs2CapFallback;
      } catch (cs2capError) {
        console.warn("[cs2] CS2Cap catalog search fallback unavailable.", cs2capError);
      }
      try {
        const skinportFallback = await getSkinportSearchFallback({
          ...params,
          page,
          limit,
          sort,
        });
        if (skinportFallback?.items.length) return skinportFallback;
      } catch (skinportError) {
        console.warn("[cs2] Skinport catalog search fallback unavailable.", skinportError);
      }
      try {
        const metadataFallback = await getMetadataSearchFallback({
          ...params,
          page,
          limit,
          sort,
        });
        if (metadataFallback?.items.length) return metadataFallback;
      } catch (metadataError) {
        console.warn("[cs2] Metadata catalog fallback unavailable.", metadataError);
      }
    }

    return buildResponse({
      ...params,
      sort,
      mode: "live",
      warning: null,
      page,
      limit,
      totalItems,
      items: mappedRows,
      facetItems,
    });
  } catch (error) {
    console.warn("[cs2] Catalog database unavailable; showing sample catalog.", error);
    try {
      const liveFallback = await getCs2CapSearchFallback({
        ...params,
        page,
        limit,
        sort,
      });
      if (liveFallback && liveFallback.items.length > 0) return liveFallback;
    } catch (cs2capError) {
      console.warn("[cs2] CS2Cap catalog search fallback unavailable; showing sample catalog.", cs2capError);
    }
    try {
      const liveFallback = await getSkinportSearchFallback({
        ...params,
        page,
        limit,
        sort,
      });
      if (liveFallback && liveFallback.items.length > 0) return liveFallback;
    } catch (skinportError) {
      console.warn("[cs2] Skinport catalog search unavailable; showing sample catalog.", skinportError);
    }
    try {
      const metadataFallback = await getMetadataSearchFallback({
        ...params,
        page,
        limit,
        sort,
      });
      if (metadataFallback) return metadataFallback;
    } catch (metadataError) {
      console.warn("[cs2] Metadata catalog search fallback unavailable.", metadataError);
    }
    const filtered = SAMPLE_CS2_ITEMS.filter((item) => itemMatches(item, params));
    const sorted = sortCs2CatalogItems(filtered, sort);
    const offset = (page - 1) * limit;
    return buildResponse({
      ...params,
      sort,
      mode: "sample",
      warning: "Database unavailable or CS2 schema pending; showing sample catalog.",
      page,
      limit,
      totalItems: filtered.length,
      items: sorted.slice(offset, offset + limit),
      facetItems: SAMPLE_CS2_ITEMS.filter((item) => itemMatches(item, { query: params.query })),
    });
  }
}
