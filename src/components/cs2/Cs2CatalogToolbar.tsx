"use client";

import type { Cs2CatalogCoverageFilter, Cs2CatalogMarketFocus, Cs2CatalogResponse, Cs2CatalogSort, Cs2CatalogSourceFilter } from "@/lib/cs2/types";
import styles from "./Cs2MarketTracker.module.css";

type Cs2CatalogToolbarProps = {
  catalog: Cs2CatalogResponse | null;
  itemType: string | null;
  coverage: Cs2CatalogCoverageFilter;
  marketFocus: Cs2CatalogMarketFocus;
  source: Cs2CatalogSourceFilter;
  page: number;
  sort: Cs2CatalogSort;
  onItemTypeChange: (itemType: string | null) => void;
  onCoverageChange: (coverage: Cs2CatalogCoverageFilter) => void;
  onMarketFocusChange: (marketFocus: Cs2CatalogMarketFocus) => void;
  onSourceChange: (source: Cs2CatalogSourceFilter) => void;
  onPageChange: (page: number | ((current: number) => number)) => void;
  onSortChange: (sort: Cs2CatalogSort) => void;
};

export function Cs2CatalogToolbar({
  catalog,
  itemType,
  coverage,
  marketFocus,
  source,
  page,
  sort,
  onItemTypeChange,
  onCoverageChange,
  onMarketFocusChange,
  onSourceChange,
  onPageChange,
  onSortChange,
}: Cs2CatalogToolbarProps) {
  const itemTypeOptions = catalog?.facets.itemTypes ?? [];

  function handleItemTypeChange(nextValue: string) {
    if (nextValue === "__all__") {
      onItemTypeChange(null);
    } else {
      onItemTypeChange(nextValue);
    }
    onPageChange(1);
  }

  return (
    <div className={styles.catalogToolbar}>
      <div className={styles.filterRow} aria-label="Filter by CS2 item type">
        <button
          className={styles.filterChip}
          type="button"
          data-active={!itemType}
          onClick={() => {
            onItemTypeChange(null);
            onPageChange(1);
          }}
        >
          All
        </button>
        {itemTypeOptions.slice(0, 8).map((facet) => (
          <button
            className={styles.filterChip}
            type="button"
            data-active={itemType === facet.value}
            key={facet.value}
            onClick={() => {
              onItemTypeChange(facet.value);
              onPageChange(1);
            }}
          >
            {facet.value} <span>{facet.count}</span>
          </button>
        ))}
        {itemTypeOptions.length > 8 && (
          <select
            className={styles.catalogTypeSelect}
            aria-label="All CS2 item types"
            value={itemType ?? "__all__"}
            onChange={(event) => handleItemTypeChange(event.target.value)}
          >
            <option value="__all__">+ more item types</option>
            {itemTypeOptions.slice(8).map((facet) => (
              <option value={facet.value} key={`select-${facet.value}`}>
                {facet.value} ({facet.count})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.catalogControls}>
        <select
          aria-label="Filter by market focus"
          value={marketFocus}
          onChange={(event) => {
            onMarketFocusChange(event.target.value as Cs2CatalogMarketFocus);
            onPageChange(1);
          }}
        >
          <option value="all">All markets</option>
          <option value="china">China focus</option>
          <option value="global">Global focus</option>
        </select>
        <select
          aria-label="Filter by market source"
          value={source}
          onChange={(event) => {
            onSourceChange(event.target.value as Cs2CatalogSourceFilter);
            onPageChange(1);
          }}
        >
          <option value="all">All sources</option>
          <option value="buff">BUFF163</option>
          <option value="youpin">YouPin898</option>
          <option value="c5game">C5Game</option>
          <option value="csfloat">CSFloat</option>
          <option value="skinport">Skinport</option>
          <option value="steam">Steam</option>
          <option value="dmarket">DMarket</option>
          <option value="bitskins">BitSkins</option>
          <option value="buffmarket">BUFF.Market</option>
          <option value="marketcsgo">Market.CSGO</option>
          <option value="waxpeer">WAXPEER</option>
          <option value="whitemarket">white.market</option>
        </select>
        <select
          aria-label="Filter by market coverage"
          value={coverage}
          onChange={(event) => {
            onCoverageChange(event.target.value as Cs2CatalogCoverageFilter);
            onPageChange(1);
          }}
        >
          <option value="all">All coverage</option>
          <option value="with-history">With history</option>
          <option value="missing-history">Missing history</option>
          <option value="with-china">With China price</option>
          <option value="missing-china">Missing China price</option>
          <option value="spreadable">Spreadable</option>
        </select>
        <select
          aria-label="Sort CS2 catalog"
          value={sort}
          onChange={(event) => {
            onSortChange(event.target.value as Cs2CatalogSort);
            onPageChange(1);
          }}
        >
          <option value="updated">Newest data</option>
          <option value="china-discount">China discount</option>
          <option value="price-asc">Lowest ask</option>
          <option value="price-desc">Highest ask</option>
          <option value="name">Name</option>
        </select>
        <button
          className={styles.pageButton}
          type="button"
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <span className={styles.pageStatus}>{catalog?.page ?? page} / {catalog?.totalPages ?? 1}</span>
        <button
          className={styles.pageButton}
          type="button"
          onClick={() => onPageChange((current) => Math.min(catalog?.totalPages ?? current + 1, current + 1))}
          disabled={catalog ? catalog.page >= catalog.totalPages : false}
        >
          Next
        </button>
      </div>
    </div>
  );
}
