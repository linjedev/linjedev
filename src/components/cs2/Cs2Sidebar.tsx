"use client";

import { BarChart3, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Cs2AnalysisPanel } from "@/components/cs2/Cs2AnalysisPanel";
import { Cs2SyncPanel } from "@/components/cs2/Cs2SyncPanel";
import type { Cs2TrackerOverview, Cs2WatchlistEntryView } from "@/lib/cs2/types";
import styles from "./Cs2MarketTracker.module.css";

type Cs2SidebarProps = {
  overview: Cs2TrackerOverview | null;
  busyItem: string | null;
  ownerKey: string;
  onSaveWatchlistItem: (entry: Cs2WatchlistEntryView, updates: {
    targetBuyCents: number | null;
    targetSellCents: number | null;
    notes: string | null;
  }) => void;
  onRemoveWatchlistItem: (itemId: string) => void;
};

function centsToInput(value: number | null) {
  return value === null ? "" : (value / 100).toFixed(2);
}

function inputToCents(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

export function Cs2Sidebar({ overview, busyItem, ownerKey, onSaveWatchlistItem, onRemoveWatchlistItem }: Cs2SidebarProps) {
  const anchorSources = overview?.sourceStatus.filter((source) => source.region === "china") ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetBuy, setTargetBuy] = useState("");
  const [targetSell, setTargetSell] = useState("");
  const [notes, setNotes] = useState("");

  function startEditing(entry: Cs2WatchlistEntryView) {
    setEditingId(entry.id);
    setTargetBuy(centsToInput(entry.targetBuyCents));
    setTargetSell(centsToInput(entry.targetSellCents));
    setNotes(entry.notes ?? "");
  }

  function stopEditing() {
    setEditingId(null);
    setTargetBuy("");
    setTargetSell("");
    setNotes("");
  }

  return (
    <aside className={styles.leftPane} aria-label="Market anchors and watchlist">
      <Cs2SyncPanel ownerKey={ownerKey} />

      <div className={styles.panelHeader}>
        <BarChart3 size={16} />
        <span>Chinese anchors</span>
      </div>
      <div className={styles.anchorList}>
        {anchorSources.map((source) => (
          <a className={styles.anchorRow} href={source.homepageUrl} target="_blank" rel="noreferrer" key={source.id}>
            <span>
              <strong>{source.name}</strong>
              <small>{source.integration} / {source.itemCount} items / {source.note}</small>
            </span>
            <b data-state={source.integration}>{source.integration}</b>
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
            <span>
              <strong>{entry.marketHashName}</strong>
              <small>buy {centsToInput(entry.targetBuyCents) || "n/a"} / sell {centsToInput(entry.targetSellCents) || "n/a"}</small>
            </span>
            <div className={styles.watchRowActions}>
              <button
                className={styles.deleteButton}
                type="button"
                aria-label={`Edit ${entry.marketHashName}`}
                onClick={() => (editingId === entry.id ? stopEditing() : startEditing(entry))}
                disabled={busyItem === entry.itemId}
              >
                <Pencil size={14} />
              </button>
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
            {editingId === entry.id && (
              <div className={styles.watchEditor}>
                <label>
                  <span>Buy target</span>
                  <input value={targetBuy} onChange={(event) => setTargetBuy(event.target.value)} inputMode="decimal" placeholder="27.50" />
                </label>
                <label>
                  <span>Sell target</span>
                  <input value={targetSell} onChange={(event) => setTargetSell(event.target.value)} inputMode="decimal" placeholder="31.00" />
                </label>
                <label className={styles.watchEditorNotes}>
                  <span>Notes</span>
                  <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="China spread, stickers, float setup..." />
                </label>
                <div className={styles.watchEditorButtons}>
                  <button
                    className={styles.syncButton}
                    type="button"
                    onClick={() => {
                      onSaveWatchlistItem(entry, {
                        targetBuyCents: inputToCents(targetBuy),
                        targetSellCents: inputToCents(targetSell),
                        notes: notes.trim() || null,
                      });
                      stopEditing();
                    }}
                    disabled={busyItem === entry.itemId}
                  >
                    Save
                  </button>
                  <button className={styles.syncButton} type="button" onClick={stopEditing}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {overview?.watchlist.length === 0 && <div className={styles.emptyState}>No watched items yet</div>}
      </div>

      {overview?.analysis && <Cs2AnalysisPanel analysis={overview.analysis} />}
    </aside>
  );
}
