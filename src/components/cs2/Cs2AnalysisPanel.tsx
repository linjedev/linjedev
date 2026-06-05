"use client";

import { Activity, AlertTriangle, ScanSearch, TrendingDown } from "lucide-react";
import type { Cs2MarketAnalysis } from "@/lib/cs2/types";
import { formatPercent } from "@/lib/cs2/format";
import styles from "./Cs2MarketTracker.module.css";

export function Cs2AnalysisPanel({ analysis }: { analysis: Cs2MarketAnalysis }) {
  return (
    <section className={styles.analysisPanel} aria-label="CS2 market analysis">
      <div className={styles.panelHeader}>
        <ScanSearch size={16} />
        <span>Analysis</span>
      </div>

      <div className={styles.coverageGrid}>
        <div>
          <strong>{analysis.marketCoverage.itemsWithCrossMarketSpread}</strong>
          <small>spreadable</small>
        </div>
        <div>
          <strong>{analysis.marketCoverage.itemsWithChinesePrice}</strong>
          <small>CN priced</small>
        </div>
        <div>
          <strong>{analysis.marketCoverage.itemsWithHistory}</strong>
          <small>history</small>
        </div>
        <div>
          <strong>{analysis.marketCoverage.candleCount}</strong>
          <small>candles</small>
        </div>
      </div>

      <div className={styles.panelHeader}>
        <ScanSearch size={16} />
        <span>Coverage gaps</span>
      </div>
      <div className={styles.signalList}>
        <div className={styles.signalRow} data-severity={analysis.marketCoverage.gaps.missingChinesePrice > 0 ? "warning" : undefined}>
          <span>
            <strong>Missing CN anchors</strong>
            <small>{analysis.marketCoverage.gaps.missingCrossMarketSpread} without cross-market spread</small>
          </span>
          <b>{analysis.marketCoverage.gaps.missingChinesePrice}</b>
        </div>
        <div className={styles.signalRow} data-severity={analysis.marketCoverage.gaps.missingHistory > 0 ? "warning" : undefined}>
          <span>
            <strong>Missing history</strong>
            <small>{analysis.marketCoverage.gaps.staleItems} stale current observations</small>
          </span>
          <b>{analysis.marketCoverage.gaps.missingHistory}</b>
        </div>
      </div>

      <div className={styles.panelHeader}>
        <TrendingDown size={16} />
        <span>Top CN discounts</span>
      </div>
      <div className={styles.signalList}>
        {analysis.opportunities.slice(0, 3).map((opportunity) => (
          <div className={styles.signalRow} key={opportunity.itemId}>
            <span>
              <strong>{opportunity.marketHashName}</strong>
              <small>{opportunity.bestChineseMarket} to {opportunity.bestGlobalMarket}</small>
            </span>
            <b>{opportunity.spreadPercent.toFixed(2)}%</b>
          </div>
        ))}
        {analysis.opportunities.length === 0 && <div className={styles.emptyState}>No cross-market spreads yet</div>}
      </div>

      <div className={styles.panelHeader}>
        <Activity size={16} />
        <span>Trend movers</span>
      </div>
      <div className={styles.signalList}>
        {analysis.trendSignals.slice(0, 3).map((signal) => (
          <div className={styles.signalRow} data-severity={signal.severity} key={`${signal.itemId}-${signal.provider}-${signal.marketName}-${signal.interval}`}>
            <span>
              <strong>{signal.marketHashName}</strong>
              <small>{signal.marketName} / {signal.candleCount} {signal.interval} candles / vol {formatPercent(signal.volatilityPercent)}</small>
            </span>
            <b>{formatPercent(signal.changePercent)}</b>
          </div>
        ))}
        {analysis.trendSignals.length === 0 && <div className={styles.emptyState}>No historical candle signals yet</div>}
      </div>

      <div className={styles.panelHeader}>
        <AlertTriangle size={16} />
        <span>Signals</span>
      </div>
      <div className={styles.signalList}>
        {analysis.watchlistSignals.slice(0, 3).map((signal) => (
          <div className={styles.signalRow} data-severity={signal.severity} key={`${signal.itemId}-${signal.signal}`}>
            <span>
              <strong>{signal.marketHashName}</strong>
              <small>{signal.message}</small>
            </span>
          </div>
        ))}
        {analysis.watchlistSignals.length === 0 && <div className={styles.emptyState}>No active watchlist signals</div>}
      </div>
    </section>
  );
}
