import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCs2CapCatalogItems, fetchCs2CapLatestItems } from "@/lib/cs2/providers/cs2cap";
import { fetchCs2ShHistory, fetchCs2ShLatestItems } from "@/lib/cs2/providers/cs2sh";
import { fetchPricempireLatestItems } from "@/lib/cs2/providers/pricempire";
import { fetchSkinportLatestItems } from "@/lib/cs2/providers/skinport";
import { getCs2WatchlistMarketHashNames, persistProviderCandles, persistProviderCatalogItems, persistProviderItems } from "@/lib/cs2/syncRepository";
import { hydrateCs2ItemsFromConfiguredProviders, syncCs2MarketPipeline, syncCs2WatchlistHistory } from "@/lib/cs2/syncService";

vi.mock("@/lib/cs2/providers/cs2cap", () => ({
  fetchCs2CapCandles: vi.fn(),
  fetchCs2CapCatalogItems: vi.fn(),
  fetchCs2CapLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/cs2sh", () => ({
  fetchCs2ShHistory: vi.fn(),
  fetchCs2ShLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/pricempire", () => ({
  fetchPricempireHistory: vi.fn(),
  fetchPricempireLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/providers/skinport", () => ({
  fetchSkinportLatestItems: vi.fn(),
}));

vi.mock("@/lib/cs2/syncRepository", () => ({
  createCs2SyncRun: vi.fn(),
  finishCs2SyncRun: vi.fn(),
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
  });

  it("skips provider calls when no live API keys are configured", async () => {
    const summaries = await hydrateCs2ItemsFromConfiguredProviders({
      marketHashNames: [" AK-47 | Redline (Field-Tested) ", ""],
    });

    expect(summaries).toEqual([]);
    expect(fetchCs2ShLatestItems).not.toHaveBeenCalled();
    expect(fetchCs2CapLatestItems).not.toHaveBeenCalled();
    expect(fetchPricempireLatestItems).not.toHaveBeenCalled();
    expect(fetchSkinportLatestItems).not.toHaveBeenCalled();
    expect(persistProviderItems).not.toHaveBeenCalled();
  });

  it("hydrates an exact watchlist item from every configured China-aware provider", async () => {
    process.env.CS2SH_API_KEY = "cs2sh-key";
    process.env.CS2CAP_API_KEY = "cs2cap-key";
    process.env.PRICEMPIRE_API_KEY = "pricempire-key";
    vi.mocked(fetchCs2ShLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchCs2CapLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(fetchPricempireLatestItems).mockResolvedValue([{ marketHashName: "AK-47 | Redline (Field-Tested)", snapshots: [] }] as never);
    vi.mocked(persistProviderItems)
      .mockResolvedValueOnce(2 as never)
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(4 as never);

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
    expect(summaries).toEqual([
      expect.objectContaining({ provider: "cs2.sh", status: "ok", snapshotCount: 2 }),
      expect.objectContaining({ provider: "cs2cap", status: "ok", snapshotCount: 3 }),
      expect.objectContaining({ provider: "pricempire", status: "ok", snapshotCount: 4 }),
    ]);
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
    vi.mocked(persistProviderItems).mockResolvedValue(1 as never);

    const summary = await syncCs2MarketPipeline({});

    expect(fetchSkinportLatestItems).toHaveBeenCalledWith({
      limit: undefined,
    });
    expect(summary).toEqual(expect.objectContaining({
      provider: "pipeline",
      status: "ok",
      itemCount: 1,
      snapshotCount: 1,
      candleCount: 0,
      message: null,
    }));
    expect(summary.runs.map((run) => run.provider)).toEqual(["skinport"]);
  });

  it("runs configured China-first catalog and latest-price pipeline steps", async () => {
    process.env.CS2CAP_API_KEY = "cs2cap-key";
    process.env.PRICEMPIRE_API_KEY = "pricempire-key";
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
    vi.mocked(fetchSkinportLatestItems).mockResolvedValue([{ marketHashName: "M4A4 | Poseidon (Factory New)", snapshots: [] }] as never);
    vi.mocked(persistProviderCatalogItems).mockResolvedValue(undefined as never);
    vi.mocked(persistProviderItems)
      .mockResolvedValueOnce(5 as never)
      .mockResolvedValueOnce(6 as never)
      .mockResolvedValueOnce(7 as never);

    const summary = await syncCs2MarketPipeline({
      latestLimit: 1000,
      catalogLimit: 2000,
    });

    expect(fetchSkinportLatestItems).toHaveBeenCalledWith({
      limit: 1000,
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
    expect(fetchCs2ShLatestItems).not.toHaveBeenCalled();
    expect(summary).toEqual(expect.objectContaining({
      provider: "pipeline",
      status: "ok",
      itemCount: 5,
      snapshotCount: 18,
      candleCount: 0,
    }));
    expect(summary.runs.map((run) => run.provider)).toEqual(["cs2cap", "skinport", "cs2cap", "pricempire"]);
  });
});
