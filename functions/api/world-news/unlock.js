import { json, readJson, requireSameOrigin } from "../../_auth.js";
import {
  hasWorldNewsUnlock,
  requireWorldNewsUser,
  unlockWorldNews
} from "./_world-news.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireWorldNewsUser({ request, env });
  if (auth.response) return auth.response;

  const unlocked = await hasWorldNewsUnlock({ request, env, user: auth.user });
  return json({
    unlocked,
    username: auth.user.username
  }, {
    headers: {
      "cache-control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const auth = await requireWorldNewsUser({ request, env });
  if (auth.response) return auth.response;

  const input = await readJson(request);
  const unlock = await unlockWorldNews({
    request,
    env,
    user: auth.user,
    password: String(input.password || "")
  });
  if (!unlock) return json({ error: "World Watch login failed." }, { status: 401 });

  return json({
    unlocked: true,
    username: auth.user.username,
    expiresAt: unlock.expiresAt
  }, {
    headers: {
      "cache-control": "no-store",
      "set-cookie": unlock.header
    }
  });
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}
