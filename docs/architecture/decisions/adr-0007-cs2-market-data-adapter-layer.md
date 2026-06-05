# CS2 Market Data Adapter Layer

## Context

Linje is being expanded into a full-stack Counter-Strike 2 market tracker. CS2 sellable items are priced across fragmented marketplaces with different schemas, currencies, rate limits, API access rules, and coverage. Chinese markets are especially important because BUFF163 and YouPin often act as reference-liquidity venues, but direct access can be limited, paid, or operationally fragile.

## Decision

Adopt a canonical CS2 item catalog and normalized market snapshot model inside Linje, fed by provider adapters. The first adapters target aggregator APIs with Chinese-market coverage, especially cs2.sh, Pricempire, and CS2Cap, while preserving room for direct marketplace adapters such as CSFloat, Steam Community Market, DMarket, BitSkins, BUFF163, and YouPin. UI and analytics read only Linje's normalized item, snapshot, candle, and watchlist contracts.

## Consequences

The tracker can ship a working product surface before every direct marketplace integration is complete, and it can swap or combine providers without changing watchlists or charts. Historical data, spread analysis, liquidity checks, and alerts become consistent because they use one internal model. The trade-off is that each provider adapter must be maintained carefully, and high-quality production coverage still depends on paid API keys or direct marketplace credentials.
