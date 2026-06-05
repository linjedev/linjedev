import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCs2CapCandles, fetchCs2CapCatalogItems, fetchCs2CapLatestItems } from "@/lib/cs2/providers/cs2cap";
import { fetchC5GameLatestItems } from "@/lib/cs2/providers/c5game";
import { fetchCsPriceApiLatestItems } from "@/lib/cs2/providers/cspriceapi";
import { fetchCs2ShHistory, fetchCs2ShLatestItems } from "@/lib/cs2/providers/cs2sh";
import { fetchCsFloatLatestItems, fetchCsFloatSalesHistory } from "@/lib/cs2/providers/csfloat";
import { fetchMarketCsgoLatestItems, fetchMarketCsgoSalesHistory } from "@/lib/cs2/providers/marketcsgo";
import { fetchPricempireLatestItems } from "@/lib/cs2/providers/pricempire";
import { fetchSkinportLatestItems } from "@/lib/cs2/providers/skinport";
import { fetchSteamLatestItems, fetchSteamPriceHistory } from "@/lib/cs2/providers/steam";
import { getCs2ItemMetadataCatalog } from "@/lib/cs2/itemMetadataService";
import { getCs2MissingChinesePriceMarketHashNames, getCs2MissingHistoryMarketHashNames, getCs2WatchlistMarketHashNames, persistProviderCandles, persistProviderCatalogItems, persistProviderItems } from "@/lib/cs2/syncRepository";
import { hydrateCs2ItemsFromConfiguredProviders, syncCs2Catalog, syncCs2GapSweep, syncCs2LatestPrices, syncCs2MarketPipeline, syncCs2MissingHistory, syncCs2WatchlistHistory } from "@/lib/cs2/syncService";

vi.mock("@/lib/cs2/providers/cs2cap", () => ({
  fetchCs2CapCandles: vi.fn(),
  fetchCs2CapCatalogItems: vi.fn(),
  fetchCs2CapLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/c5game", () => ({
  fetchC5GameLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/cspriceapi", () => ({
  fetchCsPriceApiLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/cs2sh", () => ({
  fetchCs2ShHistory: vi.fn(),
  fetchCs2ShLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/csfloat", () => ({
  fetchCsFloatLatestItems: vi.fn(),
  fetchCsFloatSalesHistory: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/marketcsgo", () => ({
  fetchMarketCsgoLatestItems: vi.fn(),
  fetchMarketCsgoSalesHistory: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/pricempire", () => ({
  fetchPricempireHistory: vi.fn(),
  fetchPricempireLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/skinport", () => ({
  fetchSkinportLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/steam", () => ({
  fetchSteamLatestItems: vi.fn(),
  fetchSteamPriceHistory: vi.fn(),
}));

vi.mock("@/lib/cs2/itemMetadataService", () => ({
  getCs2ItemMetadataCatalog: vi.fn(),
}));

vi.mock("@/lib/cs2/syncRepository", () => ({
  createCs2SyncRun: vi.fn(),
  finishCs2SyncRun: vi.fn(),
  getCs2MissingChinesePriceMarketHashNames: vi.fn(),
  getCs2MissingHistoryMarketHashNames: vi.fn(),
  getCs2WatchlistMarketHashNames: vi.fn(),
  getCs2SyncStatus: vi.fn(),
  persistProviderCandles: vi.fn(),
  persistProviderCatalogItems: vi.fn(),
  persistProviderItems: vi.fn(),
}));

