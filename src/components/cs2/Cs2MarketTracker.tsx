"use client";

import Image from "next/image";
import {
  Activity,
  Database,
  LineChart,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Cs2CatalogToolbar } from "@/components/cs2/Cs2CatalogToolbar";
import { Cs2FloatSearchSection } from "@/components/cs2/Cs2FloatSearchSection";
import { Cs2ItemDetail } from "@/components/cs2/Cs2ItemDetail";
import { Cs2MarketTable } from "@/components/cs2/Cs2MarketTable";
import { Cs2Sidebar } from "@/components/cs2/Cs2Sidebar";
import { formatPercent } from "@/lib/cs2/format";
import type { Cs2CatalogCoverageFilter, Cs2CatalogMarketFocus, Cs2CatalogResponse, Cs2CatalogSort, Cs2CatalogSourceFilter, Cs2ItemView, Cs2TrackerOverview, Cs2WatchlistEntryView } from "@/lib/cs2/types";
import styles from "./Cs2MarketTracker.module.css";

const OWNER_KEY_STORAGE = "linje-cs2-watch-owner";
const LOCAL_WATCHLIST_STORAGE = "linje-cs2-local-watchlist";

type WatchlistMutationResponse = {
  watchlistItem: Cs2WatchlistEntryView;
  item: Cs2ItemView | null;
  hydration: Array<{
    provider: string;
    status: "ok" | "error";
    itemCount: number;
    snapshotCount: number;
    candleCount: number;
    message: string | null;
  }>;
};

function getOwnerKey() {
  if (typeof window === "undefined") return "linje-local-watchlist";
  const existing = window.localStorage.getItem(OWNER_KEY_STORAGE);
  if (existing) return existing;
  const generated = `linje-watch-${crypto.randomUUID()}`;
  window.localStorage.setItem(OWNER_KEY_STORAGE, generated);
  return generated;
}

function isWatched(overview: Cs2TrackerOverview | null, item: Cs2ItemView) {
  return overview?.watchlist.some((entry) => entry.marketHashName === item.marketHashName) ?? false;
}

function readLocalWatchlist() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(LOCAL_WATCHLIST_STORAGE);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as string[];
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeLocalWatchlist(marketHashNames: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_WATCHLIST_STORAGE, JSON.stringify(Array.from(new Set(marketHashNames))));
}

function mergeLocalWatchlist(payload: Cs2TrackerOverview): Cs2TrackerOverview {
  const localNames = readLocalWatchlist();
  if (localNames.length === 0) return payload;
  const existingNames = new Set(payload.watchlist.map((entry) => entry.marketHashName));
  const localEntries = localNames
    .filter((marketHashName) => !existingNames.has(marketHashName))
    .map((marketHashName) => {
      const item = payload.items.find((candidate) => candidate.marketHashName === marketHashName);
      return {
        id: `local-${marketHashName}`,
        itemId: item?.id ?? marketHashName,
        marketHashName,
        targetBuyCents: item?.chineseAskCents ? Math.round(item.chineseAskCents * 0.96) : null,
        targetSellCents: item?.globalAskCents ? Math.round(item.globalAskCents * 1.08) : null,
        notes: "Local fallback watch item.",
        createdAt: new Date().toISOString(),
      };
    });
  return {
    ...payload,
    watchlist: [...payload.watchlist, ...localEntries],
    metrics: {
      ...payload.metrics,
      watchedItems: payload.watchlist.length + localEntries.length,
    },
  };
}

function upsertByMarketHashName(items: Cs2ItemView[], item: Cs2ItemView | null) {
  if (!item) return items;
  const exists = items.some((candidate) => candidate.marketHashName === item.marketHashName);
  return exists
    ? items.map((candidate) => candidate.marketHashName === item.marketHashName ? item : candidate)
    : [item, ...items];
}

function upsertWatchlistEntry(entries: Cs2WatchlistEntryView[], entry: Cs2WatchlistEntryView) {
  const exists = entries.some((candidate) => candidate.marketHashName === entry.marketHashName);
  return exists
    ? entries.map((candidate) => candidate.marketHashName === entry.marketHashName ? entry : candidate)
    : [entry, ...entries];
}

