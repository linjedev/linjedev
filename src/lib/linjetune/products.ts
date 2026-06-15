export type LinjeTuneProductId = "paintlab" | "tunes_10" | "tunes_25" | "tunes_60";

export interface LinjeTuneProduct {
  id: LinjeTuneProductId;
  name: string;
  description: string;
  unitAmountGbpPence: number;
  tuneTokens: number;
  unlocksPaintLab: boolean;
}

export const LINJETUNE_PRODUCTS: Record<LinjeTuneProductId, LinjeTuneProduct> = {
  paintlab: {
    id: "paintlab",
    name: "PaintLab unlock",
    description: "Permanent access to PaintLab color tools.",
    unitAmountGbpPence: 299,
    tuneTokens: 0,
    unlocksPaintLab: true,
  },
  tunes_10: {
    id: "tunes_10",
    name: "10 tune credits",
    description: "Good for light weekly tuning. Includes AI-enhanced tuning access.",
    unitAmountGbpPence: 199,
    tuneTokens: 10,
    unlocksPaintLab: false,
  },
  tunes_25: {
    id: "tunes_25",
    name: "25 tune credits",
    description: "Better value for regular builders. Includes AI-enhanced tuning access.",
    unitAmountGbpPence: 399,
    tuneTokens: 25,
    unlocksPaintLab: false,
  },
  tunes_60: {
    id: "tunes_60",
    name: "60 tune credits",
    description: "Best value for heavy tuning sessions. Includes AI-enhanced tuning access.",
    unitAmountGbpPence: 799,
    tuneTokens: 60,
    unlocksPaintLab: false,
  },
};

export function getLinjeTuneProduct(id: unknown): LinjeTuneProduct | null {
  return typeof id === "string" && id in LINJETUNE_PRODUCTS
    ? LINJETUNE_PRODUCTS[id as LinjeTuneProductId]
    : null;
}
