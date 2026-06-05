import { prisma } from "@/lib/db";
import {
  getCs2ItemMetadataByMarketHashName,
  getCs2ItemMetadataCatalog,
  getCs2ItemMetadataCatalogWithTotal,
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
import type { Cs2CatalogCoverageFilter, Cs2CatalogMarketFocus, Cs2CatalogResponse, Cs2CatalogSort, Cs2CatalogSourceFilter, Cs2ItemView } from "@/lib/cs2/types";

type CatalogParams = {
  query?: string | null;
  itemType?: string | null;
  coverage?: Cs2CatalogCoverageFilter;
  marketFocus?: Cs2CatalogMarketFocus;
  source?: Cs2CatalogSourceFilter;
  page?: number;
  limit?: number;
  sort?: Cs2CatalogSort;
};

function sourceFilterToMarketName(source: Cs2CatalogSourceFilter) {
  if (source === "buff") return "BUFF163";
  if (source === "youpin") return "YouPin898";
  if (source === "c5game") return "C5Game";
  if (source === "csfloat") return "CSFloat";
  if (source === "skinport") return "Skinport";
  if (source === "steam") return "Steam";
  return null;
}


function normalizePage(value: number | undefined) {
  return Number.isInteger(value) && value && value > 0 ? value : 1;
}

function normalizeLimit(value: number | undefined) {
  if (!Number.isInteger(value) || !value) return 50;
  return Math.min(100, Math.max(1, value));
}

function itemMatchesCoverage(item: Cs2ItemView, coverage: Cs2CatalogCoverageFilter) {
  if (coverage === "with-history") return item.candles.length > 1;
  if (coverage === "missing-history") return item.candles.length <= 1;
  if (coverage === "with-china") return item.chineseAskCents !== null;
  if (coverage === "missing-china") return item.chineseAskCents === null;
  if (coverage === "spreadable") return item.spreadPercent !== null;
  return true;
}

function itemMatchesMarketFocus(item: Cs2ItemView, marketFocus: Cs2CatalogMarketFocus) {
  if (marketFocus === "china") return item.chineseAskCents !== null || item.snapshots.some((snapshot) => snapshot.marketRegion === "china");
  if (marketFocus === "global") return item.globalAskCents !== null || item.snapshots.some((snapshot) => snapshot.marketRegion !== "china");
  return true;
}

function itemMatchesSource(item: Cs2ItemView, source: Cs2CatalogSourceFilter) {
  const marketName = sourceFilterToMarketName(source);
  if (!marketName) return true;
  return item.snapshots.some((snapshot) => snapshot.marketName === marketName);
}

function itemMatches(item: Cs2ItemView, params: CatalogParams) {
  const query = searchKey(params.query ?? "");
  const itemType = params.itemType?.trim().toLowerCase();
  if (itemType && item.itemType.toLowerCase() !== itemType) return false;
  if (!itemMatchesCoverage(item, params.coverage ?? "all")) return false;
  if (!itemMatchesMarketFocus(item, params.marketFocus ?? "all")) return false;
  if (!itemMatchesSource(item, params.source ?? "all")) return false;
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
  const coverage = params.coverage ?? "all";
  const marketFocus = params.marketFocus ?? "all";
  const source = params.source ?? "all";
  const marketName = sourceFilterToMarketName(source);
  const queryTokens = buildSearchTokens(params.query);
  const andClauses: Record<string, unknown>[] = [];
  if (queryTokens.length > 0) {
    andClauses.push(...queryTokens.map((token) => ({
      OR: [
        { marketHashName: { contains: token, mode: "insensitive" as const } },
        { itemType: { contains: token, mode: "insensitive" as const } },
        { category: { contains: token, mode: "insensitive" as const } },
        { rarity: { contains: token, mode: "insensitive" as const } },
        { collection: { contains: token, mode: "insensitive" as const } },
      ],
    })));
  }
  if (coverage === "with-history") andClauses.push({ priceCandles: { some: {} } });
  if (coverage === "missing-history") andClauses.push({ priceCandles: { none: {} } });
  if (coverage === "with-china") andClauses.push({ marketSummary: { is: { chineseAskCents: { not: null } } } });
  if (coverage === "missing-china") andClauses.push({ OR: [{ marketSummary: { is: null } }, { marketSummary: { is: { chineseAskCents: null } } }] });
  if (coverage === "spreadable") andClauses.push({ marketSummary: { is: { spreadPercent: { not: null } } } });
  if (marketFocus === "china") andClauses.push({ OR: [{ latestSnapshots: { some: { marketRegion: "china" } } }, { marketSnapshots: { some: { marketRegion: "china" } } }] });
  if (marketFocus === "global") andClauses.push({ OR: [{ latestSnapshots: { some: { marketRegion: { not: "china" } } } }, { marketSnapshots: { some: { marketRegion: { not: "china" } } } }] });
  if (marketName) andClauses.push({ OR: [{ latestSnapshots: { some: { marketName } } }, { marketSnapshots: { some: { marketName } } }] });

  return {
    ...(normalizedType ? { itemType: normalizedType } : {}),
    ...(andClauses.length > 0 ? { AND: andClauses } : {}),
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
    coverage: params.coverage ?? "all",
    marketFocus: params.marketFocus ?? "all",
    source: params.source ?? "all",
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
  if (!query || query.length < 2) return { candidates: [], total: 0 };

  const metadataRows = await getCs2ItemMetadataCatalogWithTotal({
    query,
    itemType: params.itemType,
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
  });

  return {
    candidates: sortCs2CatalogItems(
      metadataRows.items
        .map(metadataToCatalogItem)
        .filter((item) => itemMatches(item, params)),
      params.sort,
    ),
    total: metadataRows.total,
  };
}

async function getMetadataSearchFallback(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const response = await getMetadataSearchCandidates(params);
  const candidates = response.candidates;
  if (candidates.length === 0) return null;
  return buildResponse({
    ...params,
    mode: "sample",
    warning: "Database unavailable; using metadata catalog fallback for search results.",
    page: params.page,
    limit: params.limit,
    sort: params.sort,
    totalItems: response.total,
    items: candidates,
    facetItems: candidates,
  });
}

async function getMetadataFallbackByOffset(params: CatalogParams & {
  page: number;
  limit: number;
  sort: Cs2CatalogSort;
}) {
  const metadataRows = await getCs2ItemMetadataCatalogWithTotal({
    query: params.query?.trim(),
    itemType: params.itemType,
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
  });

  return {
    candidates: sortCs2CatalogItems(metadataRows.items.map(metadataToCatalogItem), params.sort),
    total: metadataRows.total,
  };
}

async function getMetadataFallback(
  params: CatalogParams & { page: number; limit: number; sort: Cs2CatalogSort },
  warning: string,
) {
  const { candidates, total } = await getMetadataFallbackByOffset(params);
  if (total === 0) return null;

  return buildResponse({
    ...params,
    mode: "sample",
    warning,
    sort: params.sort,
    totalItems: total,
    page: params.page,
    limit: params.limit,
    items: candidates,
    facetItems: candidates,
  });
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
      const metadataCandidates = await getMetadataSearchCandidates(params);
      appendCandidates(metadataCandidates.candidates);
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
    const mappedRows = rows.map(dbItemToCs2ItemView).filter((item) => itemMatches(item, params));
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
    })).filter((item) => itemMatches(item, params));
    const effectiveTotalItems = mappedRows.length < rows.length ? mappedRows.length : totalItems;

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
        const warning = effectiveTotalItems === 0
          ? "Database unavailable; showing live market search results."
          : effectiveTotalItems < page * limit
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

    if (effectiveTotalItems === 0 && !hasQuery) {
      try {
        const metadataFallback = await getMetadataFallback({
          ...params,
          page,
          limit,
          sort,
        }, "Database unavailable; showing metadata market catalog.");
        if (metadataFallback) return metadataFallback;
      } catch (metadataError) {
        console.warn("[cs2] Metadata catalog fallback unavailable.", metadataError);
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
      totalItems: effectiveTotalItems,
      items: mappedRows,
      facetItems,
    });
  } catch (error) {
    console.warn("[cs2] Catalog database unavailable; showing sample catalog.", error);
    if (params.query) {
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
    } else {
      try {
        const metadataFallback = await getMetadataFallback({
          ...params,
          page,
          limit,
          sort,
        }, "Database unavailable or CS2 schema pending; showing metadata market catalog.");
        if (metadataFallback) return metadataFallback;
      } catch (metadataError) {
        console.warn("[cs2] Metadata catalog fallback unavailable.", metadataError);
      }
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
