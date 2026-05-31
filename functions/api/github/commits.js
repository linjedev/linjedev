import { json } from "../../_auth.js";

const CACHE_SECONDS = 60;
const DEFAULT_COMMIT_QUERY = "author:linjedev";

export async function onRequestGet({ env, request }) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    return json({ error: "GITHUB_TOKEN is not configured." }, { status: 503 });
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const query = env.GITHUB_COMMIT_QUERY || DEFAULT_COMMIT_QUERY;
  const response = await fetch(`https://api.github.com/search/commits?q=${encodeURIComponent(query)}&per_page=1`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "user-agent": "linje-dev"
    }
  });

  if (!response.ok) {
    return json({ error: "GitHub commit count is unavailable." }, { status: 502 });
  }

  const data = await response.json();
  const result = json({
    query,
    totalCommits: Number(data.total_count) || 0,
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
