-- Scale CS2 catalog search/filtering as the sellable item set grows.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "cs2_items_marketHashName_trgm_idx"
  ON "cs2_items" USING GIN ("marketHashName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "cs2_items_itemType_trgm_idx"
  ON "cs2_items" USING GIN ("itemType" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "cs2_items_category_trgm_idx"
  ON "cs2_items" USING GIN ("category" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "cs2_items_rarity_trgm_idx"
  ON "cs2_items" USING GIN ("rarity" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "cs2_items_collection_trgm_idx"
  ON "cs2_items" USING GIN ("collection" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "cs2_market_latest_snapshots_marketName_idx"
  ON "cs2_market_latest_snapshots"("marketName");

CREATE INDEX IF NOT EXISTS "cs2_market_latest_snapshots_itemId_marketRegion_idx"
  ON "cs2_market_latest_snapshots"("itemId", "marketRegion");

CREATE INDEX IF NOT EXISTS "cs2_market_latest_snapshots_itemId_marketName_idx"
  ON "cs2_market_latest_snapshots"("itemId", "marketName");

CREATE INDEX IF NOT EXISTS "cs2_market_snapshots_marketName_idx"
  ON "cs2_market_snapshots"("marketName");

CREATE INDEX IF NOT EXISTS "cs2_market_snapshots_itemId_marketRegion_idx"
  ON "cs2_market_snapshots"("itemId", "marketRegion");

CREATE INDEX IF NOT EXISTS "cs2_market_snapshots_itemId_marketName_idx"
  ON "cs2_market_snapshots"("itemId", "marketName");
