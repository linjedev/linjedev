-- CreateTable
CREATE TABLE "cs2_items" (
    "id" TEXT NOT NULL,
    "marketHashName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "category" TEXT,
    "rarity" TEXT,
    "exterior" TEXT,
    "collection" TEXT,
    "imageUrl" TEXT,
    "tradable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cs2_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cs2_market_snapshots" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "marketRegion" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "askCents" INTEGER,
    "bidCents" INTEGER,
    "medianCents" INTEGER,
    "askVolume" INTEGER,
    "bidVolume" INTEGER,
    "salesVolume24h" INTEGER,
    "liquidityScore" DOUBLE PRECISION,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "raw" JSONB,

    CONSTRAINT "cs2_market_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cs2_market_latest_snapshots" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "marketRegion" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "askCents" INTEGER,
    "bidCents" INTEGER,
    "medianCents" INTEGER,
    "askVolume" INTEGER,
    "bidVolume" INTEGER,
    "salesVolume24h" INTEGER,
    "liquidityScore" DOUBLE PRECISION,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "raw" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cs2_market_latest_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cs2_price_candles" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "openCents" INTEGER NOT NULL,
    "highCents" INTEGER NOT NULL,
    "lowCents" INTEGER NOT NULL,
    "closeCents" INTEGER NOT NULL,
    "volume" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cs2_price_candles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cs2_watchlist_items" (
    "id" TEXT NOT NULL,
    "ownerKey" TEXT NOT NULL,
    "userId" TEXT,
    "itemId" TEXT NOT NULL,
    "targetBuyCents" INTEGER,
    "targetSellCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cs2_watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cs2_market_sync_runs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotCount" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "cs2_market_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cs2_items_marketHashName_key" ON "cs2_items"("marketHashName");

-- CreateIndex
CREATE INDEX "cs2_items_itemType_idx" ON "cs2_items"("itemType");

-- CreateIndex
CREATE INDEX "cs2_items_category_idx" ON "cs2_items"("category");

-- CreateIndex
CREATE INDEX "cs2_items_updatedAt_idx" ON "cs2_items"("updatedAt");

-- CreateIndex
CREATE INDEX "cs2_market_snapshots_provider_marketName_observedAt_idx" ON "cs2_market_snapshots"("provider", "marketName", "observedAt");

-- CreateIndex
CREATE INDEX "cs2_market_snapshots_itemId_observedAt_idx" ON "cs2_market_snapshots"("itemId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cs2_market_latest_snapshots_itemId_provider_marketName_key" ON "cs2_market_latest_snapshots"("itemId", "provider", "marketName");

-- CreateIndex
CREATE INDEX "cs2_market_latest_snapshots_provider_marketName_idx" ON "cs2_market_latest_snapshots"("provider", "marketName");

-- CreateIndex
CREATE INDEX "cs2_market_latest_snapshots_marketRegion_askCents_idx" ON "cs2_market_latest_snapshots"("marketRegion", "askCents");

-- CreateIndex
CREATE INDEX "cs2_market_latest_snapshots_observedAt_idx" ON "cs2_market_latest_snapshots"("observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "cs2_price_candles_itemId_provider_marketName_interval_startsAt_key" ON "cs2_price_candles"("itemId", "provider", "marketName", "interval", "startsAt");

-- CreateIndex
CREATE INDEX "cs2_price_candles_marketName_interval_startsAt_idx" ON "cs2_price_candles"("marketName", "interval", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "cs2_watchlist_items_ownerKey_itemId_key" ON "cs2_watchlist_items"("ownerKey", "itemId");

-- CreateIndex
CREATE INDEX "cs2_watchlist_items_userId_idx" ON "cs2_watchlist_items"("userId");

-- CreateIndex
CREATE INDEX "cs2_market_sync_runs_provider_startedAt_idx" ON "cs2_market_sync_runs"("provider", "startedAt");

-- AddForeignKey
ALTER TABLE "cs2_market_snapshots" ADD CONSTRAINT "cs2_market_snapshots_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "cs2_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs2_market_latest_snapshots" ADD CONSTRAINT "cs2_market_latest_snapshots_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "cs2_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs2_price_candles" ADD CONSTRAINT "cs2_price_candles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "cs2_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs2_watchlist_items" ADD CONSTRAINT "cs2_watchlist_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "cs2_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cs2_watchlist_items" ADD CONSTRAINT "cs2_watchlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
