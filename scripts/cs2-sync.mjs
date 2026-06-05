import fs from "node:fs";

function loadEnv(file, { override = false } = {}) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    if (!override && process.env[key] !== undefined) continue;
    let value = match[2] || "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function readArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

function readListArg(name) {
  const value = readArg(name);
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : null;
}

loadEnv(".env");
loadEnv(".env.local", { override: true });

const mode = readArg("mode") || "latest";
const provider = readArg("provider") || (mode === "catalog" ? "cs2cap" : "cs2.sh");
const appUrl = (process.env.CS2_SYNC_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CS2_SYNC_SECRET;
const defaultHistorySources = provider === "pricempire" ? ["buff163"] : ["buff", "youpin", "csfloat"];

if (!secret && process.env.NODE_ENV === "production") {
  console.error("CS2_SYNC_SECRET is required in production.");
  process.exitCode = 1;
}

if (process.exitCode !== 1) {
  const payload = mode === "catalog"
    ? {
      mode: "catalog",
      provider,
      query: readArg("q") ?? undefined,
      limit: readArg("limit") ? Number(readArg("limit")) : undefined,
    }
    : mode === "history"
    ? {
      mode: "history",
      provider,
      marketHashNames: readListArg("items") ?? ["AK-47 | Redline (Field-Tested)"],
      sources: readListArg("sources") ?? defaultHistorySources,
      start: readArg("start") ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      end: readArg("end") ?? new Date().toISOString().slice(0, 10),
      lookback: readArg("lookback") ?? undefined,
      interval: readArg("interval") ?? "1d",
      fill: readArg("fill") === "true" ? true : undefined,
    }
    : mode === "watchlist-history"
    ? {
      mode: "watchlist-history",
      provider,
      ownerKey: readArg("owner") ?? undefined,
      sources: readListArg("sources") ?? defaultHistorySources,
      start: readArg("start") ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      end: readArg("end") ?? new Date().toISOString().slice(0, 10),
      lookback: readArg("lookback") ?? undefined,
      interval: readArg("interval") ?? "1d",
      fill: readArg("fill") === "true" ? true : undefined,
      limit: readArg("limit") ? Number(readArg("limit")) : undefined,
    }
    : mode === "pipeline"
    ? {
      mode: "pipeline",
      includeCatalog: readArg("catalog") === null ? undefined : readArg("catalog") !== "false",
      includeLatest: readArg("latest") === null ? undefined : readArg("latest") !== "false",
      includeWatchlistHistory: readArg("watchlist-history") === "true",
      latestLimit: readArg("latest-limit") ? Number(readArg("latest-limit")) : undefined,
      catalogLimit: readArg("catalog-limit") ? Number(readArg("catalog-limit")) : undefined,
      ownerKey: readArg("owner") ?? undefined,
      historyProvider: readArg("history-provider") ?? undefined,
      historySources: readListArg("history-sources") ?? undefined,
      historyStart: readArg("history-start") ?? undefined,
      historyEnd: readArg("history-end") ?? undefined,
      historyLookback: readArg("history-lookback") ?? "30d",
      historyInterval: readArg("history-interval") ?? "1d",
      historyFill: readArg("history-fill") === "true" ? true : undefined,
      watchlistLimit: readArg("watchlist-limit") ? Number(readArg("watchlist-limit")) : undefined,
    }
    : {
      mode: "latest",
      provider,
      marketHashNames: readListArg("items") ?? undefined,
      providers: readListArg("providers") ?? undefined,
      limit: readArg("limit") ? Number(readArg("limit")) : undefined,
      type: readArg("type") ?? undefined,
    };

  const response = await fetch(`${appUrl}/api/cs2/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "x-cs2-sync-secret": secret } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(text);
    process.exitCode = 1;
  } else {
    console.log(text);
  }
}
