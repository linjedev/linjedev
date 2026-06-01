import { getSessionUser, hasDatabase, isAdminUser, json } from "../../_auth.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const NEWS_DOMAINS = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "aljazeera.com",
  "france24.com",
  "dw.com",
  "theguardian.com",
  "scmp.com",
  "japantimes.co.jp",
  "thehindu.com",
  "timesofindia.indiatimes.com",
  "lemonde.fr"
];

const SOURCE_LOCATIONS = {
  argentina: { label: "Argentina", lat: -34.6, lon: -58.4, region: "South America" },
  australia: { label: "Australia", lat: -35.3, lon: 149.1, region: "Oceania" },
  brazil: { label: "Brazil", lat: -15.8, lon: -47.9, region: "South America" },
  canada: { label: "Canada", lat: 45.4, lon: -75.7, region: "North America" },
  china: { label: "China", lat: 39.9, lon: 116.4, region: "East Asia" },
  france: { label: "France", lat: 48.9, lon: 2.4, region: "Europe" },
  germany: { label: "Germany", lat: 52.5, lon: 13.4, region: "Europe" },
  india: { label: "India", lat: 28.6, lon: 77.2, region: "South Asia" },
  indonesia: { label: "Indonesia", lat: -6.2, lon: 106.8, region: "Southeast Asia" },
  japan: { label: "Japan", lat: 35.7, lon: 139.7, region: "East Asia" },
  mexico: { label: "Mexico", lat: 19.4, lon: -99.1, region: "North America" },
  nigeria: { label: "Nigeria", lat: 9.1, lon: 7.5, region: "West Africa" },
  russia: { label: "Russia", lat: 55.8, lon: 37.6, region: "Eurasia" },
  southafrica: { label: "South Africa", lat: -25.7, lon: 28.2, region: "Africa" },
  unitedarabemirates: { label: "United Arab Emirates", lat: 24.5, lon: 54.4, region: "Middle East" },
  unitedkingdom: { label: "United Kingdom", lat: 51.5, lon: -0.1, region: "Europe" },
  unitedstates: { label: "United States", lat: 38.9, lon: -77, region: "North America" }
};