describe("CS2 sync service hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CS2SH_API_KEY;
    delete process.env.CS2CAP_API_KEY;
    delete process.env.PRICEMPIRE_API_KEY;
    delete process.env.C5GAME_API_KEY;
    delete process.env.CSPRICEAPI_API_KEY;
    delete process.env.MARKET_CSGO_API_KEY;
    vi.mocked(getCs2ItemMetadataCatalog).mockResolvedValue([] as never);
    vi.mocked(getCs2MissingChinesePriceMarketHashNames).mockResolvedValue([] as never);
    vi.mocked(getCs2MissingHistoryMarketHashNames).mockResolvedValue([] as never);
  });

  it("skips provider calls when no live API keys are configured", async () => {
    const summaries = await hydrateCs2ItemsFromConfiguredProviders({
      marketHashNames: [" AK-47 | Redline (Field-Tested) ", ""],
    });

    expect(summaries).toEqual([]);
    expect(fetchCs2ShLatestItems).not.toHaveBeenCalled();
    expect(fetchCs2CapLatestItems).not.toHaveBeenCalled();
    expect(fetchPricempireLatestItems).not.toHaveBeenCalled();
    expect(fetchC5GameLatestItems).not.toHaveBeenCalled();
    expect(fetchCsPriceApiLatestItems).not.toHaveBeenCalled();
    expect(fetchSteamLatestItems).not.toHaveBeenCalled();
    expect(fetchCsFloatLatestItems).not.toHaveBeenCalled();
    expect(fetchMarketCsgoLatestItems).not.toHaveBeenCalled();
    expect(fetchSkinportLatestItems).not.toHaveBeenCalled();
    expect(persistProviderItems).not.toHaveBeenCalled();
  });

  it("hydrates an exact watchlist item from every configured China-aware provider", async () => {
    process.env.CS2SH_API_KEY = "cs2sh-key";
    process.env.CS2CAP_API_KEY = "cs2cap-key";
    process.env.PRICEMPIRE_API_KEY = "pricempire-key";
    process.env.C5GAME_API_KEY = "c5game-key";
    process.env.CSPRICEAPI_API_KEY = "cspriceapi-key";
    process.env.MARKET_CSGO_API_KEY = "marketcsgo-key";
    vi.mocked(fetchCs2ShLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchCs2CapLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchPricempireLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchC5GameLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchCsPriceApiLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchMarketCsgoLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(persistProviderItems)
      .mockResolvedValueOnce(2 as never)
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(4 as never)
      .mockResolvedValueOnce(5 as never)
      .mockResolvedValueOnce(6 as never)
      .mockResolvedValueOnce(7 as never);

    const summaries = await hydrateCs2ItemsFromConfiguredProviders({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        " AK-47 | Redline (Field-Tested) ",
      ],
    });

    expect(fetchCs2ShLatestItems).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(fetchCs2CapLatestItems).toHaveBeenCalledWith(expect.objectContaining({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
      providers: expect.arrayContaining(["buff163", "youpin", "csfloat"]),
    }));
    expect(fetchPricempireLatestItems).toHaveBeenCalledWith(expect.objectContaining({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
      sources: expect.arrayContaining(["buff163", "buff163_buy", "youpin", "youpin_buy"]),
    }));
    expect(fetchC5GameLatestItems).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(fetchCsPriceApiLatestItems).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(fetchMarketCsgoLatestItems).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(summaries).toEqual([
      expect.objectContaining({ provider: "cs2.sh", status: "ok", snapshotCount: 2 }),
      expect.objectContaining({ provider: "cs2cap", status: "ok", snapshotCount: 3 }),
      expect.objectContaining({ provider: "pricempire", status: "ok", snapshotCount: 4 }),
      expect.objectContaining({ provider: "c5game", status: "ok", snapshotCount: 5 }),
      expect.objectContaining({ provider: "cspriceapi", status: "ok", snapshotCount: 6 }),
      expect.objectContaining({ provider: "marketcsgo", status: "ok", snapshotCount: 7 }),
    ]);
  });

  it("rejects exact-item latest providers without explicit item names", async () => {
    const c5Summary = await syncCs2LatestPrices({ provider: "c5game" });
    const csPriceSummary = await syncCs2LatestPrices({ provider: "cspriceapi" });
    const steamSummary = await syncCs2LatestPrices({ provider: "steam" });
    const csfloatSummary = await syncCs2LatestPrices({ provider: "csfloat" });
    const marketCsgoSummary = await syncCs2LatestPrices({ provider: "marketcsgo" });

    expect(fetchC5GameLatestItems).not.toHaveBeenCalled();
    expect(fetchCsPriceApiLatestItems).not.toHaveBeenCalled();
    expect(fetchSteamLatestItems).not.toHaveBeenCalled();
    expect(fetchCsFloatLatestItems).not.toHaveBeenCalled();
    expect(fetchMarketCsgoLatestItems).not.toHaveBeenCalled();
    expect(c5Summary).toEqual(expect.objectContaining({
      provider: "c5game",
      status: "error",
      message: "c5game latest sync requires explicit marketHashNames.",
    }));
    expect(csPriceSummary).toEqual(expect.objectContaining({
      provider: "cspriceapi",
      status: "error",
      message: "cspriceapi latest sync requires explicit marketHashNames.",
    }));
    expect(steamSummary).toEqual(expect.objectContaining({
      provider: "steam",
      status: "error",
      message: "steam latest sync requires explicit marketHashNames.",
    }));
    expect(csfloatSummary).toEqual(expect.objectContaining({
      provider: "csfloat",
      status: "error",
      message: "csfloat latest sync requires explicit marketHashNames.",
    }));
    expect(marketCsgoSummary).toEqual(expect.objectContaining({
      provider: "marketcsgo",
      status: "error",
      message: "marketcsgo latest sync requires explicit marketHashNames.",
    }));
  });

  it("backfills history for watched items without manually passing item names", async () => {
    vi.mocked(getCs2WatchlistMarketHashNames).mockResolvedValue([
      "AK-47 | Redline (Field-Tested)",
      "Sticker | Crown (Foil)",
    ] as never);
    vi.mocked(fetchCs2ShHistory).mockResolvedValue([
      {
        marketHashName: "AK-47 | Redline (Field-Tested)",
        provider: "cs2.sh",
        marketName: "BUFF163",
        interval: "1d",
        openCents: 2500,
        highCents: 2700,
        lowCents: 2400,
        closeCents: 2650,
        volume: 12,
        startsAt: new Date("2026-06-01T00:00:00.000Z"),
      },
    ] as never);
    vi.mocked(persistProviderCandles).mockResolvedValue(1 as never);

    const summary = await syncCs2WatchlistHistory({
      ownerKey: "owner-1",
      provider: "cs2.sh",
      sources: ["buff", "youpin"],
      start: "2026-06-01",
      end: "2026-06-05",
      interval: "1d",
      limit: 50,
    });

    expect(getCs2WatchlistMarketHashNames).toHaveBeenCalledWith({
      ownerKey: "owner-1",
      limit: 50,
    });
    expect(fetchCs2ShHistory).toHaveBeenCalledWith(expect.objectContaining({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      sources: ["buff", "youpin"],
      start: "2026-06-01",
      end: "2026-06-05",
      interval: "1d",
    }));
    expect(summary).toEqual(expect.objectContaining({
      provider: "cs2.sh",
      status: "ok",
      itemCount: 2,
      candleCount: 1,
    }));
  });

  it("backfills CSFloat sales history for watched items", async () => {
    vi.mocked(getCs2WatchlistMarketHashNames).mockResolvedValue([
      "AK-47 | Redline (Field-Tested)",
    ] as never);
    vi.mocked(fetchCsFloatSalesHistory).mockResolvedValue([
      {
        marketHashName: "AK-47 | Redline (Field-Tested)",
        provider: "csfloat",
        marketName: "CSFloat",
        interval: "1d",
        openCents: 2600,
        highCents: 2800,
        lowCents: 2600,
        closeCents: 2800,
        volume: 2,
        startsAt: new Date("2026-06-04T00:00:00.000Z"),
      },
    ] as never);
    vi.mocked(persistProviderCandles).mockResolvedValue(1 as never);

    const summary = await syncCs2WatchlistHistory({
      ownerKey: "owner-1",
      provider: "csfloat",
      interval: "1d",
      limit: 50,
    });

    expect(fetchCsFloatSalesHistory).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(summary).toEqual(expect.objectContaining({
      provider: "csfloat",
      status: "ok",
      itemCount: 1,
      candleCount: 1,
    }));
  });

  it("backfills Steam market history for watched items", async () => {
    vi.mocked(getCs2WatchlistMarketHashNames).mockResolvedValue([
      "Sticker | Crown (Foil)",
    ] as never);
    vi.mocked(fetchSteamPriceHistory).mockResolvedValue([
      {
        marketHashName: "Sticker | Crown (Foil)",
        provider: "steam",
        marketName: "Steam",
        interval: "1d",
        openCents: 102599,
        highCents: 103000,
        lowCents: 102000,
        closeCents: 102700,
        volume: 3,
        startsAt: new Date("2026-06-04T00:00:00.000Z"),
      },
    ] as never);
    vi.mocked(persistProviderCandles).mockResolvedValue(1 as never);

    const summary = await syncCs2WatchlistHistory({
      ownerKey: "owner-1",
      provider: "steam",
      interval: "1d",
      limit: 50,
    });

    expect(fetchSteamPriceHistory).toHaveBeenCalledWith({
      marketHashNames: ["Sticker | Crown (Foil)"],
    });
    expect(summary).toEqual(expect.objectContaining({
      provider: "steam",
      status: "ok",
      itemCount: 1,
      candleCount: 1,
    }));
  });

  it("backfills Market.CSGO sales history for watched items", async () => {
    vi.mocked(getCs2WatchlistMarketHashNames).mockResolvedValue([
      "AK-47 | Redline (Field-Tested)",
    ] as never);
    vi.mocked(fetchMarketCsgoSalesHistory).mockResolvedValue([
      {
        marketHashName: "AK-47 | Redline (Field-Tested)",
        provider: "marketcsgo",
        marketName: "Market.CSGO",
        interval: "1d",
        openCents: 2950,
        highCents: 3125,
        lowCents: 2950,
        closeCents: 3125,
        volume: 2,
        startsAt: new Date("2026-06-05T00:00:00.000Z"),
      },
    ] as never);
    vi.mocked(persistProviderCandles).mockResolvedValue(1 as never);

    const summary = await syncCs2WatchlistHistory({
      ownerKey: "owner-1",
      provider: "marketcsgo",
      interval: "1d",
      limit: 50,
    });

    expect(fetchMarketCsgoSalesHistory).toHaveBeenCalledWith({
      marketHashNames: ["AK-47 | Redline (Field-Tested)"],
    });
    expect(summary).toEqual(expect.objectContaining({
      provider: "marketcsgo",
      status: "ok",
      itemCount: 1,
      candleCount: 1,
    }));
  });

  it("returns an ok no-op summary when watchlist history has no items", async () => {
    vi.mocked(getCs2WatchlistMarketHashNames).mockResolvedValue([] as never);

    const summary = await syncCs2WatchlistHistory({
      ownerKey: "owner-empty",
      provider: "cs2.sh",
      start: "2026-06-01",
      end: "2026-06-05",
      interval: "1d",
    });

    expect(fetchCs2ShHistory).not.toHaveBeenCalled();
    expect(persistProviderCandles).not.toHaveBeenCalled();
    expect(summary).toEqual(expect.objectContaining({
      status: "ok",
      itemCount: 0,
      candleCount: 0,
      message: "No watchlist items to backfill.",
    }));
  });

  it("returns a clear watchlist history error when the database is unavailable", async () => {
    vi.mocked(getCs2WatchlistMarketHashNames).mockRejectedValue(new Error("Invalid `prisma.cs2WatchlistItem.findMany()` invocation") as never);

    const summary = await syncCs2WatchlistHistory({
      ownerKey: "owner-offline",
      provider: "cs2cap",
      lookback: "30d",
      interval: "1d",
    });

    expect(summary).toEqual(expect.objectContaining({
      provider: "cs2cap",
      status: "error",
      message: "Watchlist database unavailable or CS2 schema pending.",
    }));
  });

  it("runs the public Skinport latest-price pipeline step when no provider API keys are configured", async () => {
    vi.mocked(fetchSkinportLatestItems).mockResolvedValue([{ marketHashName: "M4A4 | Poseidon (Factory New)", snapshots: [] }] as never);
    vi.mocked(getCs2ItemMetadataCatalog).mockResolvedValue([{
      marketHashName: "M4A4 | Poseidon (Factory New)",
      itemType: "skin",
      category: "M4A4",
      rarity: "Classified",
      exterior: "Factory New",
      collection: null,
      imageUrl: "https://cdn.example.com/m4a4.png",
    }] as never);
    vi.mocked(persistProviderCatalogItems).mockResolvedValue(undefined as never);
    vi.mocked(persistProviderItems).mockResolvedValue(1 as never);

    const summary = await syncCs2MarketPipeline({});

    expect(fetchSkinportLatestItems).toHaveBeenCalledWith({
      limit: undefined,
    });
    expect(getCs2ItemMetadataCatalog).toHaveBeenCalledWith({
      query: undefined,
      limit: undefined,
    });
    expect(summary).toEqual(expect.objectContaining({
      provider: "pipeline",
      status: "ok",
      itemCount: 2,
      snapshotCount: 1,
      candleCount: 0,
      message: null,
    }));
    expect(summary.runs.map((run) => run.provider)).toEqual(["metadata", "skinport"]);
  });

  it("syncs the public metadata catalog into the database", async () => {
    vi.mocked(getCs2ItemMetadataCatalog).mockResolvedValue([{
      marketHashName: "Sticker | Crown (Foil)",
      itemType: "sticker",
      category: "Sticker",
      rarity: "Exotic",
      exterior: null,
      collection: null,
      imageUrl: "https://cdn.example.com/crown.png",
    }] as never);
    vi.mocked(persistProviderCatalogItems).mockResolvedValue(undefined as never);

    const summary = await syncCs2Catalog({
      provider: "metadata",
      query: "crown",
      limit: 100,
    });

    expect(getCs2ItemMetadataCatalog).toHaveBeenCalledWith({
      query: "crown",
      limit: 100,
    });
    expect(persistProviderCatalogItems).toHaveBeenCalledWith([expect.objectContaining({
      marketHashName: "Sticker | Crown (Foil)",
      itemType: "sticker",
      imageUrl: "https://cdn.example.com/crown.png",
      tradable: true,
    })]);
    expect(summary).toEqual(expect.objectContaining({
      provider: "metadata",
      status: "ok",
      itemCount: 1,
      snapshotCount: 0,
    }));
  });

  it("uses missing-China catalog gaps for exact China providers when no watchlist scope is provided", async () => {
    process.env.C5GAME_API_KEY = "c5game-key";
    process.env.CSPRICEAPI_API_KEY = "cspriceapi-key";
    vi.mocked(fetchSkinportLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchSteamLatestItems).mockResolvedValue([{ marketHashName: "Sticker | Crown (Foil)", snapshots: [] }] as never);
    vi.mocked(fetchCsFloatLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(getCs2MissingChinesePriceMarketHashNames).mockResolvedValue([
      "AK-47 | Redline (Field-Tested)",
      "Sticker | Crown (Foil)",
    ] as never);
    vi.mocked(fetchC5GameLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchCsPriceApiLatestItems).mockResolvedValue([{ marketHashName: "Sticker | Crown (Foil)", snapshots: [] }] as never);
    vi.mocked(persistProviderCatalogItems).mockResolvedValue(undefined as never);
    vi.mocked(persistProviderItems)
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(4 as never)
      .mockResolvedValueOnce(5 as never)
      .mockResolvedValueOnce(5 as never);

    const summary = await syncCs2MarketPipeline({
      includeCatalog: false,
      latestLimit: 2,
      latestAfterMarketHashName: "AK-47 | Asiimov (Field-Tested)",
    });

    expect(getCs2MissingChinesePriceMarketHashNames).toHaveBeenCalledWith({
      limit: 2,
      afterMarketHashName: "AK-47 | Asiimov (Field-Tested)",
    });
    expect(getCs2WatchlistMarketHashNames).not.toHaveBeenCalled();
    expect(fetchC5GameLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 2,
    });
    expect(fetchCsPriceApiLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 2,
    });
    expect(fetchSteamLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 2,
    });
    expect(fetchCsFloatLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 2,
    });
    expect(summary.nextCursor).toBe("Sticker | Crown (Foil)");
    expect(summary.runs.map((run) => run.provider)).toEqual(["skinport", "steam", "csfloat", "c5game", "cspriceapi"]);
  });

  it("backfills history for catalog items missing candles", async () => {
    vi.mocked(getCs2MissingHistoryMarketHashNames).mockResolvedValue([
      "AK-47 | Redline (Field-Tested)",
      "Sticker | Crown (Foil)",
    ] as never);
    vi.mocked(fetchCs2CapCandles).mockResolvedValue([{
      marketHashName: "AK-47 | Redline (Field-Tested)",
      provider: "cs2cap",
      marketName: "BUFF163",
      interval: "1d",
      openCents: 2500,
      highCents: 2600,
      lowCents: 2400,
      closeCents: 2550,
      volume: 10,
      startsAt: new Date("2026-06-01T00:00:00.000Z"),
    }] as never);
    vi.mocked(persistProviderCandles).mockResolvedValue(1 as never);

    const summary = await syncCs2MissingHistory({
      provider: "cs2cap",
      lookback: "30d",
      interval: "1d",
      limit: 2,
      staleAfterDays: 14,
      afterMarketHashName: "AK-47 | Asiimov (Field-Tested)",
    });

    expect(getCs2MissingHistoryMarketHashNames).toHaveBeenCalledWith({
      limit: 2,
      staleAfterDays: 14,
      afterMarketHashName: "AK-47 | Asiimov (Field-Tested)",
    });
    expect(fetchCs2CapCandles).toHaveBeenCalledWith(expect.objectContaining({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      lookback: "30d",
      interval: "1d",
    }));
    expect(summary).toEqual(expect.objectContaining({
      provider: "cs2cap",
      status: "ok",
      itemCount: 2,
      candleCount: 1,
      nextCursor: "Sticker | Crown (Foil)",
    }));
  });

  it("runs configured China-first catalog and latest-price pipeline steps", async () => {
    process.env.CS2CAP_API_KEY = "cs2cap-key";
    process.env.PRICEMPIRE_API_KEY = "pricempire-key";
    process.env.C5GAME_API_KEY = "c5game-key";
    process.env.CSPRICEAPI_API_KEY = "cspriceapi-key";
    vi.mocked(fetchCs2CapCatalogItems).mockResolvedValue([
      {
        marketHashName: "AK-47 | Redline (Field-Tested)",
        itemType: "skin",
        category: "AK-47",
        rarity: null,
        exterior: "Field-Tested",
        collection: null,
        imageUrl: null,
        tradable: true,
      },
      {
        marketHashName: "Sticker | Crown (Foil)",
        itemType: "sticker",
        category: "sticker",
        rarity: null,
        exterior: null,
        collection: null,
        imageUrl: null,
        tradable: true,
      },
    ] as never);
    vi.mocked(fetchCs2CapLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchPricempireLatestItems).mockResolvedValue([{ marketHashName: "Sticker | Crown (Foil)", snapshots: [] }] as never);
    vi.mocked(fetchC5GameLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchCsPriceApiLatestItems).mockResolvedValue([{ marketHashName: "Sticker | Crown (Foil)", snapshots: [] }] as never);
    vi.mocked(fetchSkinportLatestItems).mockResolvedValue([{ marketHashName: "M4A4 | Poseidon (Factory New)", snapshots: [] }] as never);
    vi.mocked(fetchSteamLatestItems).mockResolvedValue([{ marketHashName: "Sticker | Crown (Foil)", snapshots: [] }] as never);
    vi.mocked(fetchCsFloatLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(getCs2WatchlistMarketHashNames).mockResolvedValue([
      "AK-47 | Redline (Field-Tested)",
      "Sticker | Crown (Foil)",
    ] as never);
    vi.mocked(getCs2ItemMetadataCatalog).mockResolvedValue([{
      marketHashName: "M4A4 | Poseidon (Factory New)",
      itemType: "skin",
      category: "M4A4",
      rarity: null,
      exterior: "Factory New",
      collection: null,
      imageUrl: null,
    }] as never);
    vi.mocked(persistProviderCatalogItems).mockResolvedValue(undefined as never);
    vi.mocked(persistProviderItems)
      .mockResolvedValueOnce(5 as never)
      .mockResolvedValueOnce(6 as never)
      .mockResolvedValueOnce(7 as never)
      .mockResolvedValueOnce(8 as never)
      .mockResolvedValueOnce(9 as never)
      .mockResolvedValueOnce(10 as never)
      .mockResolvedValueOnce(11 as never);

    const summary = await syncCs2MarketPipeline({
      ownerKey: "owner-1",
      latestLimit: 1000,
      catalogLimit: 2000,
    });

    expect(fetchSkinportLatestItems).toHaveBeenCalledWith({
      limit: 1000,
    });
    expect(getCs2ItemMetadataCatalog).toHaveBeenCalledWith({
      query: undefined,
      limit: 2000,
    });
    expect(fetchCs2CapCatalogItems).toHaveBeenCalledWith({
      query: undefined,
      limit: 2000,
    });
    expect(fetchCs2CapLatestItems).toHaveBeenCalledWith(expect.objectContaining({
      providers: expect.arrayContaining(["buff163", "youpin", "csfloat"]),
      limit: 1000,
    }));
    expect(fetchPricempireLatestItems).toHaveBeenCalledWith(expect.objectContaining({
      sources: expect.arrayContaining(["buff163", "buff163_buy", "youpin", "youpin_buy"]),
      limit: 1000,
    }));
    expect(getCs2WatchlistMarketHashNames).toHaveBeenCalledWith({
      ownerKey: "owner-1",
      limit: 100,
    });
    expect(fetchC5GameLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 1000,
    });
    expect(fetchCsPriceApiLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 1000,
    });
    expect(fetchSteamLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 1000,
    });
    expect(fetchCsFloatLatestItems).toHaveBeenCalledWith({
      marketHashNames: [
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ],
      limit: 1000,
    });
    expect(fetchCs2ShLatestItems).not.toHaveBeenCalled();
    expect(summary).toEqual(expect.objectContaining({
      provider: "pipeline",
      status: "ok",
      itemCount: 10,
      snapshotCount: 56,
      candleCount: 0,
    }));
    expect(summary.runs.map((run) => run.provider)).toEqual(["metadata", "cs2cap", "skinport", "cs2cap", "pricempire", "steam", "csfloat", "c5game", "cspriceapi"]);
  });

  it("sweeps China latest-price gaps across cursor batches", async () => {
    process.env.CSPRICEAPI_API_KEY = "cspriceapi-key";
    vi.mocked(fetchSkinportLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchSteamLatestItems).mockResolvedValue([] as never);
    vi.mocked(fetchCsFloatLatestItems).mockResolvedValue([] as never);
    vi.mocked(getCs2MissingChinesePriceMarketHashNames)
      .mockResolvedValueOnce([
        "AK-47 | Redline (Field-Tested)",
        "Sticker | Crown (Foil)",
      ] as never)
      .mockResolvedValueOnce([
        "M4A4 | Poseidon (Factory New)",
      ] as never);
    vi.mocked(fetchCsPriceApiLatestItems)
      .mockResolvedValueOnce([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never)
      .mockResolvedValueOnce([{ marketHashName: "M4A4 | Poseidon (Factory New)", snapshots: [] }] as never);
    vi.mocked(persistProviderCatalogItems).mockResolvedValue(undefined as never);
    vi.mocked(persistProviderItems)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(1 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(0 as never)
      .mockResolvedValueOnce(2 as never);

    const summary = await syncCs2GapSweep({
      target: "latest-china",
      maxBatches: 4,
      latestLimit: 2,
      startAfterMarketHashName: "AK-47 | Asiimov (Field-Tested)",
    });

    expect(getCs2MissingChinesePriceMarketHashNames).toHaveBeenNthCalledWith(1, {
      limit: 2,
      afterMarketHashName: "AK-47 | Asiimov (Field-Tested)",
    });
    expect(getCs2MissingChinesePriceMarketHashNames).toHaveBeenNthCalledWith(2, {
      limit: 2,
      afterMarketHashName: "Sticker | Crown (Foil)",
    });
    expect(fetchCsPriceApiLatestItems).toHaveBeenCalledTimes(2);
    expect(fetchSteamLatestItems).toHaveBeenCalledTimes(2);
    expect(fetchCsFloatLatestItems).toHaveBeenCalledTimes(2);
    expect(summary).toEqual(expect.objectContaining({
      provider: "sweep",
      target: "latest-china",
      status: "ok",
      itemCount: 2,
      snapshotCount: 3,
      nextCursor: null,
    }));
    expect(summary.batches).toHaveLength(2);
  });
});