export function Cs2MarketTracker() {
  const [searchInput, setSearchInput] = useState("");
  const [overview, setOverview] = useState<Cs2TrackerOverview | null>(null);
  const [catalog, setCatalog] = useState<Cs2CatalogResponse | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [itemType, setItemType] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<Cs2CatalogCoverageFilter>("all");
  const [marketFocus, setMarketFocus] = useState<Cs2CatalogMarketFocus>("all");
  const [source, setSource] = useState<Cs2CatalogSourceFilter>("all");
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogSort, setCatalogSort] = useState<Cs2CatalogSort>("updated");
  const [ownerKey] = useState(() => getOwnerKey());
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchNonce, setSearchNonce] = useState(0);
  const overviewRequestId = useRef(0);
  const catalogRequestId = useRef(0);
  const catalogItems = catalog?.items ?? overview?.items ?? [];

  const selectedItem = useMemo(() => {
    return catalogItems.find((item) => item.id === selectedItemId) ?? catalogItems[0] ?? null;
  }, [catalogItems, selectedItemId]);

  async function loadOverview(nextQuery = query) {
    const requestId = ++overviewRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      const response = await fetch(`/api/cs2/market/overview?${params.toString()}`, {
        headers: { "x-linje-watch-owner": ownerKey },
      });
      if (!response.ok) throw new Error(`Overview request failed with ${response.status}`);
      const payload = mergeLocalWatchlist(await response.json() as Cs2TrackerOverview);
      if (requestId !== overviewRequestId.current) return;
      setOverview(payload);
      setSelectedItemId((current) => current ?? payload.items[0]?.id ?? null);
    } catch (requestError) {
      if (requestId === overviewRequestId.current) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load market overview");
      }
    } finally {
      if (requestId === overviewRequestId.current) {
        setLoading(false);
      }
    }
  }

  async function loadCatalog(params: {
    nextQuery?: string;
    nextItemType?: string | null;
    nextCoverage?: Cs2CatalogCoverageFilter;
    nextMarketFocus?: Cs2CatalogMarketFocus;
    nextSource?: Cs2CatalogSourceFilter;
    nextPage?: number;
    nextSort?: Cs2CatalogSort;
  } = {}) {
    const requestId = ++catalogRequestId.current;
    setCatalogLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      const activeQuery = params.nextQuery ?? query;
      const activeItemType = params.nextItemType === undefined ? itemType : params.nextItemType;
      const activeCoverage = params.nextCoverage ?? coverage;
      const activeMarketFocus = params.nextMarketFocus ?? marketFocus;
      const activeSource = params.nextSource ?? source;
      const activePage = params.nextPage ?? catalogPage;
      const activeSort = params.nextSort ?? catalogSort;
      if (activeQuery.trim()) searchParams.set("q", activeQuery.trim());
      if (activeItemType) searchParams.set("itemType", activeItemType);
      if (activeCoverage !== "all") searchParams.set("coverage", activeCoverage);
      if (activeMarketFocus !== "all") searchParams.set("marketFocus", activeMarketFocus);
      if (activeSource !== "all") searchParams.set("source", activeSource);
      searchParams.set("page", String(activePage));
      searchParams.set("limit", "50");
      searchParams.set("sort", activeSort);
      const response = await fetch(`/api/cs2/items?${searchParams.toString()}`);
      if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`);
      const payload = await response.json() as Cs2CatalogResponse;
      if (requestId !== catalogRequestId.current) return;
      setCatalog(payload);
      setSelectedItemId((current) => current ?? payload.items[0]?.id ?? null);
    } catch (requestError) {
      if (requestId === catalogRequestId.current) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load CS2 item catalog");
      }
    } finally {
      if (requestId === catalogRequestId.current) {
        setCatalogLoading(false);
      }
    }
  }

  function runSearch(
    nextQuery = query,
    nextItemType = itemType,
    nextCoverage = coverage,
    nextMarketFocus = marketFocus,
    nextSource = source,
    nextPage = 1,
    nextSort = catalogSort,
  ) {
    const normalizedQuery = nextQuery.trim();
    setQuery(normalizedQuery);
    setCatalogPage(nextPage);
    if (nextItemType !== itemType) {
      setItemType(nextItemType);
    }
    if (nextSort !== catalogSort) {
      setCatalogSort(nextSort);
    }
    if (nextCoverage !== coverage) {
      setCoverage(nextCoverage);
    }
    if (nextMarketFocus !== marketFocus) {
      setMarketFocus(nextMarketFocus);
    }
    if (nextSource !== source) {
      setSource(nextSource);
    }
    if (searchInput !== normalizedQuery) {
      setSearchInput(normalizedQuery);
    }
    setSearchNonce((current) => current + 1);
  }

  function applyWatchlistMutation(payload: WatchlistMutationResponse) {
    setOverview((current) => {
      if (!current) return current;
      const watchlist = upsertWatchlistEntry(current.watchlist, payload.watchlistItem);
      return {
        ...current,
        items: upsertByMarketHashName(current.items, payload.item),
        watchlist,
        metrics: {
          ...current.metrics,
          watchedItems: watchlist.length,
        },
      };
    });
    setCatalog((current) => current && payload.item
      ? {
        ...current,
        items: upsertByMarketHashName(current.items, payload.item),
      }
      : current);
    if (payload.item) setSelectedItemId(payload.item.id);
    const errors = payload.hydration.filter((summary) => summary.status === "error");
    if (errors.length > 0) {
      setError(`${errors.length} provider${errors.length === 1 ? "" : "s"} could not hydrate this item.`);
    }
  }

  async function addToWatchlist(item: Cs2ItemView) {
    setBusyItem(item.id);
    setError(null);
    try {
      const response = await fetch("/api/cs2/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-linje-watch-owner": ownerKey,
        },
        body: JSON.stringify({
          marketHashName: item.marketHashName,
          targetBuyCents: item.chineseAskCents ? Math.round(item.chineseAskCents * 0.96) : null,
          targetSellCents: item.globalAskCents ? Math.round(item.globalAskCents * 1.08) : null,
          notes: "Track Chinese anchor spread and global exit price.",
        }),
      });
      if (!response.ok) {
        const payload = await response.json() as { error?: string };
        throw new Error(payload.error ?? `Watchlist request failed with ${response.status}`);
      }
      applyWatchlistMutation(await response.json() as WatchlistMutationResponse);
    } catch (requestError) {
      writeLocalWatchlist([...readLocalWatchlist(), item.marketHashName]);
      setError(requestError instanceof Error ? `${requestError.message}; saved locally` : "Saved locally");
      await Promise.all([loadOverview(), loadCatalog()]);
    } finally {
      setBusyItem(null);
    }
  }

  async function saveWatchlistItem(entry: { marketHashName: string; itemId: string }, updates: {
    targetBuyCents: number | null;
    targetSellCents: number | null;
    notes: string | null;
  }) {
    setBusyItem(entry.itemId);
    setError(null);
    try {
      const response = await fetch("/api/cs2/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-linje-watch-owner": ownerKey,
        },
        body: JSON.stringify({
          marketHashName: entry.marketHashName,
          ...updates,
        }),
      });
      if (!response.ok) {
        const payload = await response.json() as { error?: string };
        throw new Error(payload.error ?? `Watchlist save failed with ${response.status}`);
      }
      applyWatchlistMutation(await response.json() as WatchlistMutationResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save watchlist item");
    } finally {
      setBusyItem(null);
    }
  }

  async function removeFromWatchlist(itemId: string) {
    setBusyItem(itemId);
    setError(null);
    try {
      const response = await fetch(`/api/cs2/watchlist?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: { "x-linje-watch-owner": ownerKey },
      });
      if (!response.ok) throw new Error(`Remove request failed with ${response.status}`);
      await Promise.all([loadOverview(), loadCatalog()]);
    } catch (requestError) {
      const itemName = overview?.watchlist.find((entry) => entry.itemId === itemId)?.marketHashName;
      if (itemName) {
        writeLocalWatchlist(readLocalWatchlist().filter((marketHashName) => marketHashName !== itemName));
      }
      setError(requestError instanceof Error ? `${requestError.message}; removed locally` : "Removed locally");
      await Promise.all([loadOverview(), loadCatalog()]);
    } finally {
      setBusyItem(null);
    }
  }

  useEffect(() => {
    if (!ownerKey) return;
    void loadOverview(query);
    void loadCatalog({
      nextQuery: query,
      nextItemType: itemType,
      nextCoverage: coverage,
      nextMarketFocus: marketFocus,
      nextSource: source,
      nextPage: catalogPage,
      nextSort: catalogSort,
    });
  }, [ownerKey, query, itemType, coverage, marketFocus, source, catalogPage, catalogSort, searchNonce]);

  return (
    <main className={styles.shell}>
      <div className={styles.grid} />
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>
            <Image src="/logo/logo-icon.svg" alt="" width={32} height={32} priority />
          </span>
          <div>
            <div className={styles.brandName}>linje.dev</div>
            <div className={styles.brandSubline}>CS2 market intelligence</div>
          </div>
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Search CS2 sellable items"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                runSearch(searchInput, itemType, coverage, marketFocus, source, 1, catalogSort);
              }
            }}
            placeholder="AK-47, sticker, operator, knife..."
          />
          <button
            className={styles.searchButton}
            type="button"
            aria-label="Run catalog search"
            onClick={() => runSearch(searchInput, itemType, coverage, marketFocus, source, 1, catalogSort)}
          >
            <Search size={14} />
          </button>
        </div>

        <button
          className={styles.iconButton}
          type="button"
          onClick={() => void Promise.all([loadOverview(), loadCatalog()])}
          aria-label="Refresh market data"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      <section className={styles.metrics} aria-label="Market metrics">
        <div className={styles.metric}>
          <Database size={16} />
          <span>{overview?.metrics.trackedItems ?? 0}</span>
          <small>items</small>
        </div>
        <div className={styles.metric}>
          <Star size={16} />
          <span>{overview?.metrics.watchedItems ?? 0}</span>
          <small>watched</small>
        </div>
        <div className={styles.metric}>
          <Activity size={16} />
          <span>{overview?.metrics.marketsRepresented ?? 0}</span>
          <small>markets</small>
        </div>
        <div className={styles.metric}>
          <LineChart size={16} />
          <span>{formatPercent(overview?.metrics.averageChinaDiscountPercent)}</span>
          <small>CN spread</small>
        </div>
      </section>

      <Cs2FloatSearchSection />

      <section className={styles.layout}>
        <Cs2Sidebar
          overview={overview}
          busyItem={busyItem}
          ownerKey={ownerKey}
          onSaveWatchlistItem={(entry, updates) => void saveWatchlistItem(entry, updates)}
          onRemoveWatchlistItem={(itemId) => void removeFromWatchlist(itemId)}
        />

        <Cs2MarketTable
          toolbar={(
            <Cs2CatalogToolbar
              catalog={catalog}
              itemType={itemType}
              coverage={coverage}
              marketFocus={marketFocus}
              source={source}
              page={catalogPage}
              sort={catalogSort}
              onItemTypeChange={setItemType}
              onCoverageChange={setCoverage}
              onMarketFocusChange={setMarketFocus}
              onSourceChange={setSource}
              onPageChange={setCatalogPage}
              onSortChange={setCatalogSort}
            />
          )}
          items={catalogItems}
          selectedItem={selectedItem}
          loading={loading || catalogLoading}
          busyItem={busyItem}
          isWatched={(item) => isWatched(overview, item)}
          onAddToWatchlist={(item) => void addToWatchlist(item)}
          onSelectItem={setSelectedItemId}
        />

        <aside className={styles.detailPane} aria-label="Selected market detail">
          <Cs2ItemDetail item={selectedItem} />
        </aside>
      </section>

      <footer className={styles.statusBar}>
        <span data-mode={overview?.mode ?? "sample"}>{overview?.mode ?? "sample"} mode</span>
        <span>{overview?.configuredProviders.length ? overview.configuredProviders.join(" / ") : "add CS2SH_API_KEY, CS2CAP_API_KEY, or PRICEMPIRE_API_KEY for live feeds"}</span>
        {overview?.warning || error ? <strong>{error ?? overview?.warning}</strong> : <span>{overview?.generatedAt ? new Date(overview.generatedAt).toLocaleTimeString() : ""}</span>}
      </footer>
    </main>
  );
}
