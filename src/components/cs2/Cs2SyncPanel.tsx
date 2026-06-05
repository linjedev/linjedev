"use client";

import { Database, History, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { Cs2SyncStatus } from "@/lib/cs2/types";
import styles from "./Cs2MarketTracker.module.css";

type Cs2SyncPanelProps = {
  ownerKey: string;
};

type SyncAction = "pipeline" | "watchlist-history" | "history-gaps" | "sweep-latest" | "sweep-history";
type HistoryProvider = "cs2.sh" | "cs2cap" | "pricempire" | "csfloat" | "steam";

const EMPTY_STATUS: Cs2SyncStatus = {
  generatedAt: "",
  status: "unavailable",
  databaseAvailable: false,
  message: "CS2 sync status unavailable.",
  itemCount: 0,
  latestSnapshotCount: 0,
  marketSummaryCount: 0,
  candleCount: 0,
  coverage: {
    itemsWithLatestSnapshots: 0,
    itemsWithChinesePrice: 0,
    itemsWithGlobalPrice: 0,
    itemsWithHistory: 0,
    itemsMissingLatestSnapshots: 0,
    itemsMissingChinesePrice: 0,
    itemsMissingGlobalPrice: 0,
    itemsMissingHistory: 0,
  },
  providerCoverage: [],
  latestObservation: null,
  recentRuns: [],
};

export function Cs2SyncPanel({ ownerKey }: Cs2SyncPanelProps) {
  const [status, setStatus] = useState<Cs2SyncStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<SyncAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [historyProvider, setHistoryProvider] = useState<HistoryProvider>("cs2.sh");
  const [lookback, setLookback] = useState<"7d" | "30d" | "90d">("30d");
  const [sweepBatches, setSweepBatches] = useState<"2" | "5" | "10">("5");

  function historySourcesFor(provider: HistoryProvider) {
    if (provider === "cs2.sh") return ["buff", "youpin", "c5game"];
    if (provider === "pricempire") return ["buff163"];
    return undefined;
  }

  async function loadStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/cs2/sync/status");
      if (!response.ok) throw new Error(`Status request failed with ${response.status}`);
      setStatus(await response.json() as Cs2SyncStatus);
    } catch (error) {
      setStatus({
        ...EMPTY_STATUS,
        generatedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : EMPTY_STATUS.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync(action: SyncAction) {
    setBusyAction(action);
    setMessage(null);
    try {
      const body = action === "pipeline"
        ? {
          mode: "pipeline",
          includeCatalog: true,
          includeLatest: true,
          includeWatchlistHistory: true,
          ownerKey,
          historyProvider,
          historySources: historySourcesFor(historyProvider),
          historyLookback: lookback,
          historyInterval: "1d",
          watchlistLimit: 50,
        }
        : action === "sweep-latest"
          ? {
            mode: "sweep",
            target: "latest-china",
            maxBatches: Number(sweepBatches),
            latestLimit: 50,
          }
          : action === "sweep-history"
            ? {
              mode: "sweep",
              target: "history-gaps",
              maxBatches: Number(sweepBatches),
              historyProvider,
              historySources: historySourcesFor(historyProvider),
              historyLookback: lookback,
              historyInterval: "1d",
              historyLimit: 50,
            }
        : action === "history-gaps"
          ? {
            mode: "history-gaps",
            provider: historyProvider,
            sources: historySourcesFor(historyProvider),
            lookback,
            interval: "1d",
            limit: 50,
          }
          : {
          mode: "watchlist-history",
          ownerKey,
          provider: historyProvider,
          sources: historySourcesFor(historyProvider),
          lookback,
          interval: "1d",
        };
      const response = await fetch("/api/cs2/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-linje-watch-owner": ownerKey,
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json() as { message?: string; status?: string; nextCursor?: string | null; itemCount?: number; snapshotCount?: number; candleCount?: number };
      if (!response.ok) {
        throw new Error(payload.message ?? `Sync request failed with ${response.status}`);
      }
      const baseMessage = action === "pipeline"
        ? "Pipeline sync finished."
        : action === "history-gaps"
          ? "History gap sync finished."
          : action === "sweep-latest"
            ? `China sweep finished: ${payload.itemCount ?? 0} items.`
            : action === "sweep-history"
              ? `History sweep finished: ${payload.candleCount ?? 0} candles.`
              : "Watchlist history sync finished.";
      setMessage(payload.nextCursor ? `${baseMessage} Next cursor: ${payload.nextCursor}` : baseMessage);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync request failed.");
    } finally {
      setBusyAction(null);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <section className={styles.syncPanel} aria-label="CS2 sync controls">
      <div className={styles.panelHeader}>
        <Database size={16} />
        <span>Data sync</span>
      </div>

      <div className={styles.syncStats}>
        <div>
          <strong>{loading ? "..." : status.itemCount}</strong>
          <small>catalog items</small>
        </div>
        <div>
          <strong>{loading ? "..." : status.latestSnapshotCount}</strong>
          <small>latest snapshots</small>
        </div>
        <div>
          <strong>{loading ? "..." : status.candleCount}</strong>
          <small>history candles</small>
        </div>
      </div>

      <div className={styles.syncActions}>
        <div className={styles.syncControlRow}>
          <label>
            <span>History provider</span>
            <select value={historyProvider} onChange={(event) => setHistoryProvider(event.target.value as HistoryProvider)}>
              <option value="cs2.sh">cs2.sh</option>
              <option value="cs2cap">CS2Cap</option>
              <option value="pricempire">Pricempire</option>
              <option value="csfloat">CSFloat</option>
              <option value="steam">Steam</option>
            </select>
          </label>
          <label>
            <span>Lookback</span>
            <select value={lookback} onChange={(event) => setLookback(event.target.value as "7d" | "30d" | "90d")}>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="90d">90d</option>
            </select>
          </label>
          <label>
            <span>Sweep batches</span>
            <select value={sweepBatches} onChange={(event) => setSweepBatches(event.target.value as "2" | "5" | "10")}>
              <option value="2">2</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </label>
        </div>
        <button
          className={styles.syncButton}
          type="button"
          onClick={() => void triggerSync("pipeline")}
          disabled={busyAction !== null}
        >
          <RefreshCw size={14} />
          Full sync
        </button>
        <button
          className={styles.syncButton}
          type="button"
          onClick={() => void triggerSync("watchlist-history")}
          disabled={busyAction !== null}
        >
          <History size={14} />
          Watch history
        </button>
        <button
          className={styles.syncButton}
          type="button"
          onClick={() => void triggerSync("history-gaps")}
          disabled={busyAction !== null}
        >
          <History size={14} />
          Gap history
        </button>
        <button
          className={styles.syncButton}
          type="button"
          onClick={() => void triggerSync("sweep-latest")}
          disabled={busyAction !== null}
        >
          <RefreshCw size={14} />
          Sweep CN
        </button>
        <button
          className={styles.syncButton}
          type="button"
          onClick={() => void triggerSync("sweep-history")}
          disabled={busyAction !== null}
        >
          <History size={14} />
          Sweep history
        </button>
      </div>

      <div className={styles.syncMeta}>
        <small>
          {status.latestObservation
            ? `latest ${status.latestObservation.marketName} via ${status.latestObservation.provider}`
            : status.message ?? "No sync data yet"}
        </small>
        <small>{historyProvider === "cs2.sh" ? "China-first history: BUFF / YouPin / C5Game" : historyProvider === "pricempire" ? "China-first history: BUFF163 daily" : historyProvider === "csfloat" ? "CSFloat sales history candles" : historyProvider === "steam" ? "Steam market history candles" : "Composite history via CS2Cap"}</small>
        <small>{status.coverage.itemsWithChinesePrice} CN priced / {status.coverage.itemsWithHistory} with history / {status.coverage.itemsMissingLatestSnapshots} missing latest</small>
        {status.providerCoverage.length > 0 ? (
          <small>{status.providerCoverage.slice(0, 3).map((entry) => `${entry.provider}:${entry.itemCount}`).join(" / ")}</small>
        ) : null}
        {message ? <strong>{message}</strong> : null}
      </div>

      <div className={styles.syncRuns}>
        {status.recentRuns.slice(0, 4).map((run) => (
          <div className={styles.syncRun} key={run.id}>
            <span>
              <strong>{run.provider}</strong>
              <small>{run.itemCount} items / {run.snapshotCount} snapshots / {run.candleCount} candles</small>
            </span>
            <b data-state={run.status}>{run.status}</b>
          </div>
        ))}
        {!loading && status.recentRuns.length === 0 ? <div className={styles.emptyState}>No sync runs yet</div> : null}
      </div>
    </section>
  );
}