const PLACE_CATALOG = [
  { name: "Tehran", aliases: ["tehran"], country: "Iran", region: "Middle East", lat: 35.6892, lon: 51.389, population: 9380000, kind: "capital" },
  { name: "Isfahan", aliases: ["isfahan", "esfahan"], country: "Iran", region: "Middle East", lat: 32.6546, lon: 51.668, population: 2220000, kind: "city" },
  { name: "Mashhad", aliases: ["mashhad"], country: "Iran", region: "Middle East", lat: 36.2605, lon: 59.6168, population: 3400000, kind: "city" },
  { name: "Kerman", aliases: ["kerman"], country: "Iran", region: "Middle East", lat: 30.2839, lon: 57.0834, population: 738000, kind: "city" },
  { name: "Zahedan", aliases: ["zahedan"], country: "Iran", region: "Middle East", lat: 29.4963, lon: 60.8629, population: 588000, kind: "city" },
  { name: "London", aliases: ["london", "westminster"], country: "United Kingdom", region: "Europe", lat: 51.5072, lon: -0.1276, population: 8799800, kind: "capital" },
  { name: "Paris", aliases: ["paris"], country: "France", region: "Europe", lat: 48.8566, lon: 2.3522, population: 2103000, kind: "capital" },
  { name: "Berlin", aliases: ["berlin"], country: "Germany", region: "Europe", lat: 52.52, lon: 13.405, population: 3878000, kind: "capital" },
  { name: "Kyiv", aliases: ["kyiv", "kiev"], country: "Ukraine", region: "Europe", lat: 50.4501, lon: 30.5234, population: 2952300, kind: "capital" },
  { name: "Moscow", aliases: ["moscow"], country: "Russia", region: "Eurasia", lat: 55.7558, lon: 37.6173, population: 13010000, kind: "capital" },
  { name: "Beijing", aliases: ["beijing"], country: "China", region: "East Asia", lat: 39.9042, lon: 116.4074, population: 21893000, kind: "capital" },
  { name: "Shanghai", aliases: ["shanghai"], country: "China", region: "East Asia", lat: 31.2304, lon: 121.4737, population: 24870000, kind: "city" },
  { name: "Tokyo", aliases: ["tokyo"], country: "Japan", region: "East Asia", lat: 35.6762, lon: 139.6503, population: 14094000, kind: "capital" },
  { name: "Seoul", aliases: ["seoul"], country: "South Korea", region: "East Asia", lat: 37.5665, lon: 126.978, population: 9400000, kind: "capital" },
  { name: "New Delhi", aliases: ["new delhi", "delhi"], country: "India", region: "South Asia", lat: 28.6139, lon: 77.209, population: 11000000, kind: "capital" },
  { name: "Mumbai", aliases: ["mumbai", "bombay"], country: "India", region: "South Asia", lat: 19.076, lon: 72.8777, population: 12478000, kind: "city" },
  { name: "Gaza City", aliases: ["gaza city", "gaza"], country: "Palestine", region: "Middle East", lat: 31.5017, lon: 34.4668, population: 590000, kind: "city" },
  { name: "Rafah", aliases: ["rafah"], country: "Palestine", region: "Middle East", lat: 31.2969, lon: 34.2435, population: 171000, kind: "city" },
  { name: "Jerusalem", aliases: ["jerusalem"], country: "Israel", region: "Middle East", lat: 31.7683, lon: 35.2137, population: 971800, kind: "city" },
  { name: "Tel Aviv", aliases: ["tel aviv"], country: "Israel", region: "Middle East", lat: 32.0853, lon: 34.7818, population: 474500, kind: "city" },
  { name: "Dubai", aliases: ["dubai"], country: "United Arab Emirates", region: "Middle East", lat: 25.2048, lon: 55.2708, population: 3550000, kind: "city" },
  { name: "Riyadh", aliases: ["riyadh"], country: "Saudi Arabia", region: "Middle East", lat: 24.7136, lon: 46.6753, population: 7677000, kind: "capital" },
  { name: "Cairo", aliases: ["cairo"], country: "Egypt", region: "Africa", lat: 30.0444, lon: 31.2357, population: 10100000, kind: "capital" },
  { name: "Lagos", aliases: ["lagos"], country: "Nigeria", region: "West Africa", lat: 6.5244, lon: 3.3792, population: 15300000, kind: "city" },
  { name: "Nairobi", aliases: ["nairobi"], country: "Kenya", region: "Africa", lat: -1.2921, lon: 36.8219, population: 4397000, kind: "capital" },
  { name: "Johannesburg", aliases: ["johannesburg"], country: "South Africa", region: "Africa", lat: -26.2041, lon: 28.0473, population: 5635000, kind: "city" },
  { name: "Washington", aliases: ["washington", "washington dc"], country: "United States", region: "North America", lat: 38.9072, lon: -77.0369, population: 678000, kind: "capital" },
  { name: "New York", aliases: ["new york", "nyc", "manhattan"], country: "United States", region: "North America", lat: 40.7128, lon: -74.006, population: 8258000, kind: "city" },
  { name: "Los Angeles", aliases: ["los angeles"], country: "United States", region: "North America", lat: 34.0522, lon: -118.2437, population: 3822000, kind: "city" },
  { name: "Mexico City", aliases: ["mexico city"], country: "Mexico", region: "North America", lat: 19.4326, lon: -99.1332, population: 9209000, kind: "capital" },
  { name: "Brasilia", aliases: ["brasilia"], country: "Brazil", region: "South America", lat: -15.7939, lon: -47.8828, population: 2817000, kind: "capital" },
  { name: "Sao Paulo", aliases: ["sao paulo", "são paulo"], country: "Brazil", region: "South America", lat: -23.5558, lon: -46.6396, population: 11450000, kind: "city" },
  { name: "Buenos Aires", aliases: ["buenos aires"], country: "Argentina", region: "South America", lat: -34.6037, lon: -58.3816, population: 3120000, kind: "capital" },
  { name: "Sydney", aliases: ["sydney"], country: "Australia", region: "Oceania", lat: -33.8688, lon: 151.2093, population: 5297000, kind: "city" },
  { name: "Jakarta", aliases: ["jakarta"], country: "Indonesia", region: "Southeast Asia", lat: -6.2088, lon: 106.8456, population: 10670000, kind: "capital" }
];

