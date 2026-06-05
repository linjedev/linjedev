"use client";

import { formatMoney, formatPercent } from "@/lib/cs2/format";
import type { Cs2ItemView } from "@/lib/cs2/types";
import styles from "./Cs2MarketTracker.module.css";

function Sparkline({ item }: { item: Cs2ItemView }) {
  const values = item.candles.map((candle) => candle.closeCents);
  if (values.length < 2) {
    return <div className={styles.sparklineEmpty}>No candles</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 40 - ((value - min) / range) * 34;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg className={styles.sparkline} viewBox="0 0 100 44" role="img" aria-label={`${item.marketHashName} price history`}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Cs2ItemDetail({ item }: { item: Cs2ItemView | null }) {
  if (!item) return null;

  return (
    <>
      <div className={styles.detailImageFrame}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt="" loading="lazy" />
          : <span>{item.marketHashName.slice(0, 2).toUpperCase()}</span>}
      </div>
      <div className={styles.detailTitle}>
        <small>{item.itemType}</small>
        <h1>{item.marketHashName}</h1>
      </div>
      <Sparkline item={item} />
      <div className={styles.priceGrid}>
        <div>
          <small>China ask</small>
          <strong>{formatMoney(item.chineseAskCents)}</strong>
        </div>
        <div>
          <small>Best bid</small>
          <strong>{formatMoney(item.bestBidCents)}</strong>
        </div>
        <div>
          <small>Global ask</small>
          <strong>{formatMoney(item.globalAskCents)}</strong>
        </div>
        <div>
          <small>Spread</small>
          <strong>{formatPercent(item.spreadPercent)}</strong>
        </div>
      </div>
      <div className={styles.venueList}>
        {item.snapshots.map((snapshot) => (
          <a
            href={snapshot.sourceUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className={styles.venueRow}
            key={`${snapshot.marketName}-${snapshot.observedAt}`}
          >
            <span>
              <strong>{snapshot.marketName}</strong>
              <small>{snapshot.marketRegion} / {snapshot.askVolume ?? 0} asks</small>
            </span>
            <b>{formatMoney(snapshot.askCents)}</b>
          </a>
        ))}
      </div>
    </>
  );
}
