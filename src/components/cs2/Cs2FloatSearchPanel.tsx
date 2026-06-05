"use client";

import { Crosshair, ExternalLink, Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { Cs2FloatListingView, Cs2FloatSearchResponse, Cs2FloatSort } from "@/lib/cs2/types";
import { formatMoney } from "@/lib/cs2/format";
import styles from "./Cs2MarketTracker.module.css";

type Cs2FloatSearchPanelProps = {
  response: Cs2FloatSearchResponse | null;
  suggestions: string[];
  loading: boolean;
  query: string;
  minFloat: string;
  maxFloat: string;
  paintSeed: string;
  paintIndex: string;
  sort: Cs2FloatSort;
  onQueryChange: (value: string) => void;
  onMinFloatChange: (value: string) => void;
  onMaxFloatChange: (value: string) => void;
  onPaintSeedChange: (value: string) => void;
  onPaintIndexChange: (value: string) => void;
  onSortChange: (value: Cs2FloatSort) => void;
  onSearch: () => void;
};

function formatFloat(value: number | null) {
  return value === null ? "n/a" : value.toFixed(8);
}

function ListingImage({ listing }: { listing: Cs2FloatListingView }) {
  if (!listing.imageUrl) {
    return <div className={styles.itemThumbFallback}>{listing.marketHashName.slice(0, 2).toUpperCase()}</div>;
  }
  return <img className={styles.floatListingImage} src={listing.imageUrl} alt="" loading="lazy" />;
}

export function Cs2FloatSearchPanel({
  response,
  suggestions,
  loading,
  query,
  minFloat,
  maxFloat,
  paintSeed,
  paintIndex,
  sort,
  onQueryChange,
  onMinFloatChange,
  onMaxFloatChange,
  onPaintSeedChange,
  onPaintIndexChange,
  onSortChange,
  onSearch,
}: Cs2FloatSearchPanelProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (event.key === "Enter") onSearch();
  }

  return (
    <section className={styles.floatPanel} aria-label="CSFloat style listing search">
      <div className={styles.floatPanelHeader}>
        <span>
          <Crosshair size={16} />
          Float search
        </span>
        <small>{response?.mode ?? "sample"} listings</small>
      </div>

      <div className={styles.floatSearchControls}>
        <label>
          <span>Item</span>
          <input
            list="cs2-float-search-suggestions"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="M4A4 | Poseidon (Factory New)"
          />
          <datalist id="cs2-float-search-suggestions">
            {suggestions.map((suggestion) => (
              <option value={suggestion} key={suggestion} />
            ))}
          </datalist>
        </label>
        <label>
          <span>Min float</span>
          <input value={minFloat} onChange={(event) => onMinFloatChange(event.target.value)} onKeyDown={handleKeyDown} inputMode="decimal" placeholder="0.0000" />
        </label>
        <label>
          <span>Max float</span>
          <input value={maxFloat} onChange={(event) => onMaxFloatChange(event.target.value)} onKeyDown={handleKeyDown} inputMode="decimal" placeholder="0.0700" />
        </label>
        <label>
          <span>Paint seed</span>
          <input value={paintSeed} onChange={(event) => onPaintSeedChange(event.target.value)} onKeyDown={handleKeyDown} inputMode="numeric" placeholder="661" />
        </label>
        <label>
          <span>Paint index</span>
          <input value={paintIndex} onChange={(event) => onPaintIndexChange(event.target.value)} onKeyDown={handleKeyDown} inputMode="numeric" placeholder="449" />
        </label>
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value as Cs2FloatSort)} onKeyDown={handleKeyDown}>
            <option value="best_deal">Best deal</option>
            <option value="lowest_float">Lowest float</option>
            <option value="highest_float">Highest float</option>
            <option value="lowest_price">Lowest price</option>
            <option value="highest_price">Highest price</option>
            <option value="most_recent">Most recent</option>
            <option value="float_rank">Float rank</option>
          </select>
        </label>
        <button className={styles.floatSearchButton} type="button" onClick={onSearch}>
          <Search size={15} />
        </button>
      </div>

      {!!response?.resolvedMarketHashNames.length && (
        <div className={styles.floatResolvedMatches} aria-label="Resolved CS2 items">
          {response.resolvedMarketHashNames.map((marketHashName) => (
            <span key={marketHashName}>{marketHashName}</span>
          ))}
        </div>
      )}

      <div className={styles.floatListings}>
        {loading && <div className={styles.emptyState}>Searching listed assets...</div>}
        {!loading && response?.listings.map((listing) => (
          <a className={styles.floatListing} href={listing.listingUrl ?? "#"} target="_blank" rel="noreferrer" key={listing.id}>
            <ListingImage listing={listing} />
            <span>
              <strong>{listing.marketHashName}</strong>
              <small>{listing.marketName} / float {formatFloat(listing.floatValue)} / seed {listing.paintSeed ?? "n/a"} / paint {listing.paintIndex ?? "n/a"}</small>
            </span>
            <b>{formatMoney(listing.priceCents)}</b>
            <ExternalLink size={14} />
          </a>
        ))}
        {!loading && response?.listings.length === 0 && <div className={styles.emptyState}>No matching float listings</div>}
      </div>
    </section>
  );
}
