import { getSessionUser, hasDatabase, isAdminUser, json } from "../../_auth.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

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
  if (cached && Date.now() - Date.parse(cached.updated_at) < CACHE_TTL_MS) {
    return JSON.parse(cached.payload);
  }

  let feed;
  try {
    feed = await fetchGdeltFeed();
  } catch (error) {
    if (cached) {
      return {
        ...JSON.parse(cached.payload),
        stale: true,
        status: error.message || "World news feed is using cached data."
      };
    }
    throw error;
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

async function fetchGdeltFeed() {
  const query = Object.keys(SOURCE_LOCATIONS)
    .map((country) => `sourcecountry:${country}`)
    .join(" OR ");
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", `(${query})`);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("timespan", "12h");
  url.searchParams.set("maxrecords", "50");
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
  const articles = (data.articles || [])
    .map(normalizeArticle)
    .filter(Boolean)
    .slice(0, 36);

  const regions = articles.reduce((items, article) => {
    const current = items.get(article.region) || { count: 0, latestAt: "" };
    current.count += 1;
    current.latestAt = !current.latestAt || article.seenAt > current.latestAt ? article.seenAt : current.latestAt;
    items.set(article.region, current);
    return items;
  }, new Map());

  return {
    articles,
    regions: [...regions.entries()].map(([region, value]) => ({ region, ...value })),
    source: "GDELT DOC 2.0",
    updatedAt: new Date().toISOString()
  };
}

function normalizeArticle(article) {
  const sourceKey = normalizeSourceCountry(article.sourcecountry || "");
  const location = SOURCE_LOCATIONS[sourceKey];
  if (!location || !article.url || !article.title) return null;

  return {
    id: hashArticleId(article.url),
    title: String(article.title).slice(0, 180),
    url: article.url,
    domain: String(article.domain || "").slice(0, 120),
    language: String(article.language || "").slice(0, 40),
    sourceCountry: location.label,
    region: location.region,
    lat: location.lat,
    lon: location.lon,
    seenAt: normalizeGdeltDate(article.seendate || ""),
    image: article.socialimage || ""
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
