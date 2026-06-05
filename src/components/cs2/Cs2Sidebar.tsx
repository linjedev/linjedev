"use client";

import { BarChart3, Star, Trash2 } from "lucide-react";
import { Cs2AnalysisPanel } from "@/components/cs2/Cs2AnalysisPanel";
import type { Cs2TrackerOverview } from "@/lib/cs2/types";
import styles from "./Cs2MarketTracker.module.css";

type Cs2SidebarProps = {
  overview: Cs2TrackerOverview | null;
  busyItem: string | null;
  onRemoveWatchlistItem: (itemId: string) => void;
};

export function Cs2Sidebar({ overview, busyItem, onRemoveWatchlistItem }: Cs2SidebarProps) {
  const anchorSources = overview?.sources.filter((source) => source.region === "china") ?? [];

  return (
    <aside className={styles.leftPane} aria-label="Market anchors and watchlist">
      <div className={styles.panelHeader}>
        <BarChart3 size={16} />
        <span>Chinese anchors</span>
      </div>
      <div className={styles.anchorList}>
        {anchorSources.map((source) => (
          <a className={styles.anchorRow} href={source.homepageUrl} target="_blank" rel="noreferrer" key={source.id}>
            <span>
              <strong>{source.name}</strong>
              <small>{source.coverage}</small>
            </span>
            <b>{source.priority}</b>
          </a>
        ))}
      </div>

      <div className={styles.panelHeader}>
        <Star size={16} />
        <span>Watchlist</span>
      </div>
      <div className={styles.watchList}>
        {overview?.watchlist.map((entry) => (
          <div className={styles.watchRow} key={entry.id}>
            <span>{entry.marketHashName}</span>
            <button
              className={styles.deleteButton}
              type="button"
              aria-label={`Remove ${entry.marketHashName}`}
              onClick={() => onRemoveWatchlistItem(entry.itemId)}
              disabled={busyItem === entry.itemId}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {overview?.watchlist.length === 0 && <div className={styles.emptyState}>No watched items yet</div>}
      </div>

      {overview?.analysis && <Cs2AnalysisPanel analysis={overview.analysis} />}
    </aside>
  );
}
