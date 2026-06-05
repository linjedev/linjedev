-- CreateTable
CREATE TABLE IF NOT EXISTS "cs2_item_market_summaries" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "bestAskCents" INTEGER,
    "bestBidCents" INTEGER,
    "chineseAskCents" INTEGER,
    "globalAskCents" INTEGER,
    "spreadPercent" DOUBLE PRECISION,
    "askVolumeTotal" INTEGER NOT NULL DEFAULT 0,
    "bidVolumeTotal" INTEGER NOT NULL DEFAULT 0,
    "salesVolume24hTotal" INTEGER NOT NULL DEFAULT 0,
    "liquidityScore" DOUBLE PRECISION,
    "latestObservedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cs2_item_market_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "cs2_item_market_summaries_itemId_key" ON "cs2_item_market_summaries"("itemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cs2_item_market_summaries_bestAskCents_idx" ON "cs2_item_market_summaries"("bestAskCents");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cs2_item_market_summaries_bestBidCents_idx" ON "cs2_item_market_summaries"("bestBidCents");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cs2_item_market_summaries_chineseAskCents_idx" ON "cs2_item_market_summaries"("chineseAskCents");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cs2_item_market_summaries_globalAskCents_idx" ON "cs2_item_market_summaries"("globalAskCents");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cs2_item_market_summaries_spreadPercent_idx" ON "cs2_item_market_summaries"("spreadPercent");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cs2_item_market_summaries_latestObservedAt_idx" ON "cs2_item_market_summaries"("latestObservedAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'cs2_item_market_summaries_itemId_fkey'
    ) THEN
        ALTER TABLE "cs2_item_market_summaries"
            ADD CONSTRAINT "cs2_item_market_summaries_itemId_fkey"
            FOREIGN KEY ("itemId") REFERENCES "cs2_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
