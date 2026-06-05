import type { Cs2FloatListingView, Cs2FloatSort } from "@/lib/cs2/types";

const CSFLOAT_BASE_URL = "https://csfloat.com/api/v1";
const STEAM_IMAGE_BASE = "https://community.fastly.steamstatic.com/economy/image";

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function steamImageUrl(path: unknown) {
  const value = readString(path);
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${STEAM_IMAGE_BASE}/${value}`;
}

function readObject(value: unknown) {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function listingToView(row: Record<string, unknown>): Cs2FloatListingView | null {
  const item = readObject(row.item);
  const marketHashName = readString(item?.market_hash_name) ?? readString(row.market_hash_name);
  if (!marketHashName) return null;
  const listingId = readString(row.id) ?? `${marketHashName}-${readNumber(item?.float_value) ?? "listing"}`;
  const screenshotId = readString(row.id);

  return {
    id: listingId,
    marketHashName,
    itemName: readString(item?.item_name),
    wearName: readString(item?.wear_name),
    priceCents: readNumber(row.price),
    referencePriceCents: readNumber(item?.scm && readObject(item.scm)?.price),
    floatValue: readNumber(item?.float_value),
    paintSeed: readNumber(item?.paint_seed),
    paintIndex: readNumber(item?.paint_index),
    floatRank: readNumber(item?.float_rank),
    rarity: readNumber(item?.rarity),
    imageUrl: steamImageUrl(item?.icon_url),
    screenshotUrl: screenshotId ? `${CSFLOAT_BASE_URL}/listings/${screenshotId}/screenshot` : null,
    inspectUrl: readString(item?.inspect_link),
    listingUrl: screenshotId ? `https://csfloat.com/item/${screenshotId}` : null,
    hasScreenshot: readBoolean(item?.has_screenshot),
    stickers: Array.isArray(item?.stickers)
      ? item.stickers.map((sticker) => readObject(sticker)).filter((sticker): sticker is Record<string, unknown> => sticker !== null).map((sticker) => ({
        name: readString(sticker.name) ?? "Sticker",
        slot: readNumber(sticker.slot),
        imageUrl: steamImageUrl(sticker.icon_url),
      }))
      : [],
  };
}

export function flattenCsFloatListings(rows: Record<string, unknown>[]) {
  return rows
    .map(listingToView)
    .filter((listing): listing is Cs2FloatListingView => listing !== null);
}

export async function fetchCsFloatListings(params: {
  query?: string | null;
  minFloat?: number | null;
  maxFloat?: number | null;
  paintSeed?: number | null;
  paintIndex?: number | null;
  sort?: Cs2FloatSort;
  limit?: number;
}) {
  const url = new URL(`${CSFLOAT_BASE_URL}/listings`);
  url.searchParams.set("limit", String(Math.min(50, Math.max(1, params.limit ?? 20))));
  url.searchParams.set("sort_by", params.sort ?? "best_deal");
  if (params.query?.trim()) url.searchParams.set("market_hash_name", params.query.trim());
  if (params.minFloat !== null && params.minFloat !== undefined) url.searchParams.set("min_float", String(params.minFloat));
  if (params.maxFloat !== null && params.maxFloat !== undefined) url.searchParams.set("max_float", String(params.maxFloat));
  if (params.paintSeed !== null && params.paintSeed !== undefined) url.searchParams.set("paint_seed", String(params.paintSeed));
  if (params.paintIndex !== null && params.paintIndex !== undefined) url.searchParams.set("paint_index", String(params.paintIndex));

  const response = await fetch(url, {
    headers: process.env.CSFLOAT_API_KEY ? { Authorization: process.env.CSFLOAT_API_KEY } : undefined,
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error(`CSFloat listings returned ${response.status}`);
  const payload = await response.json() as unknown;
  const payloadObject = readObject(payload);
  const dataRows = payloadObject && Array.isArray(payloadObject.data) ? payloadObject.data : [];
  const rows = Array.isArray(payload)
    ? payload
    : dataRows;
  return flattenCsFloatListings(rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null));
}
