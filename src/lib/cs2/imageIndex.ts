const LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS = {
  akRedline: "/cs2-images/ak-redline.png",
  awpAsiimov: "/cs2-images/awp-asiimov.png",
  butterflyDoppler: "/cs2-images/butterfly-doppler.png",
  sportGlovesPandora: "/cs2-images/sport-gloves-pandora.png",
  crownFoil: "/cs2-images/crown-foil.png",
  miamiDarryl: "/cs2-images/miami-darryl.png",
};

const STAR_PREFIX = "\u2605";
type ImageIndexEntry = [string, string];

export type Cs2ImageCatalogEntry = {
  marketHashName: string;
  imageUrl: string;
  backgroundRemoved: boolean;
  source: "indexed-transparent-local-render" | "csgo-api";
};

type ImageMetadataInput = {
  marketHashName: string;
  imageUrl: string | null;
};

function normalizeStarPrefix(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/^\s*&#9733;\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*Ã‚Â·\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*Ã¢\s*/u, `${STAR_PREFIX} `)
    .replace(/^\s*\u2605\s*/u, `${STAR_PREFIX} `);
}

function buildImageIndex(entries: ImageIndexEntry[]) {
  const index: Record<string, string> = {};
  for (const [marketHashName, imageUrl] of entries) {
    const canonical = normalizeStarPrefix(marketHashName);
    index[marketHashName] = imageUrl;
    index[marketHashName.normalize("NFKC")] = imageUrl;
    index[canonical] = imageUrl;
  }
  return index;
}

export const CS2_IMAGE_INDEX = buildImageIndex([
  ["AK-47 | Redline (Field-Tested)", LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.akRedline],
  ["AWP | Asiimov (Field-Tested)", LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.awpAsiimov],
  [`${STAR_PREFIX} Butterfly Knife | Doppler (Factory New)`, LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.butterflyDoppler],
  ["â˜… Butterfly Knife | Doppler (Factory New)", LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.butterflyDoppler],
  [`${STAR_PREFIX} Sport Gloves | Pandora's Box (Field-Tested)`, LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.sportGlovesPandora],
  ["â˜… Sport Gloves | Pandora's Box (Field-Tested)", LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.sportGlovesPandora],
  ["Sticker | Crown (Foil)", LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.crownFoil],
  ["Sir Bloody Miami Darryl | The Professionals", LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.miamiDarryl],
]);

export const SAMPLE_CS2_IMAGE_URLS = LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS;

export function getIndexedCs2ImageUrl(marketHashName: string) {
  const normalized = marketHashName.normalize("NFKC");
  return CS2_IMAGE_INDEX[normalized] ?? CS2_IMAGE_INDEX[normalizeStarPrefix(normalized)] ?? null;
}

export function resolveCs2ImageUrl(marketHashName: string, candidateUrl?: string | null) {
  const indexedUrl = getIndexedCs2ImageUrl(marketHashName);
  if (indexedUrl) return indexedUrl;
  if (!candidateUrl) return null;
  return candidateUrl.includes("/social-images/") ? null : candidateUrl;
}

export function buildCs2ImageCatalog(metadataItems: ImageMetadataInput[]): Cs2ImageCatalogEntry[] {
  const entries = new Map<string, Cs2ImageCatalogEntry>();

  for (const [marketHashName, imageUrl] of Object.entries(CS2_IMAGE_INDEX)) {
    const normalizedName = normalizeStarPrefix(marketHashName.normalize("NFKC"));
    if (entries.has(normalizedName)) continue;
    entries.set(normalizedName, {
      marketHashName: normalizedName,
      imageUrl,
      backgroundRemoved: true,
      source: "indexed-transparent-local-render",
    });
  }

  for (const metadata of metadataItems) {
    const normalizedName = normalizeStarPrefix(metadata.marketHashName.normalize("NFKC"));
    if (!metadata.imageUrl || entries.has(normalizedName)) continue;
    entries.set(normalizedName, {
      marketHashName: normalizedName,
      imageUrl: metadata.imageUrl,
      backgroundRemoved: false,
      source: "csgo-api",
    });
  }

  return Array.from(entries.values()).sort((a, b) => a.marketHashName.localeCompare(b.marketHashName));
}
