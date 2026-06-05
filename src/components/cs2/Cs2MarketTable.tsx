"use client";

import { BellPlus } from "lucide-react";
import type { ReactNode } from "react";
import { formatMoney, formatPercent } from "@/lib/cs2/format";
import type { Cs2ItemView } from "@/lib/cs2/types";
import styles from "./Cs2MarketTracker.module.css";

type Cs2MarketTableProps = {
  toolbar?: ReactNode;
  items: Cs2ItemView[];
  selectedItem: Cs2ItemView | null;
  loading: boolean;
  busyItem: string | null;
  isWatched: (item: Cs2ItemView) => boolean;
  onAddToWatchlist: (item: Cs2ItemView) => void;
  onSelectItem: (itemId: string) => void;
};

function ItemThumb({ item }: { item: Cs2ItemView }) {
  if (!item.imageUrl) {
    return <span className={styles.itemThumbFallback}>{item.marketHashName.slice(0, 2).toUpperCase()}</span>;
  }
  return <img className={styles.itemThumb} src={item.imageUrl} alt="" loading="lazy" />;
}

export function Cs2MarketTable({
  toolbar,
  items,
  selectedItem,
  loading,
  busyItem,
  isWatched,
  onAddToWatchlist,
  onSelectItem,
}: Cs2MarketTableProps) {
  return (
    <section className={styles.marketTable} aria-label="CS2 item market table">
      {toolbar}
      <div className={styles.tableHeader}>
        <span>Item</span>
        <span>China ask</span>
        <span>Best ask</span>
        <span>Spread</span>
        <span>Action</span>
      </div>
      <div className={styles.tableBody}>
        {loading && <div className={styles.loadingRow}>Loading market state...</div>}
        {!loading && items.map((item) => (
          <div
            role="button"
            tabIndex={0}
            className={`${styles.itemRow} ${selectedItem?.id === item.id ? styles.itemRowSelected : ""}`}
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelectItem(item.id);
            }}
          >
            <span className={styles.itemName}>
              <ItemThumb item={item} />
              <span>
                <strong>{item.marketHashName}</strong>
                <small>{[item.itemType, item.rarity, item.exterior].filter(Boolean).join(" / ")}</small>
              </span>
            </span>
            <span>{formatMoney(item.chineseAskCents)}</span>
            <span>{formatMoney(item.bestAskCents)}</span>
            <span className={item.spreadPercent && item.spreadPercent < 0 ? styles.goodSpread : styles.flatSpread}>
              {formatPercent(item.spreadPercent)}
            </span>
            <span>
              <button
                className={styles.watchButton}
                type="button"
                aria-label={`Add ${item.marketHashName} to watchlist`}
                onClick={(event) => {
                  event.stopPropagation();
                  onAddToWatchlist(item);
                }}
                disabled={busyItem === item.id || isWatched(item)}
              >
                <BellPlus size={15} />
              </button>
            </span>
          </div>
        ))}
        {!loading && items.length === 0 && <div className={styles.loadingRow}>No matching sellable items</div>}
      </div>
    </section>
  );
}
