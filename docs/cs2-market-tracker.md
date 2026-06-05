# CS2 Market Tracker

Linje's CS2 tracker stores canonical sellable items, normalized marketplace snapshots, OHLC candles, and user watchlists. Provider APIs feed the database through adapters; the UI reads Linje's normalized model rather than a provider-specific response.

The data model has two price layers:

- `cs2_market_snapshots`: append-only observations for audit trails and historical analysis.
- `cs2_market_latest_snapshots`: one current row per item/provider/market for fast dashboard reads, watchlist alerts, and spread scans.
- `cs2_item_market_summaries`: one derived row per item for scalable catalog sorting by best ask, best bid, China/global ask, spread, liquidity, volume, and latest observation.

This is like keeping a receipt box, price tags, and an index card. The receipt box has every observation for audits and charts; price tags hold each venue's current answer; the index card lets the catalog sort thousands of items without opening every receipt.

## Catalog API

The scalable item browser uses a paginated catalog endpoint:

```bash
curl "http://localhost:3000/api/cs2/items?limit=50&page=1&sort=china-discount"
```

Supported query parameters:

- `q`: search by market hash name, item type, category, rarity, or collection.
- `itemType`: filter facets such as `skin`, `sticker`, `operator`, `knife`, or `gloves`.
- `page` and `limit`: bounded pagination, capped at 100 items per page.
- `sort`: `updated`, `name`, `price-asc`, `price-desc`, or `china-discount`.

The endpoint falls back to sample data when the local database is unavailable, so the UI can still render while Postgres or provider credentials are being configured.

## Watchlist Tracking

Watchlist entries are keyed by exact `marketHashName`, so any sellable CS2 item from the canonical catalog can be tracked:

```bash
curl -X POST "http://localhost:3000/api/cs2/watchlist" \
  -H "Content-Type: application/json" \
  -H "x-linje-watch-owner: local-owner" \
  -d '{
    "marketHashName":"AK-47 | Redline (Field-Tested)",
    "targetBuyCents":2700,
    "targetSellCents":3200,
    "notes":"Track China anchor discount"
  }'
```

When live provider keys are configured, adding a watchlist item also attempts immediate hydration from the configured China-aware providers. The response includes a `hydration` array with per-provider status, item count, snapshot count, and any provider error. That makes the watchlist behave like a tracking request, not just a saved label.

## Float-Specific Listing Search

The dashboard includes a CSFloat-style listing search for exact listed assets. It is separate from the catalog because float, paint seed, paint index, screenshots, stickers, and inspect links belong to an individual listing, not the generic item.

```bash
curl "http://localhost:3000/api/cs2/float-search?q=AK-47%20%7C%20Redline%20(Field-Tested)&minFloat=0.15&maxFloat=0.18&sort=lowest_float"
```

Supported query parameters:

- `q`: exact CSFloat market hash name filter.
- `minFloat` / `maxFloat`: float range from `0` to `1`.
- `paintSeed`: pattern seed filter.
- `paintIndex`: paint index filter.
- `sort`: `best_deal`, `lowest_price`, `highest_price`, `lowest_float`, `highest_float`, `most_recent`, or `float_rank`.

The route returns live CSFloat listings when available and falls back to sample float listings when CSFloat is unavailable.

## Providers

The first live adapter is `cs2.sh` because it covers BUFF163, YouPin898, CSFloat, Steam, Skinport, and C5Game with current prices and historical candles. BUFF163 and YouPin are treated as Chinese anchor markets for spread analysis.

The second adapter is `CS2Cap`, which adds a full catalog endpoint plus normalized lowest asks across 40+ providers. That provider is the preferred path for broad whole-market ingestion because it can populate sellable item metadata separately from current listing availability.

The third adapter is `Pricempire`, which is another China-first aggregator path. It supports BUFF163/YouPin sell prices and buy-order sources (`buff163_buy`, `youpin_buy`), plus metadata such as images, liquidity, item counts, and ranks. That makes it a useful redundancy layer for the tracker instead of depending on a single aggregator for Chinese anchors.

