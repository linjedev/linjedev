import { json } from "../../_auth.js";

const CACHE_SECONDS = 60;
const DEFAULT_COMMIT_QUERY = "author:linjedev";
const MAX_SEARCH_PAGES = 10;
const FALLBACK_ACTIVITY = {
  query: DEFAULT_COMMIT_QUERY,
  totalCommits: 59,
  hourBuckets: [
    { commits: [], count: 0, hour: 0 },
    { commits: [], count: 0, hour: 1 },
    { commits: [], count: 1, hour: 2 },
    { commits: [], count: 3, hour: 3 },
    { commits: [], count: 14, hour: 4 },
    { commits: [], count: 11, hour: 5 },
    { commits: [], count: 16, hour: 6 },
    { commits: [], count: 2, hour: 7 },
    { commits: [], count: 0, hour: 8 },
    { commits: [], count: 0, hour: 9 },
    { commits: [], count: 0, hour: 10 },
    { commits: [], count: 0, hour: 11 },
    { commits: [], count: 0, hour: 12 },
    { commits: [], count: 0, hour: 13 },
    { commits: [], count: 0, hour: 14 },
    { commits: [], count: 0, hour: 15 },
    { commits: [], count: 0, hour: 16 },
    { commits: [], count: 0, hour: 17 },
    { commits: [], count: 0, hour: 18 },
    { commits: [], count: 0, hour: 19 },
    { commits: [], count: 4, hour: 20 },
    { commits: [], count: 5, hour: 21 },
    { commits: [], count: 3, hour: 22 },
    { commits: [], count: 0, hour: 23 }
  ]
};

export async function onRequestGet({ env, request }) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    return fallbackResponse("Snapshot from latest deployment.");
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const query = env.GITHUB_COMMIT_QUERY || DEFAULT_COMMIT_QUERY;
  const firstPage = await searchCommits({ page: 1, query, token });

  if (!firstPage.ok) {
    return fallbackResponse("GitHub commit activity is temporarily unavailable. Showing deployment snapshot.");
  }

  const firstData = await firstPage.json();
  const totalCommits = Number(firstData.total_count) || 0;
  const pages = Math.min(MAX_SEARCH_PAGES, Math.ceil(totalCommits / 100));
  const items = [...(firstData.items || [])];

  for (let page = 2; page <= pages; page += 1) {
    const response = await searchCommits({ page, query, token });
    if (!response.ok) break;
    const data = await response.json();
    items.push(...(data.items || []));
  }

  const result = json({
    query,
    totalCommits,
    hourBuckets: buildHourBuckets(items),
    cachedFor: CACHE_SECONDS
  }, {
    headers: {
      "cache-control": `public, max-age=${CACHE_SECONDS}`
    }
  });

  await cache.put(cacheKey, result.clone());
  return result;
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}

function fallbackResponse(status) {
  return json({
    ...FALLBACK_ACTIVITY,
    cachedFor: CACHE_SECONDS,
    fallback: true,
    status
  }, {
    headers: {
      "cache-control": `public, max-age=${CACHE_SECONDS}`
    }
  });
}

function searchCommits({ page, query, token }) {
  return fetch(`https://api.github.com/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=100&page=${page}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "user-agent": "linje-dev"
    }
  });
}

function buildHourBuckets(items) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    commits: [],
    count: 0,
    hour
  }));

  items.forEach((item) => {
    const date = new Date(item.commit?.author?.date || item.commit?.committer?.date || "");
    if (Number.isNaN(date.getTime())) return;
    const hour = date.getHours();
    buckets[hour].count += 1;
    buckets[hour].commits.push({
      date: date.toISOString(),
      message: item.commit?.message?.split("\n")[0] || "Commit",
      sha: item.sha || ""
    });
  });

  return buckets;
}
