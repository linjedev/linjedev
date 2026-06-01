import { json } from "../../_auth.js";
import {
  getWorldNewsFeed,
  hasWorldNewsAccess,
  requireWorldNewsUser
} from "./_world-news.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireWorldNewsUser({ request, env });
  if (auth.response) return auth.response;

  const allowed = await hasWorldNewsAccess({ env, user: auth.user });
  if (!allowed) return json({ error: "World Watch approval required." }, { status: 403 });

  try {
    const feed = await getWorldNewsFeed(env);
    return json(feed, {
      headers: {
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return json({ error: error.message || "World news feed is unavailable." }, { status: 502 });
  }
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