Required local secrets:

```bash
CS2SH_API_KEY=...
CS2CAP_API_KEY=...
PRICEMPIRE_API_KEY=...
CSFLOAT_API_KEY=...
CS2_SYNC_SECRET=...
```

`CSFLOAT_API_KEY` is optional for public listings search, but should be configured if CSFloat enforces authenticated listing requests or for higher reliability.

## Sync Item Catalog

Use CS2Cap to populate canonical sellable CS2 items before or alongside price ingestion:

```bash
pnpm cs2:sync:catalog -- --provider=cs2cap --limit=1000
```

```bash
curl -X POST http://localhost:3000/api/cs2/sync \
  -H "Content-Type: application/json" \
  -H "x-cs2-sync-secret: $CS2_SYNC_SECRET" \
  -d '{"mode":"catalog","provider":"cs2cap","limit":1000}'
```

## Sync Latest Prices

Cron-friendly script:

```bash
pnpm cs2:sync:latest
```

CS2Cap latest-price sync can focus on Chinese anchors and key global exit venues:

```bash
pnpm cs2:sync:latest -- --provider=cs2cap --providers=buff163,youpin,csfloat,steam,dmarket,skinport --limit=1000
```

Pricempire latest-price sync can capture Chinese asks and buy orders in the same normalized snapshots:

```bash
pnpm cs2:sync:latest -- --provider=pricempire --providers=buff163,buff163_buy,youpin,youpin_buy,csfloat,skinport,steam --limit=1000
```

Full provider snapshot:

```bash
curl -X POST http://localhost:3000/api/cs2/sync \
  -H "Content-Type: application/json" \
  -H "x-cs2-sync-secret: $CS2_SYNC_SECRET" \
  -d '{"mode":"latest","provider":"cs2.sh"}'
```

Bounded smoke test:

```bash
curl -X POST http://localhost:3000/api/cs2/sync \
  -H "Content-Type: application/json" \
  -H "x-cs2-sync-secret: $CS2_SYNC_SECRET" \
  -d '{"mode":"latest","provider":"cs2.sh","limit":100}'
```

## Sync Pipeline

The pipeline mode is the recommended production scheduler entrypoint. It composes the configured provider adapters into one China-first ingestion run:

- CS2Cap catalog sync when `CS2CAP_API_KEY` is configured.
- Latest prices from `cs2.sh`, CS2Cap, and/or Pricempire when their keys are configured.
- Optional watchlist history backfill for watched items.

```bash
pnpm cs2:sync:pipeline -- --catalog-limit=100000 --latest-limit=100000
```

With watched-item history:

```bash
pnpm cs2:sync:pipeline -- --watchlist-history=true --owner=local-owner --history-provider=cs2cap --history-lookback=30d --history-interval=1d --watchlist-limit=100
```

```bash
curl -X POST http://localhost:3000/api/cs2/sync \
  -H "Content-Type: application/json" \
  -H "x-cs2-sync-secret: $CS2_SYNC_SECRET" \
  -H "x-linje-watch-owner: local-owner" \
  -d '{
    "mode":"pipeline",
    "catalogLimit":100000,
    "latestLimit":100000,
    "includeWatchlistHistory":true,
    "historyProvider":"cs2cap",
    "historyLookback":"30d",
    "historyInterval":"1d",
    "watchlistLimit":100
  }'
```

The response is a pipeline summary with aggregate counts plus `runs`, preserving each sub-step's provider status and error message.

## Backfill History

Cron-friendly cs2.sh script for per-source historical candles:

```bash
pnpm cs2:sync:history -- --items="AK-47 | Redline (Field-Tested)" --sources=buff,youpin,csfloat --start=2026-01-01 --end=2026-06-04 --interval=1d
```