export async function ensureWorldNewsTables(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS world_news_requests (
      user_id TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      requested_at TEXT NOT NULL,
      reviewed_by TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT '',
      PRIMARY KEY (user_id)
    )`
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_world_news_requests_status ON world_news_requests(status)"
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS world_news_access (
      user_id TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      granted_by TEXT DEFAULT '',
      granted_at TEXT NOT NULL,
      revoked_by TEXT DEFAULT '',
      revoked_at TEXT DEFAULT '',
      PRIMARY KEY (user_id)
    )`
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_world_news_access_username ON world_news_access(username)"
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS world_news_cache (
      cache_key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ).run();
}

export async function requireWorldNewsUser({ request, env }) {
  if (!hasDatabase(env)) {
    return { response: json({ error: "World Watch storage is not configured." }, { status: 503 }) };
  }

  const user = await getSessionUser({ request, env });
  if (!user) {
    return { response: json({ error: "Login required." }, { status: 401 }) };
  }

  return { user };
}

export async function requestWorldNewsAccess({ env, user }) {
  await ensureWorldNewsTables(env);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO world_news_requests
     (user_id, username, status, requested_at, reviewed_by, reviewed_at)
     VALUES (?, ?, 'pending', ?, '', '')
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username,
       status = CASE
         WHEN world_news_requests.status = 'approved' THEN 'approved'
         ELSE 'pending'
       END,
       requested_at = excluded.requested_at`
  ).bind(user.id, user.username, now).run();
  return getWorldNewsEnrollment({ env, user });
}

export async function getWorldNewsEnrollment({ env, user, admin = false }) {
  await ensureWorldNewsTables(env);
  const request = await env.DB.prepare(
    `SELECT user_id, username, status, requested_at, reviewed_by, reviewed_at
     FROM world_news_requests
     WHERE user_id = ?`
  ).bind(user.id).first();
  const grant = await env.DB.prepare(
    `SELECT user_id, username, granted_by, granted_at, revoked_by, revoked_at
     FROM world_news_access
     WHERE user_id = ?`
  ).bind(user.id).first();
  const allowed = Boolean(admin || (grant && !grant.revoked_at));
  return {
    allowed,
    admin,
    grantedAt: grant && !grant.revoked_at ? grant.granted_at : "",
    registered: Boolean(request || grant || admin),
    requestedAt: request ? request.requested_at : "",
    status: allowed ? "approved" : request ? request.status : "not_registered",
    username: user.username
  };
}

export async function hasWorldNewsAccess({ env, user }) {
  if (!user) return false;
  const admin = isAdminUser(user, env);
  const enrollment = await getWorldNewsEnrollment({ env, user, admin });
  return enrollment.allowed;
}

export async function getWorldNewsFeed(env) {
  await ensureWorldNewsTables(env);
  const cached = await env.DB.prepare(
    "SELECT payload, updated_at FROM world_news_cache WHERE cache_key = 'global'"
  ).first();
  const cachedPayload = parseCachedFeed(cached);
  if (cachedPayload && hasWorldSignals(cachedPayload) && Date.now() - Date.parse(cached.updated_at) < CACHE_TTL_MS) {
    return cachedPayload;
  }

  let feed;
  try {
    feed = await fetchGdeltFeed();
  } catch (error) {
    if (cachedPayload && hasWorldSignals(cachedPayload)) {
      return {
        ...cachedPayload,
        stale: true,
        status: error.message || "World news feed is using cached data."
      };
    }
    feed = await emptyFreeWorldFeed(error.message || "Free world news feed is temporarily unavailable.");
  }
  await env.DB.prepare(
    `INSERT INTO world_news_cache (cache_key, payload, updated_at)
     VALUES ('global', ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at`
  ).bind(JSON.stringify(feed), feed.updatedAt).run();

  return feed;
}

function parseCachedFeed(cached) {
  if (!cached || !cached.payload) return null;
  try {
    return JSON.parse(cached.payload);
  } catch {
    return null;
  }
}

function hasWorldSignals(feed) {
  return Boolean(feed && Array.isArray(feed.articles) && feed.articles.length);
}

async function fetchGdeltFeed() {
  const query = NEWS_DOMAINS.map((domain) => `domainis:${domain}`).join(" OR ");
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", `(${query})`);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("timespan", "48h");
  url.searchParams.set("maxrecords", "100");
  url.searchParams.set("sort", "datedesc");

  const response = await fetch(url.toString(), {
    headers: {
      "user-agent": "linje-world-watch"
    }
  });
  if (!response.ok) {
    throw new Error("World news feed is temporarily unavailable.");
  }

  const data = await response.json();
  let articles = (data.articles || [])
    .map((article) => normalizeArticle(article))
    .filter(Boolean)
    .slice(0, 72);

  const regions = articles.reduce((items, article) => {
    const current = items.get(article.region) || { count: 0, latestAt: "" };
    current.count += 1;
    current.latestAt = !current.latestAt || article.seenAt > current.latestAt ? article.seenAt : current.latestAt;
    items.set(article.region, current);
    return items;
  }, new Map());

  return {
    articles,
    flights: await fetchOpenSkyFlights(),
    places: buildPlaces(articles),
    regions: [...regions.entries()].map(([region, value]) => ({ region, ...value })),
    ships: getMaritimeLayer(),
    sources: [
      { name: "GDELT DOC 2.0", status: "news articles", url: "https://www.gdeltproject.org/" },
      { name: "OpenSky Network", status: "ADS-B state vectors when rate limit permits", url: "https://opensky-network.org/" },
      { name: "AISStream", status: "configure free AISSTREAM_KEY for live vessel WebSocket streaming", url: "https://aisstream.io/documentation" }
    ],
    status: articles.length ? "live" : "GDELT returned no articles for the current window.",
    source: "GDELT DOC 2.0 / OpenSky / AIS-ready",
    updatedAt: new Date().toISOString()
  };
}

async function emptyFreeWorldFeed(status) {
  return {
    articles: [],
    flights: await fetchOpenSkyFlights(),
    places: [],
    regions: [],
    ships: getMaritimeLayer(),
    sources: [
      { name: "GDELT DOC 2.0", status: status || "unavailable", url: "https://www.gdeltproject.org/" },
      { name: "OpenSky Network", status: "ADS-B state vectors when rate limit permits", url: "https://opensky-network.org/" },
      { name: "AISStream", status: "configure free AISSTREAM_KEY for live vessel WebSocket streaming", url: "https://aisstream.io/documentation" }
    ],
    source: "free APIs",
    status,
    updatedAt: new Date().toISOString()
  };
}

function normalizeArticle(article) {
  const sourceKey = normalizeSourceCountry(article.sourcecountry || "");
  const place = inferPlace(article, SOURCE_LOCATIONS[sourceKey]);
  if (!place || !article.url || !article.title) return null;

  return {
    id: hashArticleId(article.url),
    title: String(article.title).slice(0, 180),
    url: article.url,
    domain: String(article.domain || "").slice(0, 120),
    language: String(article.language || "").slice(0, 40),
    sourceCountry: place.country || place.label,
    place,
    placeName: place.name || place.label,
    region: place.region,
    lat: place.lat,
    lon: place.lon,
    seenAt: normalizeGdeltDate(article.seendate || ""),
    image: article.socialimage || ""
  };
}

function inferPlace(article, sourceLocation) {
  const haystack = `${article.title || ""} ${article.description || ""}`.toLowerCase();
  const matched = PLACE_CATALOG.find((place) => place.aliases.some((alias) => haystack.includes(alias)));
  if (matched) return matched;
  if (sourceLocation) {
    return {
      name: sourceLocation.label,
      country: sourceLocation.label,
      region: sourceLocation.region,
      lat: sourceLocation.lat,
      lon: sourceLocation.lon,
      population: 0,
      kind: "country centroid"
    };
  }
  const domain = String(article.domain || "").toLowerCase();
  if (domain.endsWith(".ir")) return PLACE_CATALOG[0];
  if (domain.includes("bbc") || domain.includes("guardian")) return PLACE_CATALOG[5];
  if (domain.includes("lemonde")) return PLACE_CATALOG[6];
  if (domain.includes("dw.com")) return PLACE_CATALOG[7];
  if (domain.includes("scmp")) return PLACE_CATALOG[10];
  if (domain.includes("japantimes")) return PLACE_CATALOG[12];
  if (domain.includes("thehindu") || domain.includes("timesofindia")) return PLACE_CATALOG[14];
  return PLACE_CATALOG[27];
}

function buildPlaces(articles) {
  const places = new Map();
  articles.forEach((article) => {
    const place = article.place;
    if (!place) return;
    const key = `${place.name || place.label}:${place.country}`;
    const current = places.get(key) || {
      ...place,
      articleCount: 0,
      articles: []
    };
    current.articleCount += 1;
    current.articles.push({ id: article.id, title: article.title, url: article.url, domain: article.domain });
    places.set(key, current);
  });
  return [...places.values()];
}

async function fetchOpenSkyFlights() {
  try {
    const response = await fetch("https://opensky-network.org/api/states/all", {
      headers: { "user-agent": "linje-world-watch" }
    });
    if (!response.ok) throw new Error(`OpenSky ${response.status}`);
    const data = await response.json();
    const states = Array.isArray(data.states) ? data.states : [];
    return {
      source: "OpenSky Network",
      status: "live",
      updatedAt: data.time ? new Date(data.time * 1000).toISOString() : new Date().toISOString(),
      aircraft: states
        .filter((state) => Number.isFinite(state[5]) && Number.isFinite(state[6]))
        .slice(0, 140)
        .map((state) => ({
          id: state[0],
          callsign: String(state[1] || "").trim() || state[0],
          originCountry: state[2] || "",
          lastContact: state[4] ? new Date(state[4] * 1000).toISOString() : "",
          lon: state[5],
          lat: state[6],
          altitudeMeters: state[7] ?? state[13] ?? null,
          onGround: Boolean(state[8]),
          speedMps: state[9] ?? null,
          track: state[10] ?? null,
          verticalRate: state[11] ?? null,
          squawk: state[14] || "",
          positionSource: state[16] ?? null,
          category: state[17] ?? null
        }))
    };
  } catch (error) {
    return {
      source: "OpenSky Network",
      status: error.message || "unavailable",
      updatedAt: new Date().toISOString(),
      aircraft: []
    };
  }
}

function getMaritimeLayer() {
  return {
    source: "AISStream",
    status: "free AISSTREAM_KEY required for live vessel WebSocket streaming",
    updatedAt: new Date().toISOString(),
    vessels: [],
    lanes: []
  };
}

function normalizeSourceCountry(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeGdeltDate(value) {
  const text = String(value || "");
  const match = text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return text;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
}

function hashArticleId(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `ww-${Math.abs(hash)}`;
}
