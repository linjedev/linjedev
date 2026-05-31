import { getSessionUser, hasDatabase, json, readJson, requireSameOrigin } from "../_auth.js";

export async function onRequestGet({ request, env }) {
  if (!hasDatabase(env)) {
    return json({ error: "Profile storage is not configured." }, { status: 503 });
  }

  const user = await getSessionUser({ request, env });
  if (!user) return json({ error: "Login required." }, { status: 401 });

  await ensureProfilesTable(env);
  const profile = await getProfile(env, user);
  return json({ profile });
}

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  if (!hasDatabase(env)) {
    return json({ error: "Profile storage is not configured." }, { status: 503 });
  }

  const user = await getSessionUser({ request, env });
  if (!user) return json({ error: "Login required." }, { status: 401 });

  const input = await readJson(request);
  const avatarUrl = normalizeAvatarUrl(input.avatarUrl);
  const about = String(input.about || "").trim().slice(0, 280);
  const updatedAt = new Date().toISOString();

  await ensureProfilesTable(env);
  await env.DB.prepare(
    `INSERT INTO profiles (user_id, username, avatar_url, about, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       username = excluded.username,
       avatar_url = excluded.avatar_url,
       about = excluded.about,
       updated_at = excluded.updated_at`
  ).bind(user.id, user.username, avatarUrl, about, updatedAt).run();

  return json({
    profile: {
      username: user.username,
      avatarUrl,
      about,
      updatedAt
    }
  });
}

function normalizeAvatarUrl(value) {
  const input = String(value || "").trim().slice(0, 2000);
  if (!input) return "";

  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function onRequest() {
  return json({ error: "Method not allowed." }, { status: 405 });
}

async function ensureProfilesTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      avatar_url TEXT DEFAULT '',
      about TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    )`
  ).run();
}

async function getProfile(env, user) {
  const profile = await env.DB.prepare(
    "SELECT username, avatar_url, about, updated_at FROM profiles WHERE user_id = ?"
  ).bind(user.id).first();

  return {
    username: user.username,
    avatarUrl: profile?.avatar_url || "",
    about: profile?.about || "",
    updatedAt: profile?.updated_at || user.createdAt
  };
}