```bash
curl -X POST http://localhost:3000/api/cs2/sync \
  -H "Content-Type: application/json" \
  -H "x-cs2-sync-secret: $CS2_SYNC_SECRET" \
  -d '{
    "mode":"history",
    "provider":"cs2.sh",
    "marketHashNames":["AK-47 | Redline (Field-Tested)"],
    "sources":["buff","youpin","csfloat"],
    "start":"2026-01-01",
    "end":"2026-06-04",
    "interval":"1d"
  }'
```

CS2Cap also supports composite OHLCV candles across providers. This is useful for broader market trend analysis when a blended cross-market candle is enough:

```bash
pnpm cs2:sync:history -- --provider=cs2cap --items="AK-47 | Redline (Field-Tested)" --lookback=30d --interval=1d --fill=true
```

```bash
curl -X POST http://localhost:3000/api/cs2/sync \
  -H "Content-Type: application/json" \
  -H "x-cs2-sync-secret: $CS2_SYNC_SECRET" \
  -d '{
    "mode":"history",
    "provider":"cs2cap",
    "marketHashNames":["AK-47 | Redline (Field-Tested)"],
    "lookback":"30d",
    "interval":"1d",
    "fill":true
  }'
```

CS2Cap candle intervals are `5m`, `1h`, and `1d`. cs2.sh additionally supports the tracker's `30m` interval path.

Pricempire history is an enterprise API and currently maps to daily candles for one provider key at a time:

```bash
pnpm cs2:sync:history -- --provider=pricempire --items="AK-47 | Redline (Field-Tested)" --sources=buff163 --start=2026-01-01 --end=2026-06-04 --interval=1d
```

Watchlist history backfill reads the watched item names from Linje and then uses the same provider adapters. This is the preferred scheduled path for user-specific analysis because the cron job does not need to know the market hash names ahead of time:

```bash
pnpm cs2:sync:watchlist-history -- --provider=cs2.sh --owner=local-owner --sources=buff,youpin,csfloat --start=2026-01-01 --end=2026-06-04 --interval=1d --limit=100
```

```bash
curl -X POST http://localhost:3000/api/cs2/sync \
  -H "Content-Type: application/json" \
  -H "x-cs2-sync-secret: $CS2_SYNC_SECRET" \
  -H "x-linje-watch-owner: local-owner" \
  -d '{
    "mode":"watchlist-history",
    "provider":"cs2.sh",
    "sources":["buff","youpin","csfloat"],
    "start":"2026-01-01",
    "end":"2026-06-04",
    "interval":"1d",
    "limit":100
  }'
```

## Market Analysis

The analysis endpoint combines the current price surface with historical candles and watchlist targets:

```bash
curl "http://localhost:3000/api/cs2/market/analysis"
```

It returns:

- `opportunities`: China-anchor discount opportunities ranked by spread, liquidity, and volume.
- `trendSignals`: candle-derived movers with recent change, volatility, total volume, provider, market, and interval.
- `watchlistSignals`: buy/sell target, China discount, and stale-data alerts for watched items.
- `marketCoverage`: current coverage counts, including Chinese/global price coverage, historical candle depth, per-market coverage, per-item-type coverage, and explicit gap counts for missing China anchors, missing global prices, missing spreads, missing history, and stale observations.

## Sync Status

```bash
curl http://localhost:3000/api/cs2/sync/status
```

The status response reports tracked item count, latest snapshot count, candle count, most recent market observation, and the last 10 sync runs.
It also reports `marketSummaryCount`, which should approach the item count as live syncs populate derived catalog-sort summaries.

## Scaling Notes

Run latest-price sync on a short cadence, then backfill history for watchlisted or high-liquidity items. In production, point `CS2_SYNC_URL` at the public app URL and schedule `pnpm cs2:sync:latest` from Coolify cron or another scheduler. Add more providers by implementing a provider adapter that returns `ProviderItemInput` and `ProviderCandleInput`; persistence and UI do not need provider-specific changes.

Keep hot dashboard reads on `cs2_market_latest_snapshots` and `cs2_item_market_summaries`, and reserve `cs2_market_snapshots` plus `cs2_price_candles` for charts, backtests, and deeper analysis. That keeps high-frequency ingestion from making normal browsing expensive.
