import { fetchCsFloatListings } from "@/lib/cs2/providers/csfloat";
import { getCs2ItemMetadataCatalog } from "@/lib/cs2/itemMetadataService";
import type { Cs2FloatListingView, Cs2FloatSearchResponse, Cs2FloatSort } from "@/lib/cs2/types";

type FloatSearchParams = {
  query?: string | null;
  minFloat?: number | null;
  maxFloat?: number | null;
  paintSeed?: number | null;
  paintIndex?: number | null;
  sort?: Cs2FloatSort;
};

const SAMPLE_FLOAT_LISTINGS: Cs2FloatListingView[] = [
  {
    id: "sample-float-ak-redline",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    itemName: "AK-47 | Redline",
    wearName: "Field-Tested",
    priceCents: 2899,
    referencePriceCents: 3120,
    floatValue: 0.15081234,
    paintSeed: 661,
    paintIndex: 282,
    floatRank: 1842,
    rarity: 5,
    imageUrl: null,
    screenshotUrl: null,
    inspectUrl: null,
    listingUrl: "https://csfloat.com/search?market_hash_name=AK-47%20%7C%20Redline%20(Field-Tested)",
    hasScreenshot: false,
    stickers: [
      { name: "Sticker | Crown (Foil)", slot: 0, imageUrl: null },
      { name: "Sticker | Battle Scarred", slot: 3, imageUrl: null },
    ],
  },
  {
    id: "sample-float-m4a4-poseidon",
    marketHashName: "M4A4 | Poseidon (Factory New)",
    itemName: "M4A4 | Poseidon",
    wearName: "Factory New",
    priceCents: 221000,
    referencePriceCents: 236500,
    floatValue: 0.0279657766,
    paintSeed: 112,
    paintIndex: 449,
    floatRank: 428,
    rarity: 6,
    imageUrl: "https://community.fastly.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3djFN79fnzL-ckvbnNrfummJW4NE_j7mT8Nrw3QXt_RY-NzymIIHGdw87ZlHZrAe-wO-70ZC4uZzNzndjvz5iuyhP0kvddA/",
    screenshotUrl: null,
    inspectUrl: null,
    listingUrl: "https://csfloat.com/search?market_hash_name=M4A4%20%7C%20Poseidon%20(Factory%20New)",
    hasScreenshot: true,
    stickers: [],
  },
];

function matches(listing: Cs2FloatListingView, params: FloatSearchParams) {
  const query = params.query?.trim().toLowerCase();
  if (query && !listing.marketHashName.toLowerCase().includes(query)) return false;
  if (params.minFloat !== null && params.minFloat !== undefined && (listing.floatValue ?? 1) < params.minFloat) return false;
  if (params.maxFloat !== null && params.maxFloat !== undefined && (listing.floatValue ?? 1) > params.maxFloat) return false;
  if (params.paintSeed !== null && params.paintSeed !== undefined && listing.paintSeed !== params.paintSeed) return false;
  if (params.paintIndex !== null && params.paintIndex !== undefined && listing.paintIndex !== params.paintIndex) return false;
  return true;
}

function sortListings(listings: Cs2FloatListingView[], sort: Cs2FloatSort) {
  return [...listings].sort((a, b) => {
    if (sort === "lowest_float" || sort === "float_rank") return (a.floatValue ?? 1) - (b.floatValue ?? 1);
    if (sort === "highest_float") return (b.floatValue ?? 0) - (a.floatValue ?? 0);
    if (sort === "lowest_price" || sort === "best_deal") return (a.priceCents ?? Number.MAX_SAFE_INTEGER) - (b.priceCents ?? Number.MAX_SAFE_INTEGER);
    if (sort === "highest_price") return (b.priceCents ?? 0) - (a.priceCents ?? 0);
    return a.marketHashName.localeCompare(b.marketHashName);
  });
}

async function resolveMarketHashNames(query?: string | null) {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) return [];

  const matches = await getCs2ItemMetadataCatalog({
    query: normalizedQuery,
    limit: 6,
    offset: 0,
  });

  const exactKey = normalizedQuery.toLowerCase();
  const exactMatches = matches.filter((match) => match.marketHashName.toLowerCase() === exactKey);
  const resolved = exactMatches.length > 0 ? exactMatches : matches;

  return resolved.map((match) => match.marketHashName);
}

function dedupeListings(listings: Cs2FloatListingView[]) {
  const merged = new Map<string, Cs2FloatListingView>();
  for (const listing of listings) {
    if (!merged.has(listing.id)) {
      merged.set(listing.id, listing);
    }
  }
  return [...merged.values()];
}

function buildResponse(params: FloatSearchParams & {
  mode: "live" | "sample";
  warning: string | null;
  resolvedMarketHashNames: string[];
  listings: Cs2FloatListingView[];
}): Cs2FloatSearchResponse {
  return {
    generatedAt: new Date().toISOString(),
    mode: params.mode,
    warning: params.warning,
    query: params.query?.trim() || null,
    resolvedMarketHashNames: params.resolvedMarketHashNames,
    minFloat: params.minFloat ?? null,
    maxFloat: params.maxFloat ?? null,
    paintSeed: params.paintSeed ?? null,
    paintIndex: params.paintIndex ?? null,
    sort: params.sort ?? "best_deal",
    listings: params.listings,
  };
}

export async function searchCs2FloatListings(params: FloatSearchParams): Promise<Cs2FloatSearchResponse> {
  const sort = params.sort ?? "best_deal";
  const resolvedMarketHashNames = await resolveMarketHashNames(params.query);
  const candidateNames = resolvedMarketHashNames.length > 0
    ? resolvedMarketHashNames.slice(0, 4)
    : (params.query?.trim() ? [params.query.trim()] : []);

  try {
    const listings = candidateNames.length === 0
      ? await fetchCsFloatListings({ ...params, sort, limit: 20 })
      : dedupeListings((await Promise.all(candidateNames.map((marketHashName) => fetchCsFloatListings({
        ...params,
        query: undefined,
        marketHashName,
        sort,
        limit: candidateNames.length > 1 ? 8 : 20,
      })))).flat());

    return buildResponse({
      ...params,
      sort,
      mode: "live",
      warning: null,
      resolvedMarketHashNames: candidateNames,
      listings: sortListings(listings, sort),
    });
  } catch (error) {
    console.warn("[cs2] CSFloat search unavailable; showing sample float listings.", error);
    return buildResponse({
      ...params,
      sort,
      mode: "sample",
      warning: "CSFloat listings unavailable; showing sample float search results.",
      resolvedMarketHashNames: candidateNames,
      listings: sortListings(SAMPLE_FLOAT_LISTINGS.filter((listing) => matches(listing, params)), sort),
    });
  }
}
