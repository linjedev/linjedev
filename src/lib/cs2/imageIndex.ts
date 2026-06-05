const LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS = {
  akRedline: "/cs2-images/ak-redline.png",
  awpAsiimov: "/cs2-images/awp-asiimov.png",
  butterflyDoppler: "/cs2-images/butterfly-doppler.png",
  sportGlovesPandora: "/cs2-images/sport-gloves-pandora.png",
  crownFoil: "/cs2-images/crown-foil.png",
  miamiDarryl: "/cs2-images/miami-darryl.png",
};

export const CS2_IMAGE_INDEX: Record<string, string> = {
  "AK-47 | Redline (Field-Tested)": LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.akRedline,
  "AWP | Asiimov (Field-Tested)": LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.awpAsiimov,
  "★ Butterfly Knife | Doppler (Factory New)": LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.butterflyDoppler,
  "★ Sport Gloves | Pandora's Box (Field-Tested)": LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.sportGlovesPandora,
  "Sticker | Crown (Foil)": LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.crownFoil,
  "Sir Bloody Miami Darryl | The Professionals": LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS.miamiDarryl,
};

export const SAMPLE_CS2_IMAGE_URLS = LOCAL_TRANSPARENT_SAMPLE_IMAGE_URLS;

export function getIndexedCs2ImageUrl(marketHashName: string) {
  return CS2_IMAGE_INDEX[marketHashName] ?? null;
}

export function resolveCs2ImageUrl(marketHashName: string, candidateUrl?: string | null) {
  const indexedUrl = getIndexedCs2ImageUrl(marketHashName);
  if (indexedUrl) return indexedUrl;
  if (!candidateUrl) return null;
  return candidateUrl.includes("/social-images/") ? null : candidateUrl;
}
